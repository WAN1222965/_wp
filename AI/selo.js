const express = require('express');
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

const app = express();
const DB_PATH = path.join(__dirname, 'blog.db');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Input validation middleware
const validateUserId = (req, res, next) => {
  const userId = parseInt(req.params.userId || req.body.user_id || req.body.from_user_id || req.body.to_user_id);
  if (isNaN(userId) || userId <= 0) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  req.validatedUserId = userId;
  next();
};

let db;

async function initDB() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  function ensureColumn(table, column, definition) {
    const info = db.exec(`PRAGMA table_info(${table})`);
    if (!info || info.length === 0) {
      return false;
    }
    const columns = info[0].values.map(row => row[1]);
    if (!columns.includes(column)) {
      db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
      return true;
    }
    return false;
  }
  
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      display_name TEXT,
      bio TEXT,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  ensureColumn('users', 'bio', 'TEXT');
  ensureColumn('users', 'avatar_url', 'TEXT');
  
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      subtitle TEXT,
      content TEXT NOT NULL,
      cover_image TEXT,
      tags TEXT,
      is_featured INTEGER DEFAULT 0,
      read_time INTEGER DEFAULT 3,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      post_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, post_id)
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS dating_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      age INTEGER,
      gender TEXT,
      location TEXT,
      interests TEXT,
      looking_for TEXT,
      about_me TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS dating_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER,
      to_user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(from_user_id, to_user_id),
      FOREIGN KEY (from_user_id) REFERENCES users(id),
      FOREIGN KEY (to_user_id) REFERENCES users(id)
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user1_id INTEGER,
      user2_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user1_id, user2_id),
      FOREIGN KEY (user1_id) REFERENCES users(id),
      FOREIGN KEY (user2_id) REFERENCES users(id)
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER,
      to_user_id INTEGER,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_user_id) REFERENCES users(id),
      FOREIGN KEY (to_user_id) REFERENCES users(id)
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS message_reads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      message_id INTEGER,
      read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, message_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (message_id) REFERENCES messages(id)
    )
  `);
  
  const userExists = db.exec("SELECT COUNT(*) FROM users WHERE username = 'writer'")[0];
  if (!userExists || userExists.values[0][0] === 0) {
    db.run("INSERT INTO users (username, password, display_name, bio, avatar_url) VALUES (?, ?, ?, ?, ?)", 
      ['writer', 'writer123', '寫作者', '熱愛分享知識與想法的創作者', 'https://api.dicebear.com/7.x/initials/svg?seed=Writer&backgroundColor=0a0a0a']);
  }
  
  const samplePosts = [
    { title: '探索前端開發的無限可能', subtitle: '從基礎到進階的旅程', content: '前端開發是一個充滿挑戰與創意的領域。在這篇文章中，我們將探討如何從基礎開始，逐步掌握現代前端開發的核心技術。\n\n首先，HTML 是網頁的骨架。了解正確的語義化標籤使用方式，能讓你的頁面更具可訪問性和SEO友好。\n\n其次，CSS 是網頁的皮膚。Flexbox 和 Grid 布局系統讓響應式設計變得更加直觀和強大。\n\n最後，JavaScript 是網頁的心臟。掌握 ES6+ 的新特性，理解非同步編程，是成為優秀前端工程師的必經之路。', tags: '前端,開發,JavaScript', is_featured: 1, read_time: 5 },
    { title: '設計思維：創造更好的用戶體驗', subtitle: '以人為本的設計方法論', content: '設計思維是一種以人為本的創新方法，強調深入理解用戶需求，通過迭代過程找到最佳解決方案。\n\n這個過程包含五個階段：同理心、定義、創意、原型和測試。每一個階段都至關重要，缺一不可。\n\n在同理心階段，我們需要觀察用戶、與他們交談，了解他們真正關心的問題，而不是我們認為他們需要的。\n\n定義階段是將觀察結果提煉成有價值的洞察，形成清晰的問題陳述。\n\n創意階段需要頭腦風暴，產生大量想法，不要急於批判。\n\n原型階段將想法快速轉化為可觸摸的形式。\n\n測試階段則是讓真實用戶驗證原型的有效性。', tags: '設計,用戶體驗,方法論', is_featured: 1, read_time: 4 },
    { title: 'Node.js 性能優化實踐', subtitle: '讓你的服務器跑得更快', content: 'Node.js 以其非阻塞 I/O 模型聞名，但在生產環境中仍需要持續優化。以下是一些實用的優化技巧。\n\n1. 使用進程管理器如 PM2，可以實現自動重啟和負載均衡。\n\n2. 開啟 Redis 緩存，大幅減少數據庫查詢次數。\n\n3. 合理使用連接池，避免頻繁建立和關閉連接。\n\n4. 壓縮響應內容，使用 Gzip 或 Brotli。\n\n5. 使用 HTTP/2 提升資源載入效率。\n\n記住，性能優化是一個持續的過程，需要持續監控和調整。', tags: 'Node.js,性能,後端', is_featured: 0, read_time: 6 },
    { title: 'React Hooks 完全指南', subtitle: '掌握現代 React 開發的核心', content: 'React Hooks 徹底改變了我們撰寫 React 組件的方式。讓我們深入了解最常用的 Hooks。\n\nuseState 是最基礎的 Hook，用於在函數組件中添加狀態。\n\nuseEffect 讓我們可以在函數組件中執行副作用操作，如數據獲取、訂閱、手動 DOM 操作等。\n\nuseContext 解決了 prop drilling 的問題，讓我們可以跨層級傳遞數據。\n\nuseReducer 是 useState 的替代方案，適合管理複雜的狀態邏輯。\n\nuseMemo 和 useCallback 用於優化性能，避免不必要的重新渲染。\n\n掌握這些 Hooks，你就能應對大多數 React 開發場景。', tags: 'React,Hooks,前端', is_featured: 1, read_time: 7 },
    { title: '職場成長的七個關鍵習慣', subtitle: '從菜鳥到專業人士的蛻變', content: '在職場中，技術能力只是基礎。以下這些習慣能幫助你快速成長。\n\n主動學習：不要等待指示，主動尋找學習機會和挑戰。\n\n善於提問：好的問題比好的答案更有價值。學會問對問題。\n\n建立人脈：與同事、前輩建立良好關係，擴展你的職業網絡。\n\n時間管理：學會區分重要和緊急的事情，優先處理真正重要的事。\n\n接受反饋：把批評當作成長的機會，而不是攻擊。\n\n持續反思：每天花時間回顧自己的工作，思考如何做得更好。\n\n保持熱情：對工作保持熱情是長期成功的關鍵。', tags: '職場,成長,習慣', is_featured: 0, read_time: 5 },
    { title: '深入理解 TypeScript 泛型', subtitle: '讓你的代碼更靈活、更類型安全', content: 'TypeScript 的泛型是提高代碼复用性和類型安全性的強大工具。\n\n泛型允許你創建可重用的組件，同時保持完整的類型檢查。\n\n基礎泛型：使用 <T> 來表示一個類型參數。\n\n多個泛型參數：可以同時使用多個泛型參數，如 <T, K>。\n\n約束條件：使用 extends 關鍵字限制泛型的類型範圍。\n\n默認類型參數：為泛型參數指定默認值，增加靈活性。\n\n泛型接口和類：創建泛型的數據結構和類。\n\n實用工具類型：TypeScript 內置了許多實用的泛型工具類型，如 Partial、Required、Pick、Omit 等。', tags: 'TypeScript,JavaScript,前端', is_featured: 0, read_time: 8 },
    { title: '數據可視化：用圖表說故事', subtitle: '從數據到洞察的轉換藝術', content: '數據可視化是將複雜數據轉化為直觀理解的橋樑。好的可視化能讓數據說話。\n\n選擇正確的圖表類型是關鍵：\n\n- 比較數據使用柱狀圖或條形圖\n- 趨勢變化使用折線圖\n- 比例關係使用餅圖或環形圖\n- 分布情況使用直方圖或散點圖\n\n顏色的選擇也很重要：\n\n使用對比鮮明的顏色區分不同數據類別\n考慮色盲友好配色\n保持配色簡潔統一\n\n最後，記住可視化的目的：幫助觀眾快速理解數據，做出正確的決策。', tags: '數據,可視化,圖表', is_featured: 0, read_time: 6 },
    { title: '雲端運算的未來趨勢', subtitle: '無服務器架構與邊緣運算', content: '雲端運算正在經歷革命性的變化。以下趨勢將塑造未來的技術格局。\n\n無服務器架構（Serverless）讓開發者專注於業務邏輯，無需管理服務器。AWS Lambda、Azure Functions、Google Cloud Functions 是這個領域的代表。\n\n邊緣運算將計算推向網絡邊緣，減少延遲，提高響應速度。這對於物聯網和即時應用尤其重要。\n\n容器化和微服務已成為標準實踐。Kubernetes 提供了強大的容器編排能力。\n\nAI 和機器學習服務正變得越來越容易使用，讓每個開發者都能構建智能應用。', tags: '雲端,Serverless,邊緣運算', is_featured: 1, read_time: 6 },
    { title: '寫作的藝術：如何表達你的想法', subtitle: '從思維到文字的轉化', content: '寫作不僅是表達工具，更是深度思考的方式。好的寫作能讓你的想法產生更大的影響力。\n\n明確目標讀者：了解你為誰而寫，他們的背景和需求是什麼。\n\n結構清晰：用簡單的框架組織你的想法，如總分總結構。\n\n語言簡潔：避免冗長的句子和複雜的詞彙。短句更有力量。\n\n舉例說明：抽象的概念需要具體的例子來支撐。\n\n反覆修改：好文章是修改出來的。第一稿往往是粗糙的。\n\n最重要的是：開始寫。完美主義是最大的敵人。', tags: '寫作,表達,溝通', is_featured: 0, read_time: 5 },
    { title: '運動與大腦健康的秘密', subtitle: '為什麼你需要動起來', content: '運動不僅能強健身體，更能優化大腦功能。科學研究證明，定期運動能帶來諸多好處。\n\n改善記憶力：運動促進海馬體神經元生長，增強記憶力。\n\n提升情緒：運動釋放內啡肽，有效緩解壓力和焦慮。\n\n提高專注力：運動後的大腦更專注，學習效率更高。\n\n延緩衰老：運動能保護大腦免受認知衰退的影響。\n\n建議每週至少進行150分鐘的中等強度運動，如快走、游泳或騎自行車。\n\n從今天開始，讓運動成為你生活的一部分。', tags: '健康,運動,大腦', is_featured: 0, read_time: 4 },
    { title: 'Git 版本控制進階技巧', subtitle: '從入門到精通', content: 'Git 是現代軟體開發的必備工具。掌握這些進階技巧，讓你的開發流程更加高效。\n\n交互式 Rebase：整理提交歷史，讓代碼審查更順暢。\n\nGit Stash：臨時保存未完成的更改，切換分支工作。\n\nCherry-pick：選擇性地應用某個提交，適用於緊急修復。\n\nSubmodules：在一個倉庫中嵌套另一個倉庫。\n\nGit Bisect：使用二分法快速定位引入 Bug 的提交。\n\n鉤子（Hooks）：自動化你的工作流程，如 pre-commit 檢查。\n\n掌握這些技巧，你就能更自信地管理複雜的項目。', tags: 'Git,版本控制,開發', is_featured: 0, read_time: 7 }
  ];
  
  const sampleDatingProfiles = [
    { age: 25, gender: '女', location: '台北', interests: '閱讀,旅行,咖啡', looking_for: '認真交往', about_me: '熱愛閱讀和旅行的女孩，希望找到有共同興趣的伴侶。' },
    { age: 28, gender: '男', location: '台中', interests: '運動,音樂,烹飪', looking_for: '長期關係', about_me: '健身愛好者，喜歡做飯給朋友吃，希望找到能一起運動的另一半。' },
    { age: 26, gender: '女', location: '高雄', interests: '藝術,設計,瑜伽', looking_for: '朋友以上', about_me: '設計師，喜歡瑜伽和冥想，尋找有創意靈感的靈魂伴侶。' },
    { age: 30, gender: '男', location: '台北', interests: '科技,遊戲,電影', looking_for: '認真交往', about_me: '軟體工程師，喜歡玩遊戲和看電影，希望找到理解科技的女孩。' },
    { age: 24, gender: '女', location: '台南', interests: '音樂,舞蹈,美食', looking_for: '長期關係', about_me: '音樂系學生，喜歡跳舞和嘗試新美食，尋找能一起探索生活的伴侶。' }
  ];
  
  const postCount = db.exec("SELECT COUNT(*) FROM posts")[0];
  if (!postCount || postCount.values[0][0] === 0) {
    const userId = db.exec("SELECT id FROM users WHERE username = 'writer'")[0].values[0][0];
    samplePosts.forEach(post => {
      db.run("INSERT INTO posts (user_id, title, subtitle, content, tags, is_featured, read_time) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [userId, post.title, post.subtitle, post.content, post.tags, post.is_featured, post.read_time]);
    });
  }
  
  const datingProfileCount = db.exec("SELECT COUNT(*) FROM dating_profiles")[0];
  if (!datingProfileCount || datingProfileCount.values[0][0] === 0) {
    const users = queryAll("SELECT id FROM users ORDER BY id");
    sampleDatingProfiles.forEach((profile, index) => {
      if (users[index]) {
        db.run("INSERT INTO dating_profiles (user_id, age, gender, location, interests, looking_for, about_me) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [users[index].id, profile.age, profile.gender, profile.location, profile.interests, profile.looking_for, profile.about_me]);
      }
    });
  }
  
  saveDB();
}

function saveDB() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results[0] || null;
}

app.get('/api/posts', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  
  const posts = queryAll(`
    SELECT p.*, u.username, u.display_name, u.avatar_url,
           (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count
    FROM posts p
    LEFT JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `, [limit, offset]);
  
  const total = queryOne("SELECT COUNT(*) as count FROM posts").count;
  
  res.json({ posts, total, page, limit, hasMore: offset + posts.length < total });
});

app.get('/api/posts/featured', (req, res) => {
  const posts = queryAll(`
    SELECT p.*, u.username, u.display_name, u.avatar_url,
           (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count
    FROM posts p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.is_featured = 1
    ORDER BY p.created_at DESC
    LIMIT 5
  `);
  res.json(posts);
});

app.get('/api/posts/recommended', (req, res) => {
  const posts = queryAll(`
    SELECT p.*, u.username, u.display_name, u.avatar_url,
           (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count
    FROM posts p
    LEFT JOIN users u ON p.user_id = u.id
    ORDER BY like_count DESC, p.created_at DESC
    LIMIT 10
  `);
  res.json(posts);
});

app.get('/api/posts/user/:username', (req, res) => {
  const user = queryOne("SELECT * FROM users WHERE username = ?", [req.params.username]);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  const posts = queryAll(`
    SELECT p.*, u.username, u.display_name, u.avatar_url,
           (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count
    FROM posts p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
  `, [user.id]);
  
  const stats = {
    posts: posts.length,
    totalLikes: posts.reduce((sum, p) => sum + p.like_count, 0)
  };
  
  res.json({ user, posts, stats });
});

app.get('/api/posts/:id', (req, res) => {
  const post = queryOne(`
    SELECT p.*, u.username, u.display_name, u.avatar_url, u.bio,
           (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count
    FROM posts p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `, [parseInt(req.params.id)]);
  
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

app.post('/api/posts', (req, res) => {
  const { title, subtitle, content, cover_image, tags, user_id } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }
  
  const wordCount = content.split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));
  
  db.run('INSERT INTO posts (user_id, title, subtitle, content, cover_image, tags, read_time) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [user_id || 1, title, subtitle || '', content, cover_image || '', tags || '', readTime]);
  saveDB();
  
  const post = queryOne('SELECT * FROM posts WHERE id = last_insert_rowid()');
  res.status(201).json(post);
});

app.put('/api/posts/:id', (req, res) => {
  const { title, subtitle, content, cover_image, tags } = req.body;
  const wordCount = content.split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));
  
  db.run(`UPDATE posts SET title = ?, subtitle = ?, content = ?, cover_image = ?, tags = ?, read_time = ? WHERE id = ?`,
    [title, subtitle || '', content, cover_image || '', tags || '', readTime, parseInt(req.params.id)]);
  saveDB();
  
  const post = queryOne('SELECT * FROM posts WHERE id = ?', [parseInt(req.params.id)]);
  res.json(post);
});

app.delete('/api/posts/:id', (req, res) => {
  db.run('DELETE FROM likes WHERE post_id = ?', [parseInt(req.params.id)]);
  db.run('DELETE FROM posts WHERE id = ?', [parseInt(req.params.id)]);
  saveDB();
  res.json({ message: 'Post deleted' });
});

app.post('/api/likes/:postId', (req, res) => {
  const userId = req.body.user_id || 1;
  const postId = parseInt(req.params.postId);
  
  const existing = queryOne('SELECT * FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId]);
  if (existing) {
    db.run('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId]);
    saveDB();
    res.json({ liked: false });
  } else {
    db.run('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [userId, postId]);
    saveDB();
    res.json({ liked: true });
  }
});

app.get('/api/users/:username', (req, res) => {
  const user = queryOne("SELECT * FROM users WHERE username = ?", [req.params.username]);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.get('/api/users', (req, res) => {
  const users = queryAll("SELECT id, username, display_name, avatar_url, created_at FROM users ORDER BY created_at DESC");
  res.json(users);
});

// Dating API endpoints
app.get('/api/dating/profiles', (req, res) => {
  try {
    const { search, gender, minAge, maxAge, location, interests } = req.query;
    let sql = `
      SELECT dp.*, u.username, u.display_name, u.avatar_url, u.bio
      FROM dating_profiles dp
      LEFT JOIN users u ON dp.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (search) {
      sql += ` AND (u.display_name LIKE ? OR dp.about_me LIKE ? OR dp.interests LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (gender) {
      sql += ` AND dp.gender = ?`;
      params.push(gender);
    }
    
    if (minAge) {
      sql += ` AND dp.age >= ?`;
      params.push(parseInt(minAge));
    }
    
    if (maxAge) {
      sql += ` AND dp.age <= ?`;
      params.push(parseInt(maxAge));
    }
    
    if (location) {
      sql += ` AND dp.location LIKE ?`;
      params.push(`%${location}%`);
    }
    
    if (interests) {
      sql += ` AND dp.interests LIKE ?`;
      params.push(`%${interests}%`);
    }
    
    sql += ` ORDER BY dp.created_at DESC`;
    
    const profiles = queryAll(sql, params);
    res.json(profiles);
  } catch (error) {
    console.error('Get profiles error:', error);
    res.status(500).json({ error: '獲取個人資料失敗' });
  }
});

app.get('/api/dating/profiles/:userId', validateUserId, (req, res) => {
  const profile = queryOne(`
    SELECT dp.*, u.username, u.display_name, u.avatar_url, u.bio
    FROM dating_profiles dp
    LEFT JOIN users u ON dp.user_id = u.id
    WHERE dp.user_id = ?
  `, [parseInt(req.params.userId)]);
  
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  res.json(profile);
});

app.post('/api/dating/profiles', validateUserId, (req, res) => {
  const { user_id, age, gender, location, interests, looking_for, about_me } = req.body;
  
  const existing = queryOne("SELECT id FROM dating_profiles WHERE user_id = ?", [user_id]);
  
  if (existing) {
    db.run(`UPDATE dating_profiles SET age = ?, gender = ?, location = ?, interests = ?, looking_for = ?, about_me = ? WHERE user_id = ?`,
      [age, gender, location, interests, looking_for, about_me, user_id]);
  } else {
    db.run('INSERT INTO dating_profiles (user_id, age, gender, location, interests, looking_for, about_me) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user_id, age, gender, location, interests, looking_for, about_me]);
  }
  
  saveDB();
  const profile = queryOne("SELECT * FROM dating_profiles WHERE user_id = ?", [user_id]);
  res.json(profile);
});

app.post('/api/dating/likes/:toUserId', validateUserId, (req, res) => {
  const fromUserId = req.body.from_user_id;
  const toUserId = parseInt(req.params.toUserId);
  
  const existing = queryOne('SELECT * FROM dating_likes WHERE from_user_id = ? AND to_user_id = ?', [fromUserId, toUserId]);
  
  if (existing) {
    db.run('DELETE FROM dating_likes WHERE from_user_id = ? AND to_user_id = ?', [fromUserId, toUserId]);
    saveDB();
    res.json({ liked: false });
  } else {
    db.run('INSERT INTO dating_likes (from_user_id, to_user_id) VALUES (?, ?)', [fromUserId, toUserId]);
    saveDB();
    
    // Check for match
    const mutualLike = queryOne('SELECT * FROM dating_likes WHERE from_user_id = ? AND to_user_id = ?', [toUserId, fromUserId]);
    if (mutualLike) {
      // Create match
      const matchExists = queryOne('SELECT * FROM matches WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)', 
        [fromUserId, toUserId, toUserId, fromUserId]);
      if (!matchExists) {
        db.run('INSERT INTO matches (user1_id, user2_id) VALUES (?, ?)', [Math.min(fromUserId, toUserId), Math.max(fromUserId, toUserId)]);
        saveDB();
        res.json({ liked: true, matched: true });
      } else {
        res.json({ liked: true, matched: false });
      }
    } else {
      res.json({ liked: true, matched: false });
    }
  }
});

app.get('/api/dating/matches/:userId', validateUserId, (req, res) => {
  const userId = parseInt(req.params.userId);
  const matches = queryAll(`
    SELECT m.*, 
           CASE WHEN m.user1_id = ? THEN u2.username ELSE u1.username END as matched_username,
           CASE WHEN m.user1_id = ? THEN u2.display_name ELSE u1.display_name END as matched_display_name,
           CASE WHEN m.user1_id = ? THEN u2.avatar_url ELSE u1.avatar_url END as matched_avatar_url
    FROM matches m
    LEFT JOIN users u1 ON m.user1_id = u1.id
    LEFT JOIN users u2 ON m.user2_id = u2.id
    WHERE m.user1_id = ? OR m.user2_id = ?
    ORDER BY m.created_at DESC
  `, [userId, userId, userId, userId, userId]);
  
  res.json(matches);
});

app.get('/api/dating/messages/:userId', validateUserId, (req, res) => {
  const userId = parseInt(req.params.userId);
  const messages = queryAll(`
    SELECT m.*, 
           u_from.username as from_username, u_from.display_name as from_display_name,
           u_to.username as to_username, u_to.display_name as to_display_name
    FROM messages m
    LEFT JOIN users u_from ON m.from_user_id = u_from.id
    LEFT JOIN users u_to ON m.to_user_id = u_to.id
    WHERE m.from_user_id = ? OR m.to_user_id = ?
    ORDER BY m.created_at DESC
  `, [userId, userId]);
  
  res.json(messages);
});

app.get('/api/dating/messages/unread/:userId', (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const unreadCount = queryOne(`
      SELECT COUNT(*) as count FROM messages 
      WHERE to_user_id = ? AND id NOT IN (
        SELECT message_id FROM message_reads WHERE user_id = ?
      )
    `, [userId, userId]);
    
    res.json({ unreadCount: unreadCount ? unreadCount.count : 0 });
  } catch (error) {
    console.error('Get unread messages error:', error);
    res.status(500).json({ error: '獲取未讀消息失敗' });
  }
});

app.post('/api/dating/messages', (req, res) => {
  try {
    const { from_user_id, to_user_id, content } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }
    
    if (!from_user_id || !to_user_id) {
      return res.status(400).json({ error: 'Sender and receiver are required' });
    }
    
    db.run('INSERT INTO messages (from_user_id, to_user_id, content) VALUES (?, ?, ?)',
      [from_user_id, to_user_id, content.trim()]);
    saveDB();
    
    const message = queryOne('SELECT * FROM messages WHERE id = last_insert_rowid()');
    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: '發送消息失敗' });
  }
});

app.get('/api/dating/conversations/:userId', validateUserId, (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    const conversations = queryAll(`
      SELECT 
        CASE WHEN m.from_user_id = ? THEN m.to_user_id ELSE m.from_user_id END as other_user_id,
        u.username, u.display_name, u.avatar_url,
        m.content as last_message,
        m.created_at as last_message_time,
        (SELECT COUNT(*) FROM messages m2 WHERE 
          ((m2.from_user_id = ? AND m2.to_user_id = CASE WHEN m.from_user_id = ? THEN m.to_user_id ELSE m.from_user_id END) OR
           (m2.to_user_id = ? AND m2.from_user_id = CASE WHEN m.from_user_id = ? THEN m.to_user_id ELSE m.from_user_id END)) AND
          m2.id NOT IN (SELECT message_id FROM message_reads WHERE user_id = ?)
        ) as unread_count
      FROM messages m
      LEFT JOIN users u ON u.id = CASE WHEN m.from_user_id = ? THEN m.to_user_id ELSE m.from_user_id END
      WHERE m.from_user_id = ? OR m.to_user_id = ?
      GROUP BY other_user_id
      ORDER BY last_message_time DESC
    `, [userId, userId, userId, userId, userId, userId, userId, userId, userId]);
    
    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: '獲取對話列表失敗' });
  }
});

app.get('/api/dating/stats/:userId', validateUserId, (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    const likesGiven = queryOne('SELECT COUNT(*) as count FROM dating_likes WHERE from_user_id = ?', [userId]);
    const likesReceived = queryOne('SELECT COUNT(*) as count FROM dating_likes WHERE to_user_id = ?', [userId]);
    const matches = queryOne('SELECT COUNT(*) as count FROM matches WHERE user1_id = ? OR user2_id = ?', [userId, userId]);
    const messagesSent = queryOne('SELECT COUNT(*) as count FROM messages WHERE from_user_id = ?', [userId]);
    const messagesReceived = queryOne('SELECT COUNT(*) as count FROM messages WHERE to_user_id = ?', [userId]);
    
    res.json({
      likesGiven: likesGiven ? likesGiven.count : 0,
      likesReceived: likesReceived ? likesReceived.count : 0,
      matches: matches ? matches.count : 0,
      messagesSent: messagesSent ? messagesSent.count : 0,
      messagesReceived: messagesReceived ? messagesReceived.count : 0
    });
  } catch (error) {
    console.error('Get dating stats error:', error);
    res.status(500).json({ error: '獲取統計數據失敗' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, display_name } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码是必填的' });
    }
    
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: '用户名长度需在3-20字之間' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度至少6個字符' });
    }
    
    const existing = queryOne("SELECT id FROM users WHERE username = ?", [username]);
    if (existing) {
      return res.status(400).json({ error: '用户名已被使用' });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const avatar_url = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}&backgroundColor=0a0a0a`;
    
    db.run('INSERT INTO users (username, password, display_name, avatar_url) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, display_name || username, avatar_url]);
    saveDB();
    
    const user = queryOne("SELECT id, username, display_name, avatar_url, created_at FROM users WHERE username = ?", [username]);
    res.status(201).json(user);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: '註冊失敗，請稍後再試' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码是必填的' });
    }
    
    const user = queryOne("SELECT id, username, password, display_name, avatar_url, bio FROM users WHERE username = ?", [username]);
    
    if (!user) {
      return res.status(401).json({ error: '用户名或密碼錯誤' });
    }
    
    // Compare password with hash
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: '用户名或密碼錯誤' });
    }
    
    const userData = {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      bio: user.bio
    };
    
    res.json({ user: userData });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登錄失敗，請稍後再試' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.argv[2] || 3002;

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Medium-style blog with dating features v3.1 running at http://localhost:${PORT}`);
  });
});