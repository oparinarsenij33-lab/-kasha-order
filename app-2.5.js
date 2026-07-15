// ===== FIREBASE =====
const firebaseConfig = {
    apiKey: "AIzaSyCwTw-52bQ_MxtdFAT3s9pkEN9rQ2qiMEE",
    authDomain: "akasha-2b362.firebaseapp.com",
    projectId: "akasha-2b362",
    storageBucket: "akasha-2b362.firebasestorage.app",
    messagingSenderId: "352516960841",
    appId: "1:352516960841:web:88cdd6b970b14b5ced8598",
    measurementId: "G-GDYYS12EQH"
};

let knowledgeBase = {};
let lessonsById = {};
let assignmentsList = [];
let submissionsList = [];
window.currentChatPartner = null;

let usersDatabase = {};

let currentUser = null;
let addLessonState = null;
let windowDb = null;
let isInitialized = false;
let authClient = null;
let storageMode = 'php';
let previousModalFocus = null;
let chatPollTimer = null;
let activeRequests = 0;

const accessLevels = {
    'адепт': ['адепт'], 'юнлинг': ['адепт', 'юнлинг'], 'падаван': ['адепт', 'юнлинг', 'падаван'],
    'старший падаван': ['адепт', 'юнлинг', 'падаван', 'старший падаван'],
    'рыцарь': ['адепт', 'юнлинг', 'падаван', 'старший падаван', 'рыцарь'],
    'мастер': ['адепт', 'юнлинг', 'падаван', 'старший падаван', 'рыцарь', 'мастер'],
    'магистр': ['адепт', 'юнлинг', 'падаван', 'старший падаван', 'рыцарь', 'мастер', 'магистр'],
    'верховный магистр': ['адепт', 'юнлинг', 'падаван', 'старший падаван', 'рыцарь', 'мастер', 'магистр', 'верховный магистр'],
    'старейшина': ['адепт', 'юнлинг', 'падаван', 'старший падаван', 'рыцарь', 'мастер', 'магистр', 'верховный магистр', 'старейшина']
};

// ===== СЕЗОННАЯ ТЕМА =====
function applySeasonTheme() {
    const month = new Date().getMonth() + 1;
    let season = 'winter';
    let seasonName = 'Зима';
    let icon = 'fa-snowflake';
    if (month >= 3 && month <= 5) { season = 'spring'; seasonName = 'Весна'; icon = 'fa-seedling'; }
    else if (month >= 6 && month <= 8) { season = 'summer'; seasonName = 'Лето'; icon = 'fa-sun'; }
    else if (month >= 9 && month <= 11) { season = 'autumn'; seasonName = 'Осень'; icon = 'fa-leaf'; }
    document.body.classList.remove('season-spring', 'season-summer', 'season-autumn', 'season-winter');
    document.body.classList.add(`season-${season}`);
    const indicator = document.getElementById('season-indicator');
    if (indicator) indicator.innerHTML = `<i class="fa-solid ${icon}" aria-hidden="true"></i><span>${seasonName}</span>`;
}

// ===== ПРИВЕТСТВИЕ ДЛЯ СТРАННИКА =====
function getStrangerGreeting() {
    return `<div style="background:rgba(13,31,15,0.5); border:1px solid var(--border-color); border-radius:15px; padding:25px; margin:15px 0;">
        <h3 style="color:#64ffda; margin-bottom:15px; font-family:'Playfair Display',serif; text-align:center; font-size:1.8em;">🌟 Приветствую тебя, Странник</h3>
        <p style="color:var(--text-color); line-height:1.8; margin-bottom:15px;">Я — <strong>Акаша</strong>, Хранительница Знаний Ордена Вольных Джедаев. В моих архивах хранится мудрость веков, тайны магии и знания, что передавались через Великих Мастеров и Магистров всех времён и эпох.</p>
        <p style="color:var(--text-color); line-height:1.8; margin-bottom:15px;">Орден Вольных Джедаев — это братство тех, кто посвятил себя изучению высших искусств, защите, сохранению целостности и единства Света. Здесь ты найдёшь уроки, задания и возможность общаться с Наставниками.</p>
        <h4 style="color:#8bc34a; margin:20px 0 10px 0; font-family:'Playfair Display',serif;">📜 Как получить доступ:</h4>
        <p style="color:var(--text-color); line-height:1.8; margin-bottom:15px;">Чтобы войти в систему, назови мне своё <strong>Имя</strong>, <strong>Ранг</strong>, имя своего <strong>Учителя</strong> и <strong>Пароль</strong>.<br><br><em>Пример:</em> "Меня зовут Оби-Ван Кеноби, я Магистр, мой Учитель — Квай-Гон Джинн, пароль O2V7K9"</p>
        <p style="color:#a89b7e; font-style:italic; text-align:center; margin-top:20px;">✨ Орден ждёт тебя, Странник. Назови себя.</p>
    </div>`;
}

// ===== ПРИВЕТСТВИЕ ПОСЛЕ РЕГИСТРАЦИИ =====
function getRankGreeting(user) {
    const rank = user.ранг;
    const name = user.name;
    const isMasterRank = ['мастер', 'магистр', 'верховный магистр', 'старейшина'].includes(rank);
    if (isMasterRank) {
        return `<div style="background:rgba(13,31,15,0.5); border:1px solid rgba(255,215,0,0.3); border-radius:15px; padding:25px; margin:15px 0;">
            <h3 style="color:#ffd700; margin-bottom:15px; font-family:'Playfair Display',serif; text-align:center; font-size:1.8em;">🌟 Приветствую тебя, ${rank} ${name}</h3>
            <p style="color:var(--text-color); line-height:1.8; margin-bottom:15px;">Орден Вольных Джедаев рад видеть тебя среди своих хранителей. Твоя мудрость и опыт — бесценный дар для наших учеников.</p>
            <h4 style="color:#8bc34a; margin:20px 0 10px 0; font-family:'Playfair Display',serif;">📋 Твои возможности:</h4>
            <ul style="color:var(--text-color); line-height:1.8; padding-left:20px; margin-bottom:15px;">
                <li>📚 Доступ ко всем разделам знаний Ордена</li>
                <li>📝 Создание и проверка домашних заданий</li>
                <li>✏️ Добавление и редактирование уроков</li>
                <li>💬 Общение с учениками через личный чат</li>
                <li>📊 Просмотр таблицы успеваемости</li>
                ${rank === 'магистр' || rank === 'верховный магистр' || rank === 'старейшина' ? '<li>⚙️ Админ-панель: управление пользователями и блокировка</li>' : ''}
            </ul>
            <p style="color:#a89b7e; font-style:italic; text-align:center; margin-top:20px;">Используй свои возможности мудро, ${rank}. Орден доверяет тебе.</p>
        </div>`;
    } else {
        return `<div style="background:rgba(13,31,15,0.5); border:1px solid var(--border-color); border-radius:15px; padding:25px; margin:15px 0;">
            <h3 style="color:#64ffda; margin-bottom:15px; font-family:'Playfair Display',serif; text-align:center; font-size:1.8em;">🌟 Я рада приветствовать тебя в Ордене Вольных Джедаев, ${rank} ${name}!</h3>
            <p style="color:var(--text-color); line-height:1.8; margin-bottom:15px;">Твой путь только начинается. Впереди тебя ждут знания, испытания и рост. Помни — дисциплина и усердие суть ключи к мастерству.</p>
            <h4 style="color:#8bc34a; margin:20px 0 10px 0; font-family:'Playfair Display',serif;">📜 Как пользоваться Акашей:</h4>
            <ul style="color:var(--text-color); line-height:1.8; padding-left:20px; margin-bottom:15px;">
                <li> <strong>Домашние задания</strong> — просматривай задания от Мастеров и отправляй свои ответы</li>
                <li>✉️ <strong>Написать Мастеру</strong> — личный чат с твоим Наставником</li>
                <li>📚 <strong>Оглавление знаний</strong> — уроки, доступные твоему Рангу</li>
                <li>🏛️ <strong>Совет Мастеров</strong> — узнай, кто руководит Орденом</li>
                <li>👥 <strong>Члены Ордена</strong> — список всех братьев и сестёр</li>
                <li>📊 <strong>Успеваемость</strong> — следи за своим прогрессом</li>
            </ul>
            <p style="color:#a89b7e; font-style:italic; text-align:center; margin-top:20px;">Да пребудет с тобой Сила, ${rank} ${name}. Используй главное меню для навигации.</p>
        </div>`;
    }
}

// ===== DOM ЭЛЕМЕНТЫ =====
const chatContainer = document.getElementById('chat-container');
const customTextarea = document.getElementById('custom-textarea');
const customKeyboard = document.getElementById('custom-keyboard');
const mainInputWrapper = document.getElementById('main-input-wrapper');

// Font Awesome вместо системных emoji в элементах интерфейса.
const UI_ICON_MAP = new Map([
    ['📜', 'fa-scroll'], ['🌟', 'fa-star'], ['✨', 'fa-wand-magic-sparkles'], ['🌸', 'fa-seedling'], ['☀️', 'fa-sun'],
    ['🍂', 'fa-leaf'], ['❄️', 'fa-snowflake'], ['📚', 'fa-book-open'], ['✏️', 'fa-pen'],
    ['💬', 'fa-comments'], ['📊', 'fa-chart-column'], ['⚙️', 'fa-gear'], ['📝', 'fa-clipboard-list'],
    ['✉️', 'fa-envelope'], ['🏛️', 'fa-landmark'], ['👥', 'fa-users'], ['🔮', 'fa-circle-nodes'],
    ['🚪', 'fa-right-from-bracket'], ['📅', 'fa-calendar-days'], ['✅', 'fa-circle-check'], ['⚠️', 'fa-triangle-exclamation'],
    ['⏳', 'fa-hourglass-half'], ['⏱️', 'fa-stopwatch'], ['📤', 'fa-paper-plane'], ['📬', 'fa-inbox'], ['🔍', 'fa-magnifying-glass'],
    ['🗑️', 'fa-trash'], ['❌', 'fa-circle-xmark'], ['🔒', 'fa-lock'], ['📖', 'fa-book-open-reader'],
    ['🚫', 'fa-ban'], ['🔙', 'fa-arrow-left'], ['💡', 'fa-lightbulb'], ['🔔', 'fa-bell'],
    ['🔓', 'fa-lock-open'], ['🔗', 'fa-link'], ['🏆', 'fa-trophy'], ['📌', 'fa-thumbtack'], ['🛡️', 'fa-shield-halved'],
    ['⬅️', 'fa-arrow-left'], ['➡️', 'fa-arrow-right'], ['➕', 'fa-plus'], ['➖', 'fa-minus'],
    ['🖼️', 'fa-image'], ['🎓', 'fa-graduation-cap'], ['🧙‍♂️', 'fa-hat-wizard'], ['🧙', 'fa-hat-wizard'], ['📈', 'fa-chart-line'],
    ['👋', 'fa-hand'], ['💥', 'fa-burst'], ['📋', 'fa-clipboard'], ['👤', 'fa-user'], ['🔑', 'fa-key'], ['🧹', 'fa-broom'], ['📎', 'fa-paperclip']
]);

function replaceUiEmojiIcons(root = document.body) {
    if (!root || !document.createTreeWalker) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
        const parent = node.parentElement;
        if (!parent || parent.closest('.user-message, input, textarea, script, style, .fa, [data-keep-emoji]')) return;
        let parts = [node.nodeValue || ''];
        let changed = false;
        UI_ICON_MAP.forEach((iconClass, emoji) => {
            const next = [];
            parts.forEach((part) => {
                if (typeof part !== 'string' || !part.includes(emoji)) { next.push(part); return; }
                changed = true;
                const chunks = part.split(emoji);
                chunks.forEach((chunk, index) => {
                    if (chunk) next.push(chunk);
                    if (index < chunks.length - 1) next.push({ iconClass });
                });
            });
            parts = next;
        });
        if (!changed) return;
        const fragment = document.createDocumentFragment();
        parts.forEach((part) => {
            if (typeof part === 'string') fragment.appendChild(document.createTextNode(part));
            else {
                const icon = document.createElement('i');
                icon.className = `fa-solid ${part.iconClass} ui-icon`;
                icon.setAttribute('aria-hidden', 'true');
                fragment.appendChild(icon);
            }
        });
        node.replaceWith(fragment);
    });
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[char]));
}

function asDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value.toDate === 'function') return value.toDate();
    if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDbDate(value, options) {
    const date = asDate(value);
    return date ? date.toLocaleString('ru-RU', options) : '';
}


function compareDbDates(a, b) {
    const left = asDate(a)?.getTime() || 0;
    const right = asDate(b)?.getTime() || 0;
    return left - right;
}

function safeUrl(value) {
    try {
        const url = new URL(String(value || ''), window.location.href);
        return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch (error) { return ''; }
}

function safeRichText(value) {
    const source = String(value || '');
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${source}</div>`, 'text/html');
    const allowedTags = new Set(['DIV','P','BR','STRONG','B','EM','I','U','UL','OL','LI','H2','H3','H4','BLOCKQUOTE','CODE','PRE','A']);
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);
    const elements = [];
    while (walker.nextNode()) elements.push(walker.currentNode);
    elements.forEach((element) => {
        if (!allowedTags.has(element.tagName)) {
            const text = doc.createTextNode(element.textContent || '');
            element.replaceWith(text);
            return;
        }
        const originalHref = element.tagName === 'A' ? element.getAttribute('href') : '';
        [...element.attributes].forEach((attribute) => element.removeAttribute(attribute.name));
        if (element.tagName === 'A') {
            const href = safeUrl(originalHref);
            if (href) {
                element.setAttribute('href', href);
                element.setAttribute('target', '_blank');
                element.setAttribute('rel', 'noopener noreferrer');
            } else element.replaceWith(doc.createTextNode(element.textContent || ''));
        }
    });
    const wrapper = doc.body.firstElementChild;
    if (!wrapper) return escapeHtml(source).replace(/\n/g, '<br>');
    const hadMarkup = /<\/?[a-z][\s\S]*>/i.test(source);
    return hadMarkup ? wrapper.innerHTML : escapeHtml(source).replace(/\n/g, '<br>');
}

function profileToCurrentUser(profile) {
    if (!profile) return null;
    return {
        name: profile.name,
        ранг: profile.rank,
        учитель: profile.teacher || 'отсутствует',
        specialTitle: profile.specialTitle || '',
        description: profile.description || ''
    };
}

function hydrateProfiles(profiles) {
    usersDatabase = {};
    (profiles || []).forEach((profile) => {
        const key = String(profile.name || '').toLowerCase();
        if (!key) return;
        usersDatabase[key] = {
            fullName: profile.name,
            ранг: profile.rank,
            учитель: profile.teacher || 'отсутствует',
            specialTitle: profile.specialTitle || '',
            description: profile.description || ''
        };
    });
}

const USER_RANK_OPTIONS = [
    'адепт', 'юнлинг', 'падаван', 'старший падаван', 'рыцарь',
    'мастер', 'магистр', 'верховный магистр', 'старейшина'
];

function titleCase(value) {
    const text = String(value || '');
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}

async function refreshProfiles(refreshSession = false) {
    if (!authClient) return;
    const profilesResult = await authClient.getProfiles();
    hydrateProfiles(profilesResult.profiles || []);
    if (refreshSession && currentUser) {
        const session = await authClient.getSession();
        if (session.authenticated && session.profile) {
            currentUser = profileToCurrentUser(session.profile);
            updateLogoutButton();
        }
    }
}

function teacherSelectOptions(selectedName = '') {
    const options = [{ value: 'отсутствует', label: 'Не назначен' }];
    Object.values(usersDatabase)
        .filter((user) => isMasterRankValue(user.ранг))
        .sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru'))
        .forEach((user) => options.push({ value: user.fullName, label: `${user.fullName} — ${titleCase(user.ранг)}` }));
    if (selectedName && selectedName !== 'отсутствует' && !options.some((option) => option.value === selectedName)) {
        options.push({ value: selectedName, label: selectedName });
    }
    return options;
}

function updateConnectionStatus(state, text) {
    const status = document.getElementById('connection-status');
    if (!status) return;
    status.className = `status-chip is-${state}`;
    const label = status.querySelector('.status-text');
    if (label) label.textContent = text;
}

function showToast(message, type = 'info', duration = 3500) {
    const region = document.getElementById('toast-region');
    if (!region) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: 'fa-circle-check', error: 'fa-circle-exclamation', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
    toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}" aria-hidden="true"></i><span>${escapeHtml(message)}</span>`;
    region.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    window.setTimeout(() => {
        toast.classList.remove('is-visible');
        window.setTimeout(() => toast.remove(), 220);
    }, duration);
}

function setLoading(isLoading, text = 'Загрузка…') {
    const overlay = document.getElementById('loading-overlay');
    const label = document.getElementById('loading-text');
    if (!overlay) return;
    if (isLoading) activeRequests += 1;
    else activeRequests = Math.max(0, activeRequests - 1);
    if (label) label.textContent = text;
    overlay.hidden = activeRequests === 0;
    overlay.setAttribute('aria-hidden', activeRequests === 0 ? 'true' : 'false');
}

function setMainInputVisible(visible) {
    if (mainInputWrapper) mainInputWrapper.hidden = !visible;
}

function userKey(value) {
    return encodeURIComponent(String(value || ''));
}

function decodeUserKey(value) {
    try { return decodeURIComponent(value); } catch (error) { return String(value || ''); }
}

const uiIconObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) replaceUiEmojiIcons(node);
    }));
});
uiIconObserver.observe(document.body, { childList: true, subtree: true });

// ===== LOCAL STORAGE =====
function isLocalStorageAvailable() {
    try { localStorage.setItem('test', 'test'); localStorage.removeItem('test'); return true; }
    catch (e) { return false; }
}
const LOCAL_STORAGE_AVAILABLE = isLocalStorageAvailable();
const STORAGE_KEY = 'akasha_chat_history';
const USER_KEY = 'akasha_current_user';

