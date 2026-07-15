// firebase-client.js
(function () {
    'use strict';

    const STORE_KEY = 'akasha_github_store_v1';
    const SESSION_KEY = 'akasha_github_session_v1';
    const ADMIN_RANKS = new Set(['магистр', 'верховный магистр', 'старейшина']);

    class AkashaApiError extends Error {
        constructor(message, status = 0, code = 'request_failed') {
            super(message);
            this.name = 'AkashaApiError';
            this.status = status;
            this.code = code;
        }
    }

    function nowIso() { return new Date().toISOString(); }
    function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
    function normalizeName(value) {
        return String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('ru-RU').replace(/ё/g, 'е');
    }
    function randomId() {
        if (window.crypto?.randomUUID) return window.crypto.randomUUID().replace(/-/g, '').slice(0, 20);
        return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
    }
    function publicProfile(user) {
        const profile = { name: user.name, rank: user.rank, teacher: user.teacher || 'отсутствует' };
        if (user.specialTitle) profile.specialTitle = user.specialTitle;
        if (user.description) profile.description = user.description;
        return profile;
    }

    // === Firebase Database Client ===
    class FirebaseDatabase {
        constructor(firebase) {
            this.firebase = firebase;
            this.db = firebase.firestore();
        }

        collection(name) {
            return new CollectionReference(this.db, name);
        }

        batch() {
            return new WriteBatch(this.db);
        }

        async ping() {
            try {
                await this.db.collection('users').limit(1).get();
                return { ok: true, driver: 'Firebase Firestore', version: '2.5.0-firebase' };
            } catch (e) {
                throw new AkashaApiError('Не удалось подключиться к Firebase.', 500, 'connection_failed');
            }
        }

        async login(name, password) {
            const usersRef = this.db.collection('users');
            const snapshot = await usersRef.where('full_name', '==', name).get();
            if (snapshot.empty) {
                throw new AkashaApiError('Пользователь не найден.', 401, 'invalid_credentials');
            }
            const doc = snapshot.docs[0];
            const user = doc.data();
            if (user.password !== password) {
                throw new AkashaApiError('Неверный пароль.', 401, 'invalid_credentials');
            }
            if (user.blocked === true) {
                throw new AkashaApiError('Доступ заблокирован.', 403, 'blocked');
            }
            localStorage.setItem(SESSION_KEY, name);
            return { ok: true, profile: publicProfile(user) };
        }

        async logout() {
            localStorage.removeItem(SESSION_KEY);
            return { ok: true };
        }

        async getSession() {
            const name = localStorage.getItem(SESSION_KEY);
            if (!name) return { ok: true, authenticated: false };
            const usersRef = this.db.collection('users');
            const snapshot = await usersRef.where('full_name', '==', name).get();
            if (snapshot.empty) {
                localStorage.removeItem(SESSION_KEY);
                return { ok: true, authenticated: false };
            }
            const user = snapshot.docs[0].data();
            return { ok: true, authenticated: true, profile: publicProfile(user) };
        }

        async getProfiles() {
            const snapshot = await this.db.collection('users').get();
            const profiles = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                profiles.push(publicProfile(data));
            });
            return { ok: true, profiles: profiles.sort((a, b) => a.name.localeCompare(b.name, 'ru')) };
        }

        async createUser(data) {
            const actor = await this.getSession();
            if (!actor.authenticated) throw new AkashaApiError('Требуется авторизация.', 401, 'unauthorized');
            if (!ADMIN_RANKS.has(actor.profile.rank)) throw new AkashaApiError('Только Магистры могут создавать пользователей.', 403, 'forbidden');

            const name = String(data.name || '').trim();
            const password = String(data.password || '');
            if (name.length < 2) throw new AkashaApiError('Имя слишком короткое.', 400, 'invalid_name');
            if (password.length < 6) throw new AkashaApiError('Пароль должен быть ≥6 символов.', 400, 'invalid_password');

            const existing = await this.db.collection('users').where('full_name', '==', name).get();
            if (!existing.empty) throw new AkashaApiError('Пользователь уже существует.', 409, 'user_exists');

            const user = {
                full_name: name,
                rank: String(data.rank || 'адепт').toLocaleLowerCase('ru-RU'),
                teacher: String(data.teacher || 'отсутствует'),
                password: password,
                aliases: Array.isArray(data.aliases) ? data.aliases.filter(Boolean).map(String) : [],
                special_title: String(data.specialTitle || ''),
                description: String(data.description || ''),
                created_at: nowIso(),
                created_by: actor.profile.name
            };

            await this.db.collection('users').add(user);
            return { ok: true, profile: publicProfile(user) };
        }

        async updateUser(userName, data) {
            const actor = await this.getSession();
            if (!actor.authenticated) throw new AkashaApiError('Требуется авторизация.', 401, 'unauthorized');
            if (!ADMIN_RANKS.has(actor.profile.rank)) throw new AkashaApiError('Только Магистры могут редактировать пользователей.', 403, 'forbidden');

            const userDoc = await this.db.collection('users').where('full_name', '==', userName).get();
            if (userDoc.empty) throw new AkashaApiError('Пользователь не найден.', 404, 'not_found');

            const updateData = {};
            if ('rank' in data) updateData.rank = String(data.rank).toLocaleLowerCase('ru-RU');
            if ('teacher' in data) updateData.teacher = String(data.teacher || 'отсутствует');
            if ('aliases' in data) updateData.aliases = Array.isArray(data.aliases) ? data.aliases.filter(Boolean).map(String) : [];
            if ('specialTitle' in data) updateData.special_title = String(data.specialTitle || '');
            if ('description' in data) updateData.description = String(data.description || '');

            await userDoc.docs[0].ref.update(updateData);
            return { ok: true, profile: publicProfile({ ...userDoc.docs[0].data(), ...updateData }) };
        }

        async resetUserPassword(userName, password) {
            const actor = await this.getSession();
            if (!actor.authenticated) throw new AkashaApiError('Требуется авторизация.', 401, 'unauthorized');
            if (!ADMIN_RANKS.has(actor.profile.rank)) throw new AkashaApiError('Только Магистры могут менять пароли.', 403, 'forbidden');

            if (String(password || '').length < 6) throw new AkashaApiError('Пароль должен быть ≥6 символов.', 400, 'invalid_password');

            const userDoc = await this.db.collection('users').where('full_name', '==', userName).get();
            if (userDoc.empty) throw new AkashaApiError('Пользователь не найден.', 404, 'not_found');

            await userDoc.docs[0].ref.update({ password: String(password) });
            return { ok: true };
        }
    }

    class CollectionReference {
        constructor(db, name) {
            this.db = db;
            this.name = name;
        }
        doc(id) { return new DocumentReference(this.db, this.name, id); }
        async add(data) {
            const docRef = this.db.collection(this.name).doc();
            await docRef.set(data);
            return new DocumentReference(this.db, this.name, docRef.id);
        }
        async get() {
            const snapshot = await this.db.collection(this.name).get();
            const docs = [];
            snapshot.forEach(doc => docs.push(new DocumentSnapshot(doc.ref, doc.data(), true)));
            return new QuerySnapshot(docs);
        }
    }

    class DocumentReference {
        constructor(db, collection, id) {
            this.db = db;
            this.collection = collection;
            this.id = id;
        }
        async get() {
            const doc = await this.db.collection(this.collection).doc(this.id).get();
            return new DocumentSnapshot(doc.ref, doc.data(), doc.exists);
        }
        async set(data, options = {}) {
            if (options.merge) {
                await this.db.collection(this.collection).doc(this.id).set(data, { merge: true });
            } else {
                await this.db.collection(this.collection).doc(this.id).set(data);
            }
            return this;
        }
        async update(data) {
            await this.db.collection(this.collection).doc(this.id).update(data);
            return this;
        }
        async delete() {
            await this.db.collection(this.collection).doc(this.id).delete();
        }
    }

    class DocumentSnapshot {
        constructor(ref, data, exists) {
            this.ref = ref;
            this.id = ref.id;
            this.exists = exists;
            this._data = clone(data || {});
        }
        data() { return this.exists ? clone(this._data) : undefined; }
    }

    class QuerySnapshot {
        constructor(docs) {
            this.docs = docs;
            this.empty = docs.length === 0;
            this.size = docs.length;
        }
        forEach(callback) { this.docs.forEach(callback); }
    }

    class WriteBatch {
        constructor(db) {
            this.db = db;
            this.ops = [];
        }
        update(ref, data) {
            this.ops.push({ type: 'update', ref, data });
            return this;
        }
        set(ref, data) {
            this.ops.push({ type: 'set', ref, data });
            return this;
        }
        delete(ref) {
            this.ops.push({ type: 'delete', ref });
            return this;
        }
        async commit() {
            for (const op of this.ops) {
                if (op.type === 'update') await op.ref.update(op.data);
                else if (op.type === 'set') await op.ref.set(op.data);
                else if (op.type === 'delete') await op.ref.delete();
            }
            this.ops = [];
        }
    }

    window.AkashaApiError = AkashaApiError;
    window.createFirebaseDatabaseClient = function(firebase) {
        return new FirebaseDatabase(firebase);
    };
})();
