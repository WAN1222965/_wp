const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fetch = require('node-fetch');
const Parser = require('rss-parser');

const app = express();
const PORT = 3000;
const BASE = '/s111410509';
const db = new sqlite3.Database('./blog.db');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(BASE, express.static('public', { index: false }));
app.use(express.static('views'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.locals.baseUrl = BASE;

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

  db.run("ALTER TABLE posts ADD COLUMN title TEXT DEFAULT ''", err => err && null);
  db.run("ALTER TABLE posts ADD COLUMN summary TEXT DEFAULT ''", err => err && null);
  db.run("ALTER TABLE posts ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0", err => err && null);
  db.run("ALTER TABLE posts ADD COLUMN likes INTEGER DEFAULT 0", err => err && null);
  db.run("ALTER TABLE posts ADD COLUMN reports INTEGER DEFAULT 0", err => err && null);
});

// ===== BLOG CRUD (EJS) =====

router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  db.all('SELECT COUNT(*) as total FROM posts', [], (err, countResult) => {
    const total = countResult ? countResult[0].total : 0;
    db.all('SELECT * FROM posts ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset], (err, posts) => {
      if (err) return res.status(500).send(err.message);
      const tagMap = {};
      if (posts.length > 0) {
        const ids = posts.map(p => p.id);
        const placeholders = ids.map(() => '?').join(',');
        db.all(`SELECT pt.post_id, t.name FROM post_tags pt JOIN tags t ON pt.tag_id = t.id WHERE pt.post_id IN (${placeholders})`, ids, (err, tags) => {
          if (tags) tags.forEach(t => { (tagMap[t.post_id] = tagMap[t.post_id] || []).push(t.name); });
          posts.forEach(p => p.tags = tagMap[p.id] || []);
          res.render('index', { posts, tags: [], currentPage: page, totalPages: Math.ceil(total / limit) });
        });
      } else {
        res.render('index', { posts, tags: [], currentPage: page, totalPages: Math.ceil(total / limit) });
      }
    });
  });
});

router.get('/post/new', (req, res) => {
  res.render('new');
});

router.post('/posts', (req, res) => {
  const { title, content, summary, tags: tagsStr } = req.body;
  if (!title || !content) return res.status(400).send('Title and content required');
  const stmt = db.prepare('INSERT INTO posts (title, content, summary, user_id) VALUES (?, ?, ?, 1)');
  stmt.run(title, content, summary || '', function(err) {
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
  const { title, content, summary, tags: tagsStr } = req.body;
  db.run('UPDATE posts SET title = ?, content = ?, summary = ? WHERE id = ?', [title, content, summary || '', req.params.id], function(err) {
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
      excerpt: cleanHtml(p.content).substring(0, 200),
      tags: p.tags ? p.tags.split(',').filter(Boolean) : [],
      url: '/s111410509/post/' + p.id,
      created_at: p.created_at
    }));
    res.json(index);
  });
});

router.get('/api/search', (req, res) => {
  const q = req.query.q;
  if (!q) return res.json([]);
  db.all(`SELECT id, title, content, substr(content, 1, 200) as excerpt, created_at FROM posts WHERE title LIKE ? OR content LIKE ? ORDER BY created_at DESC LIMIT 20`, [`%${q}%`, `%${q}%`], (err, posts) => {
    if (err) return res.status(500).json({ error: err.message });
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
      db.all(`SELECT DISTINCT p.id, p.title, substr(p.content, 1, 100) as excerpt FROM posts p JOIN post_tags pt ON p.id = pt.post_id JOIN tags t ON pt.tag_id = t.id WHERE t.name IN (${placeholders}) AND p.id != ? LIMIT 5`, [...tagNames, post.id], (err, related) => {
        res.json(related || []);
      });
    });
  });
});

// ===== RSS Feed =====

router.get('/rss.xml', (req, res) => {
  db.all('SELECT id, title, content, created_at FROM posts ORDER BY created_at DESC LIMIT 20', [], (err, posts) => {
    if (err) return res.status(500).send(err.message);
    const buildDate = new Date().toUTCString();
    let items = posts.map(p => `
    <item>
      <title><![CDATA[${p.title || 'Untitled'}]]></title>
      <link>http://localhost:${PORT}${BASE}/post/${p.id}</link>
      <description><![CDATA[${(p.content || '').substring(0, 500)}]]></description>
      <pubDate>${new Date(p.created_at).toUTCString()}</pubDate>
      <guid>http://localhost:${PORT}${BASE}/post/${p.id}</guid>
    </item>`).join('\n');
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>墨 - 網誌</title>
    <link>http://localhost:${PORT}${BASE}/</link>
    <description>墨 - 紀錄瞬間的思緒</description>
    <language>zh-TW</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="http://localhost:${PORT}${BASE}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.send(rss);
  });
});

router.get('/notes', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ===== Newsletter Subscription =====

const subscribers = [];
router.post('/api/subscribe', (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email required' });
  subscribers.push(email);
  res.json({ message: '訂閱成功！' });
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
    const notes = posts.map(p => ({ ...p, time: p.time ? new Date(p.time).toLocaleDateString('zh-TW') : '' }));
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
      db.run('UPDATE news_likes SET likes = likes + 1 WHERE id = ?', [row.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '已按讚', likes: row.likes + 1 });
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
  const API_KEY = 'YOUR_NEWSAPI_KEY';
  const url = `https://newsapi.org/v2/top-headlines?language=zh&apiKey=${API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === 'ok') {
      res.json({ source: '國際新聞 (NewsAPI)', articles: data.articles.slice(0, 20).map(item => ({ title: item.title, link: item.url, pubDate: item.publishedAt, description: item.description || '', image: item.urlToImage })) });
    } else {
      res.json({ source: '國際新聞', articles: [], error: '請設定 NewsAPI Key 或使用替代新聞源' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use(BASE, router);
app.get('/', (req, res) => res.redirect(BASE + '/'));
app.get('/notes', (req, res) => res.redirect(BASE + '/notes'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`「墨」伺服器運行中：http://localhost:${PORT}${BASE}/`);
});