function saveMessageToStorage(text, isUser) {
    if (!LOCAL_STORAGE_AVAILABLE) return;
    try {
        let history = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        history.push({ text, isUser, timestamp: Date.now() });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {}
}

function loadHistoryFromStorage() {
    if (!LOCAL_STORAGE_AVAILABLE) return;
    try {
        const history = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        history.forEach(msg => { addMessage(msg.text, msg.isUser, false); });
    } catch (error) {}
}

function clearHistory() {
    if (!LOCAL_STORAGE_AVAILABLE) return;
    localStorage.removeItem(STORAGE_KEY);
}

function saveUserToStorage() {
    if (!LOCAL_STORAGE_AVAILABLE || storageMode === 'php') return;
    if (currentUser) { localStorage.setItem(USER_KEY, JSON.stringify(currentUser)); }
    else { localStorage.removeItem(USER_KEY); }
}

function loadUserFromStorage() {
    if (!LOCAL_STORAGE_AVAILABLE || storageMode === 'php') return;
    try {
        const user = JSON.parse(localStorage.getItem(USER_KEY));
        if (user) { currentUser = user; }
    } catch (error) {}
}

// ===== ДОБАВЛЕНИЕ СООБЩЕНИЯ =====
function addMessage(text, isUser = false, saveToStorage = true) {
    const container = document.getElementById('chat-container');
    if (!container) return;
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'akasha-message'}`;
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    if (isUser) contentDiv.textContent = text;
    else contentDiv.innerHTML = text;
    messageDiv.appendChild(contentDiv);
    container.appendChild(messageDiv);
    if (saveToStorage) saveMessageToStorage(text, isUser);
    // Основной экран — обычная страница, поэтому не двигаем viewport после каждого рендера.
    // Автопрокрутка остаётся только внутри отдельного окна личного чата.
}

// ===== FIREBASE CRUD =====
async function loadLessonsFromFirebase() {
    if (!windowDb) return;
    try {
        const snapshot = await windowDb.collection('lessons').get();
        knowledgeBase = {}; lessonsById = {};
        snapshot.forEach((doc) => {
            const data = doc.data(); const id = doc.id;
            lessonsById[id] = { id, ...data };
            if (!knowledgeBase[data.category]) knowledgeBase[data.category] = [];
            knowledgeBase[data.category].push({ id, ...data });
        });
    } catch (error) { console.error('Ошибка загрузки уроков:', error); }
}

async function loadAssignments() {
    if (!windowDb) return;
    try {
        const snapshot = await windowDb.collection('homework_assignments').get();
        assignmentsList = [];
        snapshot.forEach((doc) => { assignmentsList.push({ id: doc.id, ...doc.data() }); });
        assignmentsList.sort((a, b) => compareDbDates(b.createdAt, a.createdAt));
    } catch (error) {
        console.error('Ошибка загрузки заданий:', error);
        showToast(error?.message || 'Не удалось загрузить домашние задания.', 'error');
    }
}

async function loadSubmissions() {
    if (!windowDb) return;
    try {
        const snapshot = await windowDb.collection('homework_submissions').get();
        submissionsList = [];
        snapshot.forEach((doc) => { submissionsList.push({ id: doc.id, ...doc.data() }); });
        submissionsList.sort((a, b) => compareDbDates(b.submittedAt, a.submittedAt));
    } catch (error) {
        console.error('Ошибка загрузки ответов:', error);
        submissionsList = [];
        if (isMaster()) showToast(error?.message || 'Не удалось загрузить ответы.', 'error');
    }
}

async function createAssignment(title, description, dueAt = null) {
    if (!windowDb) return false;
    try {
        await windowDb.collection('homework_assignments').add({
            title, description, dueAt: dueAt || null,
            createdBy: currentUser.name, createdAt: new Date()
        });
        return true;
    } catch (error) {
        console.error('Ошибка создания задания:', error);
        showToast(error?.message || 'Не удалось создать задание.', 'error');
        return false;
    }
}

async function updateAssignment(assignmentId, updates) {
    if (!windowDb || !assignmentId) return false;
    try {
        await windowDb.collection('homework_assignments').doc(assignmentId).update(updates);
        return true;
    } catch (error) {
        console.error('Ошибка обновления задания:', error);
        showToast(error?.message || 'Не удалось обновить задание.', 'error');
        return false;
    }
}

async function removeAssignment(assignmentId) {
    if (!windowDb || !assignmentId) return false;
    try {
        await windowDb.collection('homework_assignments').doc(assignmentId).delete();
        return true;
    } catch (error) {
        console.error('Ошибка удаления задания:', error);
        showToast(error?.message || 'Не удалось удалить задание.', 'error');
        return false;
    }
}

async function submitHomeworkToFirebase(assignmentId, content) {
    if (!windowDb) return false;
    try {
        await windowDb.collection('homework_submissions').add({
            assignmentId: assignmentId, studentName: currentUser.name,
            studentRank: currentUser.ранг, content: content,
            status: 'pending', submittedAt: new Date(),
            masterFeedback: '', reviewedAt: null
        });
        return true;
    } catch (error) { console.error('Ошибка отправки:', error); return false; }
}

async function updateSubmissionStatus(submissionId, status, feedback) {
    if (!windowDb) return false;
    try {
        await windowDb.collection('homework_submissions').doc(submissionId).update({
            status: status, masterFeedback: feedback, reviewedAt: new Date()
        });
        return true;
    } catch (error) { console.error('Ошибка обновления:', error); return false; }
}

async function loadCommentsForLesson(lessonId) {
    if (!windowDb || !lessonId) return [];
    try {
        const snapshot = await windowDb.collection('comments').where('lessonId', '==', lessonId).get();
        const comments = [];
        snapshot.forEach((doc) => { comments.push({ id: doc.id, ...doc.data() }); });
        comments.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        return comments;
    } catch (error) { return []; }
}

async function addCommentToFirebase(lessonId, text, type) {
    if (!windowDb || !lessonId) return false;
    try {
        await windowDb.collection('comments').add({
            lessonId: lessonId, text: text, type: type,
            authorName: currentUser.name, authorRank: currentUser.ранг, createdAt: new Date()
        });
        return true;
    } catch (error) { console.error('Ошибка добавления:', error); return false; }
}

async function updateCommentInFirebase(commentId, newText) {
    if (!windowDb || !commentId) return false;
    try {
        await windowDb.collection('comments').doc(commentId).update({ text: newText, updatedAt: new Date() });
        return true;
    } catch (error) { return false; }
}

async function deleteCommentFromFirebase(commentId) {
    if (!windowDb || !commentId) return false;
    try {
        await windowDb.collection('comments').doc(commentId).delete();
        return true;
    } catch (error) { return false; }
}

async function addLessonToFirebase(category, title, content, mediaUrl = '') {
    if (!windowDb) return false;
    try {
        await windowDb.collection('lessons').add({
            category, title, content, mediaUrl, createdAt: new Date(), addedBy: currentUser.name
        });
        return true;
    } catch (error) { return false; }
}

async function updateLessonInFirebase(lessonId, updates) {
    if (!windowDb || !lessonId) return false;
    try {
        await windowDb.collection('lessons').doc(lessonId).update(updates);
        return true;
    } catch (error) { return false; }
}

async function deleteLesson(lessonId) {
    if (!windowDb || !lessonId) return false;
    try {
        await windowDb.collection('lessons').doc(lessonId).delete();
        delete lessonsById[lessonId];
        return true;
    } catch (error) { return false; }
}

// ===== ЧАТ С МАСТЕРОМ =====
async function sendMessageToMaster(text) {
    if (!windowDb || !currentUser) return false;
    const masterName = currentUser.учитель;
    if (!masterName || masterName === 'отсутствует') {
        addMessage('<p>❌ У тебя нет назначенного Мастера!</p>');
        return false;
    }
    try {
        await windowDb.collection('messages').add({
            from: currentUser.name, to: masterName, text: text,
            timestamp: new Date(), read: false
        });
        return true;
    } catch (error) {
        console.error('💥 Ошибка:', error);
        addMessage(`<p>❌ Ошибка отправки: ${error.message}</p>`);
        return false;
    }
}

async function loadChatWith(partnerName) {
    if (!windowDb || !currentUser || !partnerName) return [];
    try {
        const [snap1, snap2] = await Promise.all([
            windowDb.collection('messages').where('from', '==', currentUser.name).where('to', '==', partnerName).get(),
            windowDb.collection('messages').where('from', '==', partnerName).where('to', '==', currentUser.name).get()
        ]);
        const messages = [];
        snap1.forEach((doc) => messages.push({ id: doc.id, ...doc.data() }));
        snap2.forEach((doc) => messages.push({ id: doc.id, ...doc.data() }));
        messages.sort((a, b) => compareDbDates(a.timestamp, b.timestamp));
        return messages;
    } catch (error) {
        console.error('Ошибка загрузки чата:', error);
        showToast(error?.message || 'Не удалось загрузить переписку.', 'error');
        return [];
    }
}

async function markAsRead(fromUser) {
    if (!windowDb || !currentUser || !fromUser) return;
    try {
        const snapshot = await windowDb.collection('messages')
            .where('from', '==', fromUser)
            .where('to', '==', currentUser.name)
            .where('read', '==', false)
            .get();
        if (snapshot.empty) return;
        const batch = windowDb.batch();
        snapshot.forEach((doc) => batch.update(doc.ref, { read: true }));
        await batch.commit();
    } catch (error) { console.error('Ошибка отметки сообщений:', error); }
}

function renderChatMessages(messages, partnerName) {
    const container = document.getElementById('master-chat-container');
    if (!container) return;
    container.replaceChildren();
    if (!messages.length) {
        const empty = document.createElement('div');
        empty.className = 'empty-state compact';
        empty.innerHTML = '<i class="fa-regular fa-comments" aria-hidden="true"></i><p>Пока нет сообщений. Напиши первым.</p>';
        container.appendChild(empty);
        return;
    }
    messages.forEach((msg) => {
        const isMine = msg.from === currentUser.name;
        const bubble = document.createElement('article');
        bubble.className = `chat-bubble ${isMine ? 'mine' : 'theirs'}`;
        const text = document.createElement('div');
        text.className = 'bubble-text';
        text.textContent = String(msg.text || '');
        const meta = document.createElement('div');
        meta.className = 'bubble-time';
        const time = msg.timestamp ? formatDbDate(msg.timestamp, { hour: '2-digit', minute: '2-digit' }) : '';
        meta.textContent = `${time}${isMine && msg.read ? ' · прочитано' : ''}`;
        bubble.append(text, meta);
        container.appendChild(bubble);
    });
    requestAnimationFrame(() => { container.scrollTop = container.scrollHeight; });
    if (partnerName) markAsRead(partnerName);
}

async function refreshActiveChat() {
    const partner = window.currentChatPartner;
    if (!partner || document.getElementById('master-chat-wrapper')?.hidden) return;
    const messages = await loadChatWith(partner);
    renderChatMessages(messages, partner);
}

function startChatPolling() {
    window.clearInterval(chatPollTimer);
    chatPollTimer = window.setInterval(refreshActiveChat, 15000);
}

async function openChatPartner(partnerName) {
    if (!partnerName || !currentUser) return;
    window.currentChatPartner = partnerName;
    chatContainer.classList.add('chat-open');
    setMainInputVisible(false);
    const wrapper = document.getElementById('master-chat-wrapper');
    if (wrapper) wrapper.hidden = false;
    const title = document.getElementById('master-chat-title');
    if (title) title.textContent = `Чат: ${partnerName}`;
    const container = document.getElementById('master-chat-container');
    if (container) container.innerHTML = '<div class="loading-inline"><i class="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i> Загрузка переписки…</div>';
    const messages = await loadChatWith(partnerName);
    renderChatMessages(messages, partnerName);
    startChatPolling();
    document.getElementById('master-chat-input')?.focus({ preventScroll: true });
}

window.openMasterChat = async function() {
    if (!currentUser) return;
    if (!currentUser.учитель || currentUser.учитель === 'отсутствует') {
        await showMasterDashboard();
        return;
    }
    await openChatPartner(currentUser.учитель);
};

async function showMasterDashboard() {
    if (!windowDb || !currentUser) return;
    const container = document.getElementById('chat-container');
    if (container) container.innerHTML = '';
    try {
        const snapshot = await windowDb.collection('messages').where('to', '==', currentUser.name).get();
        const studentsMap = new Map();
        snapshot.forEach((doc) => {
            const data = doc.data();
            const studentName = data.from;
            if (!studentName) return;
            const existing = studentsMap.get(studentName);
            if (!existing || compareDbDates(data.timestamp, existing.timestamp) > 0) {
                studentsMap.set(studentName, {
                    name: studentName,
                    lastMessage: String(data.text || ''),
                    timestamp: data.timestamp,
                    unread: data.read === false || Boolean(existing?.unread)
                });
            } else if (data.read === false) existing.unread = true;
        });
        const students = Array.from(studentsMap.values()).sort((a, b) => compareDbDates(b.timestamp, a.timestamp));
        let html = `<section class="panel-card"><div class="section-heading"><i class="fa-solid fa-inbox" aria-hidden="true"></i><div><h2>Сообщения от учеников</h2><p>Личные диалоги и непрочитанные сообщения</p></div></div>`;
        if (!students.length) {
            html += `<div class="empty-state"><i class="fa-regular fa-comments" aria-hidden="true"></i><p>Пока нет сообщений от учеников.</p></div>`;
        } else {
            html += '<div class="conversation-list">';
            students.forEach((student) => {
                const time = student.timestamp ? formatDbDate(student.timestamp, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
                const preview = student.lastMessage.length > 90 ? `${student.lastMessage.slice(0, 90)}…` : student.lastMessage;
                html += `<button class="conversation-card" type="button" onclick="window.openChatWithStudent(decodeUserKey('${userKey(student.name)}'))">
                    <span class="conversation-avatar"><i class="fa-solid fa-user" aria-hidden="true"></i></span>
                    <span class="conversation-main"><strong>${escapeHtml(student.name)}</strong><span>${escapeHtml(preview)}</span></span>
                    <span class="conversation-meta">${student.unread ? '<span class="unread-dot" title="Есть непрочитанные"></span>' : ''}<time>${escapeHtml(time)}</time></span>
                </button>`;
            });
            html += '</div>';
        }
        html += `<button class="hw-btn secondary" onclick="showMainMenu()"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Вернуться в меню</button></section>`;
        addMessage(html, false, false);
    } catch (error) {
        console.error('Ошибка загрузки панели Мастера:', error);
        addMessage(`<div class="system-error">${escapeHtml(error?.message || 'Не удалось загрузить сообщения.')}</div>`, false, false);
    }
}

window.openChatWithStudent = async function(studentName) {
    await openChatPartner(studentName);
};

window.sendMasterChatMessage = async function() {
    const input = document.getElementById('master-chat-input');
    const button = document.getElementById('master-chat-send');
    const partner = window.currentChatPartner;
    if (!input || !partner || !currentUser) return;
    const text = input.value.trim();
    if (!text) return;
    input.disabled = true;
    if (button) button.disabled = true;
    try {
        await windowDb.collection('messages').add({
            from: currentUser.name,
            to: partner,
            text,
            timestamp: new Date(),
            read: false
        });
        input.value = '';
        await refreshActiveChat();
    } catch (error) {
        console.error('Ошибка отправки:', error);
        showToast(error?.message || 'Не удалось отправить сообщение.', 'error');
    } finally {
        input.disabled = false;
        if (button) button.disabled = false;
        input.focus({ preventScroll: true });
    }
};

window.closeMasterChat = function() {
    window.clearInterval(chatPollTimer);
    chatPollTimer = null;
    chatContainer.classList.remove('chat-open');
    const wrapper = document.getElementById('master-chat-wrapper');
    if (wrapper) wrapper.hidden = true;
    window.currentChatPartner = null;
    setMainInputVisible(Boolean(currentUser));
    showMainMenu();
};

// ===== УТИЛИТЫ =====
function parseUserInput(text) {
    const data = { name: '', ранг: '', учитель: '', пароль: '' };
    const parts = text.split(',');
    if (parts.length > 0) {
        const namePart = parts[0].trim().toLowerCase();
        data.name = namePart.replace(/(?:меня\s+)?(?:зовут|зову)\s+/i, '').trim();
    }
    if (parts.length > 1) {
        const rankPart = parts[1].trim().toLowerCase();
        const ranks = ['верховный магистр', 'старший падаван', 'старейшина', 'магистр', 'мастер', 'рыцарь', 'падаван', 'юнлинг', 'адепт'];
        for (let rank of ranks) { if (rankPart.includes(rank)) { data.ранг = rank; break; } }
    }
    const teacherMatch = text.match(/(?:учитель|учителя)\s+([^,]+),/i);
    if (teacherMatch) { data.учитель = teacherMatch[1].trim(); if (data.учитель.toLowerCase().includes('нет')) data.учитель = 'отсутствует'; }
    const passMatch = text.match(/(?:пароль|пароль:)\s*(.+)$/i);
    if (passMatch) {
        let pass = passMatch[1].trim().replace(/[—–\-]/g, '');
        pass = pass.replace(/I/g, 'i');
        data.пароль = pass;
    }
    return data;
}

function checkAccess(topic) {
    const topicAccess = {
        'ганн': ['адепт', 'юнлинг', 'падаван', 'старший падаван', 'рыцарь', 'мастер', 'магистр', 'верховный магистр', 'старейшина'],
        'берг': ['падаван', 'старший падаван', 'рыцарь', 'мастер', 'магистр', 'верховный магистр', 'старейшина'],
        'катарн': ['рыцарь', 'мастер', 'магистр', 'верховный магистр', 'старейшина'],
        'крайт': ['мастер', 'магистр', 'верховный магистр', 'старейшина']
    };
    return topicAccess[topic].includes(currentUser.ранг);
}

function isAdmin() { return Boolean(currentUser && ['магистр', 'верховный магистр', 'старейшина'].includes(currentUser.ранг)); }
function isMaster() { return Boolean(currentUser && ['мастер', 'магистр', 'верховный магистр', 'старейшина'].includes(currentUser.ранг)); }

// ===== ГЛАВНОЕ МЕНЮ =====
function showMainMenu() {
    const container = document.getElementById('chat-container');
    if (!container || !currentUser) return;
    window.clearInterval(chatPollTimer);
    chatPollTimer = null;
    const wrapper = document.getElementById('master-chat-wrapper');
    if (wrapper) wrapper.hidden = true;
    setMainInputVisible(true);
    const actions = [
        ['fa-clipboard-list', 'Домашние задания', 'Задания, ответы и проверка', 'window.showHomeworkBoard()', ''],
        ['fa-envelope', isMaster() ? 'Сообщения' : 'Написать Мастеру', 'Личная переписка', 'window.openMasterChat()', 'accent'],
        ['fa-book-open', 'Оглавление знаний', 'Уроки по уровню доступа', 'showTOC()', ''],
        ['fa-landmark', 'Совет Мастеров', 'Состав руководства Ордена', 'window.showCouncilOfMasters()', 'accent'],
        ['fa-users', 'Члены Ордена', 'Участники и статусы', 'window.showMembersList()', ''],
        ['fa-chart-column', 'Успеваемость', 'Уроки, ДЗ и корректировки', 'window.showProgressTable()', '']
    ];
    if (isAdmin()) actions.push(['fa-shield-halved', 'Админ-панель', 'Блокировки и журнал действий', 'window.showAdminPanel()', 'danger']);
    container.innerHTML = `
        <section class="panel-card dashboard-card">
            <div class="dashboard-welcome">
                <span class="eyebrow">Личный кабинет</span>
                <h2>${escapeHtml(currentUser.name)}</h2>
                <p>${escapeHtml(currentUser.ранг)}${currentUser.учитель && currentUser.учитель !== 'отсутствует' ? ` · наставник: ${escapeHtml(currentUser.учитель)}` : ''}</p>
            </div>
            <div class="dashboard-grid">
                ${actions.map(([icon,title,desc,action,tone]) => `<button class="dashboard-action ${tone}" type="button" onclick="${action}"><span class="dashboard-action-icon"><i class="fa-solid ${icon}" aria-hidden="true"></i></span><span><strong>${title}</strong><small>${desc}</small></span><i class="fa-solid fa-chevron-right dashboard-chevron" aria-hidden="true"></i></button>`).join('')}
            </div>
            <p class="dashboard-tip"><i class="fa-regular fa-keyboard" aria-hidden="true"></i> Внизу можно задать Акаше вопрос или быстро написать команду.</p>
        </section>`;
    container.focus({ preventScroll: true });
}

// ===== ДОМАШНИЕ ЗАДАНИЯ =====// ===== ДОМАШНИЕ ЗАДАНИЯ =====
function submissionStatus(status) {
    const map = {
        approved: { label: 'Одобрено', icon: 'fa-circle-check', className: 'approved' },
        needs_revision: { label: 'Нужна доработка', icon: 'fa-triangle-exclamation', className: 'revision' },
        pending: { label: 'На проверке', icon: 'fa-clock', className: 'pending' }
    };
    return map[status] || map.pending;
}

function formatDueDate(value) {
    const date = asDate(value);
    if (!date) return null;
    return {
        text: date.toLocaleString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        overdue: date.getTime() < Date.now()
    };
}

window.showHomeworkBoard = async function() {
    const container = document.getElementById('chat-container');
    if (container) container.innerHTML = '<div class="loading-inline"><i class="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i> Загружаем задания…</div>';
    await Promise.all([loadAssignments(), loadSubmissions()]);
    if (container) container.innerHTML = '';

    let html = `<section class="panel-card homework-board"><div class="section-heading"><i class="fa-solid fa-clipboard-list" aria-hidden="true"></i><div><h2>Домашние задания</h2><p>${assignmentsList.length ? `Опубликовано заданий: ${assignmentsList.length}` : 'Мастера пока не опубликовали задания'}</p></div></div>`;

    if (isMaster()) {
        html += `<div class="section-actions"><button class="hw-btn primary" onclick="window.startCreateAssignment()"><i class="fa-solid fa-plus" aria-hidden="true"></i> Создать задание</button></div>`;
    }

    if (!assignmentsList.length) {
        html += `<div class="empty-state"><i class="fa-regular fa-clipboard" aria-hidden="true"></i><h3>Заданий пока нет</h3><p>${isMaster() ? 'Создайте первое задание для учеников.' : 'Новое задание появится здесь после публикации Мастером.'}</p></div>`;
    } else {
        html += '<div class="homework-list">';
        assignmentsList.forEach((hw) => {
            if (!hw?.id) return;
            const hwSubmissions = submissionsList.filter((item) => item.assignmentId === hw.id);
            const pendingCount = hwSubmissions.filter((item) => item.status === 'pending').length;
            const mySubmissions = submissionsList
                .filter((item) => item.assignmentId === hw.id && item.studentName === currentUser.name)
                .sort((a, b) => compareDbDates(b.submittedAt, a.submittedAt));
            const myLastSubmission = mySubmissions[0] || null;
            const due = formatDueDate(hw.dueAt);

            html += `<article class="hw-card"><div class="hw-card-head"><div><h3 class="hw-title">${escapeHtml(hw.title || 'Без названия')}</h3><div class="hw-meta"><span><i class="fa-solid fa-user-pen" aria-hidden="true"></i> ${escapeHtml(hw.createdBy || 'Мастер')}</span><span><i class="fa-regular fa-calendar" aria-hidden="true"></i> ${escapeHtml(formatDbDate(hw.createdAt, { day: '2-digit', month: '2-digit', year: 'numeric' }) || 'дата не указана')}</span></div></div>`;
            if (due) html += `<span class="deadline-badge ${due.overdue ? 'is-overdue' : ''}"><i class="fa-regular fa-clock" aria-hidden="true"></i> ${due.overdue ? 'Срок прошёл' : 'До'} ${escapeHtml(due.text)}</span>`;
            html += `</div><div class="hw-desc">${escapeHtml(hw.description || '').replace(/\n/g, '<br>')}</div>`;

            if (!isMaster() && myLastSubmission) {
                const status = submissionStatus(myLastSubmission.status);
                html += `<div class="submission-summary ${status.className}"><div class="submission-status"><i class="fa-solid ${status.icon}" aria-hidden="true"></i><strong>${status.label}</strong></div><div class="submission-content"><span>Ваш ответ</span><p>${escapeHtml(myLastSubmission.content || '').replace(/\n/g, '<br>')}</p></div>`;
                if (myLastSubmission.masterFeedback) html += `<div class="feedback-box"><strong><i class="fa-solid fa-comment-dots" aria-hidden="true"></i> Комментарий Мастера</strong><p>${escapeHtml(myLastSubmission.masterFeedback).replace(/\n/g, '<br>')}</p></div>`;
                html += `<small>Отправлено: ${escapeHtml(formatDbDate(myLastSubmission.submittedAt) || 'дата неизвестна')}</small></div>`;
            }

            if (isMaster()) {
                html += `<div class="submission-stats"><span><i class="fa-solid fa-inbox" aria-hidden="true"></i> Ответов: ${hwSubmissions.length}</span><span><i class="fa-regular fa-clock" aria-hidden="true"></i> На проверке: ${pendingCount}</span></div>`;
            }

            html += '<div class="hw-actions">';
            if (isMaster()) {
                if (hwSubmissions.length) html += `<button class="hw-btn primary" onclick="window.reviewSubmissions('${hw.id}')"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i> Проверить ответы</button>`;
                html += `<button class="hw-btn secondary" onclick="window.editAssignment('${hw.id}')"><i class="fa-solid fa-pen" aria-hidden="true"></i> Изменить</button>`;
                html += `<button class="hw-btn danger" onclick="window.confirmDeleteAssignment('${hw.id}')"><i class="fa-solid fa-trash" aria-hidden="true"></i> Удалить</button>`;
            } else if (!myLastSubmission || myLastSubmission.status === 'needs_revision') {
                html += `<button class="hw-btn primary" onclick="window.submitHomework('${hw.id}')"><i class="fa-solid fa-paper-plane" aria-hidden="true"></i> ${myLastSubmission ? 'Исправить и отправить' : 'Отправить ответ'}</button>`;
            } else {
                html += `<button class="hw-btn secondary" disabled><i class="fa-solid fa-lock" aria-hidden="true"></i> ${myLastSubmission.status === 'approved' ? 'Задание принято' : 'Ответ уже отправлен'}</button>`;
                if (myLastSubmission.status === 'pending') html += `<button class="hw-btn danger ghost" onclick="window.deleteMySubmission('${myLastSubmission.id}')"><i class="fa-solid fa-trash" aria-hidden="true"></i> Отозвать ответ</button>`;
            }
            html += '</div></article>';
        });
        html += '</div>';
    }
    html += `<button class="hw-btn secondary full-width" onclick="showMainMenu()"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Вернуться в меню</button></section>`;
    addMessage(html, false, false);
};

window.deleteMySubmission = async function(submissionId) {
    showCustomConfirm('Отозвать ответ', 'Ответ будет удалён без возможности восстановления. Продолжить?', async (confirmed) => {
        if (!confirmed) return;
        try {
            setLoading(true, 'Удаляем ответ…');
            await windowDb.collection('homework_submissions').doc(submissionId).delete();
            showToast('Ответ удалён.', 'success');
            await window.showHomeworkBoard();
        } catch (error) {
            showToast(error?.message || 'Не удалось удалить ответ.', 'error');
        } finally { setLoading(false); }
    });
};

window.reviewSubmissions = async function(assignmentId) {
    await loadSubmissions();
    const container = document.getElementById('chat-container');
    if (container) container.innerHTML = '';
    const hw = assignmentsList.find((item) => item.id === assignmentId);
    if (!hw) { showToast('Задание не найдено.', 'error'); return; }
    const submissions = submissionsList.filter((item) => item.assignmentId === assignmentId);
    let html = `<section class="panel-card homework-board"><div class="section-heading"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><div><h2>Проверка ответов</h2><p>${escapeHtml(hw.title || '')}</p></div></div>`;
    if (!submissions.length) {
        html += `<div class="empty-state"><i class="fa-regular fa-inbox" aria-hidden="true"></i><p>Ответов пока нет.</p></div>`;
    } else {
        html += '<div class="homework-list">';
        submissions.forEach((sub) => {
            const status = submissionStatus(sub.status);
            html += `<article class="hw-card submission-card ${status.className}"><div class="hw-card-head"><div><h3 class="hw-title">${escapeHtml(sub.studentName || 'Ученик')}</h3><div class="hw-meta"><span>${escapeHtml(sub.studentRank || '')}</span><span>${escapeHtml(formatDbDate(sub.submittedAt) || '')}</span></div></div><span class="status-badge ${status.className}"><i class="fa-solid ${status.icon}" aria-hidden="true"></i>${status.label}</span></div>`;
            html += `<div class="submission-content"><span>Ответ ученика</span><p>${escapeHtml(sub.content || '').replace(/\n/g, '<br>')}</p></div>`;
            if (sub.masterFeedback) html += `<div class="feedback-box"><strong><i class="fa-solid fa-comment-dots" aria-hidden="true"></i> Комментарий</strong><p>${escapeHtml(sub.masterFeedback).replace(/\n/g, '<br>')}</p></div>`;
            html += `<div class="hw-actions"><button class="hw-btn success" onclick="window.gradeSubmission('${sub.id}', '${hw.id}', 'approved')"><i class="fa-solid fa-check" aria-hidden="true"></i> Одобрить</button><button class="hw-btn warning" onclick="window.gradeSubmission('${sub.id}', '${hw.id}', 'needs_revision')"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i> На доработку</button><button class="hw-btn secondary" onclick="window.addFeedback('${sub.id}', '${hw.id}')"><i class="fa-solid fa-comment" aria-hidden="true"></i> Комментарий</button></div></article>`;
        });
        html += '</div>';
    }
    html += `<button class="hw-btn secondary full-width" onclick="window.showHomeworkBoard()"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Назад к заданиям</button></section>`;
    addMessage(html, false, false);
};

window.gradeSubmission = function(submissionId, assignmentId, status) {
    const label = status === 'approved' ? 'Одобрить ответ' : 'Отправить на доработку';
    showFormModal({
        title: label,
        description: status === 'approved' ? 'Комментарий необязателен.' : 'Укажите, что нужно исправить.',
        submitText: status === 'approved' ? 'Одобрить' : 'На доработку',
        fields: [{ id: 'review-feedback', label: 'Комментарий Мастера', type: 'textarea', rows: 5, maxlength: 5000, placeholder: 'Комментарий для ученика' }],
        onSubmit: async (values, controls) => {
            controls.setBusy(true);
            const success = await updateSubmissionStatus(submissionId, status, values['review-feedback'].trim());
            controls.setBusy(false);
            if (!success) { controls.showError('Не удалось обновить статус.'); return false; }
            showToast('Статус ответа обновлён.', 'success');
            await window.reviewSubmissions(assignmentId);
            return true;
        }
    });
};

window.addFeedback = function(submissionId, assignmentId) {
    const sub = submissionsList.find((item) => item.id === submissionId);
    showFormModal({
        title: 'Комментарий Мастера',
        submitText: 'Сохранить комментарий',
        fields: [{ id: 'master-feedback', label: 'Комментарий', type: 'textarea', rows: 6, required: true, maxlength: 5000, value: sub?.masterFeedback || '', placeholder: 'Напишите понятный комментарий ученику' }],
        onSubmit: async (values, controls) => {
            controls.setBusy(true);
            const success = await updateSubmissionStatus(submissionId, sub?.status || 'pending', values['master-feedback'].trim());
            controls.setBusy(false);
            if (!success) { controls.showError('Не удалось сохранить комментарий.'); return false; }
            showToast('Комментарий сохранён.', 'success');
            await window.reviewSubmissions(assignmentId);
            return true;
        }
    });
};

window.startCreateAssignment = function() {
    if (!isMaster()) { showToast('Недостаточно прав.', 'error'); return; }
    showFormModal({
        title: 'Новое домашнее задание',
        description: 'Название и описание обязательны. Срок сдачи можно оставить пустым.',
        submitText: 'Опубликовать',
        draftKey: `assignment_new_${currentUser.name}`,
        fields: [
            { id: 'assignment-title', label: 'Название', type: 'text', required: true, maxlength: 180, placeholder: 'Например: Основы защитной магии', autocomplete: 'off' },
            { id: 'assignment-description', label: 'Описание задания', type: 'textarea', rows: 8, required: true, maxlength: 10000, placeholder: 'Что нужно сделать, требования и формат ответа' },
            { id: 'assignment-due', label: 'Срок сдачи', type: 'datetime-local', help: 'Необязательно' }
        ],
        onSubmit: async (values, controls) => {
            controls.setBusy(true);
            const dueAt = values['assignment-due'] ? new Date(values['assignment-due']) : null;
            const success = await createAssignment(values['assignment-title'].trim(), values['assignment-description'].trim(), dueAt);
            controls.setBusy(false);
            if (!success) { controls.showError('Не удалось сохранить задание.'); return false; }
            showToast('Задание опубликовано.', 'success');
            await window.showHomeworkBoard();
            return true;
        }
    });
};

window.editAssignment = function(assignmentId) {
    const hw = assignmentsList.find((item) => item.id === assignmentId);
    if (!hw || !isMaster()) return;
    const due = asDate(hw.dueAt);
    const dueValue = due ? new Date(due.getTime() - due.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
    showFormModal({
        title: 'Редактирование задания',
        submitText: 'Сохранить',
        fields: [
            { id: 'assignment-title', label: 'Название', type: 'text', required: true, maxlength: 180, value: hw.title || '' },
            { id: 'assignment-description', label: 'Описание задания', type: 'textarea', rows: 8, required: true, maxlength: 10000, value: hw.description || '' },
            { id: 'assignment-due', label: 'Срок сдачи', type: 'datetime-local', value: dueValue, help: 'Оставьте пустым, чтобы убрать срок' }
        ],
        onSubmit: async (values, controls) => {
            controls.setBusy(true);
            const success = await updateAssignment(assignmentId, {
                title: values['assignment-title'].trim(),
                description: values['assignment-description'].trim(),
                dueAt: values['assignment-due'] ? new Date(values['assignment-due']) : null
            });
            controls.setBusy(false);
            if (!success) { controls.showError('Не удалось сохранить изменения.'); return false; }
            showToast('Задание обновлено.', 'success');
            await window.showHomeworkBoard();
            return true;
        }
    });
};

window.confirmDeleteAssignment = function(assignmentId) {
    const hw = assignmentsList.find((item) => item.id === assignmentId);
    if (!hw || !isMaster()) return;
    showCustomConfirm('Удаление задания', `Удалить «${hw.title}» вместе со связанными ответами?`, async (confirmed) => {
        if (!confirmed) return;
        setLoading(true, 'Удаляем задание…');
        const success = await removeAssignment(assignmentId);
        setLoading(false);
        if (!success) return;
        showToast('Задание удалено.', 'success');
        await window.showHomeworkBoard();
    });
};

window.submitHomework = function(hwId) {
    const hw = assignmentsList.find((item) => item.id === hwId);
    if (!hw || isMaster()) return;
    const existing = submissionsList
        .filter((item) => item.assignmentId === hwId && item.studentName === currentUser.name)
        .sort((a, b) => compareDbDates(b.submittedAt, a.submittedAt))[0];
    if (existing && existing.status !== 'needs_revision') {
        showToast(existing.status === 'approved' ? 'Это задание уже принято.' : 'Ответ уже отправлен на проверку.', 'warning');
        return;
    }
    showFormModal({
        title: existing ? 'Исправить ответ' : 'Отправить ответ',
        description: hw.title || '',
        submitText: 'Отправить Мастеру',
        draftKey: `homework_${currentUser.name}_${hwId}`,
        fields: [{ id: 'homework-answer', label: 'Ваш ответ', type: 'textarea', rows: 10, required: true, maxlength: 20000, value: existing?.content || '', placeholder: 'Напишите ответ. Можно выделять, копировать и вставлять текст.' }],
        onSubmit: async (values, controls) => {
            controls.setBusy(true);
            let success = false;
            if (existing) {
                try {
                    await windowDb.collection('homework_submissions').doc(existing.id).update({ content: values['homework-answer'].trim(), status: 'pending', submittedAt: new Date() });
                    success = true;
                } catch (error) { controls.showError(error?.message || 'Не удалось повторно отправить ответ.'); }
            } else success = await submitHomeworkToFirebase(hwId, values['homework-answer'].trim());
            controls.setBusy(false);
            if (!success) { if (document.querySelector('.form-error')?.hidden) controls.showError('Не удалось отправить ответ.'); return false; }
            showToast('Ответ отправлен Мастеру.', 'success');
            await window.showHomeworkBoard();
            return true;
        }
    });
};

// ===== ОГЛАВЛЕНИЕ =====
function showTOC() {
    const container = document.getElementById('chat-container');
    if (container) container.innerHTML = '';
    const availableSections = accessLevels[currentUser.ранг];
    const isAdminUser = isAdmin();
    let tocHTML = `<div style="background:rgba(13,31,15,0.5); border:1px solid var(--border-color); border-radius:10px; padding:20px; margin:10px 0;"><h3 style="color:#64ffda; margin-bottom:20px; font-family:'Playfair Display',serif;">📚 Оглавление знаний Ордена</h3>`;
    const sections = [{ key: 'адепт', name: '1. Занятия для Адептов' }, { key: 'юнлинг', name: '2. Занятия для Юнлингов' }, { key: 'падаван', name: '3. Занятия для Падаванов' }, { key: 'рыцарь', name: '4. Занятия для Рыцарей' }, { key: 'мастер', name: '5. Занятия для Мастеров' }];
    sections.forEach(section => {
        if (availableSections.includes(section.key)) {
            tocHTML += `<div class="toc-section"><div class="toc-section-title">${section.name}</div>`;
            const lessons = knowledgeBase[section.key] || [];
            if (lessons.length === 0) tocHTML += `<div class="toc-empty">• Уроков пока нет</div>`;
            else lessons.forEach(lesson => { if (lesson.id) tocHTML += `<div class="toc-lesson-link" onclick="window.showLessonContent('${lesson.id}')">• ${lesson.title}</div>`; });
            tocHTML += `</div>`;
        }
    });
    if (isAdminUser) tocHTML += `<div class="toc-section"><div class="toc-section-title">6. Админ-панель</div><div class="toc-lesson-link" onclick="window.startAddLesson()">➕ Добавить новый урок</div></div>`;
    tocHTML += `</div><button class="hw-btn" onclick="showMainMenu()" style="width:100%; margin-top:10px; padding:12px;">🔙 Вернуться в меню</button>`;
    addMessage(tocHTML);
}

// ===== УРОКИ =====
function lessonMediaMarkup(rawUrl) {
    const url = safeUrl(rawUrl);
    if (!url) return '';
    try {
        const parsed = new URL(url);
        const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
        let embedUrl = '';
        if (host === 'youtube.com' || host === 'm.youtube.com') {
            const videoId = parsed.searchParams.get('v');
            if (videoId && /^[\w-]{6,20}$/.test(videoId)) embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
        } else if (host === 'youtu.be') {
            const videoId = parsed.pathname.split('/').filter(Boolean)[0] || '';
            if (/^[\w-]{6,20}$/.test(videoId)) embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
        } else if (host.endsWith('rutube.ru')) {
            const match = parsed.pathname.match(/(?:video|play\/embed)\/([\w-]+)/);
            if (match) embedUrl = `https://rutube.ru/play/embed/${match[1]}`;
        }
        if (embedUrl) return `<div class="media-frame"><iframe src="${escapeHtml(embedUrl)}" title="Медиа к уроку" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
        if (/\.(?:jpe?g|png|gif|webp|avif)(?:$|\?)/i.test(url)) return `<img class="lesson-media" src="${escapeHtml(url)}" alt="Материал к уроку" loading="lazy">`;
        if (/\.(?:mp4|webm|ogg)(?:$|\?)/i.test(url)) return `<video class="lesson-media" controls preload="metadata"><source src="${escapeHtml(url)}"></video>`;
        return `<a class="external-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> Открыть дополнительный материал</a>`;
    } catch (error) { return ''; }
}

