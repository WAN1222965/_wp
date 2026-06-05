#全部都用AI，我負責調整版面，以及新增需要的功能和伺服器的自動開啟、公開網址
# 墨 — 極簡部落格系統

> 紀錄瞬間的思緒。一個融合部落格、隨筆小站與小遊戲的 Node.js 全端專案。

| 欄位 | 內容 |
|------|------|
| 學期 | 114 學年下學期 |
| 學生 | 吳嘉恩 |
| 學號末兩碼 | 09 |
| 教師 | [陳鍾誠](https://www.nqu.edu.tw/educsie/index.php?act=blog&code=list&ids=4) |
| 學校科系 | [金門大學資訊工程系](https://www.nqu.edu.tw/educsie/index.php) |
| 課程教材 | [html2server](https://github.com/ccc114b/html2server) / [W3Schools](https://www.w3schools.com/) |
| 執行網址 | `http://localhost:3000/s111410509/` |

---

## 目錄

- [快速開始](#快速開始)
- [系統架構](#系統架構)
- [功能一覽](#功能一覽)
- [目錄結構](#目錄結構)
- [資料庫結構](#資料庫結構)
- [API 文件](#api-文件)
- [功能模組詳解](#功能模組詳解)
  - [1. 部落格 CRUD](#1-部落格-crud)
  - [2. Markdown 編輯器](#2-markdown-編輯器)
  - [3. 搜尋引擎](#3-搜尋引擎)
  - [4. 水墨動畫背景](#4-水墨動畫背景)
  - [5. 經典部落格主題](#5-經典部落格主題)
  - [6. RSS / Sitemap / SEO](#6-rss--sitemap--seo)
  - [7. 圖片上傳](#7-圖片上傳)
  - [8. 使用者認證](#8-使用者認證)
  - [9. 安全防護機制](#9-安全防護機制)
  - [10. 隨筆小站](#10-隨筆小站)
  - [11. 遊戲模組](#11-遊戲模組)
  - [12. 時事新聞聚合](#12-時事新聞聚合)
  - [13. 排行榜](#13-排行榜)
  - [14. 靜態頁面（關於 / 聯絡 / 隱私權）](#14-靜態頁面關於--聯絡--隱私權)
- [部署指南](#部署指南)
- [技術債與未來展望](#技術債與未來展望)

---

## 快速開始

```bash
# 1. 進入專案目錄
cd mid/program

# 2. 安裝依賴
npm install

# 3. 啟動伺服器
npm start

# 4. 開啟瀏覽器
# → http://localhost:3000/s111410509/
```

**需求：** Node.js v18+（建議 v24+）、npm

---

## 系統架構

```
技術棧：Node.js + Express + SQLite3 + EJS + Vanilla JavaScript
執行環境：Node.js v24+
資料庫：SQLite3 (blog.db + sessions.db)
基礎路徑：/s111410509/
連接埠：3000（自動 fallback +1 若被佔用）
主題風格：經典部落格（黑/白/灰，仿 WordPress 雙欄佈局）

安全性：
  ├─ bcrypt（密碼雜湊，salt rounds = 12）
  ├─ express-session + SQLite Store（httpOnly Cookie）
  ├─ helmet（安全標頭）
  └─ express-rate-limit（API 100次/15分，認證 20次/15分）
```

```
瀏覽器 (Client)
    │
    ├─ EJS 頁面 (伺服器渲染) → views/*.ejs
    ├─ 靜態頁面 (SPA 風格)   → public/*.html
    │
    ▼
Express 伺服器 (server.js)
    │
    ├─ 安全性中介軟體 — helmet, rate-limit, morgan
    ├─ Session 管理 — express-session + connect-sqlite3
    ├─ 路由掛載點：/s111410509/
    │   ├─ 部落格 CRUD (EJS 渲染)
    │   ├─ RESTful API (/api/*)
    │   ├─ 靜態資源 (/uploads/、/*.html、/*.js、/*.css)
    │   ├─ RSS (/rss.xml)
    │   ├─ Sitemap (/sitemap.xml)
    │   └─ 自訂錯誤頁 (views/error.ejs)
    │
    ▼
SQLite3 (blog.db)
    ├─ users            — 使用者（bcrypt 雜湊密碼）
    ├─ posts            — 文章（含 views 瀏覽數）
    ├─ tags             — 標籤
    ├─ post_tags        — 多對多關聯
    ├─ comments         — 留言
    ├─ scores           — 遊戲分數
    ├─ news_likes       — 新聞按讚
    ├─ news_comments    — 新聞留言
    ├─ news_commentary  — 新聞評論分析
    ├─ contact_messages — 聯絡表單訊息
    ├─ subscribers      — 電子報訂閱
    ├─ post_likes       — 文章按讚（多元去重）
    └─ post_reports     — 文章檢舉（多元去重）
```

---

## 功能一覽

| 功能模組 | 說明 | 技術亮點 |
|----------|------|----------|
| 📝 部落格 CRUD | 文章新增/編輯/刪除/列表 | 分頁、標籤篩選、關聯推薦、瀏覽數統計 |
| ✏️ Markdown 編輯器 | 所見即所得預覽 + 工具列 | marked 渲染、分頁切換、草稿自動儲存 |
| 🔍 客戶端搜尋引擎 | 即時搜尋文章 | 雙層架構 (SQL LIKE + 客戶端索引評分) |
| 🎨 水墨動畫背景 | Canvas 粒子系統 | 滑鼠互動、深色模式自動切換 |
| 🖼️ 經典部落格主題 | 仿 WordPress 雙欄佈局 | 黑白灰色調、首頁橫幅圖片、側邊欄 |
| 📡 RSS / Sitemap | 標準 RSS 2.0 + XML Sitemap | SEO 優化、協議自動偵測 |
| 🖼 圖片上傳 | 拖放/選取上傳 | multer + UUID 重新命名 + 限制 5MB |
| 👤 使用者認證 | 註冊/登入/登出 | bcrypt 雜湊 + express-session |
| 🔒 安全防護 | 全方位安全機制 | helmet + rate-limit + httpOnly Cookie |
| 🐍 貪吃蛇 | 20×20 Canvas 遊戲 | requestAnimationFrame、蛇身漸層、分數提交 |
| 🎯 捕墨 (打地鼠) | 3×3 九宮格反應遊戲 | 連擊系統、墨花濺射動畫、倒數計時 |
| 🏃 墨陣 (迷宮) | DFS 迷宮生成（6×6 ~ 18×18） | 遞迴回溯法、撞牆水墨特效、關卡遞增 |
| 📰 時事新聞 | RSS 聚合 + 國際新聞 | 按讚/留言系統、新聞評論分析 CRUD |
| 📈 股市行情 | 加密貨幣 + 台股 + 美股報價 | CoinGecko + Yahoo Finance API |
| 🏆 排行榜 | 遊戲分數排名 | SQL 排序取前 5 名 |
| ℹ️ 關於頁面 | 網站介紹、價值主張 | EJS 伺服端渲染 |
| ✉️ 聯絡表單 | 姓名/Email/主旨/訊息 | SQLite 持久化、表單驗證 |
| 🔒 隱私權政策 | 靜態資訊頁面 | EJS 渲染 |
| 📬 電子報訂閱 | Email 訂閱 | SQLite 持久化、去重保護 |
| 🛑 自訂錯誤頁 | 404/500 錯誤頁面 | EJS 渲染、深色模式支援 |

---

## 目錄結構

```
mid/program/
├── server.js                  # 主伺服器 (Express 路由、API、資料庫、安全中介)
├── blog.db                    # SQLite3 資料庫（文章、使用者、遊戲…）
├── sessions.db                # Session 存放（connect-sqlite3）
├── package.json               # Node.js 依賴管理
├── package-lock.json
├── README.md                  # 本文件
│
├── views/                     # EJS 樣板 (伺服端渲染)
│   ├── index.ejs              # 部落格首頁 (雙欄佈局、橫幅圖片、側邊欄)
│   ├── post.ejs               # 文章檢視頁 (TOC + 程式碼區塊 + 留言 + 相關文章)
│   ├── new.ejs                # 新增文章 (Markdown 編輯器 + 圖片上傳)
│   ├── edit.ejs               # 編輯文章
│   ├── about.ejs              # 關於頁面
│   ├── contact.ejs            # 聯絡表單
│   ├── privacy.ejs            # 隱私權政策
│   ├── error.ejs              # 自訂錯誤頁（404 / 500）
│   └── partials/              # 共用模板
│       ├── navbar.ejs         # 導覽列（含 Session 狀態）
│       └── footer.ejs         # 頁尾（含 GA4 支援）
│
├── public/                    # 靜態資源 (客戶端)
│   ├── uploads/               # 上傳圖片存放處
│   ├── style.css              # 主樣式表 (經典部落格風格)
│   ├── game_styles.css        # 遊戲共用 CSS（霓虹深色主題）
│   ├── blog.js                # 部落格客戶端互動邏輯 (TOC、搜尋、留言、程式碼沙盒)
│   ├── script.js              # 隨筆小站客戶端邏輯
│   ├── ink_background.js      # 水墨動畫 Canvas 粒子背景
│   ├── index.html             # 隨筆小站入口 (簡短文哲貼文)
│   ├── login.html             # 登入/註冊頁
│   ├── news.html              # 時事新聞聚合頁 (雙分頁、按讚、留言)
│   ├── leaderboard.html       # 排行榜
│   ├── market.html            # 股市行情 (加密貨幣 + 台股 + 美股)
│   ├── classic-blog.html      # 獨立 WordPress 主題展示頁
│   ├── snake.html / snake.js  # 貪吃蛇遊戲
│   ├── whack.html / whack.js  # 打地鼠遊戲 (捕墨)
│   └── maze.html / maze.js    # 迷宮遊戲 (墨陣)
│
└── node_modules/              # 依賴套件
```

---

## 資料庫結構

```sql
-- 使用者
CREATE TABLE users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  username   TEXT UNIQUE NOT NULL,
  nickname   TEXT NOT NULL,
  password   TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 文章
CREATE TABLE posts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL DEFAULT 0,
  title      TEXT DEFAULT '',
  content    TEXT NOT NULL,
  summary    TEXT DEFAULT '',
  likes      INTEGER DEFAULT 0,
  reports    INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 標籤
CREATE TABLE tags (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

-- 文章-標籤關聯 (多對多)
CREATE TABLE post_tags (
  post_id INTEGER NOT NULL,
  tag_id  INTEGER NOT NULL,
  PRIMARY KEY (post_id, tag_id)
);

-- 留言
CREATE TABLE comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id    INTEGER NOT NULL,
  user_id    INTEGER NOT NULL,
  content    TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 遊戲分數
CREATE TABLE scores (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT NOT NULL,
  score INTEGER NOT NULL,
  date  TEXT NOT NULL
);

-- 新聞按讚
CREATE TABLE news_likes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  news_title TEXT NOT NULL,
  news_link  TEXT NOT NULL,
  likes      INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 新聞留言
CREATE TABLE news_comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  news_title TEXT NOT NULL,
  news_link  TEXT NOT NULL,
  username   TEXT NOT NULL,
  content    TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 新聞評論分析
CREATE TABLE news_commentary (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  category          TEXT NOT NULL,
  original_title    TEXT NOT NULL,
  original_link     TEXT NOT NULL,
  source_name       TEXT NOT NULL,
  rewritten_headline TEXT NOT NULL,
  event_summary     TEXT NOT NULL,
  analysis_content  TEXT NOT NULL,
  embed_url         TEXT DEFAULT '',
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 聯絡表單
CREATE TABLE contact_messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  subject    TEXT NOT NULL,
  message    TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 電子報訂閱
CREATE TABLE subscribers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 文章按讚（多元組合去重）
CREATE TABLE post_likes (
  post_id    INTEGER NOT NULL,
  user_id    INTEGER NOT NULL DEFAULT 0,
  session_id TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, user_id, session_id)
);

-- 文章檢舉（多元組合去重）
CREATE TABLE post_reports (
  post_id    INTEGER NOT NULL,
  user_id    INTEGER NOT NULL DEFAULT 0,
  session_id TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, user_id, session_id)
);
```

---

## API 文件

### 部落格

| 方法 | 路徑 | 功能 | 參數 | 回傳 |
|------|------|------|------|------|
| GET | `/` | 首頁文章列表 | `?page=1&tag=xxx` | EJS HTML |
| GET | `/post/new` | 新增文章表單 | — | EJS HTML |
| POST | `/posts` | 儲存新文章 | `title, content, summary, tags` | 302 Redirect |
| GET | `/post/:id` | 文章檢視 | — | EJS HTML |
| GET | `/post/:id/edit` | 編輯文章表單 | — | EJS HTML |
| POST | `/post/:id/update` | 更新文章 | `title, content, summary, tags` | 302 Redirect |
| POST | `/post/:id/delete` | 刪除文章 | — | 302 Redirect |

### 搜尋

| 方法 | 路徑 | 功能 | 參數 | 回傳 |
|------|------|------|------|------|
| GET | `/api/search` | SQL LIKE 搜尋 | `?q=keyword` | JSON |
| GET | `/api/search-index` | 完整搜尋索引 | — | JSON |

### 標籤

| 方法 | 路徑 | 功能 | 回傳 |
|------|------|------|------|
| GET | `/api/tags` | 熱門標籤 (依文章數排序) | JSON |
| GET | `/api/tags/:name/posts` | 指定標籤的文章列表 | JSON |

### 圖片上傳

| 方法 | 路徑 | 功能 | 參數 | 限制 |
|------|------|------|------|------|
| POST | `/api/upload` | 上傳圖片 | `image` (FormData) | 5MB, jpg/png/gif/webp/svg |
| POST | `/api/upload/url` | 註冊圖片 URL | `url` | — |

### 使用者認證

| 方法 | 路徑 | 功能 | 參數 |
|------|------|------|------|
| POST | `/api/auth/register` | 註冊（bcrypt 雜湊） | `username, nickname, password` |
| POST | `/api/auth/login` | 登入（建立 Session） | `username, password` |
| POST | `/api/auth/logout` | 登出（銷毀 Session） | — |
| GET | `/api/auth/me` | 取得當前登入使用者 | — |

### 瀏覽數

| 方法 | 路徑 | 功能 |
|------|------|------|
| GET | `/api/posts/:id/views` | 取得文章瀏覽數 |

### 隨筆 (Notes)

| 方法 | 路徑 | 功能 |
|------|------|------|
| GET | `/api/notes` | 所有隨筆 |
| POST | `/api/notes` | 新增隨筆 |
| POST | `/api/notes/:id/like` | 按讚 |
| POST | `/api/notes/:id/report` | 檢舉 |
| GET | `/api/notes/:id/comments` | 留言列表 |
| POST | `/api/notes/:id/comments` | 新增留言 |

### 關聯推薦

| 方法 | 路徑 | 功能 |
|------|------|------|
| GET | `/api/posts/:id/related` | 依共同標籤推薦最多 5 篇 |

### 新聞

| 方法 | 路徑 | 功能 |
|------|------|------|
| GET | `/api/news/taiwan` | RSS 聚合 (UDN + ETtoday + 自由) |
| GET | `/api/news/world` | RSS 國際新聞 (BBC + CNN) |
| GET | `/api/news/likes` | 所有新聞按讚數 |
| POST | `/api/news/like` | 按讚/追加之 |
| GET | `/api/news/comments` | 指定新聞留言 |
| POST | `/api/news/comment` | 新增新聞留言 |

### 新聞評論分析

| 方法 | 路徑 | 功能 |
|------|------|------|
| GET | `/api/news/commentary/:category` | 依分類取得評論 |
| POST | `/api/news/commentary` | 新增評論 |
| PUT | `/api/news/commentary/:id` | 更新評論 |
| DELETE | `/api/news/commentary/:id` | 刪除評論 |

### 股市行情

| 方法 | 路徑 | 功能 |
|------|------|------|
| GET | `/api/market/crypto` | 加密貨幣報價 (BTC/ETH/SOL 等 10 種) |
| GET | `/api/market/tw-stock` | 台股報價 (加權指數、台積電等 15 檔) |
| GET | `/api/market/us-stocks` | 美股報價 (S&P 500、AAPL 等 15 檔) |

### 遊戲

| 方法 | 路徑 | 功能 |
|------|------|------|
| GET | `/api/scores` | 前 5 名排行榜 |
| POST | `/api/scores` | 提交分數 |

### 靜態頁面

| 方法 | 路徑 | 功能 |
|------|------|------|
| GET | `/about` | 關於頁面 (EJS) |
| GET | `/contact` | 聯絡表單 (EJS) |
| POST | `/contact` | 送出聯絡訊息 |
| GET | `/privacy` | 隱私權政策 (EJS) |

### 其他

| 方法 | 路徑 | 功能 |
|------|------|------|
| GET | `/rss.xml` | RSS 2.0 Feed (最新 20 篇，自動偵測 HTTP/HTTPS) |
| GET | `/sitemap.xml` | XML Sitemap (含靜態頁面 + 文章) |
| POST | `/api/subscribe` | 電子報訂閱 (SQLite 持久化，去重保護) |

---

## 功能模組詳解

### 1. 部落格 CRUD

路由表：

| 方法 | 路徑 | 功能 | 樣板 |
|------|------|------|------|
| GET | `/` | 首頁（雙欄佈局、橫幅圖片、分頁列表、側邊欄搜尋與標籤雲） | `index.ejs` |
| GET | `/post/new` | 新增文章表單 | `new.ejs` |
| POST | `/posts` | 儲存新文章（含標籤） | — |
| GET | `/post/:id` | 文章檢視 + TOC + 關聯推薦 + 留言 | `post.ejs` |
| GET | `/post/:id/edit` | 編輯文章表單 | `edit.ejs` |
| POST | `/post/:id/update` | 更新文章（含 `updated_at`） | — |
| POST | `/post/:id/delete` | 刪除文章（含確認對話框） | — |

**首頁分頁查詢：**

```javascript
router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  const tagFilter = req.query.tag || '';

  // 依有無標籤篩選，分別使用不同 SQL
  let countSql, listSql;
  if (tagFilter) {
    countSql = `SELECT COUNT(*) FROM posts p
      JOIN post_tags pt ON p.id = pt.post_id
      JOIN tags t ON pt.tag_id = t.id WHERE t.name = ?`;
    listSql = `SELECT p.* FROM posts p ... WHERE t.name = ?
      ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
  } else {
    countSql = 'SELECT COUNT(*) as total FROM posts';
    listSql = 'SELECT * FROM posts ORDER BY created_at DESC LIMIT ? OFFSET ?';
  }
  // 先算總數 → 再查該頁文章 → 最後撈標籤組合 → 渲染
});
```

**首頁佈局**：採用雙欄設計（主欄 68% + 側邊欄 28%），頂部顯示 940px 橫幅圖片，側邊欄包含搜尋框與標籤雲。

**標籤篩選**：點擊標籤連結 (`/?tag=標籤名`) 可篩選特定標籤的文章，頁面會顯示目前篩選的標籤與清除按鈕。

**關聯推薦**：文章檢視頁底部自動推薦最多 5 篇含共同標籤的文章。

---

### 2. Markdown 編輯器

位於 `new.ejs` / `edit.ejs`，提供完整編輯體驗：

- **工具列**：粗體、斜體、標題 H2/H3、清單、編號、程式碼區塊、連結、圖片、引用
- **編輯/預覽分頁**：切換至預覽時以 marked 即時渲染 HTML
- **圖片上傳**：點擊「上傳圖片」→ 選取檔案 → `POST /api/upload` → 自動插入 `![檔名](URL)` 至游標位置
- **自動儲存草稿**：每 10 秒自動儲存至 `localStorage`，頁面載入時偵測草稿並詢問是否還原
- **Toast 通知**：圖片上傳成功/失敗右上角浮動提示

```javascript
// 圖片上傳核心
async function uploadImage(input) {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch('/s111410509/api/upload', { method: 'POST', body: formData });
  const data = await res.json();
  if (data.url) {
    const md = `![${file.name}](${data.url})`;
    // 插入至編輯器游標位置
    editor.value = editor.value.substring(0, start) + md + editor.value.substring(end);
  }
}
```

---

### 3. 搜尋引擎

**雙層搜尋架構：**

1. **伺服端 API** `GET /api/search?q=` — SQL `LIKE` 查詢標題與內容，回傳最多 20 筆
2. **客戶端搜尋索引** `GET /api/search-index` — 頁面初始化時快取所有文章的輕量 JSON

**客戶端評分比對演算法：**

```javascript
const scored = index.map(item => {
  let score = 0;
  const title   = (item.title   || '').toLowerCase();
  const excerpt = (item.excerpt || '').toLowerCase();
  const tags    = (item.tags    || []).join(' ').toLowerCase();
  for (const term of terms) {
    if (title.includes(term))   score += 10;  // 標題權重最高
    if (tags.includes(term))    score += 5;   // 標籤次之
    if (excerpt.includes(term)) score += 3;   // 內文最低
  }
  return { item, score };
}).filter(s => s.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, 20);
```

搜尋結果支援關鍵字高亮顯示，部落格頁面可按 `Ctrl+K` 或 `Cmd+K` 快速啟用搜尋。

---

### 4. 水墨動畫背景

位於 `ink_background.js`，以 Canvas 2D 實作的粒子系統。  
全部程式碼包裹在 **IIFE** 內，避免 `const canvas` / `const ctx` 與遊戲腳本的全域命名衝突。

```javascript
(function() {
const canvas = document.getElementById('inkCanvas');
if (!canvas) return;  // 無 inkCanvas 的頁面跳過
const ctx = canvas.getContext('2d');

const THEME_COLORS = {
  light: { bg: [242, 240, 233], ink: [0, 0, 0] },
  dark:  { bg: [26, 26, 26],   ink: [200, 200, 200] }
};
// ...
window.createInk = createInk;   // 暴露給 maze.js 呼叫
window.inkBg = { updateTheme };
})();
```

- **`InkParticle` 類別**：每個墨點具有位置 (x, y)、大小、透明度、擴散速度 (`growSpeed`)、淡出速度 (`fadeSpeed`)
- **`createInk(x, y, count, isAuto)`**：在指定座標產生墨點，`isAuto` 控制隨機擴散範圍；透過 `window.createInk` 暴露，供遊戲腳本撞牆特效呼叫
- **主循環 `animate()`**：每幀以半透明背景疊加產生殘影效果 (`rgba(bg, 0.05)`)
- **互動機制**：
  - 滑鼠移動：20% 機率噴 1 點
  - 滑鼠點擊：噴 5 點
  - 自動產生：每 2 秒，上限 50 點
- **主題支援**：透過 `window.inkBg.updateTheme()` 讀取 `data-theme` 屬性（部分頁面保留）

---

### 5. 經典部落格主題

首頁採用仿 WordPress 風格的經典部落格佈局：

**視覺設計：**
- **底色**：淺灰背景 `#f1f1f1` + 白色容器 `#fff`
- **字型**：`Helvetica Neue` / `Arial` 無襯線字體（標題使用 `Georgia` 襯線字體）
- **導覽列**：黑色水平全寬列，白色文字，懸停底線效果
- **首頁橫幅**：940×198px Unsplash 森林自然圖片
- **頁尾**：單行 flex 佈局（品牌名 + 版權 + 連結）

**雙欄佈局：**
```
內容區 (content-area)
  ├── 主要欄位 (main-column) — 68% 寬度
  │   ├── 搜尋列
  │   ├── 文章列表
  │   └── 分頁按鈕
  └── 側邊欄 (sidebar) — 28% 寬度
      ├── 搜尋小工具
      └── 標籤雲
```

**色彩系統：**
| 用途 | 顏色 |
|------|------|
| 頁面背景 | `#f1f1f1` |
| 容器背景 | `#fff` |
| 主文字 | `#333` |
| 標題 | `#000` |
| 連結/懸停 | `#0066cc` |
| 導覽列 | `#000` |
| 頁尾裝飾線 | `#000`（4px 粗） |

---

### 6. RSS / Sitemap / SEO

#### RSS Feed (`GET /rss.xml`)

標準 RSS 2.0 格式，包含最新 20 篇文章：

```xml
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>墨 - 網誌</title>
    <link>http://localhost:3000/s111410509/</link>
    <description>墨 - 紀錄瞬間的思緒</description>
    ...
    <item>
      <title><![CDATA[文章標題]]></title>
      <link>http://localhost:3000/s111410509/post/1</link>
      <description><![CDATA[前 500 字純文字摘要]]></description>
      <pubDate>...</pubDate>
      <guid>http://localhost:3000/s111410509/post/1</guid>
    </item>
  </channel>
</rss>
```

#### Sitemap (`GET /sitemap.xml`)

自動產生包含所有文章 URL 及靜態頁面（`/`、`/about`、`/contact`）的 XML Sitemap，每篇文章標記 `changefreq=weekly`、`priority=0.8`，靜態頁面為 `monthly`。

> RSS 與 Sitemap 均使用 `req.protocol` 動態偵測 HTTP/HTTPS，支援反向代理後的 TLS 環境。

#### SEO 標籤

每篇文章自動生成：
- **Open Graph**：`og:title`、`og:description`、`og:type=article`、`og:url`
- **Twitter Card**：`twitter:card=summary`
- **JSON-LD**：嵌入 `Article` 結構化資料 (Schema.org)
- **Canonical URL**：防止重複內容
- **Meta Description**：自動取用文章摘要或前 160 字
- **Robots**：編輯/新增頁面標示 `noindex`

---

### 7. 圖片上傳

採用 `multer` 中介軟體處理檔案上傳：

```javascript
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);  // UUID 重新命名避免衝突
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },  // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  }
});
```

**特性：**
- 支援格式：jpg, jpeg, png, gif, webp, svg
- 大小限制：5MB
- 儲存位置：`public/uploads/`（自動建立目錄）
- 重新命名：UUID v4 保留副檔名
- 可擴充：修改 `storage` 即可切換至 AWS S3

---

### 8. 使用者認證

採用 **bcrypt** + **express-session** 的安全認證系統：

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/auth/register` | 註冊：`{ username, nickname, password }` |
| POST | `/api/auth/login` | 登入：`{ username, password }` |
| POST | `/api/auth/logout` | 登出 |
| GET | `/api/auth/me` | 取得當前 Session 使用者 |

流程：
1. 客戶端提交帳號密碼
2. 註冊時伺服器以 `bcrypt.hash(password, 12)` 雜湊儲存
3. 登入時伺服器以 `bcrypt.compare()` 驗證
4. 驗證成功後建立 `express-session`（httpOnly Cookie + SQLite 儲存）
5. 客戶端可透過 `GET /api/auth/me` 驗證 Session 有效性
6. 登出時呼叫 `POST /api/auth/logout` 銷毀 Session

---

### 9. 安全防護機制

#### bcrypt 密碼雜湊

```javascript
const hash = await bcrypt.hash(password, 12);   // 註冊
const match = await bcrypt.compare(password, user.password);  // 登入
```

salt rounds = 12，密碼絕不以明文儲存。

#### express-session

```javascript
app.use(session({
  store: new SQLiteStore({ db: 'sessions.db' }),
  secret: SESSION_SECRET,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 }
}));
```

- Session 儲存於 `sessions.db`（connect-sqlite3）
- Cookie 標記 `httpOnly`、`sameSite=lax`
- 支援多執行個體共享

#### helmet

```javascript
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
```

自動設定安全相關 HTTP 標頭（X-Frame-Options、X-Content-Type-Options、Strict-Transport-Security 等）。

#### express-rate-limit

```javascript
const apiLimiter = rateLimit({ windowMs: 15*60*1000, max: 100 });  // API 通用
const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 20 });  // 認證專用
```

| 限制器 | 範圍 | 上限 | 時窗 |
|--------|------|------|------|
| API | `/api/*` | 100 次 | 15 分鐘 |
| 認證 | `/api/auth/*` | 20 次 | 15 分鐘 |

#### morgan 日誌

自動記錄所有 HTTP 請求（ISO 時間、方法、URL、狀態碼、回應時間）。

---

### 10. 隨筆小站

位於 `public/index.html` + `public/script.js`，提供極簡短貼文功能：

- 輸入框 + 落筆按鈕 → `POST /api/notes`
- 貼文卡片列表 → `GET /api/notes`
- 按讚 (`POST /api/notes/:id/like`)
- 檢舉 (`POST /api/notes/:id/report`)
- 留言系統 (`GET/POST /api/notes/:id/comments`)
- 需登入才能操作
- 所有路徑改為 JavaScript 動態解析 `BASE`（`window.location.pathname`），不再硬編碼 `/s111410509`

---

### 11. 遊戲模組

三款遊戲均採用統一的 **深色霓虹視覺風格**（`#0f172a` 深藍底色），並共用專案的主題切換、水墨背景與排行榜系統。

#### 墨跡貪吃蛇 (`snake.js`)

- **遊戲引擎**：`requestAnimationFrame` 驅動，幀率控制（約 15 FPS）
- **視覺**：霓虹藍蛇身 `#38bdf8` + 粉紅食物 `#f43f5e` + CSS `shadowBlur` 發光效果
- **機制**：20px 網格移動、穿牆（從另一端出現）、吃食物增長加分
- **碰撞**：撞到自己 → Game Over → 自動提交分數 → 1.5 秒後重生
- **操作**：方向鍵 + WASD（桌面）、滑動手勢（行動裝置）
- **分數提交**：名稱「無名書生」

```javascript
// 遊戲主循環 — requestAnimationFrame + 幀率控制
function loop() {
  requestAnimationFrame(loop);
  if (++count < 6) return;
  count = 0;
  // ...更新邏輯與繪製
}
```

#### 捕墨打地鼠 (`whack.js`)

- 3×3 九宮格，墨點隨機彈出（600-1200ms 間隔，隨時間加速）
- 30 秒倒數計時
- 連擊系統：連續命中 3 次得 2 分、5 次得 3 分
- 點擊命中 → 浮動 `+N` 分數動畫 + 墨花濺射（CSS `@keyframes splash`）
- 最高分紀錄於 `localStorage`（跨遊戲階段保留）
- 分數提交名稱：「捕墨手」

```css
@keyframes splash {
  to { transform: scale(1.5); opacity: 0; filter: blur(10px); }
}
```

#### 墨陣迷宮 (`maze.js`)

- **演算法**：遞迴回溯法（Recursive Backtracking / DFS），產生完美迷宮（任意兩點間僅一條路徑）
- **視覺**：深色 Canvas 背景 `#1e293b`、牆壁 `#475569`、玩家光點 `#38bdf8`（外發光）、終點 `#f43f5e`（發光圓球）
- **操作**：方向鍵 / WASD + 觸控滑動
- **碰撞**：撞牆 → `createInk()` 水墨噴濺特效 → 退回起點，步數重置
- **關卡遞增**：過關後點擊「下一關」，迷宮尺寸從 **6×6** 遞增至最大 **18×18**
- **計分**：`max(200 − 失誤×10 − 步數 + 關卡×20, 1)`
- **分數提交**：名稱「墨陣行者」

---

### 12. 時事新聞聚合

位於 `news.html` + `server.js` 伺服端 RSS 聚合：

**雙分頁系統：**
- **台灣新聞**：使用 `rss-parser` 聚合三大新聞源
  - UDN 聯合報、ETtoday、自由時報
  - 各取前 10 則，依來源標色
- **國際新聞**：BBC + CNN RSS 聚合

**互動功能：**
- 按讚：`POST /api/news/like`（資料庫持久化）
- 留言：`POST /api/news/comment`（自動填入使用者暱稱）
- 分頁切換：`switchTab()` 切換台灣/國際分頁

---

### 13. 排行榜

位於 `leaderboard.html`，簡單的遊戲分數排名：

```javascript
// GET /api/scores — 回傳前 5 名
db.all('SELECT name, score, date FROM scores ORDER BY score DESC LIMIT 5', ...);
```

---

### 14. 靜態頁面（關於 / 聯絡 / 隱私權）

三個 EJS 伺服端渲染頁面，使用 Express Router 統一掛載：

| 頁面 | 路由 | 功能 |
|------|------|------|
| 關於 | `GET /about` | 網站介紹、寫作初衷、技術棧、價值主張 |
| 聯絡 | `GET /contact` | 聯絡表單（姓名、Email、主旨、訊息） |
| 聯絡（送出） | `POST /contact` | 表單驗證 → 寫入 `contact_messages` 表 → 成功/錯誤提示 |
| 隱私權 | `GET /privacy` | 資料收集與 Cookie 政策說明 |

**聯絡表單流程：**

```javascript
router.post('/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.render('contact', { success: false, error: '所有欄位皆為必填' });
  }
  // INSERT INTO contact_messages ...
  res.render('contact', { success: true, error: null });
});
```

**Sitemap 整合**：`/about` 與 `/contact` 自動加入 `/sitemap.xml`，分別標記 `monthly` 更新頻率與 0.6 / 0.4 優先權。

---

## 部署指南

### 本地部署

```bash
git clone <repository-url>
cd mid/program
npm install
npm start
# → http://localhost:3000/s111410509/
```

### 區域網路共享

啟動後終端機會顯示區域網路 IP，其他裝置可用 `http://你的IP:3000/s111410509/` 連線。

### 線上部署 (建議)

**使用 PM2 (背景執行)：**
```bash
npm install -g pm2
pm2 start server.js --name "ink-blog"
pm2 save
pm2 startup
```

**使用反向代理 (Nginx)：**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /s111410509/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**環境變數：**
| 變數 | 預設值 | 說明 |
|------|--------|------|
| `PORT` | `3000` | 伺服器連接埠（設為 `80` 或 `443` 可免打埠號） |
| `BASE` | `/s111410509` | 基礎路徑前綴 |

---

## 技術債與未來展望

- ~~密碼安全：目前密碼以明文儲存~~ ✅ **已解決** — 採用 `bcrypt` (salt=12) 雜湊儲存
- ~~留言驗證：缺乏 XSS 防護與 Rate Limiting~~ ✅ **已解決** — 導入 `helmet` + `express-rate-limit`
- ~~Session 管理：目前採用 `localStorage` 簡易方案~~ ✅ **已解決** — 導入 `express-session` + SQLite Store + httpOnly Cookie
- **國際新聞來源**：目前使用 BBC + CNN RSS，可考慮擴充更多來源
- **資料庫備份**：生產環境建議定期備份 `blog.db`
- **響應式設計**：部分遊戲頁面在手機上體驗有限，可考慮進一步觸控最佳化
- **載入效能**：首頁可加入圖片懶載入 (`loading="lazy"`) 與無限捲動
- **單元測試**：目前無測試覆蓋，建議加入 `jest` 或 `mocha`

---

## 更新紀錄

| 日期 | 變更 |
|------|------|
| 2026-05 | 全面改版為經典部落格主題（仿 WordPress 雙欄佈局，移除深色模式） |
| 2026-05 | 新增「關於、聯絡表單、隱私權政策」三個 EJS 靜態頁面 |
| 2026-05 | 新增 `contact_messages` 資料表與聯絡表單後端邏輯 |
| 2026-05 | 修復 `ink_background.js` 全域 `const` 與遊戲腳本命名衝突（包裹 IIFE） |
| 2026-05 | 貪吃蛇改為 `requestAnimationFrame` 驅動 + 霓虹視覺風格 |
| 2026-05 | 迷宮改為 DFS 遞迴回溯演算法 + 深色霓虹視覺風格 |
| 2026-05 | 伺服器加入 `EADDRINUSE` 自動 fallback 埠號機制 |
| 2026-05 | 修復 `POST /api/news/like` 競爭條件（重新查詢實際讚數） |
| 2026-05 | RSS/Sitemap 改用 `req.protocol` 動態偵測 HTTP/HTTPS |
| 2026-05 | 搜尋索引 URL 前綴改為動態 `BASE` 變數 |
| 2026-05 | 文章新增支援動態 `user_id`（讀取 `x-user-id` 標頭） |
| 2026-05 | 修復圖片上傳按鈕選擇器（`button:last-child` → `[onclick*="imageUpload"]`） |
| 2026-05 | 導入 `bcrypt` 密碼雜湊（salt=12），取代明文儲存 |
| 2026-05 | 導入 `express-session` + `connect-sqlite3` Session 管理 |
| 2026-05 | 導入 `helmet` 安全標頭中介軟體 |
| 2026-05 | 導入 `express-rate-limit` 請求限制（API 100 次、認證 20 次 / 15分） |
| 2026-05 | 新增 `subscribers`、`post_likes`、`post_reports` 資料表 |
| 2026-05 | 新增 `POST /api/auth/logout` 與 `GET /api/auth/me` API |
| 2026-05 | 新增 `GET /api/posts/:id/views` 瀏覽數 API |
| 2026-05 | 新增 `views/error.ejs` 自訂錯誤頁（404/500） |

---

*本專案為金門大學資訊工程系網頁設計課程作業，僅供學習用途。*

---

### 15. 參考

https://tw.wordpress.org/themes/twentyten/ 布景格式
