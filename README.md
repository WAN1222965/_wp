# 網頁設計課程作業 — 「墨」部落格系統

| 欄位 | 內容 |
|------|------|
| 學期 | 114 學年下學期 |
| 學生 | 吳嘉恩 |
| 學號末兩碼 | 09 |
| 教師 | [陳鍾誠](https://www.nqu.edu.tw/educsie/index.php?act=blog&code=list&ids=4) |
| 學校科系 | [金門大學資訊工程系](https://www.nqu.edu.tw/educsie/index.php) |
| 課程教材 | https://github.com/ccc114b/html2server / https://www.w3schools.com/ |
| 執行網址 | http://localhost:3000/s111410509/ |

---

## 系統架構

```
技術棧：Node.js + Express + SQLite3 + EJS + Vanilla JavaScript
執行環境：Node.js v24+
資料庫：SQLite3 (blog.db)
基礎路徑：/s111410509/
連接埠：3000
```

### 目錄結構

```
mid/program/
├── server.js          # 主伺服器 (Express 路由、API、資料庫)
├── blog.db            # SQLite3 資料庫
├── package.json       # Node.js 依賴管理
├── views/             # EJS 樣板 (伺服端渲染)
│   ├── index.ejs      # 部落格首頁
│   ├── post.ejs       # 文章檢視頁
│   ├── new.ejs        # 新增文章
│   └── edit.ejs       # 編輯文章
├── public/            # 靜態資源 (客戶端)
│   ├── style.css      # 主樣式表
│   ├── game_styles.css# 遊戲專用樣式
│   ├── blog.js        # 部落格客戶端互動邏輯
│   ├── script.js      # 隨筆小站客戶端邏輯
│   ├── ink_background.js # 水墨動畫 Canvas 背景
│   ├── index.html     # 隨筆小站入口
│   ├── login.html     # 登入/註冊頁
│   ├── news.html      # 時事新聞聚合頁
│   ├── leaderboard.html # 排行榜
│   ├── snake.html / snake.js   # 貪吃蛇遊戲
│   ├── whack.html / whack.js   # 打地鼠遊戲
│   └── maze.html / maze.js     # 迷宮遊戲
```

---

## 資料庫結構 (SQLite3)

```sql
-- 使用者
users (id, username UNIQUE, nickname, password, created_at)

-- 文章
posts (id, user_id, title, content, summary, likes, reports, created_at)

-- 標籤
tags (id, name UNIQUE)

-- 文章-標籤關聯 (多對多)
post_tags (post_id PK, tag_id PK)

-- 留言
comments (id, post_id, user_id, content, created_at)

-- 遊戲分數
scores (id, name, score, date)

-- 新聞按讚
news_likes (id, news_title, news_link, likes, created_at)

-- 新聞留言
news_comments (id, news_title, news_link, username, content, created_at)
```

---

## 功能模組與程式碼說明

### 1. 部落格 CRUD（server.js + views/）

#### 路由表

| 方法 | 路徑 | 功能 | 樣板 |
|------|------|------|------|
| GET | `/` | 首頁（分頁列表，每頁 10 篇） | `index.ejs` |
| GET | `/post/new` | 新增文章表單 | `new.ejs` |
| POST | `/posts` | 儲存新文章（含標籤） | — |
| GET | `/post/:id` | 文章檢視 + 關聯推薦 | `post.ejs` |
| GET | `/post/:id/edit` | 編輯文章表單 | `edit.ejs` |
| POST | `/post/:id/update` | 更新文章 | — |
| POST | `/post/:id/delete` | 刪除文章 | — |

**關鍵程式碼 — 首頁分頁查詢（server.js）：**

```javascript
router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  // 先算總數，再查該頁文章，最後撈標籤
  db.all('SELECT COUNT(*) as total FROM posts', [], (err, countResult) => {
    const total = countResult ? countResult[0].total : 0;
    db.all('SELECT * FROM posts ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset], (err, posts) => {
        // ... 組合標籤後渲染
        res.render('index', { posts, currentPage: page, totalPages: Math.ceil(total / limit) });
      });
  });
});
```

#### index.ejs — 首頁功能

- **文章卡片列表**：顯示標題、日期、標籤、摘要（150 字）、閱讀更多
- **分頁導航**：上一頁 / 下一頁 + 數字頁碼
- **深色模式切換**：按鈕觸發，遵循系統 `prefers-color-scheme`，存入 `localStorage`
- **標籤雲**：`fetch('/s111410509/api/tags')` 動態載入，依文章數量排序
- **即時搜尋**：初始化時快取 `/api/search-index`，客戶端比對關鍵字、依權重評分（標題 10 分、內文 3 分）

```javascript
// index.ejs 內嵌 — 客戶端搜尋引擎
const scored = index.map(item => {
  let score = 0;
  if (title.includes(term)) score += 10;
  if (excerpt.includes(term)) score += 3;
  return { item, score };
}).filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 20);
```

#### post.ejs — 文章檢視頁功能

- **閱讀進度條**：`#progressBar` 固定頂部，隨捲動更新寬度
- **浮動目錄 (TOC)**：自動抓取 `<h2>/<h3>` 產生側邊欄，`IntersectionObserver` 高亮目前章節
- **搜尋 overlay**：`Ctrl+K` 快捷鍵、`Escape` 關閉
- **AI 摘要區塊**：條件顯示 `post.summary`
- **程式碼區塊增強**：自動包裝 `filename` 標頭 + 一鍵複製按鈕 + Prism.js 行號
- **互動式程式碼沙盒**：從 `[data-playground]` 屬性解析 HTML/CSS/JS，iframe 即時執行
- **註解彈窗**：`[data-annotation]` 屬性 → hover 顯示解釋
- **關聯文章推薦**：依共同標籤查詢最多 5 篇
- **留言系統**：名稱 + 內容，POST 至 `/api/notes/:id/comments`
- **電子報訂閱**：POST 至 `/api/subscribe`
- **GitHub Discussions**：預留嵌入區塊
- **語法高亮**：Prism.js（CDN）+ Tomorrow 主題 + Autoloader

---

### 2. 搜尋引擎（server.js + blog.js）

**雙層搜尋架構：**

1. **伺服端 API** `GET /api/search?q=` — SQL `LIKE` 查詢，回傳 20 筆（備援）
2. **客戶端搜尋索引** `GET /api/search-index` — 回傳所有文章的輕量 JSON

**搜尋索引 API 實作（server.js）：**

```javascript
router.get('/api/search-index', (req, res) => {
  db.all(`SELECT p.id, p.title, p.content, p.created_at,
    COALESCE(GROUP_CONCAT(t.name), '') as tags
    FROM posts p LEFT JOIN post_tags pt ON p.id = pt.post_id
    LEFT JOIN tags t ON pt.tag_id = t.id
    GROUP BY p.id ORDER BY p.created_at DESC`, [], (err, posts) => {
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
```

**客戶端評分比對（blog.js）：**

```javascript
const scored = index.map(item => {
  let score = 0;
  const title = (item.title || '').toLowerCase();
  const excerpt = (item.excerpt || '').toLowerCase();
  const tags = (item.tags || []).join(' ').toLowerCase();
  for (const term of terms) {
    if (title.includes(term)) score += 10;
    if (excerpt.includes(term)) score += 3;
    if (tags.includes(term)) score += 5;
  }
  return { item, score };
}).filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 20);
```

---

### 3. 水墨動畫背景（ink_background.js）

**核心機制：**

```javascript
const THEME_COLORS = {
  light: { bg: [242, 240, 233], ink: [0, 0, 0] },
  dark:  { bg: [26, 26, 26],   ink: [200, 200, 200] }
};

function getThemeColors() {
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  return THEME_COLORS[theme] || THEME_COLORS.light;
}
```

- `InkParticle` 類別：墨點具有位置、大小、透明度、擴散速度與淡出速度
- `createInk(x, y, count)`：在指定座標產生墨點粒子
- `animate()` 主循環：每幀以半透明背景疊加產生殘影效果
- 滑鼠移動（20% 機率噴 1 點）、點擊（噴 5 點）、定時自動（每 2 秒，上限 50 點）
- 支援深色模式自動切換墨色與背景色

---

### 4. RSS 訂閱（server.js）

```javascript
router.get('/rss.xml', (req, res) => {
  db.all('SELECT id, title, content, created_at FROM posts ORDER BY created_at DESC LIMIT 20',
    [], (err, posts) => {
      // 產生 RSS 2.0 XML
      res.set('Content-Type', 'application/rss+xml; charset=utf-8');
      res.send(rss);
    });
});
```

標準 RSS 2.0 格式，包含 `title`、`link`、`description`、`pubDate`、`guid`，支援 `atom:link` 自我參照。

---

### 5. 深色模式切換（blog.js + index.ejs）

```javascript
function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

// 系統變更時自動切換（若使用者未手動指定）
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  if (!localStorage.getItem('theme')) applyTheme(e.matches ? 'dark' : 'light');
});
```

CSS 變數 `--bg`、`--text`、`--accent` 等隨 `[data-theme]` 屬性切換。

---

### 6. 遊戲模組

#### 墨跡貪吃蛇（snake.js）

- 20×20 網格 Canvas，方向鍵控制
- 蛇身漸層透明度（頭黑 → 尾淡）
- 吃食物（紅點）增長 + 加分
- 撞牆或撞自己 → Game Over，POST 分數至 `/api/scores`
- 遊戲循環 `setInterval(draw, 100)`

```javascript
// 蛇身繪製 — 頭部黑色，尾部漸淡
ctx.fillStyle = (i == 0) ? "black" : `rgba(0, 0, 0, ${1 - i/snake.length})`;
```

#### 捕墨打地鼠（whack.js）

- 3×3 九宮格，墨點隨機彈出（600-1200ms）
- 30 秒倒數計時
- 點擊命中：得分 + 墨花濺射動畫（CSS `@keyframes splash`）
- 時間到 → 顯示得分 → POST 至 `/api/scores`

```css
@keyframes splash {
  to { transform: scale(1.5); opacity: 0; filter: blur(10px); }
}
```

#### 墨陣迷宮（maze.js）

- 10×10 二維陣列迷宮（1=牆、2=起點、3=終點、0=路徑）
- 方向鍵移動，撞牆觸發 `createInk()` 水墨特效
- 到達終點→ 顯示「墨成！順利抵達。」並重置
- Canvas 繪製：牆壁黑色、起點綠色（「起」）、終點紅色（「成」）、玩家黑色圓點 + 陰影

---

### 7. 時事新聞（news.html + server.js）

- 雙分頁：台灣新聞（RSS 聚合） / 國際新聞（NewsAPI）
- 台灣新聞來源：UDN 聯合報、ETtoday、自由時報（`rss-parser`）
- 每則新聞可按讚、留言
- 留言自動填入使用者暱稱（從 `localStorage`）

```javascript
// 伺服端 — RSS 聚合 (server.js)
const feeds = [
  { name: 'UDN 聯合報', url: 'https://udn.com/rssfeed/news/2' },
  { name: 'ETtoday 新聞', url: 'https://www.ettoday.net/rss/news2.xml' },
  { name: '自由時報', url: 'https://news.ltn.com.tw/rss/all.xml' }
];
const allNews = await Promise.all(feeds.map(async (feed) => {
  const f = await parser.parseURL(feed.url);
  return { source: feed.name, articles: f.items.slice(0, 10) };
}));
```

---

### 8. 使用者認證（login.html + server.js）

- 註冊：`POST /api/auth/register` → 存入 `users` 表
- 登入：`POST /api/auth/login` → 比對帳號密碼 → 回傳使用者物件
- 客戶端存入 `localStorage`，後續請求自動帶入使用者資訊

---

### 9. 排行榜（leaderboard.html）

- `GET /api/scores` 取前 5 名
- 遊戲結束時自動 `POST /api/scores` 提交分數
- `snake.js` 提交名稱「無名書生」、`whack.js` 提交名稱「捕墨手」

---

## 啟動方式

```bash
cd mid/program
npm install      # 安裝依賴（express, sqlite3, ejs, ...）
npm start        # 啟動伺服器 → http://localhost:3000/s111410509/
```