async function showLessonContentWithReadButton(lessonId) {
    const container = document.getElementById('chat-container');
    if (!container) return;
    container.innerHTML = '<div class="loading-inline"><i class="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i> Загружаем урок…</div>';
    if (!lessonId || !lessonsById[lessonId]) {
        container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i><h3>Урок не найден</h3><button class="hw-btn" onclick="showTOC()">Вернуться к оглавлению</button></div>';
        return;
    }
    const lesson = lessonsById[lessonId];
    const [isRead, comments] = await Promise.all([isLessonRead(lessonId), loadCommentsForLesson(lessonId)]);
    const commentHtml = comments.length ? comments.map((comment) => {
        const masterComment = comment.type === 'task';
        const canEdit = comment.authorName === currentUser.name;
        const canDelete = canEdit || isAdmin();
        return `<article class="comment-item ${masterComment ? 'master-comment' : ''}">
            <header><div><strong>${escapeHtml(comment.authorName || '')}</strong><span class="comment-type-badge ${masterComment ? 'badge-task' : 'badge-question'}"><i class="fa-solid ${masterComment ? 'fa-thumbtack' : 'fa-comment'}" aria-hidden="true"></i> ${masterComment ? 'Задание' : 'Комментарий'}</span></div><time>${escapeHtml(comment.createdAt ? formatDbDate(comment.createdAt) : '')}</time></header>
            <div class="comment-text">${escapeHtml(comment.text || '').replace(/\n/g, '<br>')}</div>
            ${canEdit || canDelete ? `<footer class="comment-actions">${canEdit ? `<button class="text-button" onclick="window.editComment('${comment.id}','${lessonId}')"><i class="fa-solid fa-pen"></i> Изменить</button>` : ''}${canDelete ? `<button class="text-button danger" onclick="window.deleteComment('${comment.id}','${lessonId}')"><i class="fa-solid fa-trash"></i> Удалить</button>` : ''}</footer>` : ''}
        </article>`;
    }).join('') : '<div class="empty-state compact"><i class="fa-regular fa-comments" aria-hidden="true"></i><p>Комментариев пока нет.</p></div>';

    container.innerHTML = `<article class="panel-card lesson-card">
        <div class="lesson-topline"><span class="badge neutral">${escapeHtml(lesson.category || 'без категории')}</span><button class="text-button" type="button" onclick="showTOC()"><i class="fa-solid fa-arrow-left"></i> Оглавление</button></div>
        <header class="lesson-header"><i class="fa-solid fa-book-open-reader" aria-hidden="true"></i><div><h2>${escapeHtml(lesson.title || '')}</h2><p>Учебный материал Ордена</p></div></header>
        <div class="lesson-content prose">${safeRichText(lesson.content || '')}</div>
        ${lessonMediaMarkup(lesson.mediaUrl)}
        <div class="lesson-actions">
            <button class="hw-btn ${isRead ? 'success' : 'primary'}" ${isRead ? 'disabled' : `onclick="window.markLessonRead('${lessonId}')"`}><i class="fa-solid fa-circle-check"></i> ${isRead ? 'Урок прочитан' : 'Отметить прочитанным'}</button>
            ${isAdmin() ? `<button class="hw-btn" onclick="window.editLesson('${lessonId}')"><i class="fa-solid fa-pen"></i> Редактировать</button><button class="hw-btn danger" onclick="window.confirmDeleteLesson('${lessonId}')"><i class="fa-solid fa-trash"></i> Удалить</button>` : ''}
        </div>
        <section class="comments-section"><div class="section-heading small"><i class="fa-solid fa-comments"></i><div><h3>Комментарии</h3><p>${comments.length} ${comments.length === 1 ? 'запись' : 'записей'}</p></div></div>${commentHtml}<button class="hw-btn" onclick="window.startAddComment('${lessonId}')"><i class="fa-solid fa-plus"></i> Добавить комментарий</button></section>
    </article>`;
}

window.markLessonRead = async function(lessonId) {
    setLoading(true, 'Сохраняем прогресс…');
    const success = await markLessonAsRead(lessonId);
    setLoading(false);
    if (success) { showToast('Урок отмечен как прочитанный.', 'success'); await showLessonContentWithReadButton(lessonId); }
    else showToast('Не удалось сохранить отметку.', 'error');
};

window.showLessonContent = showLessonContentWithReadButton;

window.startAddComment = function(lessonId) {
    if (!lessonId) return;
    showFormModal({
        title: 'Новый комментарий',
        description: lessonsById[lessonId]?.title || '',
        submitText: 'Опубликовать',
        draftKey: `comment_${currentUser.name}_${lessonId}`,
        fields: [
            ...(isMaster() ? [{ id: 'comment-type', label: 'Тип записи', type: 'select', options: [{value:'question',label:'Комментарий'}, {value:'task',label:'Задание от Мастера'}] }] : []),
            { id: 'comment-text', label: 'Текст', type: 'textarea', rows: 7, required: true, maxlength: 5000, placeholder: 'Напишите комментарий…' }
        ],
        onSubmit: async (values, controls) => {
            controls.setBusy(true);
            const success = await addCommentToFirebase(lessonId, values['comment-text'].trim(), isMaster() ? values['comment-type'] : 'question');
            controls.setBusy(false);
            if (!success) { controls.showError('Не удалось опубликовать комментарий.'); return false; }
            showToast('Комментарий опубликован.', 'success');
            await showLessonContentWithReadButton(lessonId);
            return true;
        }
    });
};

window.editComment = async function(commentId, lessonId) {
    const comments = await loadCommentsForLesson(lessonId);
    const comment = comments.find((item) => item.id === commentId);
    if (!comment) return;
    showFormModal({
        title: 'Изменить комментарий', submitText: 'Сохранить',
        fields: [{ id: 'comment-text', label: 'Текст', type: 'textarea', rows: 7, required: true, maxlength: 5000, value: comment.text || '' }],
        onSubmit: async (values, controls) => {
            controls.setBusy(true);
            const success = await updateCommentInFirebase(commentId, values['comment-text'].trim());
            controls.setBusy(false);
            if (!success) { controls.showError('Не удалось обновить комментарий.'); return false; }
            showToast('Комментарий обновлён.', 'success');
            await showLessonContentWithReadButton(lessonId);
            return true;
        }
    });
};

window.deleteComment = function(commentId, lessonId) {
    showCustomConfirm('Удалить комментарий', 'Комментарий будет удалён без возможности восстановления.', async (confirmed) => {
        if (!confirmed) return;
        setLoading(true, 'Удаляем комментарий…');
        const success = await deleteCommentFromFirebase(commentId);
        setLoading(false);
        if (success) { showToast('Комментарий удалён.', 'success'); await showLessonContentWithReadButton(lessonId); }
        else showToast('Не удалось удалить комментарий.', 'error');
    });
};

