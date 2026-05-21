const PREFIX = window.location.pathname.replace(/\/notes.*$/, '') || '/s111410509';
const API_URL = PREFIX + '/api/notes';

function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
}

function getUser() {
    try { return JSON.parse(localStorage.getItem('user')); }
    catch { return null; }
}

function checkLogin() {
    const user = getUser();
    if (!user) {
        window.location.href = PREFIX + '/login.html';
        return null;
    }
    return user;
}

async function loadNotes() {
    const user = getUser();
    const response = await fetch(API_URL);
    const notes = await response.json();
    const notesList = document.getElementById('notesList');
    notesList.innerHTML = await Promise.all(notes.map(async note => {
        const comments = await fetchComments(note.id);
        return `
            <div class="note-card">
                <p class="note-author">${note.username || '匿名'}</p>
                <p>${note.content}</p>
                <span>${note.time}</span>
                <div class="note-actions">
                    <button class="action-btn ${user ? '' : 'disabled'}" onclick="${user ? 'likeNote(' + note.id + ')' : 'alert(\'請先登入\')'}">
                        <span class="icon">👍</span> ${note.likes || 0}
                    </button>
                    <button class="action-btn" onclick="showComments(${note.id})">
                        <span class="icon">💬</span> ${comments.length}
                    </button>
                    <button class="action-btn report" onclick="${user ? 'reportNote(' + note.id + ')' : 'alert(\'請先登入\')'}">
                        <span class="icon">🚩</span> 檢舉
                    </button>
                </div>
                <div class="comments-section" id="comments-${note.id}" style="display:none;">
                    <div class="comments-list">
                        ${comments.map(c => `<div class="comment"><p><strong>${escapeHtml(c.username || '匿名')}:</strong> ${escapeHtml(c.content)}</p></div>`).join('')}
                    </div>
                    ${user ? `
                    <div class="comment-input">
                        <input type="text" id="comment-input-${note.id}" placeholder="寫下留言...">
                        <button onclick="addComment(${note.id})">發送</button>
                    </div>
                    ` : '<p class="login-hint">登入後可發表留言</p>'}
                </div>
            </div>
        `;
    })).then(html => html.join(''));
}

async function fetchComments(noteId) {
    const response = await fetch(PREFIX + '/api/notes/' + noteId + '/comments');
    return response.json();
}

async function addNote() {
    const user = checkLogin();
    if (!user) return;

    const input = document.getElementById('noteInput');
    const content = input.value.trim();
    if (!content) return;

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, content })
    });

    if (response.ok) {
        input.value = '';
        loadNotes();
    }
}

async function likeNote(id) {
    const user = checkLogin();
    if (!user) return;

    await fetch(PREFIX + '/api/notes/' + id + '/like', { method: 'POST' });
    loadNotes();
}

async function reportNote(id) {
    const user = checkLogin();
    if (!user) return;

    if (confirm('確定要檢舉這則留言嗎？')) {
        await fetch(PREFIX + '/api/notes/' + id + '/report', { method: 'POST' });
        alert('已檢舉');
        loadNotes();
    }
}

function showComments(id) {
    const section = document.getElementById(`comments-${id}`);
    section.style.display = section.style.display === 'none' ? 'block' : 'none';
}

async function addComment(noteId) {
    const user = checkLogin();
    if (!user) return;

    const input = document.getElementById(`comment-input-${noteId}`);
    const content = input.value.trim();
    if (!content) return;

    await fetch(PREFIX + '/api/notes/' + noteId + '/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, content })
    });

    input.value = '';
    loadNotes();
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = PREFIX + '/login.html';
}

const user = getUser();
if (user) {
    const section = document.getElementById('userSection');
    if (section) {
        section.innerHTML = `<span>${user.username}</span><button onclick="logout()" style="padding:8px 15px;letter-spacing:2px;">登出</button>`;
    }
}

loadNotes();