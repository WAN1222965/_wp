const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const os = require('os');
const Parser = require('rss-parser');
const { marked } = require('marked');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');

// Multer config — local file storage (swap to S3 by changing storage)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'public', 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  }
});

marked.setOptions({
  breaks: true,
  gfm: true
});

function renderMarkdown(md) {
  if (!md) return '';
  return marked.parse(md);
}

const app = express();
const PORT = parseInt(process.env.PORT) || 3000;
const BASE = process.env.BASE || '/s111410509';
const dbPath = path.join(__dirname, 'blog.db');
const publicDir = path.join(__dirname, 'public');
const db = new sqlite3.Database(dbPath);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(BASE, express.static(publicDir, { index: false }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!require('fs').existsSync(uploadsDir)) {
  require('fs').mkdirSync(uploadsDir, { recursive: true });
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.locals.baseUrl = BASE;
app.locals.gaId = process.env.GA_ID || '';

const router = express.Router();

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    nickname TEXT NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL DEFAULT 0,
    title TEXT DEFAULT '',
    content TEXT NOT NULL,
    summary TEXT DEFAULT '',
    likes INTEGER DEFAULT 0,
    reports INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS post_tags (
    post_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (post_id, tag_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    score INTEGER NOT NULL,
    date TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS news_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    news_title TEXT NOT NULL,
    news_link TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS news_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    news_title TEXT NOT NULL,
    news_link TEXT NOT NULL,
    username TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS news_commentary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    original_title TEXT NOT NULL,
    original_link TEXT NOT NULL,
    source_name TEXT NOT NULL,
    rewritten_headline TEXT NOT NULL,
    event_summary TEXT NOT NULL,
    analysis_content TEXT NOT NULL,
    embed_url TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run("ALTER TABLE posts ADD COLUMN title TEXT DEFAULT ''", err => err && null);
  db.run("ALTER TABLE posts ADD COLUMN summary TEXT DEFAULT ''", err => err && null);
  db.run("ALTER TABLE posts ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0", err => err && null);
  db.run("ALTER TABLE posts ADD COLUMN likes INTEGER DEFAULT 0", err => err && null);
  db.run("ALTER TABLE posts ADD COLUMN reports INTEGER DEFAULT 0", err => err && null);
  db.run("ALTER TABLE posts ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP", err => err && null);
  db.run("ALTER TABLE posts ADD COLUMN meta_description TEXT DEFAULT ''", err => err && null);

  db.run(`CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// ===== Image Upload API =====

router.post('/api/upload', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: '檔案大小超過 5MB 限制' });
      return res.status(400).json({ error: '上傳失敗：' + err.message });
    }
    if (!req.file) return res.status(400).json({ error: '未選擇檔案或不支援的格式' });
    res.json({ url: `${BASE}/uploads/${req.file.filename}`, filename: req.file.filename });
  });
});

router.post('/api/upload/url', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });
  res.json({ url });
});

// ===== BLOG CRUD (EJS) =====

router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  const tagFilter = req.query.tag || '';
  let countSql = 'SELECT COUNT(*) as total FROM posts';
  let listSql = 'SELECT * FROM posts ORDER BY created_at DESC LIMIT ? OFFSET ?';
  let countParams = [];
  let listParams = [limit, offset];
  if (tagFilter) {
    countSql = `SELECT COUNT(*) as total FROM posts p JOIN post_tags pt ON p.id = pt.post_id JOIN tags t ON pt.tag_id = t.id WHERE t.name = ?`;
    listSql = `SELECT p.* FROM posts p JOIN post_tags pt ON p.id = pt.post_id JOIN tags t ON pt.tag_id = t.id WHERE t.name = ? ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    countParams = [tagFilter];
    listParams = [tagFilter, limit, offset];
  }
  db.all(countSql, countParams, (err, countResult) => {
    const total = countResult ? countResult[0].total : 0;
    db.all(listSql, listParams, (err, posts) => {
      if (err) return res.status(500).send(err.message);
      posts.forEach(p => { p.html = renderMarkdown(p.content || ''); });
      const tagMap = {};
      if (posts.length > 0) {
        const ids = posts.map(p => p.id);
        const placeholders = ids.map(() => '?').join(',');
        db.all(`SELECT pt.post_id, t.name FROM post_tags pt JOIN tags t ON pt.tag_id = t.id WHERE pt.post_id IN (${placeholders})`, ids, (err, tags) => {
          if (tags) tags.forEach(t => { (tagMap[t.post_id] = tagMap[t.post_id] || []).push(t.name); });
          posts.forEach(p => p.tags = tagMap[p.id] || []);
          res.render('index', { posts, tags: [], currentPage: page, totalPages: Math.ceil(total / limit), tagFilter });
        });
      } else {
        res.render('index', { posts, tags: [], currentPage: page, totalPages: Math.ceil(total / limit), tagFilter });
      }
    });
  });
});

router.get('/post/new', (req, res) => {
  res.render('new');
});

router.post('/posts', (req, res) => {
  const { title, content, summary, tags: tagsStr, meta_description } = req.body;
  if (!title || !content) return res.status(400).send('Title and content required');
  const authUser = req.body.user_id || (req.headers['x-user-id'] ? parseInt(req.headers['x-user-id']) : 0);
  const userId = authUser || 0;
  const stmt = db.prepare('INSERT INTO posts (title, content, summary, meta_description, user_id) VALUES (?, ?, ?, ?, ?)');
  stmt.run(title, content, summary || '', meta_description || '', userId, function(err) {
    if (err) return res.status(500).send(err.message);
    const postId = this.lastID;
    if (tagsStr) {
      const tagNames = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
      tagNames.forEach(name => {
        db.run('INSERT OR IGNORE INTO tags (name) VALUES (?)', [name]);
        db.run('INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, (SELECT id FROM tags WHERE name = ?))', [postId, name]);
      });
    }
    res.redirect(`${BASE}/post/${postId}`);
  });
  stmt.finalize();
});

router.get('/post/:id', (req, res) => {
  db.get('SELECT * FROM posts WHERE id = ?', [req.params.id], (err, post) => {
    if (err || !post) return res.status(404).send('Post not found');
    post.content = renderMarkdown(post.content);
    db.all('SELECT t.name FROM post_tags pt JOIN tags t ON pt.tag_id = t.id WHERE pt.post_id = ?', [post.id], (err, tags) => {
      post.tags = tags ? tags.map(t => t.name) : [];
      // Related posts (same tags)
      if (post.tags.length > 0) {
        const placeholders = post.tags.map(() => '?').join(',');
        db.all(`SELECT DISTINCT p.id, p.title FROM posts p JOIN post_tags pt ON p.id = pt.post_id JOIN tags t ON pt.tag_id = t.id WHERE t.name IN (${placeholders}) AND p.id != ? LIMIT 5`, [...post.tags, post.id], (err, related) => {
          res.render('post', { post, relatedPosts: related || [] });
        });
      } else {
        res.render('post', { post, relatedPosts: [] });
      }
    });
  });
});

router.get('/post/:id/edit', (req, res) => {
  db.get('SELECT * FROM posts WHERE id = ?', [req.params.id], (err, post) => {
    if (err || !post) return res.status(404).send('Post not found');
    db.all('SELECT t.name FROM post_tags pt JOIN tags t ON pt.tag_id = t.id WHERE pt.post_id = ?', [post.id], (err, tags) => {
      post.tags = tags ? tags.map(t => t.name) : [];
      res.render('edit', { post });
    });
  });
});

router.post('/post/:id/update', (req, res) => {
  const { title, content, summary, tags: tagsStr, meta_description } = req.body;
  db.run("UPDATE posts SET title = ?, content = ?, summary = ?, meta_description = ?, updated_at = datetime('now') WHERE id = ?", [title, content, summary || '', meta_description || '', req.params.id], function(err) {
    if (err) return res.status(500).send(err.message);
    db.run('DELETE FROM post_tags WHERE post_id = ?', [req.params.id]);
    if (tagsStr) {
      const tagNames = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
      tagNames.forEach(name => {
        db.run('INSERT OR IGNORE INTO tags (name) VALUES (?)', [name]);
        db.run('INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, (SELECT id FROM tags WHERE name = ?))', [req.params.id, name]);
      });
    }
    res.redirect(`${BASE}/post/${req.params.id}`);
  });
});

router.post('/post/:id/delete', (req, res) => {
  db.run('DELETE FROM post_tags WHERE post_id = ?', [req.params.id]);
  db.run('DELETE FROM posts WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).send(err.message);
    res.redirect(`${BASE}/`);
  });
});

// ===== Search Index (client-side search engine) =====

function cleanHtml(html) {
  return html ? html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim() : '';
}

router.get('/api/search-index', (req, res) => {
  db.all(`SELECT p.id, p.title, p.content, p.created_at,
    COALESCE(GROUP_CONCAT(t.name), '') as tags
    FROM posts p LEFT JOIN post_tags pt ON p.id = pt.post_id
    LEFT JOIN tags t ON pt.tag_id = t.id
    GROUP BY p.id ORDER BY p.created_at DESC`, [], (err, posts) => {
    if (err) return res.status(500).json({ error: err.message });
    const index = posts.map(p => ({
      id: p.id,
      title: p.title || '',
      excerpt: cleanHtml(renderMarkdown(p.content)).substring(0, 200),
      tags: p.tags ? p.tags.split(',').filter(Boolean) : [],
      url: BASE + '/post/' + p.id,
      created_at: p.created_at
    }));
    res.json(index);
  });
});

router.get('/api/search', (req, res) => {
  const q = req.query.q;
  if (!q) return res.json([]);
  db.all(`SELECT id, title, content, created_at FROM posts WHERE title LIKE ? OR content LIKE ? ORDER BY created_at DESC LIMIT 20`, [`%${q}%`, `%${q}%`], (err, posts) => {
    if (err) return res.status(500).json({ error: err.message });
    posts.forEach(p => {
      p.excerpt = cleanHtml(renderMarkdown(p.content || '')).substring(0, 200);
    });
    res.json(posts);
  });
});

// ===== API: Tags =====

router.get('/api/tags', (req, res) => {
  db.all(`SELECT t.name, COUNT(pt.post_id) as count FROM tags t JOIN post_tags pt ON t.id = pt.tag_id GROUP BY t.id ORDER BY count DESC`, [], (err, tags) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(tags);
  });
});