window.editLesson = function(lessonId) {
    const lesson = lessonsById[lessonId];
    if (!lesson || !isAdmin()) return;
    showFormModal({
        title: 'Редактировать урок', submitText: 'Сохранить',
        fields: [
            { id: 'lesson-category', label: 'Уровень доступа', type: 'select', value: lesson.category || 'адепт', options: ['адепт','юнлинг','падаван','старший падаван','рыцарь','мастер','магистр'] },
            { id: 'lesson-title', label: 'Название', required: true, maxlength: 180, value: lesson.title || '' },
            { id: 'lesson-content', label: 'Содержание', type: 'textarea', rows: 14, required: true, maxlength: 50000, value: lesson.content || '', help: 'Поддерживаются абзацы и безопасное базовое форматирование HTML.' },
            { id: 'lesson-media', label: 'Ссылка на медиа', type: 'url', maxlength: 2000, value: lesson.mediaUrl || '', placeholder: 'https://…', autocomplete: 'url' }
        ],
        onSubmit: async (values, controls) => {
            controls.setBusy(true);
            const success = await updateLessonInFirebase(lessonId, { category: values['lesson-category'], title: values['lesson-title'].trim(), content: values['lesson-content'].trim(), mediaUrl: values['lesson-media'].trim() });
            controls.setBusy(false);
            if (!success) { controls.showError('Не удалось сохранить урок. Проверьте ссылку и подключение.'); return false; }
            await loadLessonsFromFirebase();
            showToast('Урок обновлён.', 'success');
            await showLessonContentWithReadButton(lessonId);
            return true;
        }
    });
};

window.confirmDeleteLesson = function(lessonId) {
    const lesson = lessonsById[lessonId];
    if (!lesson || !isAdmin()) return;
    showCustomConfirm('Удалить урок', `Удалить «${lesson.title}» вместе с комментариями и отметками прочтения?`, async (confirmed) => {
        if (!confirmed) return;
        setLoading(true, 'Удаляем урок…');
        const success = await deleteLesson(lessonId);
        setLoading(false);
        if (!success) return showToast('Не удалось удалить урок.', 'error');
        await loadLessonsFromFirebase();
        showToast('Урок удалён.', 'success');
        showTOC();
    });
};

function startAddLesson() {
    if (!isAdmin()) return showToast('Недостаточно прав.', 'error');
    showFormModal({
        title: 'Новый урок', submitText: 'Опубликовать', draftKey: `lesson_new_${currentUser.name}`,
        fields: [
            { id: 'lesson-category', label: 'Уровень доступа', type: 'select', options: ['адепт','юнлинг','падаван','старший падаван','рыцарь','мастер','магистр'] },
            { id: 'lesson-title', label: 'Название', required: true, maxlength: 180, placeholder: 'Название урока' },
            { id: 'lesson-content', label: 'Содержание', type: 'textarea', rows: 14, required: true, maxlength: 50000, placeholder: 'Материал урока…' },
            { id: 'lesson-media', label: 'Ссылка на медиа', type: 'url', maxlength: 2000, placeholder: 'https://…', autocomplete: 'url' }
        ],
        onSubmit: async (values, controls) => {
            controls.setBusy(true);
            const success = await addLessonToFirebase(values['lesson-category'], values['lesson-title'].trim(), values['lesson-content'].trim(), values['lesson-media'].trim());
            controls.setBusy(false);
            if (!success) { controls.showError('Не удалось добавить урок. Проверьте данные.'); return false; }
            await loadLessonsFromFirebase();
            showToast('Урок опубликован.', 'success');
            showTOC();
            return true;
        }
    });
}

// ===== FIND ANSWER =====// ===== FIND ANSWER =====
async function findAnswer(question) {
    const q = question.toLowerCase().trim();
    if (addLessonState && addLessonState.step === 'create_hw_title') {
        if (q === 'отмена') { addLessonState = null; return '<p>❌ Создание отменено.</p>'; }
        addLessonState.hwTitle = question; addLessonState.step = 'create_hw_desc'; return '<p>Введите <strong>описание задания</strong> (или <em>"отмена"</em>):</p>';
    }
    if (addLessonState && addLessonState.step === 'create_hw_desc') {
        if (q === 'отмена') { addLessonState = null; return '<p>❌ Создание отменено.</p>'; }
        const savedTitle = addLessonState.hwTitle;
        const savedDescription = question;
        addLessonState = null;
        createAssignment(savedTitle, savedDescription).then((success) => {
            if (success) {
                addMessage(`<p>✅ Задание "<strong>${escapeHtml(savedTitle)}</strong>" создано!</p>`);
                window.showHomeworkBoard();
            } else {
                addMessage('<p>❌ Ошибка создания. Проверьте подключение и права базы данных.</p>');
            }
        });
        return '';
    }
    if (addLessonState && addLessonState.step === 'submit_hw_text') {
        if (q === 'отмена') { addLessonState = null; return '<p>❌ Отмена.</p>'; }
        const savedHwId = addLessonState.hwId; const savedHwTitle = addLessonState.hwTitle; addLessonState = null;
        submitHomeworkToFirebase(savedHwId, question).then(success => { if (success) { addMessage(`<p>✅ Ваш ответ на задание "<strong>${savedHwTitle}</strong>" отправлен Мастеру на проверку!</p>`); showMainMenu(); } else { addMessage('<p>❌ Ошибка отправки.</p>'); } });
        return '';
    }
    if (addLessonState && addLessonState.step === 'ask_comment_type') {
        if (q === 'отмена') { addLessonState = null; return ''; }
        if (q === 'задание' || q === 'task') { addLessonState.type = 'task'; addLessonState.step = 'add_comment_text'; return '<p>Напиши текст задания (или <em>"отмена"</em>):</p>'; }
        if (q === 'комментарий' || q === 'comment') { addLessonState.type = 'question'; addLessonState.step = 'add_comment_text'; return '<p>Напиши комментарий (или <em>"отмена"</em>):</p>'; }
        return '<p>Напиши <em>"задание"</em> или <em>"комментарий"</em>:</p>';
    }
    if (addLessonState && addLessonState.step === 'add_comment_text') {
        if (q === 'отмена') { addLessonState = null; return '<p>❌ Отменено.</p>'; }
        const savedLessonId = addLessonState.lessonId;
        const savedType = addLessonState.type;
        addLessonState = null;
        addCommentToFirebase(savedLessonId, question, savedType).then((success) => {
            if (success) {
                addMessage('<p>✅ Комментарий добавлен!</p>');
                setTimeout(() => showLessonContent(savedLessonId), 300);
            } else addMessage('<p>❌ Ошибка.</p>');
        });
        return '';
    }
    if (addLessonState && addLessonState.step === 'edit_comment') {
        if (q === 'отмена') { addLessonState = null; return '<p>❌ Отменено.</p>'; }
        const savedCommentId = addLessonState.commentId;
        const savedLessonId = addLessonState.lessonId;
        addLessonState = null;
        updateCommentInFirebase(savedCommentId, question).then((success) => {
            if (success) { addMessage('<p>✅ Комментарий обновлён!</p>'); showLessonContent(savedLessonId); }
            else addMessage('<p>❌ Ошибка.</p>');
        });
        return '';
    }
    if (addLessonState && addLessonState.step && addLessonState.step.startsWith('edit_')) {
        const lessonId = addLessonState.lessonId; const lesson = addLessonState.currentData;
        if (addLessonState.step === 'edit_choose') {
            if (q === 'отмена') { addLessonState = null; return ''; }
            if (q === 'название') { addLessonState.step = 'edit_title'; return `<p>Новое название (или <em>"пропустить"</em>):</p>`; }
            if (q === 'текст') { addLessonState.step = 'edit_content'; return `<p>Новый текст (или <em>"пропустить"</em>):</p>`; }
            if (q === 'медиа') { addLessonState.step = 'edit_media'; return `<p>Новая ссылка (или <em>"пропустить"</em>, <em>"нет"</em>):</p>`; }
            if (q === 'всё') { addLessonState.step = 'edit_title'; addLessonState.editAll = true; return `<p>Новое название (или <em>"пропустить"</em>):</p>`; }
            return '<p>Напиши: <em>название</em>, <em>текст</em>, <em>медиа</em>, <em>"всё"</em> или <em>"отмена"</em>.</p>';
        }
        if (addLessonState.step === 'edit_title') {
            if (q !== 'пропустить') addLessonState.newTitle = question; else addLessonState.newTitle = lesson.title;
            if (addLessonState.editAll) { addLessonState.step = 'edit_content'; return `<p>Новый текст (или <em>"пропустить"</em>):</p>`; }
            updateLessonInFirebase(lessonId, { title: addLessonState.newTitle }).then(s => { if (s) { addMessage(`<p>✅ Название изменено!</p>`); loadLessonsFromFirebase(); } else { addMessage('<p>❌ Ошибка.</p>'); } });
            addLessonState = null; return '';
        }
        if (addLessonState.step === 'edit_content') {
            if (q !== 'пропустить') addLessonState.newContent = question; else addLessonState.newContent = lesson.content;
            if (addLessonState.editAll) { addLessonState.step = 'edit_media'; return `<p>Новая ссылка (или <em>"пропустить"</em>, <em>"нет"</em>):</p>`; }
            updateLessonInFirebase(lessonId, { content: addLessonState.newContent }).then(s => { if (s) { addMessage(`<p>✅ Текст обновлён!</p>`); loadLessonsFromFirebase(); } else { addMessage('<p> Ошибка.</p>'); } });
            addLessonState = null; return '';
        }
        if (addLessonState.step === 'edit_media') {
            let newMedia = q === 'пропустить' ? lesson.mediaUrl : (q === 'нет' ? '' : question);
            const updates = {};
            if (addLessonState.newTitle !== undefined) updates.title = addLessonState.newTitle;
            if (addLessonState.newContent !== undefined) updates.content = addLessonState.newContent;
            updates.mediaUrl = newMedia;
            updateLessonInFirebase(lessonId, updates).then(s => { if (s) { addMessage(`<p>✅ Урок обновлён!</p>`); loadLessonsFromFirebase(); } else { addMessage('<p>❌ Ошибка.</p>'); } });
            addLessonState = null; return '';
        }
    }
    if (addLessonState && currentUser && isAdmin()) {
        if (addLessonState.step === 'confirm_delete') {
            const lessonIdToDelete = addLessonState.lessonId;
            if (q === 'да, удалить' || q === 'да' || q === 'удалить') { deleteLesson(lessonIdToDelete).then(s => { if (s) { addMessage(`<p>✅ Урок удалён!</p>`); loadLessonsFromFirebase(); } else { addMessage('<p>❌ Ошибка.</p>'); } }); }
            else { addMessage('<p>❌ Отменено.</p>'); }
            addLessonState = null; return '';
        }
        if (addLessonState.step === 'category') {
            const categories = ['адепт', 'юнлинг', 'падаван', 'рыцарь', 'мастер', 'магистр'];
            if (categories.includes(q)) { addLessonState.category = q; addLessonState.step = 'title'; return '<p>Название урока:</p>'; }
            else { return '<p>Выбери ранг.</p>'; }
        }
        if (addLessonState.step === 'title') { addLessonState.title = question; addLessonState.step = 'content'; return '<p>Текст урока:</p>'; }
        if (addLessonState.step === 'content') { addLessonState.content = question; addLessonState.step = 'media'; return '<p>Ссылка на медиа (или <em>нет</em>):</p>'; }
        if (addLessonState.step === 'media') {
            const mediaUrl = q === 'нет' ? '' : question;
            const lessonData = {
                category: addLessonState.category,
                title: addLessonState.title,
                content: addLessonState.content,
                mediaUrl
            };
            addLessonState = null;
            addLessonToFirebase(lessonData.category, lessonData.title, lessonData.content, lessonData.mediaUrl).then(s => { if (s) { addMessage(`<p>✅ Урок добавлен!</p>`); loadLessonsFromFirebase(); } else { addMessage('<p>❌ Ошибка.</p>'); } });
            return '';
        }
    }
    if (!currentUser) {
        if (q.includes('имя') || q.includes('зовут') || q.includes('ранг') || q.includes('пароль') || q.includes('учитель')) {
            const userData = parseUserInput(question);
            if (userData.name && userData.ранг && userData.пароль) {
                let foundUser = null;
                for (let key in usersDatabase) { const user = usersDatabase[key]; if (user.fullName.toLowerCase() === userData.name) { foundUser = user; break; } }
                if (!foundUser) foundUser = usersDatabase[userData.name];
                if (foundUser && foundUser.ранг === userData.ранг && foundUser.пароль === userData.пароль) {
                    if (await isUserBlocked(foundUser.fullName)) {
                        return '<p>Доступ к системе заблокирован. Обратитесь к администрации Ордена.</p>';
                    }
                    currentUser = { name: foundUser.fullName, ранг: foundUser.ранг, учитель: userData.учитель || foundUser.учитель };
                    saveUserToStorage();
                    updateLogoutButton();
                    loadLessonsFromFirebase();
                    loadAssignments();
                    loadSubmissions();
                    registerUserIfNeeded();
                    addMessage(getRankGreeting(currentUser));
                    showMainMenu();
                    return '';
                } else { return '<p>Данные не найдены. Проверьте Имя, Ранг и Пароль.</p>'; }
            } else { return '<p>Назови Имя, Ранг, Учителя и Пароль.</p>'; }
        }
        return '<p>Назови своё Имя, Ранг, Учителя и Пароль.</p>';
    }
    if (q.includes('выйти') || q.includes('logout')) { handleLogout(); return ''; }
    if (q.includes('очистить историю') || q.includes('очистить переписку')) { clearHistory(); chatContainer.innerHTML = ''; addMessage('<p>🧹 Очищено.</p>'); return ''; }
    if (q.includes('оглавлен') || q.includes('меню')) { showMainMenu(); return ''; }
    let knowledge = '';
    if (q.includes('ганн')) knowledge = checkAccess('ганн') ? (knowledgeBase['ганн'] ? knowledgeBase['ганн'].map(l => `<p><strong>${l.title}:</strong> ${l.content}</p>`).join('') : '<p>Пусто.</p>') : '<p>Недоступно.</p>';
    else if (q.includes('берг')) knowledge = checkAccess('берг') ? (knowledgeBase['берг'] ? knowledgeBase['берг'].map(l => `<p><strong>${l.title}:</strong> ${l.content}</p>`).join('') : '<p>Пусто.</p>') : '<p>Недоступно.</p>';
    else if (q.includes('катарн')) knowledge = checkAccess('катарн') ? (knowledgeBase['катарн'] ? knowledgeBase['катарн'].map(l => `<p><strong>${l.title}:</strong> ${l.content}</p>`).join('') : '<p>Пусто.</p>') : '<p>Недоступно.</p>';
    else if (q.includes('крайт')) knowledge = checkAccess('крайт') ? (knowledgeBase['крайт'] ? knowledgeBase['крайт'].map(l => `<p><strong>${l.title}:</strong> ${l.content}</p>`).join('') : '<p>Пусто.</p>') : '<p>Недоступно.</p>';
    else knowledge = '<p>Спроси о Кланах или напиши "оглавление".</p>';
    return knowledge;
}

async function handleSend() {
    if (!currentUser || !customTextarea) return;
    const text = customTextarea.value.trim();
    if (!text) return;
    const sendButton = document.getElementById('main-send-button');
    customTextarea.disabled = true;
    if (sendButton) sendButton.disabled = true;
    addMessage(text, true);
    customTextarea.value = '';
    updateMainInputState();
    clearMainDraft();
    try {
        const answer = await findAnswer(text);
        if (answer) addMessage(answer);
    } catch (error) {
        console.error(error);
        showToast(error?.message || 'Не удалось обработать сообщение.', 'error');
    } finally {
        customTextarea.disabled = false;
        if (sendButton) sendButton.disabled = false;
        customTextarea.focus({ preventScroll: true });
    }
}

async function handleLogout() {
    window.clearInterval(chatPollTimer);
    chatPollTimer = null;
    try { if (authClient) await authClient.logout(); } catch (error) { console.warn('Ошибка выхода:', error); }
    currentUser = null;
    usersDatabase = {};
    assignmentsList = [];
    submissionsList = [];
    lessonsById = {};
    knowledgeBase = {};
    saveUserToStorage();
    updateLogoutButton();
    setMainInputVisible(false);
    const wrapper = document.getElementById('master-chat-wrapper');
    if (wrapper) wrapper.hidden = true;
    clearHistory();
    showLoginScreen('Вы вышли из аккаунта.');
}

function updateLogoutButton() {
    const btn = document.getElementById('logout-button');
    const chip = document.getElementById('current-user-chip');
    const name = document.getElementById('current-user-name');
    if (btn) btn.hidden = !currentUser;
    if (chip) chip.hidden = !currentUser;
    if (name) name.textContent = currentUser ? `${currentUser.name} · ${currentUser.ранг}` : '';
}

// ===== КЛАВИАТУРА =====
const layouts = {
    ru: [['й','ц','у','к','е','н','г','ш','щ','з','х','ъ'], ['ф','ы','в','а','п','р','о','л','д','ж','э'], ['shift','я','ч','с','м','и','т','ь','б','ю','backspace'], ['123', ',', 'enter', 'space']],
    en: [['q','w','e','r','t','y','u','i','o','p'], ['a','s','d','f','g','h','j','k','l'], ['shift','z','x','c','v','b','n','m','backspace'], ['123', ',', 'enter', 'space']],
    numbers: [['1','2','3','4','5','6','7','8','9','0'], ['-','/',':',';','(',')','$','&','@','"'], ['!','?','#','%','*','+','=','backspace'], ['abc', ',', 'enter', 'space']]
};

let currentLang = 'ru';
let currentMode = 'letters';
let isShift = false;
let isCaps = false;
let shiftTimeout = null;

function insertTextAtCursor(text) {
    const start = customTextarea.selectionStart;
    const end = customTextarea.selectionEnd;
    const value = customTextarea.value;
    customTextarea.value = value.substring(0, start) + text + value.substring(end);
    const newPos = start + text.length;
    customTextarea.setSelectionRange(newPos, newPos);
    customTextarea.focus();
}

function deleteCharAtCursor() {
    const start = customTextarea.selectionStart;
    const end = customTextarea.selectionEnd;
    const value = customTextarea.value;
    if (start === end && start > 0) {
        customTextarea.value = value.substring(0, start - 1) + value.substring(end);
        customTextarea.setSelectionRange(start - 1, start - 1);
    } else if (start !== end) {
        customTextarea.value = value.substring(0, start) + value.substring(end);
        customTextarea.setSelectionRange(start, start);
    }
    customTextarea.focus();
}

function renderKeyboard() {
    if (!customKeyboard) return;
    customKeyboard.innerHTML = '';
    let layout;
    if (currentMode === 'numbers') layout = layouts.numbers;
    else layout = currentLang === 'ru' ? layouts.ru : layouts.en;
    const langBtn = document.getElementById('lang-toggle-btn');
    if (langBtn) langBtn.textContent = currentLang === 'ru' ? 'RU' : 'EN';
    layout.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';
        row.forEach(key => {
            const keyDiv = document.createElement('div');
            keyDiv.className = 'key';
            if (key === 'shift') {
                keyDiv.classList.add('special');
                keyDiv.textContent = isCaps ? '⇪' : '⇧';
                if (isCaps) keyDiv.classList.add('caps-active');
                let touchStartTime = 0;
                keyDiv.addEventListener('touchstart', (e) => { e.preventDefault(); touchStartTime = Date.now(); keyDiv.classList.add('pressed'); }, { passive: false });
                keyDiv.addEventListener('touchend', (e) => {
                    e.preventDefault(); keyDiv.classList.remove('pressed');
                    const touchDuration = Date.now() - touchStartTime;
                    if (touchDuration < 200) {
                        clearTimeout(shiftTimeout);
                        if (isCaps) { isCaps = false; isShift = false; } else { isShift = !isShift; shiftTimeout = setTimeout(() => { isShift = false; renderKeyboard(); }, 2000); }
                    } else { isCaps = !isCaps; isShift = false; }
                    renderKeyboard();
                    if (navigator.vibrate) navigator.vibrate(10);
                });
            } else if (key === '123' || key === 'abc') {
                keyDiv.classList.add('special');
                keyDiv.textContent = currentMode === 'letters' ? '123' : (currentLang === 'ru' ? 'RU' : 'EN');
                keyDiv.addEventListener('touchstart', (e) => { e.preventDefault(); keyDiv.classList.add('pressed'); toggleMode(); }, { passive: false });
                keyDiv.addEventListener('touchend', () => keyDiv.classList.remove('pressed'));
            } else if (key === ',') {
                keyDiv.textContent = ',';
                keyDiv.addEventListener('touchstart', (e) => { e.preventDefault(); keyDiv.classList.add('pressed'); insertTextAtCursor(','); }, { passive: false });
                keyDiv.addEventListener('touchend', () => keyDiv.classList.remove('pressed'));
            } else if (key === 'backspace') {
                keyDiv.classList.add('special');
                keyDiv.textContent = '⌫';
                keyDiv.addEventListener('touchstart', (e) => { e.preventDefault(); keyDiv.classList.add('pressed'); deleteCharAtCursor(); }, { passive: false });
                keyDiv.addEventListener('touchend', () => keyDiv.classList.remove('pressed'));
            } else if (key === 'space') {
                keyDiv.classList.add('space');
                keyDiv.addEventListener('touchstart', (e) => { e.preventDefault(); keyDiv.classList.add('pressed'); insertTextAtCursor(' '); }, { passive: false });
                keyDiv.addEventListener('touchend', () => keyDiv.classList.remove('pressed'));
            } else if (key === 'enter') {
                keyDiv.classList.add('enter');
                keyDiv.textContent = '↵';
                keyDiv.addEventListener('touchstart', (e) => { e.preventDefault(); keyDiv.classList.add('pressed'); insertTextAtCursor('\n'); }, { passive: false });
                keyDiv.addEventListener('touchend', () => keyDiv.classList.remove('pressed'));
            } else {
                let displayChar = key;
                if (currentMode === 'letters' && /^[а-яёa-z]$/.test(key)) displayChar = (isShift || isCaps) ? key.toUpperCase() : key;
                keyDiv.textContent = displayChar;
                keyDiv.addEventListener('touchstart', (e) => { e.preventDefault(); keyDiv.classList.add('pressed'); insertTextAtCursor(displayChar); if (isShift && !isCaps) { isShift = false; renderKeyboard(); } }, { passive: false });
                keyDiv.addEventListener('touchend', () => keyDiv.classList.remove('pressed'));
            }
            rowDiv.appendChild(keyDiv);
        });
        customKeyboard.appendChild(rowDiv);
    });
}

