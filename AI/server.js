const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database(path.join(__dirname, 'blog.db'));

const run = (sql, params = []) => new Promise((res, rej) => db.run(sql, params, function(err) { err ? rej(err) : res(this); }));
const queryAll = (sql, params = []) => new Promise((res, rej) => db.all(sql, params, (err, rows) => err ? rej(err) : res(rows)));
const queryOne = (sql, params = []) => new Promise((res, rej) => db.get(sql, params, (err, row) => err ? rej(err) : res(row || null)));

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password TEXT NOT NULL, display_name TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  db.run(`CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`);
  db.run(`CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL, user_id INTEGER NOT NULL, content TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`);
  db.run(`CREATE TABLE IF NOT EXISTS friends (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, friend_id INTEGER NOT NULL, status TEXT DEFAULT 'pending', created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE)`);
  db.run(`CREATE TABLE IF NOT EXISTS likes (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL, user_id INTEGER NOT NULL, type TEXT DEFAULT 'like', created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, UNIQUE(post_id, user_id, type))`);
  db.run(`CREATE TABLE IF NOT EXISTS shares (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL, user_id INTEGER NOT NULL, platform TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`);
});

let sessions = {};

app.use((req, res, next) => {
  const token = req.headers.authorization;
  if (token && sessions[token]) req.user = sessions[token];
  next();
});