router.get('/api/tags/:name/posts', (req, res) => {
  db.all(`SELECT p.id, p.title, p.created_at FROM posts p JOIN post_tags pt ON p.id = pt.post_id JOIN tags t ON pt.tag_id = t.id WHERE t.name = ? ORDER BY p.created_at DESC`, [req.params.name], (err, posts) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(posts);
  });
});

// ===== API: Related Posts =====

router.get('/api/posts/:id/related', (req, res) => {
  db.get('SELECT id FROM posts WHERE id = ?', [req.params.id], (err, post) => {
    if (!post) return res.status(404).json({ error: 'Not found' });
    db.all(`SELECT t.name FROM post_tags pt JOIN tags t ON pt.tag_id = t.id WHERE pt.post_id = ?`, [post.id], (err, tags) => {
      const tagNames = tags.map(t => t.name);
      if (tagNames.length === 0) return res.json([]);
      const placeholders = tagNames.map(() => '?').join(',');
      db.all(`SELECT DISTINCT p.id, p.title, p.content FROM posts p JOIN post_tags pt ON p.id = pt.post_id JOIN tags t ON pt.tag_id = t.id WHERE t.name IN (${placeholders}) AND p.id != ? LIMIT 5`, [...tagNames, post.id], (err, related) => {
        if (related) related.forEach(r => r.excerpt = cleanHtml(renderMarkdown(r.content || '')).substring(0, 100));
        res.json(related || []);
      });
    });
  });
});