function toggleLanguage() {
    currentLang = currentLang === 'ru' ? 'en' : 'ru';
    currentMode = 'letters';
    isShift = false; isCaps = false;
    renderKeyboard();
    if (navigator.vibrate) navigator.vibrate(10);
}

function toggleMode() {
    if (currentMode === 'letters') currentMode = 'numbers';
    else currentMode = 'letters';
    isShift = false; isCaps = false;
    renderKeyboard();
    if (navigator.vibrate) navigator.vibrate(10);
}

window.toggleLanguage = toggleLanguage;

customTextarea.addEventListener('focus', () => {
    customTextarea.classList.add('is-focused');
});

customTextarea.addEventListener('blur', () => {
    customTextarea.classList.remove('is-focused');
});

// Стандартные события click, selection, copy, cut и paste намеренно не перехватываются.
// Благодаря этому браузер показывает обычную каретку и системное меню буфера обмена.

// ===== МОДАЛЬНЫЕ ОКНА =====
function setBackgroundInteractionDisabled(disabled) {
    const modal = document.getElementById('custom-modal');
    const shell = document.querySelector('.app-shell');
    if (shell) {
        if (disabled) {
            shell.setAttribute('inert', '');
            shell.setAttribute('aria-hidden', 'true');
        } else {
            shell.removeAttribute('inert');
            shell.removeAttribute('aria-hidden');
        }
    }
    document.body.classList.toggle('modal-open', disabled);
    if (modal) modal.setAttribute('aria-hidden', disabled ? 'false' : 'true');
}

function showCustomModal(title, bodyContent, buttons = []) {
    const modal = document.getElementById('custom-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');
    if (!modal || !modalTitle || !modalBody || !modalFooter) return;

    previousModalFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    modalTitle.textContent = title;
    modalBody.replaceChildren();
    if (typeof bodyContent === 'string') modalBody.innerHTML = bodyContent;
    else if (bodyContent instanceof Node) modalBody.appendChild(bodyContent);
    modalFooter.replaceChildren();

    buttons.forEach((btn) => {
        const button = document.createElement('button');
        button.type = btn.type || 'button';
        button.className = btn.class || 'hw-btn';
        button.dataset.originalText = btn.text || '';
        if (btn.icon) button.innerHTML = `<i class="fa-solid ${btn.icon}" aria-hidden="true"></i><span>${escapeHtml(btn.text || '')}</span>`;
        else button.textContent = btn.text || '';
        if (btn.disabled) button.disabled = true;
        button.addEventListener('click', async () => {
            if (button.disabled) return;
            let shouldClose = btn.close !== false;
            if (btn.action) {
                const result = await btn.action({ button, modal, body: modalBody });
                if (result === false) shouldClose = false;
            }
            if (shouldClose) closeCustomModal();
        });
        modalFooter.appendChild(button);
    });

    setBackgroundInteractionDisabled(true);
    modal.hidden = false;
    modal.scrollTop = 0;
    requestAnimationFrame(() => {
        const firstControl = modalBody.querySelector('[autofocus], input, textarea, select, button') || modalFooter.querySelector('button');
        if (firstControl && !window.matchMedia('(pointer: coarse)').matches) firstControl.focus({ preventScroll: true });
    });
}

function closeCustomModal() {
    const modal = document.getElementById('custom-modal');
    if (!modal || modal.hidden) return;
    const active = document.activeElement;
    if (active && modal.contains(active) && typeof active.blur === 'function') active.blur();
    modal.hidden = true;
    document.getElementById('modal-body')?.replaceChildren();
    document.getElementById('modal-footer')?.replaceChildren();
    setBackgroundInteractionDisabled(false);
    const focusTarget = previousModalFocus;
    previousModalFocus = null;
    requestAnimationFrame(() => {
        if (focusTarget?.isConnected && typeof focusTarget.focus === 'function') focusTarget.focus({ preventScroll: true });
    });
}

function showFormModal({
    title,
    description = '',
    fields,
    submitText = 'Сохранить',
    cancelText = 'Отмена',
    onSubmit,
    onCancel,
    draftKey = '',
    submitClass = ''
}) {
    const form = document.createElement('form');
    form.className = 'modal-form';
    form.noValidate = true;

    if (description) {
        const intro = document.createElement('p');
        intro.className = 'form-description';
        intro.textContent = description;
        form.appendChild(intro);
    }

    const errorBox = document.createElement('div');
    errorBox.className = 'form-error';
    errorBox.hidden = true;
    errorBox.setAttribute('role', 'alert');
    form.appendChild(errorBox);

    let savedDraft = {};
    if (draftKey && LOCAL_STORAGE_AVAILABLE) {
        try { savedDraft = JSON.parse(localStorage.getItem(`akasha_draft_${draftKey}`) || '{}'); }
        catch (error) { savedDraft = {}; }
    }

    const controlsById = new Map();
    const countersById = new Map();
    (fields || []).forEach((field, index) => {
        const group = document.createElement('label');
        group.className = 'form-field';
        group.htmlFor = field.id;

        const label = document.createElement('span');
        label.className = 'form-label';
        label.textContent = field.label || field.id;
        if (field.required) {
            const required = document.createElement('span');
            required.className = 'required-mark';
            required.textContent = ' *';
            required.setAttribute('aria-hidden', 'true');
            label.appendChild(required);
        }
        group.appendChild(label);

        let control;
        if (field.type === 'textarea') {
            control = document.createElement('textarea');
            control.rows = field.rows || 5;
        } else if (field.type === 'select') {
            control = document.createElement('select');
            (field.options || []).forEach((option) => {
                const item = document.createElement('option');
                item.value = typeof option === 'string' ? option : option.value;
                item.textContent = typeof option === 'string' ? option : option.label;
                control.appendChild(item);
            });
        } else {
            control = document.createElement('input');
            control.type = field.type || 'text';
            if (field.inputmode) control.inputMode = field.inputmode;
        }
        control.id = field.id;
        control.name = field.id;
        control.className = 'modal-input';
        const draftValue = Object.prototype.hasOwnProperty.call(savedDraft, field.id) ? savedDraft[field.id] : undefined;
        control.value = draftValue ?? field.value ?? '';
        control.placeholder = field.placeholder || '';
        control.required = Boolean(field.required);
        control.autocomplete = field.autocomplete || 'off';
        control.spellcheck = field.spellcheck !== false;
        if (field.min !== undefined) control.min = String(field.min);
        if (field.max !== undefined) control.max = String(field.max);
        if (field.step !== undefined) control.step = String(field.step);
        if (field.maxlength !== undefined) control.maxLength = Number(field.maxlength);
        if (field.type === 'number' && !field.inputmode) control.inputMode = 'numeric';
        if (field.accept) control.accept = field.accept;
        if (field.autofocus || index === 0) control.autofocus = Boolean(field.autofocus);

        group.appendChild(control);

        if (field.help || field.maxlength) {
            const footer = document.createElement('span');
            footer.className = 'field-footer';
            if (field.help) {
                const help = document.createElement('span');
                help.className = 'field-help';
                help.textContent = field.help;
                footer.appendChild(help);
            } else footer.appendChild(document.createElement('span'));
            if (field.maxlength) {
                const counter = document.createElement('span');
                counter.className = 'char-counter';
                footer.appendChild(counter);
                countersById.set(field.id, counter);
            }
            group.appendChild(footer);
        }

        form.appendChild(group);
        controlsById.set(field.id, control);
    });

    const saveDraft = () => {
        if (!draftKey || !LOCAL_STORAGE_AVAILABLE) return;
        const values = {};
        controlsById.forEach((control, id) => { values[id] = control.value; });
        try { localStorage.setItem(`akasha_draft_${draftKey}`, JSON.stringify(values)); } catch (error) {}
    };
    const updateCounters = () => {
        countersById.forEach((counter, id) => {
            const control = controlsById.get(id);
            counter.textContent = `${control?.value.length || 0} / ${control?.maxLength || 0}`;
        });
    };
    controlsById.forEach((control) => control.addEventListener('input', () => {
        updateCounters();
        saveDraft();
        if (!errorBox.hidden) { errorBox.hidden = true; errorBox.textContent = ''; }
    }));
    updateCounters();

    const controls = {
        setBusy(busy) {
            form.classList.toggle('is-busy', busy);
            controlsById.forEach((control) => { control.disabled = busy; });
            const buttons = document.querySelectorAll('#modal-footer button');
            buttons.forEach((button) => {
                button.disabled = busy;
                if (button.classList.contains('modal-submit-btn')) {
                    button.innerHTML = busy
                        ? '<i class="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i><span>Сохраняем…</span>'
                        : `<i class="fa-solid fa-check" aria-hidden="true"></i><span>${escapeHtml(submitText)}</span>`;
                }
            });
        },
        showError(message) {
            errorBox.textContent = message;
            errorBox.hidden = !message;
            if (message) errorBox.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        },
        getControl(id) { return controlsById.get(id); },
        clearDraft() {
            if (draftKey && LOCAL_STORAGE_AVAILABLE) localStorage.removeItem(`akasha_draft_${draftKey}`);
        }
    };

    const submit = async () => {
        controls.showError('');
        for (const [, control] of controlsById) {
            if (!control.checkValidity()) {
                control.reportValidity();
                control.focus({ preventScroll: false });
                return false;
            }
            if (control.required && !String(control.value).trim()) {
                controls.showError('Заполните обязательные поля.');
                control.focus({ preventScroll: false });
                return false;
            }
        }
        const values = {};
        controlsById.forEach((control, id) => { values[id] = control.value; });
        if (!onSubmit) { controls.clearDraft(); return true; }
        try {
            const result = await onSubmit(values, controls);
            if (result !== false) controls.clearDraft();
            return result !== false;
        } catch (error) {
            console.error('Ошибка формы:', error);
            controls.setBusy(false);
            controls.showError(error?.message || 'Не удалось выполнить действие.');
            return false;
        }
    };

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (await submit()) closeCustomModal();
    });

    showCustomModal(title, form, [
        {
            text: cancelText,
            icon: 'fa-xmark',
            class: 'hw-btn modal-cancel-btn',
            action: () => { if (onCancel) window.setTimeout(onCancel, 0); }
        },
        {
            text: submitText,
            icon: 'fa-check',
            class: `hw-btn modal-submit-btn ${submitClass}`.trim(),
            close: false,
            action: () => form.requestSubmit()
        }
    ]);
}

document.addEventListener('click', (event) => {
    const modal = document.getElementById('custom-modal');
    if (event.target === modal) closeCustomModal();
});

document.addEventListener('keydown', (event) => {
    const modal = document.getElementById('custom-modal');
    if (!modal || modal.hidden) return;
    if (event.key === 'Escape') {
        event.preventDefault();
        closeCustomModal();
        return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...modal.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])')]
        .filter((element) => !element.hidden && element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

function showCustomPrompt(title, message, defaultValue, callback) {
    const numeric = typeof defaultValue === 'number';
    showFormModal({
        title,
        submitText: 'OK',
        fields: [{
            id: 'prompt-value',
            label: message,
            type: numeric ? 'number' : 'textarea',
            inputmode: numeric ? 'numeric' : 'text',
            value: defaultValue ?? '',
            rows: numeric ? undefined : 4,
            spellcheck: !numeric
        }],
        onSubmit: async (values) => {
            const value = numeric ? Number(values['prompt-value']) : values['prompt-value'];
            setTimeout(() => callback(value), 0);
            return true;
        },
        onCancel: () => callback(null)
    });
}

function showCustomConfirm(title, message, callback) {
    const content = document.createElement('p');
    content.textContent = message;
    showCustomModal(title, content, [
        { text: 'Отмена', icon: 'fa-xmark', class: 'hw-btn modal-cancel-btn', action: () => setTimeout(() => callback(false), 0) },
        { text: 'Подтвердить', icon: 'fa-check', class: 'hw-btn modal-submit-btn danger', action: () => setTimeout(() => callback(true), 0) }
    ]);
}

function showCustomAlert(title, message) {
    const content = document.createElement('p');
    content.textContent = message;
    showCustomModal(title, content, [
        { text: 'OK', icon: 'fa-check', class: 'hw-btn modal-submit-btn' }
    ]);
}

// ===== НОВЫЕ ФУНКЦИИ =====
async function isUserBlocked(userName) {
    if (!windowDb) return false;
    try {
        const doc = await windowDb.collection('blocked_users').doc(userName).get();
        return doc.exists && doc.data().blocked === true;
    } catch (error) { return false; }
}

async function persistBlockedUser(userName, reason) {
    if (!windowDb) return false;
    try {
        await windowDb.collection('blocked_users').doc(userName).set({
            blocked: true, reason: reason, blockedBy: currentUser.name,
            blockedAt: new Date()
        }, { merge: true });
        return true;
    } catch (error) { console.error('Ошибка блокировки:', error); return false; }
}

async function persistUnblockedUser(userName) {
    if (!windowDb) return false;
    try {
        await windowDb.collection('blocked_users').doc(userName).update({
            blocked: false, unblockedAt: new Date()
        });
        return true;
    } catch (error) { console.error('Ошибка разблокировки:', error); return false; }
}

async function markLessonAsRead(lessonId) {
    if (!windowDb || !currentUser) return false;
    try {
        await windowDb.collection('lesson_reads').doc(`${currentUser.name}_${lessonId}`).set({
            userId: currentUser.name, lessonId: lessonId,
            readAt: new Date(), userRank: currentUser.ранг
        }, { merge: true });
        return true;
    } catch (error) { console.error('Ошибка отметки:', error); return false; }
}

async function isLessonRead(lessonId) {
    if (!windowDb || !currentUser) return false;
    try {
        const doc = await windowDb.collection('lesson_reads').doc(`${currentUser.name}_${lessonId}`).get();
        return doc.exists;
    } catch (error) { return false; }
}

async function getAllLessonReads() {
    if (!windowDb) return [];
    try {
        const snapshot = await windowDb.collection('lesson_reads').get();
        const reads = [];
        snapshot.forEach(doc => reads.push({ id: doc.id, ...doc.data() }));
        return reads;
    } catch (error) { return []; }
}

async function getBlockedUsers() {
    if (!windowDb) return [];
    try {
        const snapshot = await windowDb.collection('blocked_users').where('blocked', '==', true).get();
        const blocked = [];
        snapshot.forEach(doc => blocked.push({ id: doc.id, ...doc.data() }));
        return blocked;
    } catch (error) { return []; }
}

async function getUserRegistrationDate(userName) {
    if (!windowDb) return null;
    try {
        const doc = await windowDb.collection('user_registrations').doc(userName).get();
        if (doc.exists && doc.data().registeredAt) return asDate(doc.data().registeredAt);
        return null;
    } catch (error) { console.error('Ошибка получения даты регистрации:', error); return null; }
}

async function getUserAdjustments(userName) {
    if (!windowDb) return { adjustedLessons: 0, adjustedHomework: 0, reason: '' };
    try {
        const doc = await windowDb.collection('manual_adjustments').doc(userName).get();
        if (doc.exists) return doc.data();
        return { adjustedLessons: 0, adjustedHomework: 0, reason: '' };
    } catch (error) { return { adjustedLessons: 0, adjustedHomework: 0, reason: '' }; }
}

async function saveManualAdjustment(userName, lessons, homework, reason) {
    if (!windowDb) { console.error('❌ Firestore не доступен'); return false; }
    try {
        await windowDb.collection('manual_adjustments').doc(userName).set({
            userName: userName, adjustedLessons: parseInt(lessons) || 0,
            adjustedHomework: parseInt(homework) || 0, reason: reason,
            adjustedBy: currentUser.name, adjustedAt: new Date()
        }, { merge: true });
        return true;
    } catch (error) { console.error('❌ Ошибка сохранения корректировки:', error); return false; }
}

function calculateGrade(lessonsRead, homeworkDone, totalLessons, totalHomework, adjLessons, adjHomework) {
    const realScore = lessonsRead + homeworkDone;
    const adjustedScore = realScore + adjLessons + adjHomework;
    const maxScore = totalLessons + totalHomework;
    if (maxScore === 0) return { percent: 0, grade: '—', gradeColor: '#6b5f4a' };
    const percent = Math.min(100, Math.round((adjustedScore / maxScore) * 100));
    let grade, gradeColor;
    if (percent >= 90) { grade = 'Отлично'; gradeColor = '#ffd700'; }
    else if (percent >= 70) { grade = 'Хорошо'; gradeColor = '#4caf50'; }
    else if (percent >= 50) { grade = 'Удовлетворительно'; gradeColor = '#ff9800'; }
    else { grade = 'Плохо'; gradeColor = '#ff6b6b'; }
    return { percent, grade, gradeColor, realScore, adjustedScore, maxScore };
}

function formatTimeInAkasha(regDate) {
    const now = new Date();
    const diff = now - regDate;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days} дн. ${hours} ч.`;
    if (hours > 0) return `${hours} ч.`;
    return 'только что';
}

async function registerUserIfNeeded() {
    if (!currentUser || !windowDb) return;
    try {
        await windowDb.collection('user_registrations').doc(currentUser.name).set({
            userName: currentUser.name,
            userRank: currentUser.ранг,
            registeredAt: new Date(),
            lastSeenAt: new Date()
        }, { merge: true });
    } catch (error) { console.error('Ошибка регистрации:', error); }
}

// ===== СОВЕТ МАСТЕРОВ =====
window.showCouncilOfMasters = async function() {
    const container = document.getElementById('chat-container');
    if (container) container.innerHTML = '';
    const blockedUsers = await getBlockedUsers();
    const blockedNames = blockedUsers.map(u => u.id);
    let html = `<div style="background:rgba(13,31,15,0.5); border:1px solid var(--border-color); border-radius:15px; padding:25px; margin:15px 0;">`;
    html += `<h3 class="council-title">🏛️ Совет Мастеров</h3>`;
    html += `<p class="council-subtitle">Руководство Ордена Вольных Джедаев</p>`;
    const supremeMaster = Object.values(usersDatabase).find(u => u.ранг === 'верховный магистр' && u.specialTitle);
    if (supremeMaster) {
        const isBlocked = blockedNames.includes(supremeMaster.fullName);
        html += `<div class="council-supreme"><div style="display:flex; align-items:center; gap:15px; margin-bottom:10px;">`;
        html += `<div style="font-size:2em;">🔮</div><div style="flex:1;">`;
        html += `<div style="color:#64ffda; font-family:'Playfair Display',serif; font-size:1.3em; font-weight:700;">${supremeMaster.fullName}</div>`;
        html += `<div style="color:#8bc34a; font-size:1em; font-weight:600; margin-top:3px;">${supremeMaster.specialTitle}</div></div>`;
        html += `<div class="member-status ${isBlocked ? 'status-blocked' : 'status-active'}">${isBlocked ? '🚫 Заблок.' : '✅ Активен'}</div></div>`;
        if (supremeMaster.description) html += `<div style="color:var(--text-color); font-size:0.95em; line-height:1.5; padding-left:50px; font-style:italic;">${supremeMaster.description}</div>`;
        html += `</div>`;
    }
    html += `<h4 class="council-master-header"> Мастера</h4>`;
    const masters = Object.values(usersDatabase).filter(u => u.ранг === 'мастер' && u.specialTitle);
    masters.forEach(master => {
        const isBlocked = blockedNames.includes(master.fullName);
        html += `<div class="council-master-card"><div style="display:flex; align-items:center; gap:15px; margin-bottom:10px;">`;
        html += `<div style="font-size:2em;"></div><div style="flex:1;">`;
        html += `<div style="color:#64ffda; font-family:'Playfair Display',serif; font-size:1.3em; font-weight:700;">${master.fullName}</div>`;
        html += `<div style="color:#8bc34a; font-size:1em; font-weight:600; margin-top:3px;">${master.specialTitle}</div></div>`;
        html += `<div class="member-status ${isBlocked ? 'status-blocked' : 'status-active'}">${isBlocked ? '🚫 Заблок.' : '✅ Активен'}</div></div>`;
        if (master.description) html += `<div style="color:var(--text-color); font-size:0.95em; line-height:1.5; padding-left:50px; font-style:italic;">${master.description}</div>`;
        html += `</div>`;
    });
    html += `<button class="hw-btn" onclick="showMainMenu()" style="width:100%; margin-top:20px; padding:12px;">🔙 Вернуться в меню</button></div>`;
    addMessage(html);
};

// ===== СПИСОК ЧЛЕНОВ ОРДЕНА =====
window.showMembersList = async function() {
    const container = document.getElementById('chat-container');
    if (container) container.innerHTML = '';
    const blockedUsers = await getBlockedUsers();
    const blockedNames = blockedUsers.map(u => u.id);
    let html = `<div style="background:rgba(13,31,15,0.5); border:1px solid var(--border-color); border-radius:15px; padding:25px; margin:15px 0;">`;
    html += `<h3 style="color:#64ffda; margin-bottom:25px; font-family:'Playfair Display',serif; text-align:center; font-size:1.8em;">👥 Члены Ордена</h3>`;
    html += `<p style="color:var(--text-secondary); text-align:center; margin-bottom:20px; font-style:italic;">От Адепта до Старейшины</p>`;
    const ranks = ['старейшина', 'верховный магистр', 'магистр', 'мастер', 'рыцарь', 'старший падаван', 'падаван', 'юнлинг', 'адепт'];
    for (const rank of ranks) {
        const members = Object.values(usersDatabase).filter(u => u.ранг === rank);
        if (members.length > 0) {
            html += `<div style="margin:20px 0;">`;
            html += `<h4 style="color:var(--accent-color); font-family:'Playfair Display',serif; font-size:1.3em; margin-bottom:10px; border-bottom:2px solid var(--border-color); padding-bottom:8px;">${rank}</h4>`;
            for (const member of members) {
                const isBlocked = blockedNames.includes(member.fullName);
                const teacherName = member.учитель && member.учитель !== 'отсутствует' ? member.учитель : 'нет';
                const regDate = await getUserRegistrationDate(member.fullName);
                const timeInAkasha = formatTimeInAkasha(regDate);
                html += `<div class="member-card"><div style="flex:1;">`;
                html += `<div class="member-name">${member.fullName}</div>`;
                html += `<div style="color:var(--text-secondary); font-size:0.9em; margin-top:3px;">🧙‍♂️ Учитель: ${teacherName}</div>`;
                html += `<div style="color:var(--text-secondary); font-size:0.85em; margin-top:2px;">⏱️ В Акаше: ${timeInAkasha}</div></div>`;
                html += `<div class="member-status ${isBlocked ? 'status-blocked' : 'status-active'}">${isBlocked ? '🚫 Заблок.' : '✅ Активен'}</div></div>`;
            }
            html += `</div>`;
        }
    }
    html += `<button class="hw-btn" onclick="showMainMenu()" style="width:100%; margin-top:15px; padding:12px;">🔙 Вернуться в меню</button></div>`;
    addMessage(html);
};

// ===== ТАБЛИЦА УСПЕВАЕМОСТИ =====
window.showProgressTable = async function() {
    const container = document.getElementById('chat-container');
    if (container) container.innerHTML = '';
    const reads = await getAllLessonReads();
    const isMasterUser = isMaster();
    const totalLessons = Object.keys(lessonsById).length;
    const totalHomework = assignmentsList.length;
    let html = `<div style="background:rgba(13,31,15,0.5); border:1px solid var(--border-color); border-radius:15px; padding:25px; margin:15px 0;">`;
    html += `<h3 style="color:#64ffda; margin-bottom:25px; font-family:'Playfair Display',serif; text-align:center; font-size:1.8em;">📊 Таблица успеваемости Ордена</h3>`;
    html += `<p style="color:var(--text-secondary); text-align:center; margin-bottom:20px; font-style:italic;">Всего уроков: ${totalLessons} | Всего ДЗ: ${totalHomework}</p>`;
    html += `<div style="overflow-x:auto;"><table class="progress-table">`;
    html += `<tr><th>Ученик</th><th>Ранг</th><th>Учитель</th><th>Время в Акаше</th><th>Уроки</th><th>ДЗ</th><th>Оценка</th></tr>`;
    for (const user of Object.values(usersDatabase)) {
        if (user.ранг === 'мастер' || user.ранг === 'магистр' || user.ранг === 'верховный магистр' || user.ранг === 'старейшина') continue;
        const userReads = reads.filter(r => r.userId === user.fullName);
        const userSubmissions = submissionsList.filter(s => s.studentName === user.fullName);
        const approvedHomework = userSubmissions.filter(s => s.status === 'approved').length;
        const submittedHomework = userSubmissions.length;
        const regDate = await getUserRegistrationDate(user.fullName);
        const timeInAkasha = formatTimeInAkasha(regDate);
        const adjustments = await getUserAdjustments(user.fullName);
        const gradeData = calculateGrade(userReads.length, approvedHomework, totalLessons, totalHomework, adjustments.adjustedLessons || 0, adjustments.adjustedHomework || 0);
        const teacherName = user.учитель && user.учитель !== 'отсутствует' ? user.учитель : '—';
        html += `<tr><td style="font-weight:600;">${user.fullName}</td><td>${user.ранг}</td>`;
        html += `<td style="font-size:0.9em;">${teacherName}</td><td style="font-size:0.9em;">${timeInAkasha}</td>`;
        html += `<td>${userReads.length}/${totalLessons}</td>`;
        html += `<td>${submittedHomework} сдано<br><small style="color:#a89b7e;">(${approvedHomework} одобрено)</small></td>`;
        html += `<td style="color:${gradeData.gradeColor}; font-weight:700; text-align:center;">${gradeData.grade}<br><small>${gradeData.percent}%</small></td></tr>`;
    }
    html += `</table></div>`;
    if (isMasterUser) {
        html += `<div class="admin-panel"><h3>✏️ Ручная корректировка результатов</h3>`;
        html += `<p style="color:var(--text-secondary); margin:10px 0;">Мастер может добавить баллы ученикам, которые не успели перенести свои результаты в Акашу.</p>`;
        html += `<button class="hw-btn" onclick="window.showAdjustmentPanel()" style="background:rgba(100,255,218,0.2); color:#64ffda; width:100%; margin-top:10px;">⚙️ Открыть панель корректировки</button></div>`;
        html += `<button class="hw-btn" onclick="window.showDetailedProgress()" style="width:100%; margin-top:10px; background:rgba(100,255,218,0.2); color:#64ffda;">🔒 Показать детали (какие материалы сданы)</button>`;
    }
    html += `<button class="hw-btn" onclick="showMainMenu()" style="width:100%; margin-top:15px; padding:12px;">🔙 Вернуться в меню</button></div>`;
    addMessage(html);
};

window.showAdjustmentPanel = async function() {
    const container = document.getElementById('chat-container');
    if (container) container.innerHTML = '';
    if (!isMaster()) { addMessage('<p> Доступ запрещён.</p>'); return; }
    let html = `<div style="background:rgba(13,31,15,0.5); border:1px solid var(--border-color); border-radius:15px; padding:25px; margin:15px 0;">`;
    html += `<h3 style="color:#64ffda; margin-bottom:25px; font-family:'Playfair Display',serif; text-align:center; font-size:1.8em;">⚙️ Ручная корректировка</h3>`;
    html += `<p style="color:var(--text-secondary); text-align:center; margin-bottom:20px;">Выбери ученика и добавь баллы за пройденные материалы вне Акаши</p>`;
    for (const user of Object.values(usersDatabase)) {
        if (user.ранг === 'мастер' || user.ранг === 'магистр' || user.ранг === 'верховный магистр' || user.ранг === 'старейшина') continue;
        const adjustments = await getUserAdjustments(user.fullName);
        const hasAdjustment = (adjustments.adjustedLessons || 0) > 0 || (adjustments.adjustedHomework || 0) > 0;
        html += `<div style="background:rgba(0,0,0,0.3); border-radius:10px; padding:15px; margin:10px 0; border-left:3px solid ${hasAdjustment ? '#64ffda' : 'var(--border-color)'};">`;
        html += `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">`;
        html += `<div><div style="color:var(--text-color); font-weight:600;">${user.fullName}</div><div style="color:var(--text-secondary); font-size:0.9em;">${user.ранг}</div></div>`;
        if (hasAdjustment) html += `<div style="color:#64ffda; font-size:0.85em;">+${adjustments.adjustedLessons} уроков, +${adjustments.adjustedHomework} ДЗ</div>`;
        html += `</div>`;
        html += `<button class="hw-btn" onclick="window.openAdjustmentForm('${user.fullName}')" style="width:100%; background:rgba(100,255,218,0.2); color:#64ffda; padding:8px; font-size:0.95em;">✏️ ${hasAdjustment ? 'Изменить' : 'Добавить'} корректировку</button></div>`;
    }
    html += `<button class="hw-btn" onclick="window.showProgressTable()" style="width:100%; margin-top:15px; padding:12px;">🔙 Назад к таблице</button></div>`;
    addMessage(html);
};