app.post('/register', async (req, res) => {
  try {
    const { username, password, display_name = '' } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    const existing = await queryOne('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) return res.status(400).json({ error: 'username already exists' });
    const result = await run('INSERT INTO users (username, password, display_name) VALUES (?, ?, ?)', [username, hashPassword(password), display_name]);
    res.status(201).json({ id: result.lastID, username, display_name });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    const user = await queryOne('SELECT * FROM users WHERE username = ? AND password = ?', [username, hashPassword(password)]);
    if (!user) return res.status(401).json({ error: 'invalid credentials' });
    const token = crypto.randomBytes(16).toString('hex');
    sessions[token] = { id: user.id, username: user.username, display_name: user.display_name };
    res.json({ token, user: { id: user.id, username: user.username, display_name: user.display_name } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/logout', (req, res) => {
  const token = req.headers.authorization;
  if (token && sessions[token]) delete sessions[token];
  res.json({ ok: true });
});

app.get('/users', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'login required' });
  try {
    const users = await queryAll('SELECT id, username, display_name, created_at FROM users WHERE id != ?', [req.user.id]);
    res.json(users);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/friends', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'login required' });
  try {
    const friends = await queryAll(`
      SELECT u.id, u.username, u.display_name, f.status, f.id as friend_id
      FROM friends f
      JOIN users u ON (f.friend_id = u.id AND f.user_id = ?) OR (f.user_id = u.id AND f.friend_id = ?)
      WHERE f.status IN ('accepted', 'pending') AND f.user_id = ?
    `, [req.user.id, req.user.id, req.user.id]);
    res.json(friends);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/friends', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'login required' });
  try {
    const { friend_id } = req.body;
    if (!friend_id) return res.status(400).json({ error: 'friend_id required' });
    if (friend_id === req.user.id) return res.status(400).json({ error: 'cannot friend yourself' });
    const existing = await queryOne(`SELECT id FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`, [req.user.id, friend_id, friend_id, req.user.id]);
    if (existing) return res.status(400).json({ error: 'friend request exists' });
    await run('INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, ?)', [req.user.id, friend_id, 'pending']);
    res.status(201).json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/friends/:id', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'login required' });
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) return res.status(400).json({ error: 'invalid status' });
    const friend = await queryOne('SELECT * FROM friends WHERE id = ? AND friend_id = ?', [req.params.id, req.user.id]);
    if (!friend) return res.status(404).json({ error: 'friend request not found' });
    if (status === 'accepted') await run('UPDATE friends SET status = ? WHERE id = ?', [status, req.params.id]);
    else await run('DELETE FROM friends WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/friends/:id', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'login required' });
  try {
    const friend = await queryOne('SELECT * FROM friends WHERE id = ? AND (user_id = ? OR friend_id = ?)', [req.params.id, req.user.id, req.user.id]);
    if (!friend) return res.status(404).json({ error: 'friend not found' });
    await run('DELETE FROM friends WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/posts/:id/likes', async (req, res) => {
  try {
    const likes = await queryAll('SELECT user_id, type FROM likes WHERE post_id = ?', [req.params.id]);
    const likesCount = await queryOne('SELECT COUNT(*) as count FROM likes WHERE post_id = ? AND type = ?', [req.params.id, 'like']);
    const dislikesCount = await queryOne('SELECT COUNT(*) as count FROM likes WHERE post_id = ? AND type = ?', [req.params.id, 'dislike']);
    res.json({ likes, likes_count: likesCount?.count || 0, dislikes_count: dislikesCount?.count || 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/posts/:id/likes', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'login required' });
  try {
    const post = await queryOne('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const { type = 'like' } = req.body;
    if (!['like', 'dislike'].includes(type)) return res.status(400).json({ error: 'invalid type' });
    const existing = await queryOne('SELECT id FROM likes WHERE post_id = ? AND user_id = ? AND type = ?', [req.params.id, req.user.id, type]);
    if (existing) return res.status(400).json({ error: 'already ' + type + 'd' });
    await run('INSERT INTO likes (post_id, user_id, type) VALUES (?, ?, ?)', [req.params.id, req.user.id, type]);
    res.status(201).json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/posts/:id/likes', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'login required' });
  try {
    await run('DELETE FROM likes WHERE post_id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.status(204).send();
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/posts/:id/shares', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'login required' });
  try {
    const post = await queryOne('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const { platform } = req.body;
    if (!platform) return res.status(400).json({ error: 'platform required' });
    await run('INSERT INTO shares (post_id, user_id, platform) VALUES (?, ?, ?)', [req.params.id, req.user.id, platform]);
    res.status(201).json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/posts/:id/shares', async (req, res) => {
  try {
    const shares = await queryAll('SELECT * FROM shares WHERE post_id = ?', [req.params.id]);
    res.json(shares);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/blog', async (req, res) => {
  try {
    const userId = req.user?.id;
    let likedClause = userId ? `, (SELECT type FROM likes l WHERE l.post_id = p.id AND l.user_id = ${userId}) as user_like` : '';
    const posts = await queryAll(`
      SELECT p.*, u.display_name as author_name,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND type = 'like') as likes_count,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND type = 'dislike') as dislikes_count,
      (SELECT COUNT(*) FROM shares WHERE post_id = p.id) as shares_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
      ${likedClause}
      FROM posts p LEFT JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC
    `);
    res.json(posts);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/blog/:id', async (req, res) => {
  try {
    const post = await queryOne(`
      SELECT p.*, u.display_name as author_name,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND type = 'like') as likes_count,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND type = 'dislike') as dislikes_count,
      (SELECT COUNT(*) FROM shares WHERE post_id = p.id) as shares_count
      FROM posts p LEFT JOIN users u ON p.user_id = u.id WHERE p.id = ?
    `, [req.params.id]);
    if (!post) return res.status(404).json({ error: 'Not found' });
    const comments = await queryAll(`SELECT c.*, u.display_name as author_name FROM comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.post_id = ? ORDER BY c.created_at DESC`, [req.params.id]);
    const likes = await queryAll('SELECT user_id, type FROM likes WHERE post_id = ?', [req.params.id]);
    const shares = await queryAll('SELECT * FROM shares WHERE post_id = ?', [req.params.id]);
    res.json({ ...post, comments, likes, shares });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/blog', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'login required' });
  try {
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'title and content required' });
    const result = await run('INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)', [req.user.id, title, content]);
    res.status(201).json({ id: result.lastID, title, content });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/blog/:id', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'login required' });
  try {
    const { title, content } = req.body;
    const post = await queryOne('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    if (!post) return res.status(404).json({ error: 'Not found' });
    if (post.user_id !== req.user.id) return res.status(403).json({ error: 'not authorized' });
    await run('UPDATE posts SET title = ?, content = ? WHERE id = ?', [title || post.title, content || post.content, req.params.id]);
    res.json({ id: parseInt(req.params.id), title: title || post.title, content: content || post.content });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/blog/:id', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'login required' });
  try {
    const post = await queryOne('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    if (!post) return res.status(404).json({ error: 'Not found' });
    if (post.user_id !== req.user.id) return res.status(403).json({ error: 'not authorized' });
    await run('DELETE FROM posts WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/blog/:id/comments', async (req, res) => {
  try {
    const post = await queryOne('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const comments = await queryAll(`SELECT c.*, u.display_name as author_name FROM comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.post_id = ? ORDER BY c.created_at DESC`, [req.params.id]);
    res.json(comments);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/blog/:id/comments', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'login required' });
  try {
    const post = await queryOne('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'content required' });
    const result = await run('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)', [req.params.id, req.user.id, content]);
    res.status(201).json({ id: result.lastID, post_id: parseInt(req.params.id), content });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/blog/:id/comments/:commentId', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'login required' });
  try {
    const comment = await queryOne('SELECT * FROM comments WHERE id = ? AND post_id = ?', [req.params.commentId, req.params.id]);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.user_id !== req.user.id) return res.status(403).json({ error: 'not authorized' });
    await run('DELETE FROM comments WHERE id = ?', [req.params.commentId]);
    res.status(204).send();
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Blog API: http://localhost:${PORT}/blog`));
