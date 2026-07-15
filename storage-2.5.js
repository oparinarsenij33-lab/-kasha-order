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

    const seedUsers = [
        { name: 'Аранэль Хальдарон', rank: 'верховный магистр', teacher: 'отсутствует', password: 'A1H23', aliases: ['аранэль хальдарон'], specialTitle: 'Верховный Магистр', description: 'Глава Ордена Вольных Джедаев' },
        { name: 'Дорхат Минас Тур', rank: 'мастер', teacher: 'отсутствует', password: null, aliases: ['дорхат минас тур'], specialTitle: 'Заместитель Верховного Магистра', description: 'Глава безопасности Ордена, Мастер Боевой Магии и специалист по защите от тёмных искусств' },
        { name: 'Нарнэлион Эдрад', rank: 'мастер', teacher: 'отсутствует', password: null, aliases: ['нарнэлион эдрад'], specialTitle: 'Мастер Артефактов и Целительства', description: 'Мастер магических артефактов, потусторонних миров и целительства' },
        { name: 'Рондрил Лаур', rank: 'мастер', teacher: 'отсутствует', password: null, aliases: ['рондрил лаур'], specialTitle: 'Мастер-Целитель', description: 'Мастер-Целитель, специалист по травам и физическому целительству' },
        { name: 'Далисса Иденааль Вестуро', rank: 'старший падаван', teacher: 'Аранэль Хальдарон', password: null, aliases: ['далисса вестуро', 'далисса иденааль вестуро'] },
        { name: 'Даниил Ионов', rank: 'падаван', teacher: 'Нарнэлион Эдрад', password: null, aliases: ['даниил ионов'] },
        { name: 'Кайренарт Авандалэр Ветэрмайтерос', rank: 'юнлинг', teacher: 'отсутствует', password: null, aliases: ['кайренарт ветэрмайтерос', 'кайренарт авандалэр ветэрмайтерос'] },
        { name: 'Тейраналь Арианарт Лоаннен-Тиарастес', rank: 'юнлинг', teacher: 'отсутствует', password: null, aliases: ['тейраналь лоаннен-тиарастес', 'тейраналь арианарт лоаннен-тиарастес'] },
        { name: 'Асстария Авангорн Ламанш', rank: 'юнлинг', teacher: 'отсутствует', password: null, aliases: ['асстария ламанш', 'асстария авангорн ламанш'] },
        { name: 'Наталья Кузовцова', rank: 'юнлинг', teacher: 'отсутствует', password: null, aliases: ['наталья кузовцова'] }
    ];

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
    function defaultStore() {
        const users = seedUsers.map((user, index) => ({ id: `seed_${index + 1}`, ...clone(user), createdAt: nowIso() }));
        return {
            version: 1,
            users,
            collections: {
                lessons: {
                    '1f76b02546832eaf059e': {
                        category: 'адепт', title: 'Тест', content: 'Тест', mediaUrl: '',
                        createdAt: '2026-07-13T16:00:03.824Z', addedBy: 'Аранэль Хальдарон'
                    }
                },
                homework_assignments: {}, homework_submissions: {}, comments: {}, messages: {},
                blocked_users: {}, lesson_reads: {}, user_registrations: {}, manual_adjustments: {}, audit_log: {}
            }
        };
    }
    function loadStore() {
        try {
            const parsed = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
            if (parsed && parsed.version === 1 && Array.isArray(parsed.users) && parsed.collections) return parsed;
        } catch (error) {}
        const store = defaultStore();
        saveStore(store);
        return store;
    }
    function saveStore(store) {
        try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); }
        catch (error) { throw new AkashaApiError('Браузер не разрешил сохранить данные. Проверьте настройки localStorage.', 0, 'storage_unavailable'); }
    }
    function getSessionName() {
        try { return localStorage.getItem(SESSION_KEY) || ''; } catch (error) { return ''; }
    }
    function setSessionName(name) {
        try {
            if (name) localStorage.setItem(SESSION_KEY, name);
            else localStorage.removeItem(SESSION_KEY);
        } catch (error) {}
    }
    function findUser(store, name) {
        const needle = normalizeName(name);
        return store.users.find((user) => [user.name, ...(user.aliases || [])].some((candidate) => normalizeName(candidate) === needle)) || null;
    }
    function requireSession(store) {
        const name = getSessionName();
        const user = findUser(store, name);
        if (!user) {
            setSessionName('');
            throw new AkashaApiError('Сессия истекла. Войдите снова.', 401, 'unauthorized');
        }
        const block = store.collections.blocked_users?.[user.name];
        if (block?.blocked === true) {
            setSessionName('');
            throw new AkashaApiError('Доступ заблокирован. Обратитесь к администрации.', 403, 'blocked');
        }
        return user;
    }
    function requireAdmin(user) {
        if (!ADMIN_RANKS.has(user.rank)) throw new AkashaApiError('Это действие доступно только Магистрам.', 403, 'forbidden');
    }
    function collectionMap(store, name) {
        if (!store.collections[name]) store.collections[name] = {};
        return store.collections[name];
    }
    function readable(collection, data, user) {
        if (collection === 'messages') return data.from === user.name || data.to === user.name;
        if (collection === 'homework_submissions') return ['мастер','магистр','верховный магистр','старейшина'].includes(user.rank) || data.studentName === user.name;
        if (collection === 'lesson_reads') return ['мастер','магистр','верховный магистр','старейшина'].includes(user.rank) || data.userId === user.name;
        if (collection === 'manual_adjustments') return ['мастер','магистр','верховный магистр','старейшина'].includes(user.rank) || data.userName === user.name;
        if (collection === 'audit_log') return ADMIN_RANKS.has(user.rank);
        return true;
    }

    class DocumentSnapshot {
        constructor(ref, data, exists) { this.ref = ref; this.id = ref.id; this.exists = Boolean(exists); this._data = clone(data || {}); }
        data() { return this.exists ? clone(this._data) : undefined; }
    }
    class QuerySnapshot {
        constructor(db, collectionName, documents) {
            this.docs = documents.map((doc) => new DocumentSnapshot(new DocumentReference(db, collectionName, doc.id), doc.data, true));
            this.empty = this.docs.length === 0;
            this.size = this.docs.length;
        }
        forEach(callback) { this.docs.forEach(callback); }
    }
    class QueryReference {
        constructor(db, collectionName, filters = []) { this.db = db; this.collectionName = collectionName; this.filters = filters; }
        where(field, operator, value) {
            if (operator !== '==') throw new AkashaApiError('Локальный режим поддерживает только оператор ==.', 400, 'unsupported_query');
            return new QueryReference(this.db, this.collectionName, [...this.filters, { field, value }]);
        }
        async get() {
            const store = loadStore();
            const user = requireSession(store);
            const map = collectionMap(store, this.collectionName);
            const documents = Object.entries(map)
                .filter(([, data]) => readable(this.collectionName, data, user))
                .filter(([, data]) => this.filters.every((filter) => data?.[filter.field] === filter.value))
                .map(([id, data]) => ({ id, data: clone(data) }));
            return new QuerySnapshot(this.db, this.collectionName, documents);
        }
    }
    class DocumentReference {
        constructor(db, collectionName, id) { this.db = db; this.collectionName = collectionName; this.id = String(id); }
        async get() {
            const store = loadStore();
            const user = requireSession(store);
            const data = collectionMap(store, this.collectionName)[this.id];
            const exists = Boolean(data && readable(this.collectionName, data, user));
            return new DocumentSnapshot(this, exists ? data : {}, exists);
        }
        async set(data, options = {}) {
            const store = loadStore();
            requireSession(store);
            const map = collectionMap(store, this.collectionName);
            map[this.id] = options?.merge === true && map[this.id] ? { ...map[this.id], ...clone(data) } : clone(data);
            saveStore(store);
            return this;
        }
        async update(data) {
            const store = loadStore();
            requireSession(store);
            const map = collectionMap(store, this.collectionName);
            if (!map[this.id]) throw new AkashaApiError('Документ не найден.', 404, 'not_found');
            map[this.id] = { ...map[this.id], ...clone(data) };
            saveStore(store);
            return this;
        }
        async delete() {
            const store = loadStore();
            requireSession(store);
            delete collectionMap(store, this.collectionName)[this.id];
            saveStore(store);
        }
    }
    class CollectionReference extends QueryReference {
        constructor(db, collectionName) { super(db, collectionName, []); }
        doc(id) { return new DocumentReference(this.db, this.collectionName, id); }
        async add(data) {
            const id = randomId();
            const ref = this.doc(id);
            await ref.set(data);
            return ref;
        }
    }
    class WriteBatch {
        constructor(db) { this.db = db; this.operations = []; }
        update(ref, data) { this.operations.push({ action: 'update', ref, data }); return this; }
        set(ref, data) { this.operations.push({ action: 'set', ref, data }); return this; }
        delete(ref) { this.operations.push({ action: 'delete', ref }); return this; }
        async commit() {
            for (const operation of this.operations) {
                if (operation.action === 'update') await operation.ref.update(operation.data);
                else if (operation.action === 'set') await operation.ref.set(operation.data);
                else await operation.ref.delete();
            }
            this.operations = [];
        }
    }

    class LocalDatabase {
        constructor() { this.kind = 'local'; }
        collection(name) { return new CollectionReference(this, String(name)); }
        batch() { return new WriteBatch(this); }
        async ping() {
            loadStore();
            return { ok: true, driver: 'browser localStorage', version: '2.5.0-github' };
        }
        async login(name, password) {
            const store = loadStore();
            const user = findUser(store, name);
            if (!user || user.password == null || String(user.password) !== String(password)) {
                const message = user && user.password == null
                    ? 'Для этого пользователя пароль ещё не задан. Войдите как Аранэль Хальдарон и установите пароль в админ-панели.'
                    : 'Неверное имя или пароль.';
                throw new AkashaApiError(message, 401, 'invalid_credentials');
            }
            const block = store.collections.blocked_users?.[user.name];
            if (block?.blocked === true) throw new AkashaApiError('Доступ заблокирован. Обратитесь к администрации.', 403, 'blocked');
            setSessionName(user.name);
            return { ok: true, profile: publicProfile(user) };
        }
        async logout() { setSessionName(''); return { ok: true }; }
        async getSession() {
            const name = getSessionName();
            if (!name) return { ok: true, authenticated: false };
            const store = loadStore();
            try {
                const user = requireSession(store);
                return { ok: true, authenticated: true, profile: publicProfile(user) };
            } catch (error) {
                if (error?.status === 401) return { ok: true, authenticated: false };
                throw error;
            }
        }
        async getProfiles() {
            const store = loadStore();
            requireSession(store);
            const profiles = store.users.map(publicProfile).sort((a, b) => a.name.localeCompare(b.name, 'ru'));
            return { ok: true, profiles };
        }
        async createUser(data) {
            const store = loadStore();
            const actor = requireSession(store);
            requireAdmin(actor);
            const name = String(data.name || '').trim().replace(/\s+/g, ' ');
            const password = String(data.password || '');
            if (name.length < 2) throw new AkashaApiError('Заполните имя пользователя.', 400, 'invalid_name');
            if (password.length < 6) throw new AkashaApiError('Пароль должен содержать минимум 6 символов.', 400, 'invalid_password');
            if (findUser(store, name)) throw new AkashaApiError('Пользователь с таким именем уже существует.', 409, 'user_exists');
            const user = {
                id: `user_${randomId()}`, name, rank: String(data.rank || 'адепт').toLocaleLowerCase('ru-RU'),
                teacher: String(data.teacher || 'отсутствует'), password,
                aliases: Array.isArray(data.aliases) ? data.aliases.filter(Boolean).map(String) : [],
                specialTitle: String(data.specialTitle || ''), description: String(data.description || ''),
                createdAt: nowIso(), createdBy: actor.name
            };
            store.users.push(user);
            saveStore(store);
            return { ok: true, profile: publicProfile(user) };
        }
        async updateUser(userName, data) {
            const store = loadStore();
            const actor = requireSession(store);
            requireAdmin(actor);
            const user = findUser(store, userName);
            if (!user) throw new AkashaApiError('Пользователь не найден.', 404, 'not_found');
            if (Object.prototype.hasOwnProperty.call(data, 'rank')) user.rank = String(data.rank).toLocaleLowerCase('ru-RU');
            if (Object.prototype.hasOwnProperty.call(data, 'teacher')) user.teacher = String(data.teacher || 'отсутствует');
            if (Object.prototype.hasOwnProperty.call(data, 'aliases')) user.aliases = Array.isArray(data.aliases) ? data.aliases.filter(Boolean).map(String) : [];
            if (Object.prototype.hasOwnProperty.call(data, 'specialTitle')) user.specialTitle = String(data.specialTitle || '');
            if (Object.prototype.hasOwnProperty.call(data, 'description')) user.description = String(data.description || '');
            user.updatedAt = nowIso(); user.updatedBy = actor.name;
            saveStore(store);
            return { ok: true, profile: publicProfile(user) };
        }
        async resetUserPassword(userName, password) {
            const store = loadStore();
            const actor = requireSession(store);
            requireAdmin(actor);
            const user = findUser(store, userName);
            if (!user) throw new AkashaApiError('Пользователь не найден.', 404, 'not_found');
            if (String(password || '').length < 6) throw new AkashaApiError('Пароль должен содержать минимум 6 символов.', 400, 'invalid_password');
            user.password = String(password);
            user.passwordChangedAt = nowIso(); user.passwordChangedBy = actor.name;
            saveStore(store);
            return { ok: true };
        }
    }

    window.AkashaApiError = AkashaApiError;
    window.createLocalDatabaseClient = function createLocalDatabaseClient() { return new LocalDatabase(); };
    window.AKASHA_LOCAL_TOOLS = {
        exportData() { return JSON.stringify(loadStore(), null, 2); },
        resetData() { localStorage.removeItem(STORE_KEY); localStorage.removeItem(SESSION_KEY); location.reload(); }
    };
})();