window.openAdjustmentForm = async function(userName) {
    const adjustments = await getUserAdjustments(userName);
    showFormModal({
        title: `Корректировка: ${userName}`,
        submitText: 'Сохранить',
        fields: [
            {
                id: 'adjusted-lessons', label: 'Дополнительные пройденные уроки', type: 'number',
                inputmode: 'numeric', min: 0, step: 1, required: true, value: adjustments.adjustedLessons || 0
            },
            {
                id: 'adjusted-homework', label: 'Дополнительные сданные ДЗ', type: 'number',
                inputmode: 'numeric', min: 0, step: 1, required: true, value: adjustments.adjustedHomework || 0
            },
            {
                id: 'adjustment-reason', label: 'Причина корректировки', type: 'textarea', rows: 4,
                required: true, value: adjustments.reason || '',
                placeholder: 'Например: сдано в учебном чате ВК'
            }
        ],
        onSubmit: async (values, controls) => {
            const lessons = Math.max(0, Number.parseInt(values['adjusted-lessons'], 10) || 0);
            const homework = Math.max(0, Number.parseInt(values['adjusted-homework'], 10) || 0);
            const reason = values['adjustment-reason'].trim();
            controls.setBusy(true);
            const success = await saveManualAdjustment(userName, lessons, homework, reason);
            controls.setBusy(false);
            if (!success) {
                controls.showError('Не удалось сохранить корректировку. Проверьте подключение к базе.');
                return false;
            }
            addMessage(`<p>✅ Корректировка для ${escapeHtml(userName)} сохранена!</p>`);
            await window.showAdjustmentPanel();
            return true;
        }
    });
};