// ===== RSS Feed =====

router.get('/rss.xml', (req, res) => {
  const host = req.headers.host || `localhost:${PORT}`;
  const protocol = req.protocol || 'http';
  const baseUrl = `${protocol}://${host}${BASE}`;
  db.all('SELECT id, title, content, created_at FROM posts ORDER BY created_at DESC LIMIT 20', [], (err, posts) => {
    if (err) return res.status(500).send(err.message);
    const buildDate = new Date().toUTCString();
    let items = posts.map(p => {
      const rendered = renderMarkdown(p.content || '');
      const plain = cleanHtml(rendered).substring(0, 500);
      return `
    <item>
      <title><![CDATA[${p.title || 'Untitled'}]]></title>
      <link>${baseUrl}/post/${p.id}</link>
      <description><![CDATA[${plain}]]></description>
      <pubDate>${new Date(p.created_at).toUTCString()}</pubDate>
      <guid>${baseUrl}/post/${p.id}</guid>
    </item>`;
    }).join('\n');
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>墨 - 網誌</title>
    <link>${baseUrl}/</link>
    <description>墨 - 紀錄瞬間的思緒</description>
    <language>zh-TW</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.send(rss);
  });
});

router.get('/notes', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ===== Sitemap =====

router.get('/sitemap.xml', (req, res) => {
  const host = req.headers.host || `localhost:${PORT}`;
  const protocol = req.protocol || 'http';
  const baseUrl = `${protocol}://${host}${BASE}`;
  db.all('SELECT id, created_at, updated_at FROM posts ORDER BY created_at DESC', [], (err, posts) => {
    const urls = posts.map(p => `
  <url>
    <loc>${baseUrl}/post/${p.id}</loc>
    <lastmod>${new Date(p.updated_at || p.created_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n');
    const staticUrls = [
      { loc: '/', freq: 'daily', priority: 1.0 },
      { loc: '/about', freq: 'monthly', priority: 0.6 },
      { loc: '/contact', freq: 'monthly', priority: 0.4 },
    ];
    const staticXml = staticUrls.map(u => `
  <url>
    <loc>${baseUrl}${u.loc}</loc>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticXml}${urls}
</urlset>`;
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  });
});

// ===== Newsletter Subscription =====

const subscribers = [];
router.post('/api/subscribe', (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email required' });
  subscribers.push(email);
  res.json({ message: '訂閱成功！' });
});

// ===== Static Pages =====

router.get('/about', (req, res) => {
  res.render('about');
});

router.get('/contact', (req, res) => {
  res.render('contact', { success: false, error: null });
});

router.post('/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.render('contact', { success: false, error: '所有欄位皆為必填' });
  }
  const stmt = db.prepare('INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)');
  stmt.run(name, email, subject, message, function(err) {
    if (err) return res.render('contact', { success: false, error: '送出失敗，請稍後再試' });
    res.render('contact', { success: true, error: null });
  });
  stmt.finalize();
});

router.get('/privacy', (req, res) => {
  res.render('privacy');
});

// ===== Existing Routes (kept intact) =====

router.post('/api/auth/register', (req, res) => {
  const { username, nickname, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const displayName = nickname || username;
  const stmt = db.prepare('INSERT INTO users (username, nickname, password) VALUES (?, ?, ?)');
  stmt.run(username, displayName, password, function(err) {
    if (err) return res.status(400).json({ error: 'Username already exists' });
    res.status(201).json({ id: this.lastID, username, nickname: displayName });
  });
  stmt.finalize();
});

router.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ id: user.id, username: user.username, nickname: user.nickname });
  });
});

router.get('/api/scores', (req, res) => {
  db.all('SELECT name, score, date FROM scores ORDER BY score DESC LIMIT 5', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/api/scores', (req, res) => {
  const { name, score } = req.body;
  if (!name || !score) return res.status(400).json({ error: 'Name and score required' });
  const date = new Date().toLocaleDateString();
  const stmt = db.prepare('INSERT INTO scores (name, score, date) VALUES (?, ?, ?)');
  stmt.run(name, score, date, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: "分數已紀錄" });
  });
  stmt.finalize();
});

router.get('/api/notes', (req, res) => {
  db.all(`SELECT p.id, p.content, p.likes, p.reports, p.created_at as time, u.username 
    FROM posts p LEFT JOIN users u ON p.user_id = u.id 
    ORDER BY p.created_at DESC`, [], (err, posts) => {
    if (err) return res.status(500).json({ error: err.message });
    const notes = posts.map(p => ({ ...p, content: renderMarkdown(p.content || ''), time: p.time ? new Date(p.time).toLocaleDateString('zh-TW') : '' }));
    res.json(notes);
  });
});

router.post('/api/notes', (req, res) => {
  const { user_id, content } = req.body;
  if (!user_id || !content) return res.status(400).json({ error: 'User ID and content required' });
  const stmt = db.prepare('INSERT INTO posts (user_id, content, likes, reports) VALUES (?, ?, 0, 0)');
  stmt.run(user_id, content, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    const newNote = { id: this.lastID, user_id, content, likes: 0, reports: 0, time: new Date().toLocaleDateString('zh-TW') };
    res.status(201).json(newNote);
  });
  stmt.finalize();
});

router.post('/api/notes/:id/like', (req, res) => {
  db.run('UPDATE posts SET likes = likes + 1 WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "已按讚" });
  });
});

router.post('/api/notes/:id/report', (req, res) => {
  db.run('UPDATE posts SET reports = reports + 1 WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "已檢舉" });
  });
});

router.get('/api/notes/:id/comments', (req, res) => {
  db.all(`SELECT c.*, u.username FROM comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.post_id = ? ORDER BY c.created_at DESC`, [req.params.id], (err, comments) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(comments);
  });
});

router.post('/api/notes/:id/comments', (req, res) => {
  const { user_id, content } = req.body;
  if (!user_id || !content) return res.status(400).json({ error: 'User ID and content required' });
  const stmt = db.prepare('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)');
  stmt.run(req.params.id, user_id, content, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, post_id: req.params.id, user_id, content });
  });
  stmt.finalize();
});

router.post('/api/news/like', (req, res) => {
  const { title, link } = req.body;
  if (!title || !link) return res.status(400).json({ error: 'Title and link required' });
  db.get('SELECT * FROM news_likes WHERE news_title = ? AND news_link = ?', [title, link], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) {
      db.run('UPDATE news_likes SET likes = likes + 1 WHERE id = ?', [row.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        db.get('SELECT likes FROM news_likes WHERE id = ?', [row.id], (err, updated) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: '已按讚', likes: updated.likes });
        });
      });
    } else {
      const stmt = db.prepare('INSERT INTO news_likes (news_title, news_link, likes) VALUES (?, ?, 1)');
      stmt.run(title, link, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: '已按讚', likes: 1 });
      });
      stmt.finalize();
    }
  });
});

router.get('/api/news/likes', (req, res) => {
  db.all('SELECT news_title, likes FROM news_likes ORDER BY likes DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/api/news/comment', (req, res) => {
  const { title, link, username, content } = req.body;
  if (!title || !link || !username || !content) return res.status(400).json({ error: '所有欄位皆為必填' });
  const stmt = db.prepare('INSERT INTO news_comments (news_title, news_link, username, content) VALUES (?, ?, ?, ?)');
  stmt.run(title, link, username, content, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, title, link, username, content, created_at: new Date().toLocaleDateString('zh-TW') });
  });
  stmt.finalize();
});

router.get('/api/news/comments', (req, res) => {
  const { title } = req.query;
  if (!title) return res.status(400).json({ error: '請提供新聞標題' });
  db.all('SELECT * FROM news_comments WHERE news_title = ? ORDER BY created_at DESC', [title], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.get('/api/news/taiwan', async (req, res) => {
  const parser = new Parser();
  const feeds = [
    { name: 'UDN 聯合報', url: 'https://udn.com/rssfeed/news/2' },
    { name: 'ETtoday 新聞', url: 'https://www.ettoday.net/rss/news2.xml' },
    { name: '自由時報', url: 'https://news.ltn.com.tw/rss/all.xml' }
  ];
  try {
    const allNews = await Promise.all(feeds.map(async (feed) => {
      try {
        const f = await parser.parseURL(feed.url);
        return { source: feed.name, articles: f.items.slice(0, 10).map(item => ({ title: item.title, link: item.link, pubDate: item.pubDate || item.isoDate, description: item.contentSnippet || item.content || '' })) };
      } catch (e) {
        return { source: feed.name, articles: [] };
      }
    }));
    res.json(allNews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/news/world', async (req, res) => {
  const parser = new Parser();
  const feeds = [
    { name: 'BBC', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
    { name: 'CNN', url: 'http://rss.cnn.com/rss/cnn_world.rss' }
  ];
  try {
    const allNews = await Promise.all(feeds.map(async (feed) => {
      try {
        const f = await parser.parseURL(feed.url);
        return { source: feed.name, articles: f.items.slice(0, 10).map(item => ({ title: item.title, link: item.link, pubDate: item.pubDate || item.isoDate, description: item.contentSnippet || item.content || '' })) };
      } catch (e) {
        return { source: feed.name, articles: [] };
      }
    }));
    res.json(allNews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/news/commentary/:category', (req, res) => {
  const { category } = req.params;
  db.all('SELECT * FROM news_commentary WHERE category = ? ORDER BY created_at DESC', [category], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/api/news/commentary', (req, res) => {
  const { category, original_title, original_link, source_name, rewritten_headline, event_summary, analysis_content, embed_url } = req.body;
  if (!category || !original_title || !original_link || !source_name || !rewritten_headline || !event_summary || !analysis_content) {
    return res.status(400).json({ error: '所有必填欄位皆須填寫' });
  }
  const stmt = db.prepare('INSERT INTO news_commentary (category, original_title, original_link, source_name, rewritten_headline, event_summary, analysis_content, embed_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  stmt.run(category, original_title, original_link, source_name, rewritten_headline, event_summary, analysis_content, embed_url || '', function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, category, original_title, original_link, source_name, rewritten_headline, event_summary, analysis_content, embed_url: embed_url || '' });
  });
  stmt.finalize();
});

router.put('/api/news/commentary/:id', (req, res) => {
  const { id } = req.params;
  const { category, original_title, original_link, source_name, rewritten_headline, event_summary, analysis_content, embed_url } = req.body;
  if (!category || !original_title || !original_link || !source_name || !rewritten_headline || !event_summary || !analysis_content) {
    return res.status(400).json({ error: '所有必填欄位皆須填寫' });
  }
  db.run('UPDATE news_commentary SET category = ?, original_title = ?, original_link = ?, source_name = ?, rewritten_headline = ?, event_summary = ?, analysis_content = ?, embed_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [category, original_title, original_link, source_name, rewritten_headline, event_summary, analysis_content, embed_url || '', id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: '找不到該評論' });
      res.json({ message: '更新成功' });
    });
});

router.delete('/api/news/commentary/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM news_commentary WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: '找不到該評論' });
    res.json({ message: '刪除成功' });
  });
});

// ===== Market Data (Crypto / TW Stock / US Stock) =====

router.get('/api/market/crypto', async (req, res) => {
  try {
    const ids = 'bitcoin,ethereum,solana,ripple,cardano,dogecoin,polkadot,avalanche-2,tron,litecoin';
    const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`, { timeout: 5000 });
    const data = await r.json();
    const map = { bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL', ripple: 'XRP', cardano: 'ADA', dogecoin: 'DOGE', polkadot: 'DOT', 'avalanche-2': 'AVAX', tron: 'TRX', litecoin: 'LTC' };
    const result = Object.entries(data).map(([k, v]) => ({ symbol: map[k] || k.toUpperCase(), price: v.usd, change: v.usd_24h_change, market_cap: v.usd_market_cap, volume: v.usd_24h_vol }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function fetchYahoo(symbol, label) {
  try {
    const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`, { timeout: 5000 });
    const data = await r.json();
    const result = data.chart.result[0];
    const meta = result.meta;
    const quotes = result.indicators.quote[0];
    const idx = quotes.close.length - 1;
    const prev = quotes.close[idx - 1] || meta.chartPreviousClose;
    const price = quotes.close[idx];
    const change = ((price - prev) / prev * 100);
    const high = quotes.high[idx];
    const low = quotes.low[idx];
    const volume = quotes.volume[idx];
    return { symbol, label, price, change, high, low, volume, prevClose: meta.chartPreviousClose };
  } catch (e) {
    return null;
  }
}

router.get('/api/market/tw-stock', async (req, res) => {
  try {
    const stocks = [
      { sym: '%5ETWII', label: '加權指數' },
      { sym: '2330.TW', label: '台積電' },
      { sym: '2454.TW', label: '聯發科' },
      { sym: '2317.TW', label: '鴻海' },
      { sym: '2308.TW', label: '台達電' },
      { sym: '2412.TW', label: '中華電' },
      { sym: '1303.TW', label: '南亞' },
      { sym: '1301.TW', label: '台塑' },
      { sym: '2002.TW', label: '中鋼' },
      { sym: '2881.TW', label: '富邦金' },
      { sym: '2882.TW', label: '國泰金' },
      { sym: '2886.TW', label: '兆豐金' },
      { sym: '2891.TW', label: '中信金' },
      { sym: '3008.TW', label: '大立光' },
      { sym: '3711.TW', label: '日月光' }
    ];
    const results = (await Promise.all(stocks.map(s => fetchYahoo(s.sym, s.label)))).filter(Boolean);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/market/us-stocks', async (req, res) => {
  try {
    const stocks = [
      { sym: '%5EGSPC', label: 'S&P 500' },
      { sym: '%5EDJI', label: '道瓊' },
      { sym: '%5EIXIC', label: '那斯達克' },
      { sym: 'AAPL', label: 'Apple' },
      { sym: 'MSFT', label: 'Microsoft' },
      { sym: 'GOOGL', label: 'Alphabet' },
      { sym: 'AMZN', label: 'Amazon' },
      { sym: 'NVDA', label: 'NVIDIA' },
      { sym: 'META', label: 'Meta' },
      { sym: 'TSLA', label: 'Tesla' },
      { sym: 'JPM', label: 'JPMorgan' },
      { sym: 'V', label: 'Visa' },
      { sym: 'JNJ', label: 'J&J' },
      { sym: 'WMT', label: 'Walmart' },
      { sym: 'PG', label: 'P&G' }
    ];
    const results = (await Promise.all(stocks.map(s => fetchYahoo(s.sym, s.label)))).filter(Boolean);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use(BASE, router);
app.get('/', (req, res) => res.redirect(BASE + '/'));
app.get('/notes', (req, res) => res.redirect(BASE + '/notes'));

function startServer(port) {
  const server = app.listen(port, '0.0.0.0');
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`⚠️ 埠 ${port} 已被佔用，嘗試埠 ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('❌ 伺服器啟動失敗：', err.message);
    }
  });
  server.on('listening', () => {
    const nets = os.networkInterfaces();
    const ips = Object.values(nets).flat().filter(n => n.family === 'IPv4' && !n.internal).map(n => n.address);
    console.log(`「墨」伺服器運行中：http://localhost:${port}${BASE}/`);
    ips.forEach(ip => console.log(`  區域網路：http://${ip}:${port}${BASE}/`));
    console.log(`  連接埠 ${port}（設定 PORT 環境變數可更改）`);
  });
}
startServer(PORT);