window.showDetailedProgress = async function() {
    const container = document.getElementById('chat-container');
    if (container) container.innerHTML = '';
    if (!isMaster()) { addMessage('<p>❌ Доступ запрещён. Только для Мастеров.</p>'); return; }
    const reads = await getAllLessonReads();
    const totalLessons = Object.keys(lessonsById).length;
    const totalHomework = assignmentsList.length;
    let html = `<div style="background:rgba(13,31,15,0.5); border:1px solid var(--border-color); border-radius:15px; padding:25px; margin:15px 0;">`;
    html += `<h3 style="color:#64ffda; margin-bottom:25px; font-family:'Playfair Display',serif; text-align:center; font-size:1.8em;">🔒 Детальная успеваемость</h3>`;
    for (const user of Object.values(usersDatabase)) {
        if (user.ранг === 'мастер' || user.ранг === 'магистр' || user.ранг === 'верховный магистр' || user.ранг === 'старейшина') continue;
        const userReads = reads.filter(r => r.userId === user.fullName);
        const userSubmissions = submissionsList.filter(s => s.studentName === user.fullName);
        const adjustments = await getUserAdjustments(user.fullName);
        const gradeData = calculateGrade(userReads.length, userSubmissions.filter(s => s.status === 'approved').length, totalLessons, totalHomework, adjustments.adjustedLessons || 0, adjustments.adjustedHomework || 0);
        html += `<div style="background:rgba(0,0,0,0.3); border-radius:10px; padding:15px; margin:15px 0; border-left:3px solid ${gradeData.gradeColor};">`;
        html += `<h4 style="color:${gradeData.gradeColor}; margin-bottom:10px;">${user.fullName} — ${gradeData.grade} (${gradeData.percent}%)</h4>`;
        html += `<p style="color:#8bc34a; margin:10px 0 5px 0; font-weight:600;">📖 Прочитанные уроки (${userReads.length}/${totalLessons}):</p>`;
        if (userReads.length > 0) {
            html += `<ul style="color:var(--text-color); margin:5px 0; padding-left:20px; font-size:0.95em;">`;
            userReads.forEach(read => {
                const lesson = lessonsById[read.lessonId];
                if (lesson) {
                    const readDate = read.readAt ? formatDbDate(read.readAt, {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'}) : '';
                    html += `<li>${lesson.title} <span style="color:#6b5f4a; font-size:0.85em;">— ${readDate}</span></li>`;
                }
            });
            html += `</ul>`;
        } else { html += `<p style="color:#6b5f4a; font-style:italic; margin:5px 0;">Нет прочитанных уроков</p>`; }
        html += `<p style="color:#ffa500; margin:10px 0 5px 0; font-weight:600;">📝 Сданные ДЗ (${userSubmissions.length} всего, ${userSubmissions.filter(s => s.status === 'approved').length} одобрено):</p>`;
        if (userSubmissions.length > 0) {
            html += `<ul style="color:var(--text-color); margin:5px 0; padding-left:20px; font-size:0.95em;">`;
            userSubmissions.forEach(sub => {
                const assignment = assignmentsList.find(a => a.id === sub.assignmentId);
                const statusEmoji = sub.status === 'approved' ? '✅' : (sub.status === 'needs_revision' ? '⚠️' : '');
                const title = assignment ? assignment.title : 'Неизвестное задание';
                html += `<li>${statusEmoji} ${title}</li>`;
            });
            html += `</ul>`;
        } else { html += `<p style="color:#6b5f4a; font-style:italic; margin:5px 0;">Нет сданных ДЗ</p>`; }
        if ((adjustments.adjustedLessons || 0) > 0 || (adjustments.adjustedHomework || 0) > 0) {
            html += `<div style="background:rgba(100,255,218,0.1); border-radius:8px; padding:10px; margin-top:10px;">`;
            html += `<p style="color:#64ffda; margin:0; font-weight:600;">✏️ Ручная корректировка:</p>`;
            html += `<p style="color:var(--text-color); margin:5px 0 0 0; font-size:0.9em;">+${adjustments.adjustedLessons} уроков, +${adjustments.adjustedHomework} ДЗ</p>`;
            if (adjustments.reason) html += `<p style="color:var(--text-secondary); margin:5px 0 0 0; font-size:0.85em; font-style:italic;">Причина: ${adjustments.reason}</p>`;
            if (adjustments.adjustedBy) html += `<p style="color:#6b5f4a; margin:5px 0 0 0; font-size:0.8em;">Внёс: ${adjustments.adjustedBy}</p>`;
            html += `</div>`;
        }
        html += `</div>`;
    }
    html += `<button class="hw-btn" onclick="window.showProgressTable()" style="width:100%; margin-top:15px; padding:12px;">🔙 Назад к таблице</button></div>`;
    addMessage(html);
};

// ===== АДМИН ПАНЕЛЬ =====
window.showAdminPanel = async function() {
    const container = document.getElementById('chat-container');
    if (container) container.innerHTML = '';
    if (!isAdmin()) { addMessage('<p>❌ Доступ запрещён. Только для Магистров.</p>'); return; }
    const blockedUsers = await getBlockedUsers();
    let html = `<div style="background:rgba(13,31,15,0.5); border:1px solid var(--border-color); border-radius:15px; padding:25px; margin:15px 0;">`;
    html += `<h3 style="color:#64ffda; margin-bottom:25px; font-family:'Playfair Display',serif; text-align:center; font-size:1.8em;">⚙️ Админ-панель</h3>`;
    html += `<div class="admin-panel"><h3>👥 Управление всеми пользователями (включая Мастеров)</h3>`;
    Object.values(usersDatabase).forEach(user => {
        const isBlocked = blockedUsers.find(b => b.id === user.fullName);
        const userRank = user.ранг;
        const rankColor = userRank.includes('магистр') || userRank.includes('мастер') ? '#ffd700' : 'var(--accent-color)';
        html += `<div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid var(--border-color); background:rgba(0,0,0,0.2); border-radius:8px; margin:8px 0;">`;
        html += `<div><div style="color:var(--text-color); font-weight:600; font-size:1.1em;">${user.fullName}</div>`;
        html += `<div style="color:${rankColor}; font-size:0.9em;">${user.ранг}</div></div><div>`;
        if (isBlocked) { html += `<button class="unblock-btn" onclick="window.unblockUser('${user.fullName}')">✅ Разблокировать</button>`; }
        else { html += `<button class="block-btn" onclick="window.blockUser('${user.fullName}')">🚫 Заблокировать</button>`; }
        html += `</div></div>`;
    });
    html += `</div>`;
    html += `<button class="hw-btn" onclick="showMainMenu()" style="width:100%; margin-top:15px; padding:12px;">🔙 Вернуться в меню</button></div>`;
    addMessage(html);
};

window.blockUser = async function(userName) {
    showFormModal({
        title: `Блокировка: ${userName}`,
        submitText: 'Заблокировать',
        fields: [{
            id: 'block-reason', label: 'Причина блокировки', type: 'textarea', rows: 4,
            required: true, maxlength: 1000, placeholder: 'Опишите нарушение правил'
        }],
        onSubmit: async (values, controls) => {
            const reason = values['block-reason'].trim();
            controls.setBusy(true);
            const success = await persistBlockedUser(userName, reason);
            controls.setBusy(false);
            if (!success) {
                controls.showError('Не удалось заблокировать пользователя. Проверьте подключение к базе.');
                return false;
            }
            addMessage(`<p>✅ Пользователь ${escapeHtml(userName)} заблокирован.</p>`);
            await window.showAdminPanel();
            return true;
        }
    });
};

window.unblockUser = async function(userName) {
    showCustomConfirm('Разблокировка', `Разблокировать пользователя ${userName}?`, async (confirmed) => {
        if (!confirmed) return;
        const success = await persistUnblockedUser(userName);
        if (success) { addMessage(`<p>✅ Пользователь ${userName} разблокирован.</p>`); window.showAdminPanel(); }
        else { addMessage('<p>❌ Ошибка разблокировки.</p>'); }
    });
};


// ===== УЛУЧШЕННЫЕ СПИСКИ, УСПЕВАЕМОСТЬ И АДМИНИСТРИРОВАНИЕ =====
function learnerProfiles() {
    return Object.values(usersDatabase).filter((user) => !['мастер','магистр','верховный магистр','старейшина'].includes(user.ранг));
}

async function getCollectionDocuments(collection) {
    if (!windowDb) return [];
    try {
        const snapshot = await windowDb.collection(collection).get();
        const items = [];
        snapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
        return items;
    } catch (error) {
        console.error(`Ошибка загрузки ${collection}:`, error);
        return [];
    }
}

async function showMembersListV2() {
    const container = document.getElementById('chat-container');
    if (!container) return;
    container.innerHTML = '<div class="loading-inline"><i class="fa-solid fa-circle-notch fa-spin"></i> Загружаем участников…</div>';
    const [blocked, registrations] = await Promise.all([getBlockedUsers(), getCollectionDocuments('user_registrations')]);
    const blockedMap = new Map(blocked.map((item) => [item.id, item]));
    const registrationMap = new Map(registrations.map((item) => [item.userName || item.id, item]));
    const ranks = [...USER_RANK_OPTIONS].reverse();
    const groups = ranks.map((rank) => {
        const members = Object.values(usersDatabase)
            .filter((user) => user.ранг === rank)
            .sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru'));
        if (!members.length) return '';
        return `<section class="member-group"><h3>${escapeHtml(titleCase(rank))}</h3><div class="member-grid">${members.map((member) => {
            const blockedInfo = blockedMap.get(member.fullName);
            const registration = registrationMap.get(member.fullName);
            const registeredAt = asDate(registration?.registeredAt);
            const teacher = member.учитель && member.учитель !== 'отсутствует' ? member.учитель : 'Не назначен';
            return `<article class="member-card modern"><div class="member-avatar"><i class="fa-solid ${isMasterRankValue(member.ранг) ? 'fa-user-shield' : 'fa-user-graduate'}"></i></div><div class="member-info"><strong>${escapeHtml(member.fullName)}</strong><span>${escapeHtml(titleCase(member.ранг))}</span><small><i class="fa-solid fa-person-chalkboard"></i><span>${escapeHtml(teacher)}</span></small><small><i class="fa-regular fa-clock"></i><span>${registeredAt ? formatTimeInAkasha(registeredAt) : 'Ещё не входил'}</span></small></div><span class="member-status ${blockedInfo ? 'status-blocked' : 'status-active'}"><i class="fa-solid ${blockedInfo ? 'fa-ban' : 'fa-circle-check'}"></i> ${blockedInfo ? 'Заблокирован' : 'Активен'}</span></article>`;
        }).join('')}</div></section>`;
    }).join('');
    container.innerHTML = `<section class="panel-card"><div class="section-heading"><i class="fa-solid fa-users"></i><div><h2>Члены Ордена</h2><p>${Object.keys(usersDatabase).length} участников, ранги и наставники</p></div></div>${groups || '<div class="empty-state"><i class="fa-solid fa-users-slash"></i><h3>Пользователей пока нет</h3></div>'}<div class="section-actions footer-actions"><button class="hw-btn" onclick="showMainMenu()"><i class="fa-solid fa-arrow-left"></i> В меню</button></div></section>`;
}

async function showCouncilOfMastersV2() {
    const container = document.getElementById('chat-container');
    if (!container) return;
    container.innerHTML = '<div class="loading-inline"><i class="fa-solid fa-circle-notch fa-spin"></i> Загружаем Совет…</div>';
    const blocked = await getBlockedUsers();
    const blockedMap = new Map(blocked.map((item) => [item.id, item]));
    const leaders = Object.values(usersDatabase)
        .filter((user) => isMasterRankValue(user.ранг))
        .sort((a, b) => USER_RANK_OPTIONS.indexOf(b.ранг) - USER_RANK_OPTIONS.indexOf(a.ранг) || a.fullName.localeCompare(b.fullName, 'ru'));
    const cards = leaders.map((member) => {
        const isBlocked = blockedMap.has(member.fullName);
        return `<article class="council-person-card"><div class="council-person-top"><div class="member-avatar council-avatar"><i class="fa-solid fa-user-shield"></i></div><div class="council-person-info"><strong>${escapeHtml(member.fullName)}</strong><span>${escapeHtml(member.specialTitle || titleCase(member.ранг))}</span></div><span class="member-status ${isBlocked ? 'status-blocked' : 'status-active'}"><i class="fa-solid ${isBlocked ? 'fa-ban' : 'fa-circle-check'}"></i>${isBlocked ? 'Заблокирован' : 'Активен'}</span></div>${member.description ? `<p>${escapeHtml(member.description)}</p>` : ''}</article>`;
    }).join('');
    container.innerHTML = `<section class="panel-card council-panel"><div class="section-heading"><i class="fa-solid fa-landmark"></i><div><h2>Совет Мастеров</h2><p>Руководство Ордена Вольных Джедаев</p></div></div><div class="council-grid">${cards || '<div class="empty-state"><i class="fa-solid fa-landmark-dome"></i><h3>Состав Совета пока не заполнен</h3></div>'}</div><div class="section-actions footer-actions"><button class="hw-btn" onclick="showMainMenu()"><i class="fa-solid fa-arrow-left"></i> В меню</button></div></section>`;
}

function isMasterRankValue(rank) { return ['мастер','магистр','верховный магистр','старейшина'].includes(rank); }

async function showProgressTableV2() {
    const container = document.getElementById('chat-container');
    if (!container) return;
    container.innerHTML = '<div class="loading-inline"><i class="fa-solid fa-circle-notch fa-spin"></i> Считаем успеваемость…</div>';
    await Promise.all([loadAssignments(), loadSubmissions()]);
    const [reads, adjustments, registrations] = await Promise.all([
        getAllLessonReads(), getCollectionDocuments('manual_adjustments'), getCollectionDocuments('user_registrations')
    ]);
    const adjustmentMap = new Map(adjustments.map((item) => [item.userName || item.id, item]));
    const registrationMap = new Map(registrations.map((item) => [item.userName || item.id, item]));
    const totalLessons = Object.keys(lessonsById).length;
    const totalHomework = assignmentsList.length;
    let users = learnerProfiles().sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru'));
    if (!isMaster()) users = users.filter((user) => user.fullName === currentUser.name);
    const entries = users.map((user) => {
        const userReads = reads.filter((item) => item.userId === user.fullName);
        const userSubmissions = submissionsList.filter((item) => item.studentName === user.fullName);
        const approved = userSubmissions.filter((item) => item.status === 'approved').length;
        const adjustment = adjustmentMap.get(user.fullName) || {};
        const adjustedLessons = Number(adjustment.adjustedLessons || 0);
        const adjustedHomework = Number(adjustment.adjustedHomework || 0);
        const lessonScore = userReads.length + adjustedLessons;
        const homeworkScore = approved + adjustedHomework;
        const grade = calculateGrade(userReads.length, approved, totalLessons, totalHomework, adjustedLessons, adjustedHomework);
        const registration = registrationMap.get(user.fullName);
        const regDate = asDate(registration?.registeredAt);
        return { user, lessonScore, homeworkScore, adjustedLessons, adjustedHomework, submissions: userSubmissions.length, grade, regDate };
    });
    const rows = entries.map(({user, lessonScore, homeworkScore, adjustedLessons, adjustedHomework, submissions, grade, regDate}) => `<tr><td><strong>${escapeHtml(user.fullName)}</strong><small>${escapeHtml(titleCase(user.ранг))}</small></td><td>${escapeHtml(user.учитель && user.учитель !== 'отсутствует' ? user.учитель : '—')}</td><td>${regDate ? formatTimeInAkasha(regDate) : '—'}</td><td><strong>${lessonScore}</strong> / ${totalLessons}${adjustedLessons ? `<small>Вручную +${adjustedLessons}</small>` : ''}</td><td><strong>${homeworkScore}</strong> / ${totalHomework}<small>${submissions} отправлено${adjustedHomework ? ` · вручную +${adjustedHomework}` : ''}</small></td><td><span class="grade-pill" style="--grade-color:${grade.gradeColor}">${escapeHtml(grade.grade)} · ${grade.percent}%</span></td></tr>`).join('');
    const cards = entries.map(({user, lessonScore, homeworkScore, adjustedLessons, adjustedHomework, submissions, grade, regDate}) => `<article class="progress-mobile-card"><header><div><strong>${escapeHtml(user.fullName)}</strong><span>${escapeHtml(titleCase(user.ранг))}</span></div><span class="grade-pill" style="--grade-color:${grade.gradeColor}">${grade.percent}%</span></header><dl><div><dt>Наставник</dt><dd>${escapeHtml(user.учитель && user.учитель !== 'отсутствует' ? user.учитель : 'Не назначен')}</dd></div><div><dt>В Акаше</dt><dd>${regDate ? formatTimeInAkasha(regDate) : 'Ещё не входил'}</dd></div><div><dt>Уроки</dt><dd><strong>${lessonScore}</strong> из ${totalLessons}${adjustedLessons ? `<small>Вручную +${adjustedLessons}</small>` : ''}</dd></div><div><dt>Домашние задания</dt><dd><strong>${homeworkScore}</strong> из ${totalHomework}<small>${submissions} отправлено${adjustedHomework ? ` · вручную +${adjustedHomework}` : ''}</small></dd></div></dl><footer><i class="fa-solid fa-chart-line"></i><span>${escapeHtml(grade.grade)}</span></footer></article>`).join('');
    const empty = '<div class="empty-state"><i class="fa-solid fa-chart-simple"></i><h3>Данных пока нет</h3></div>';
    container.innerHTML = `<section class="panel-card progress-panel"><div class="section-heading"><i class="fa-solid fa-chart-column"></i><div><h2>${isMaster() ? 'Успеваемость Ордена' : 'Моя успеваемость'}</h2><p>${totalLessons} уроков · ${totalHomework} домашних заданий</p></div></div>${entries.length ? `<div class="progress-desktop table-scroll"><table class="progress-table"><thead><tr><th>Ученик</th><th>Наставник</th><th>В Акаше</th><th>Уроки</th><th>ДЗ</th><th>Результат</th></tr></thead><tbody>${rows}</tbody></table></div><div class="progress-mobile">${cards}</div>` : empty}${isMaster() ? `<div class="section-actions progress-actions"><button class="hw-btn primary" onclick="window.showAdjustmentPanel()"><i class="fa-solid fa-sliders"></i> Корректировка</button><button class="hw-btn" onclick="window.showDetailedProgress()"><i class="fa-solid fa-list-check"></i> Подробности</button></div>` : ''}<div class="section-actions footer-actions"><button class="hw-btn" onclick="showMainMenu()"><i class="fa-solid fa-arrow-left"></i> В меню</button></div></section>`;
}

async function showAdjustmentPanelV2() {
    if (!isMaster()) return showToast('Раздел доступен только Мастерам.', 'error');
    const container = document.getElementById('chat-container');
    container.innerHTML = '<div class="loading-inline"><i class="fa-solid fa-circle-notch fa-spin"></i> Загружаем корректировки…</div>';
    const adjustments = await getCollectionDocuments('manual_adjustments');
    const map = new Map(adjustments.map((item) => [item.userName || item.id, item]));
    const cards = learnerProfiles().map((user) => {
        const adjustment = map.get(user.fullName) || {};
        const active = Number(adjustment.adjustedLessons || 0) + Number(adjustment.adjustedHomework || 0) > 0;
        const key = userKey(user.fullName);
        return `<article class="adjustment-card ${active ? 'has-adjustment' : ''}"><div><strong>${escapeHtml(user.fullName)}</strong><span>${escapeHtml(user.ранг)}</span>${active ? `<small><i class="fa-solid fa-plus"></i> ${adjustment.adjustedLessons || 0} уроков · ${adjustment.adjustedHomework || 0} ДЗ</small>` : '<small>Ручных баллов нет</small>'}</div><button class="hw-btn" onclick="window.openAdjustmentForm(decodeUserKey('${key}'))"><i class="fa-solid fa-pen"></i> ${active ? 'Изменить' : 'Добавить'}</button></article>`;
    }).join('');
    container.innerHTML = `<section class="panel-card"><div class="section-heading"><i class="fa-solid fa-sliders"></i><div><h2>Ручная корректировка</h2><p>Учёт уроков и ДЗ, сданных вне программы</p></div></div><div class="adjustment-list">${cards}</div><div class="section-actions footer-actions"><button class="hw-btn" onclick="window.showProgressTable()"><i class="fa-solid fa-arrow-left"></i> К таблице</button></div></section>`;
}

async function openAdjustmentFormV2(userName) {
    if (!isMaster()) return;
    const adjustments = await getUserAdjustments(userName);
    showFormModal({
        title: `Корректировка: ${userName}`,
        description: 'Укажите только материалы, которые были сданы вне Акаши. Ноль удаляет ранее начисленные дополнительные баллы.',
        submitText: 'Сохранить',
        fields: [
            { id: 'adjusted-lessons', label: 'Дополнительные уроки', type: 'number', inputmode: 'numeric', min: 0, max: 100000, step: 1, required: true, value: adjustments.adjustedLessons || 0 },
            { id: 'adjusted-homework', label: 'Дополнительные ДЗ', type: 'number', inputmode: 'numeric', min: 0, max: 100000, step: 1, required: true, value: adjustments.adjustedHomework || 0 },
            { id: 'adjustment-reason', label: 'Причина', type: 'textarea', rows: 5, required: true, maxlength: 2000, value: adjustments.reason || '', placeholder: 'Например: работа сдана в учебном чате ВК' }
        ],
        onSubmit: async (values, controls) => {
            const lessons = Math.max(0, Number.parseInt(values['adjusted-lessons'], 10) || 0);
            const homework = Math.max(0, Number.parseInt(values['adjusted-homework'], 10) || 0);
            controls.setBusy(true);
            const success = await saveManualAdjustment(userName, lessons, homework, values['adjustment-reason'].trim());
            controls.setBusy(false);
            if (!success) { controls.showError('Не удалось сохранить корректировку.'); return false; }
            showToast('Корректировка сохранена.', 'success');
            await showAdjustmentPanelV2();
            return true;
        }
    });
}

async function showDetailedProgressV2() {
    if (!isMaster()) return showToast('Раздел доступен только Мастерам.', 'error');
    const container = document.getElementById('chat-container');
    container.innerHTML = '<div class="loading-inline"><i class="fa-solid fa-circle-notch fa-spin"></i> Загружаем детали…</div>';
    await Promise.all([loadAssignments(), loadSubmissions()]);
    const [reads, adjustments] = await Promise.all([getAllLessonReads(), getCollectionDocuments('manual_adjustments')]);
    const adjustmentMap = new Map(adjustments.map((item) => [item.userName || item.id, item]));
    const cards = learnerProfiles().map((user) => {
        const userReads = reads.filter((item) => item.userId === user.fullName);
        const userSubmissions = submissionsList.filter((item) => item.studentName === user.fullName);
        const adjustment = adjustmentMap.get(user.fullName) || {};
        const lessonItems = userReads.map((read) => `<li><i class="fa-solid fa-circle-check"></i><span>${escapeHtml(lessonsById[read.lessonId]?.title || 'Удалённый урок')}</span><time>${escapeHtml(formatDbDate(read.readAt, {day:'2-digit',month:'2-digit'}))}</time></li>`).join('') || '<li class="muted">Нет прочитанных уроков</li>';
        const homeworkItems = userSubmissions.map((submission) => { const assignment = assignmentsList.find((item) => item.id === submission.assignmentId); const status = submissionStatus(submission.status); return `<li><i class="fa-solid ${status.icon}"></i><span>${escapeHtml(assignment?.title || 'Удалённое задание')}</span><em>${status.label}</em></li>`; }).join('') || '<li class="muted">Нет отправленных работ</li>';
        return `<article class="detail-progress-card"><header><div><h3>${escapeHtml(user.fullName)}</h3><p>${escapeHtml(user.ранг)}</p></div>${Number(adjustment.adjustedLessons || 0) + Number(adjustment.adjustedHomework || 0) ? `<span class="badge neutral">вручную +${(adjustment.adjustedLessons || 0) + (adjustment.adjustedHomework || 0)}</span>` : ''}</header><div class="detail-columns"><section><h4><i class="fa-solid fa-book-open"></i> Уроки</h4><ul>${lessonItems}</ul></section><section><h4><i class="fa-solid fa-clipboard-check"></i> Домашние задания</h4><ul>${homeworkItems}</ul></section></div>${adjustment.reason ? `<p class="adjustment-note"><strong>Корректировка:</strong> ${escapeHtml(adjustment.reason)}</p>` : ''}</article>`;
    }).join('');
    container.innerHTML = `<section class="panel-card"><div class="section-heading"><i class="fa-solid fa-list-check"></i><div><h2>Подробная успеваемость</h2><p>Какие материалы пройдены и сданы</p></div></div><div class="detail-progress-list">${cards}</div><div class="section-actions footer-actions"><button class="hw-btn" onclick="window.showProgressTable()"><i class="fa-solid fa-arrow-left"></i> К таблице</button></div></section>`;
}

async function showAdminPanelV2() {
    if (!isAdmin()) return showToast('Раздел доступен только Магистрам.', 'error');
    const container = document.getElementById('chat-container');
    container.innerHTML = '<div class="loading-inline"><i class="fa-solid fa-circle-notch fa-spin"></i> Загружаем админ-панель…</div>';
    await refreshProfiles();
    const [blocked, auditRows] = await Promise.all([getBlockedUsers(), getCollectionDocuments('audit_log')]);
    const blockedMap = new Map(blocked.map((item) => [item.id, item]));
    const users = Object.values(usersDatabase).sort((a, b) => USER_RANK_OPTIONS.indexOf(b.ранг) - USER_RANK_OPTIONS.indexOf(a.ранг) || a.fullName.localeCompare(b.fullName, 'ru'));
    const userCards = users.map((user) => {
        const blockedInfo = blockedMap.get(user.fullName);
        const self = user.fullName === currentUser.name;
        const key = userKey(user.fullName);
        const accessButton = self ? '<span class="badge neutral"><i class="fa-solid fa-user-check"></i> Это вы</span>' : blockedInfo ? `<button class="unblock-btn" onclick="window.unblockUser(decodeUserKey('${key}'))"><i class="fa-solid fa-lock-open"></i> Разблокировать</button>` : `<button class="block-btn" onclick="window.blockUser(decodeUserKey('${key}'))"><i class="fa-solid fa-ban"></i> Заблокировать</button>`;
        return `<article class="admin-user-card"><div class="member-avatar"><i class="fa-solid ${isMasterRankValue(user.ранг) ? 'fa-user-shield' : 'fa-user'}"></i></div><div class="admin-user-info"><strong>${escapeHtml(user.fullName)}</strong><span>${escapeHtml(titleCase(user.ранг))}</span><small><i class="fa-solid fa-person-chalkboard"></i> ${escapeHtml(user.учитель && user.учитель !== 'отсутствует' ? user.учитель : 'Наставник не назначен')}</small>${blockedInfo?.reason ? `<small class="blocked-reason"><i class="fa-solid fa-circle-exclamation"></i> ${escapeHtml(blockedInfo.reason)}</small>` : ''}</div><div class="admin-user-actions"><button class="hw-btn compact" onclick="window.editUserProfile(decodeUserKey('${key}'))"><i class="fa-solid fa-user-pen"></i> Изменить</button><button class="hw-btn compact" onclick="window.resetUserPassword(decodeUserKey('${key}'))"><i class="fa-solid fa-key"></i> Пароль</button>${accessButton}</div></article>`;
    }).join('');
    const audit = auditRows.sort((a,b) => compareDbDates(b.createdAt,a.createdAt)).slice(0,40).map((row) => `<tr><td data-label="Когда">${escapeHtml(formatDbDate(row.createdAt, {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}))}</td><td data-label="Кто">${escapeHtml(row.actor || '')}</td><td data-label="Действие">${escapeHtml(row.action || '')}</td><td data-label="Раздел">${escapeHtml(row.collection || '')}</td></tr>`).join('');
    container.innerHTML = `<section class="panel-card admin-dashboard"><div class="section-heading admin-heading"><i class="fa-solid fa-shield-halved"></i><div><h2>Админ-панель</h2><p>Пользователи, доступ и журнал изменений</p></div><button class="hw-btn primary add-user-button" onclick="window.createUserAccount()"><i class="fa-solid fa-user-plus"></i> Добавить пользователя</button></div><section><div class="subsection-row"><h3 class="subsection-title">Управление пользователями</h3><span class="badge neutral">${users.length} аккаунтов</span></div><div class="admin-user-list">${userCards || '<div class="empty-state"><i class="fa-solid fa-users-slash"></i><h3>Пользователей нет</h3></div>'}</div></section><details class="audit-details"><summary><i class="fa-solid fa-clock-rotate-left"></i> Журнал последних действий</summary><div class="table-scroll"><table class="responsive-table"><thead><tr><th>Когда</th><th>Кто</th><th>Действие</th><th>Раздел</th></tr></thead><tbody>${audit || '<tr><td colspan="4">Журнал пока пуст</td></tr>'}</tbody></table></div></details><div class="section-actions footer-actions"><button class="hw-btn" onclick="showMainMenu()"><i class="fa-solid fa-arrow-left"></i> В меню</button></div></section>`;
}

function createUserV2() {
    if (!isAdmin()) return;
    showFormModal({
        title: 'Новый пользователь',
        description: 'Создайте аккаунт и передайте пользователю его имя и временный пароль.',
        submitText: 'Создать аккаунт',
        draftKey: 'create-user',
        fields: [
            { id:'new-user-name', label:'Полное имя', type:'text', required:true, maxlength:240, autocomplete:'name', autocapitalize:'words', placeholder:'Например, Лиара Эвенстар' },
            { id:'new-user-rank', label:'Ранг', type:'select', required:true, value:'адепт', options:USER_RANK_OPTIONS.map((rank) => ({value:rank,label:titleCase(rank)})) },
            { id:'new-user-teacher', label:'Наставник', type:'select', value:'отсутствует', options:teacherSelectOptions() },
            { id:'new-user-password', label:'Временный пароль', type:'password', required:true, maxlength:240, autocomplete:'new-password', help:'Минимум 6 символов' },
            { id:'new-user-password-confirm', label:'Повторите пароль', type:'password', required:true, maxlength:240, autocomplete:'new-password' },
            { id:'new-user-title', label:'Особый титул', type:'text', maxlength:240, placeholder:'Необязательно' },
            { id:'new-user-description', label:'Описание', type:'textarea', rows:4, maxlength:2000, placeholder:'Необязательно' }
        ],
        onSubmit: async (values, controls) => {
            if (values['new-user-password'].length < 6) { controls.showError('Пароль должен содержать минимум 6 символов.'); return false; }
            if (values['new-user-password'] !== values['new-user-password-confirm']) { controls.showError('Пароли не совпадают.'); return false; }
            controls.setBusy(true);
            try {
                await authClient.createUser({
                    name: values['new-user-name'].trim(), rank: values['new-user-rank'], teacher: values['new-user-teacher'],
                    password: values['new-user-password'], specialTitle: values['new-user-title'].trim(), description: values['new-user-description'].trim()
                });
                await refreshProfiles();
                showToast('Пользователь создан.', 'success');
                await showAdminPanelV2();
                return true;
            } catch (error) {
                controls.setBusy(false); controls.showError(error?.message || 'Не удалось создать пользователя.'); return false;
            }
        }
    });
}

function editUserProfileV2(userName) {
    if (!isAdmin()) return;
    const user = Object.values(usersDatabase).find((item) => item.fullName === userName);
    if (!user) return showToast('Пользователь не найден.', 'error');
    showFormModal({
        title: `Профиль: ${user.fullName}`,
        description: 'Имя аккаунта остаётся неизменным, чтобы не потерять историю занятий и сообщений.',
        submitText: 'Сохранить изменения',
        fields: [
            { id:'edit-user-rank', label:'Ранг', type:'select', required:true, value:user.ранг, options:USER_RANK_OPTIONS.map((rank) => ({value:rank,label:titleCase(rank)})) },
            { id:'edit-user-teacher', label:'Наставник', type:'select', value:user.учитель || 'отсутствует', options:teacherSelectOptions(user.учитель) },
            { id:'edit-user-title', label:'Особый титул', type:'text', value:user.specialTitle || '', maxlength:240, placeholder:'Необязательно' },
            { id:'edit-user-description', label:'Описание', type:'textarea', rows:5, value:user.description || '', maxlength:2000, placeholder:'Необязательно' }
        ],
        onSubmit: async (values, controls) => {
            controls.setBusy(true);
            try {
                await authClient.updateUser(userName, { rank:values['edit-user-rank'], teacher:values['edit-user-teacher'], specialTitle:values['edit-user-title'].trim(), description:values['edit-user-description'].trim() });
                await refreshProfiles(userName === currentUser.name);
                showToast('Профиль обновлён.', 'success');
                await showAdminPanelV2();
                return true;
            } catch (error) { controls.setBusy(false); controls.showError(error?.message || 'Не удалось обновить профиль.'); return false; }
        }
    });
}

function resetUserPasswordV2(userName) {
    if (!isAdmin()) return;
    showFormModal({
        title: `Новый пароль: ${userName}`,
        description: 'Старый пароль перестанет работать сразу после сохранения.',
        submitText: 'Сменить пароль',
        fields: [
            { id:'reset-password', label:'Новый пароль', type:'password', required:true, maxlength:240, autocomplete:'new-password', help:'Минимум 6 символов' },
            { id:'reset-password-confirm', label:'Повторите пароль', type:'password', required:true, maxlength:240, autocomplete:'new-password' }
        ],
        onSubmit: async (values, controls) => {
            if (values['reset-password'].length < 6) { controls.showError('Пароль должен содержать минимум 6 символов.'); return false; }
            if (values['reset-password'] !== values['reset-password-confirm']) { controls.showError('Пароли не совпадают.'); return false; }
            controls.setBusy(true);
            try { await authClient.resetUserPassword(userName, values['reset-password']); showToast('Пароль изменён.', 'success'); return true; }
            catch (error) { controls.setBusy(false); controls.showError(error?.message || 'Не удалось сменить пароль.'); return false; }
        }
    });
}

async function blockUserV2(userName) {
    if (!isAdmin() || userName === currentUser.name) return;
    showFormModal({ title: `Заблокировать: ${userName}`, description: 'Пользователь не сможет войти, пока Магистр не снимет блокировку.', submitText: 'Заблокировать', submitClass: 'danger', fields: [{ id:'block-reason', label:'Причина блокировки', type:'textarea', rows:5, required:true, maxlength:2000, placeholder:'Опишите нарушение правил' }], onSubmit: async (values, controls) => {
        controls.setBusy(true); const success = await persistBlockedUser(userName, values['block-reason'].trim()); controls.setBusy(false);
        if (!success) { controls.showError('Не удалось заблокировать пользователя.'); return false; }
        showToast(`${userName} заблокирован.`, 'success'); await showAdminPanelV2(); return true;
    }});
}

async function unblockUserV2(userName) {
    if (!isAdmin()) return;
    showCustomConfirm('Разблокировать пользователя', `Вернуть доступ пользователю ${userName}?`, async (confirmed) => {
        if (!confirmed) return;
        setLoading(true, 'Снимаем блокировку…'); const success = await persistUnblockedUser(userName); setLoading(false);
        if (!success) return showToast('Не удалось снять блокировку.', 'error');
        showToast('Доступ восстановлен.', 'success'); await showAdminPanelV2();
    });
}

window.showMembersList = showMembersListV2;
window.showProgressTable = showProgressTableV2;
window.showAdjustmentPanel = showAdjustmentPanelV2;
window.openAdjustmentForm = openAdjustmentFormV2;
window.showDetailedProgress = showDetailedProgressV2;
window.showAdminPanel = showAdminPanelV2;
window.blockUser = blockUserV2;
window.unblockUser = unblockUserV2;
window.createUserAccount = createUserV2;
window.editUserProfile = editUserProfileV2;
window.resetUserPassword = resetUserPasswordV2;

// ===== ИНИЦИАЛИЗАЦИЯ И АВТОРИЗАЦИЯ =====
function loginScreenMarkup(message = '') {
    return `<section class="login-card panel-card">
        <div class="login-symbol"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i></div>
        <div class="login-heading"><span class="eyebrow">Защищённый вход</span><h2>Добро пожаловать в Акашу</h2><p>Введите имя участника Ордена и личный пароль.</p></div>
        ${message ? `<div class="login-notice"><i class="fa-solid fa-circle-info"></i>${escapeHtml(message)}</div>` : ''}
        <form id="login-form" class="login-form" novalidate>
            <label class="form-field"><span class="form-label">Имя</span><input id="login-name" class="modal-input" type="text" autocomplete="username" autocapitalize="words" spellcheck="false" required maxlength="240" placeholder="Полное имя"></label>
            <label class="form-field"><span class="form-label">Пароль</span><span class="password-field"><input id="login-password" class="modal-input" type="password" autocomplete="current-password" required maxlength="240" placeholder="Пароль"><button id="toggle-password" class="password-toggle" type="button" aria-label="Показать пароль"><i class="fa-regular fa-eye"></i></button></span></label>
            <div id="login-error" class="form-error" role="alert" hidden></div>
            <button id="login-submit" class="hw-btn primary login-submit" type="submit"><i class="fa-solid fa-right-to-bracket"></i><span>Войти</span></button>
        </form>
        <p class="login-help"><i class="fa-solid fa-lock"></i> Пароли проверяются на сервере и не хранятся в браузере.</p>
    </section>`;
}

function showLoginScreen(message = '') {
    currentUser = null;
    updateLogoutButton();
    setMainInputVisible(false);
    const wrapper = document.getElementById('master-chat-wrapper');
    if (wrapper) wrapper.hidden = true;
    const container = document.getElementById('chat-container');
    if (!container) return;
    container.innerHTML = loginScreenMarkup(message);
    const form = document.getElementById('login-form');
    const password = document.getElementById('login-password');
    document.getElementById('toggle-password')?.addEventListener('click', (event) => {
        const show = password.type === 'password';
        password.type = show ? 'text' : 'password';
        event.currentTarget.setAttribute('aria-label', show ? 'Скрыть пароль' : 'Показать пароль');
        event.currentTarget.innerHTML = `<i class="fa-regular ${show ? 'fa-eye-slash' : 'fa-eye'}"></i>`;
        password.focus({ preventScroll: true });
    });
    form?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const name = document.getElementById('login-name')?.value.trim() || '';
        const pass = password?.value || '';
        const errorBox = document.getElementById('login-error');
        const submit = document.getElementById('login-submit');
        if (!name || !pass) {
            errorBox.textContent = 'Введите имя и пароль.';
            errorBox.hidden = false;
            return;
        }
        submit.disabled = true;
        submit.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i><span>Проверяем…</span>';
        errorBox.hidden = true;
        try {
            const result = await authClient.login(name, pass);
            await activateSession(result.profile);
            showToast('Вход выполнен.', 'success');
        } catch (error) {
            errorBox.textContent = error?.message || 'Не удалось войти.';
            errorBox.hidden = false;
            password.select();
        } finally {
            submit.disabled = false;
            submit.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i><span>Войти</span>';
        }
    });
    requestAnimationFrame(() => document.getElementById('login-name')?.focus({ preventScroll: true }));
}

async function activateSession(profile) {
    currentUser = profileToCurrentUser(profile);
    if (!currentUser) throw new Error('Сервер не вернул профиль пользователя.');
    setLoading(true, 'Загружаем личный кабинет…');
    try {
        await refreshProfiles();
        await Promise.all([loadLessonsFromFirebase(), loadAssignments(), loadSubmissions(), registerUserIfNeeded()]);
        updateLogoutButton();
        loadMainDraft();
        setMainInputVisible(true);
        showMainMenu();
    } finally { setLoading(false); }
}

async function initializeDataStore() {
    const config = window.AKASHA_CONFIG || {};
    storageMode = String(config.storage || 'local').toLowerCase();

    if (storageMode === 'local') {
        if (typeof window.createLocalDatabaseClient !== 'function') throw new Error('Не загружено локальное хранилище.');
        authClient = window.createLocalDatabaseClient();
        const health = await authClient.ping();
        windowDb = authClient;
        updateConnectionStatus('online', `GitHub Pages · ${health.driver || 'браузер'}`);
        return;
    }

    if (typeof window.createPhpDatabaseClient !== 'function') throw new Error('Не загружен клиент API.');
    authClient = window.createPhpDatabaseClient(config.apiUrl || 'api.php');
    if (storageMode === 'php') {
        const health = await authClient.ping();
        windowDb = authClient;
        updateConnectionStatus('online', `Сервер · ${health.driver || 'storage'}`);
        return;
    }
    if (typeof firebase === 'undefined') throw new Error('Библиотека Firebase не загрузилась.');
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    windowDb = firebase.firestore();
    await authClient.ping();
    updateConnectionStatus('online', 'Подключено');
}

async function startApplication() {
    if (isInitialized) return;
    isInitialized = true;
    applySeasonTheme();
    if (customKeyboard) customKeyboard.hidden = true;
    replaceUiEmojiIcons(document.body);
    setMainInputVisible(false);
    updateConnectionStatus('connecting', 'Подключение…');
    try {
        await initializeDataStore();
        try {
            const session = await authClient.getSession();
            if (session.authenticated && session.profile) await activateSession(session.profile);
            else showLoginScreen();
        } catch (error) {
            if (error?.status === 401) showLoginScreen();
            else throw error;
        }
    } catch (error) {
        console.error('Ошибка запуска:', error);
        updateConnectionStatus('offline', 'Нет связи');
        const container = document.getElementById('chat-container');
        if (container) container.innerHTML = `<section class="panel-card fatal-card"><i class="fa-solid fa-plug-circle-xmark"></i><h2>Не удалось подключиться</h2><p>${escapeHtml(error?.message || 'Ошибка сервера')}</p><button class="hw-btn primary" onclick="location.reload()"><i class="fa-solid fa-rotate-right"></i> Повторить</button></section>`;
    }
}

document.addEventListener('DOMContentLoaded', startApplication);

function mainDraftKey() { return currentUser ? `akasha_main_draft_${currentUser.name}` : ''; }
function clearMainDraft() { const key = mainDraftKey(); if (key && LOCAL_STORAGE_AVAILABLE) localStorage.removeItem(key); }
function loadMainDraft() {
    if (!customTextarea || !LOCAL_STORAGE_AVAILABLE) return;
    const key = mainDraftKey();
    customTextarea.value = key ? (localStorage.getItem(key) || '') : '';
    updateMainInputState();
}
function updateMainInputState() {
    if (!customTextarea) return;
    const counter = document.getElementById('main-input-counter');
    const send = document.getElementById('main-send-button');
    if (counter) counter.textContent = `${customTextarea.value.length} / ${customTextarea.maxLength}`;
    if (send) send.disabled = !customTextarea.value.trim() || customTextarea.disabled;
    customTextarea.style.height = 'auto';
    customTextarea.style.height = `${Math.min(customTextarea.scrollHeight, 220)}px`;
}
customTextarea?.addEventListener('input', () => {
    updateMainInputState();
    const key = mainDraftKey();
    if (key && LOCAL_STORAGE_AVAILABLE) localStorage.setItem(key, customTextarea.value);
});
customTextarea?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        handleSend();
    }
});
document.getElementById('master-chat-input')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        window.sendMasterChatMessage();
    }
});
window.addEventListener('online', () => updateConnectionStatus('online', 'Подключено'));
window.addEventListener('offline', () => updateConnectionStatus('offline', 'Нет сети'));
window.setInterval(async () => {
    if (!authClient || !currentUser || document.hidden) return;
    try { await authClient.getSession(); updateConnectionStatus('online', 'Подключено'); }
    catch (error) {
        if (error?.status === 401) { showToast('Сессия завершена. Войдите снова.', 'warning'); showLoginScreen('Сессия завершена.'); }
        else updateConnectionStatus('offline', 'Нет связи');
    }
}, Math.max(2, Number(window.AKASHA_CONFIG?.sessionRefreshMinutes || 10)) * 60 * 1000);
// Версия 2.5 не использует офлайн-кэш: старый Service Worker был причиной
// несовпадения новых скриптов и старых стилей после обновления сайта.
async function removeLegacyServiceWorkers() {
    try {
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map((registration) => registration.unregister()));
        }
        if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.filter((key) => key.startsWith('akasha-')).map((key) => caches.delete(key)));
        }
    } catch (error) {
        console.warn('Очистка старого кэша:', error);
    }
}
window.addEventListener('load', removeLegacyServiceWorkers, { once: true });

function updateViewportMetrics() {
    const viewport = window.visualViewport;
    const height = viewport ? viewport.height : window.innerHeight;
    document.documentElement.style.setProperty('--visual-viewport-height', `${height}px`);
    document.documentElement.style.setProperty('--visual-viewport-offset-top', `${viewport?.offsetTop || 0}px`);
}
updateViewportMetrics();
window.addEventListener('resize', updateViewportMetrics, { passive: true });
window.visualViewport?.addEventListener('resize', updateViewportMetrics, { passive: true });
window.visualViewport?.addEventListener('scroll', updateViewportMetrics, { passive: true });

// ===== ЭКСПОРТ ВСЕХ ФУНКЦИЙ =====
window.showLessonContent = showLessonContent;
window.startAddLesson = startAddLesson;
window.editLesson = editLesson;
window.confirmDeleteLesson = confirmDeleteLesson;
window.startAddComment = startAddComment;
window.editComment = editComment;
window.deleteComment = deleteComment;
window.showHomeworkBoard = showHomeworkBoard;
window.startCreateAssignment = startCreateAssignment;
window.submitHomework = submitHomework;
window.deleteMySubmission = deleteMySubmission;
window.openMasterChat = openMasterChat;
window.closeMasterChat = closeMasterChat;
window.openChatWithStudent = openChatWithStudent;
window.reviewSubmissions = reviewSubmissions;
window.gradeSubmission = gradeSubmission;
window.addFeedback = addFeedback;
window.sendMasterChatMessage = sendMasterChatMessage;
window.showMembersList = showMembersListV2;
window.showProgressTable = showProgressTableV2;
window.showAdjustmentPanel = showAdjustmentPanelV2;
window.openAdjustmentForm = openAdjustmentFormV2;
window.showDetailedProgress = showDetailedProgressV2;
window.showAdminPanel = showAdminPanelV2;
window.blockUser = blockUserV2;
window.unblockUser = unblockUserV2;
window.createUserAccount = createUserV2;
window.editUserProfile = editUserProfileV2;
window.resetUserPassword = resetUserPasswordV2;
window.markLessonRead = markLessonRead;
window.showCouncilOfMasters = showCouncilOfMastersV2;
window.showCustomAlert = showCustomAlert;
window.showCustomConfirm = showCustomConfirm;
window.showCustomPrompt = showCustomPrompt;
window.handleLogout = handleLogout;
window.handleSend = handleSend;
window.showLoginScreen = showLoginScreen;
window.decodeUserKey = decodeUserKey;

// ===== УЛУЧШЕНИЯ ИНТЕРФЕЙСА 2.4 =====
const AKASHA_UI_PREFS_KEY = 'akasha-ui-prefs-v1';
function getUiPrefs() {
    try { return {...{scale:'1', compact:false, contrast:false, reduce:false}, ...JSON.parse(localStorage.getItem(AKASHA_UI_PREFS_KEY) || '{}')}; }
    catch (_) { return {scale:'1', compact:false, contrast:false, reduce:false}; }
}
function applyUiPrefs(prefs = getUiPrefs()) {
    document.documentElement.style.setProperty('--ui-scale', String(prefs.scale || '1'));
    document.body.classList.toggle('compact-ui', Boolean(prefs.compact));
    document.body.classList.toggle('high-contrast-ui', Boolean(prefs.contrast));
    document.body.classList.toggle('reduce-effects', Boolean(prefs.reduce));
}
function saveUiPrefs(prefs) { localStorage.setItem(AKASHA_UI_PREFS_KEY, JSON.stringify(prefs)); applyUiPrefs(prefs); }

window.openDisplaySettings = function() {
    const prefs = getUiPrefs();
    const body = `
      <div class="settings-list">
        <div class="settings-row"><label for="ui-scale-select">Размер текста<small>Меняет интерфейс без масштабирования браузера</small></label><select id="ui-scale-select"><option value="0.92">Компактный</option><option value="1">Обычный</option><option value="1.1">Крупный</option><option value="1.2">Очень крупный</option></select></div>
        <div class="settings-row"><label>Плотный режим<small>Больше информации помещается на экране</small></label><label class="switch"><input id="ui-compact" type="checkbox"><span></span></label></div>
        <div class="settings-row"><label>Высокая контрастность<small>Ярче текст и границы</small></label><label class="switch"><input id="ui-contrast" type="checkbox"><span></span></label></div>
        <div class="settings-row"><label>Уменьшить эффекты<small>Отключает лишние анимации</small></label><label class="switch"><input id="ui-reduce" type="checkbox"><span></span></label></div>
      </div>`;
    showCustomModal('Настройки отображения', body, [
      { text:'Сбросить', class:'hw-btn secondary', action:()=>{ saveUiPrefs({scale:'1',compact:false,contrast:false,reduce:false}); showToast('Настройки сброшены.','success'); } },
      { text:'Сохранить', class:'hw-btn primary', action:()=>{ saveUiPrefs({scale:document.getElementById('ui-scale-select').value,compact:document.getElementById('ui-compact').checked,contrast:document.getElementById('ui-contrast').checked,reduce:document.getElementById('ui-reduce').checked}); showToast('Отображение обновлено.','success'); } }
    ]);
    requestAnimationFrame(()=>{
      const scale=document.getElementById('ui-scale-select'); if(scale) scale.value=String(prefs.scale||'1');
      const compact=document.getElementById('ui-compact'); if(compact) compact.checked=Boolean(prefs.compact);
      const contrast=document.getElementById('ui-contrast'); if(contrast) contrast.checked=Boolean(prefs.contrast);
      const reduce=document.getElementById('ui-reduce'); if(reduce) reduce.checked=Boolean(prefs.reduce);
    });
};

window.openQuickMenu = function() {
    const admin = isAdmin() ? `<button class="quick-menu-item" onclick="closeCustomModal(); window.showAdminPanel()"><i class="fa-solid fa-shield-halved"></i><span>Админ-панель</span></button>` : '';
    showCustomModal('Быстрый переход', `<div class="quick-menu-grid">
      <button class="quick-menu-item" onclick="closeCustomModal(); window.openMasterChat()"><i class="fa-solid fa-comments"></i><span>Сообщения</span></button>
      <button class="quick-menu-item" onclick="closeCustomModal(); window.showCouncilOfMasters()"><i class="fa-solid fa-landmark"></i><span>Совет Мастеров</span></button>
      <button class="quick-menu-item" onclick="closeCustomModal(); window.showMembersList()"><i class="fa-solid fa-users"></i><span>Члены Ордена</span></button>
      <button class="quick-menu-item" onclick="closeCustomModal(); openDisplaySettings()"><i class="fa-solid fa-sliders"></i><span>Отображение</span></button>${admin}
    </div>`, [{text:'Закрыть', class:'hw-btn secondary'}]);
};

function inferCurrentRoute() {
    const title = (document.querySelector('#chat-container h2')?.textContent || '').toLowerCase();
    if (title.includes('домашн')) return 'homework';
    if (title.includes('оглавлен') || title.includes('знани')) return 'lessons';
    if (title.includes('успеваем')) return 'progress';
    if (title.includes('личный кабинет')) return 'home';
    if (document.querySelector('.dashboard-card')) return 'home';
    return 'more';
}
function updateMobileUi() {
    const loggedIn = Boolean(currentUser);
    const nav = document.getElementById('mobile-nav');
    const settings = document.getElementById('display-settings-button');
    if (nav) nav.hidden = !loggedIn;
    if (settings) settings.hidden = !loggedIn;
    document.body.classList.toggle('has-mobile-nav', loggedIn);
    const route = inferCurrentRoute();
    nav?.querySelectorAll('button[data-route]').forEach(btn=>btn.classList.toggle('is-active', btn.dataset.route===route));
}

function installCardFilter() {
    const container = document.getElementById('chat-container');
    if (!container || container.querySelector('.filter-toolbar')) return;
    const cards = [...container.querySelectorAll('.member-card.modern, .admin-user-card, .progress-mobile-card')];
    if (cards.length < 4) return;
    const heading = container.querySelector('.section-heading, .subsection-row');
    if (!heading) return;

    const toolbar = document.createElement('div');
    toolbar.className = 'filter-toolbar';
    toolbar.innerHTML = `<div class="filter-search-wrap"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><input class="filter-search" type="search" placeholder="Найти по имени, рангу или наставнику…" autocomplete="off" enterkeyhint="search" aria-label="Поиск по списку"></div><span class="filter-count" aria-live="polite">Показано: ${cards.length}</span>`;
    heading.insertAdjacentElement('afterend', toolbar);

    const input = toolbar.querySelector('input');
    const count = toolbar.querySelector('.filter-count');
    const groups = [...container.querySelectorAll('.member-group')];
    const applyFilter = () => {
        const q = input.value.trim().toLocaleLowerCase('ru');
        let visible = 0;
        cards.forEach((card) => {
            const show = !q || card.textContent.toLocaleLowerCase('ru').includes(q);
            card.hidden = !show;
            if (show) visible += 1;
        });
        groups.forEach((group) => {
            const groupCards = [...group.querySelectorAll('.member-card.modern')];
            group.hidden = groupCards.length > 0 && groupCards.every((card) => card.hidden);
        });
        count.textContent = `Показано: ${visible}`;
        toolbar.classList.toggle('is-empty', visible === 0);
    };
    input.addEventListener('input', applyFilter);
    input.addEventListener('search', applyFilter);
}

function enhanceRenderedView() { updateMobileUi(); installCardFilter(); }
const akashaViewObserver = new MutationObserver(()=>requestAnimationFrame(enhanceRenderedView));
document.addEventListener('DOMContentLoaded', ()=>{
    document.documentElement.dataset.akashaUi = '2.5';
    document.body.classList.add('ui-ready');
    applyUiPrefs();
    const container=document.getElementById('chat-container'); if(container) akashaViewObserver.observe(container,{childList:true,subtree:true});
    window.addEventListener('scroll', ()=>{ const b=document.getElementById('scroll-top-button'); if(b && currentUser) b.hidden=window.scrollY<650; }, {passive:true});
    setTimeout(enhanceRenderedView, 100);
});
