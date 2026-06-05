完全AI製作，我負責輸入我想要的版面指令引導 AI 新增模組與修改功能。運用標籤雲提升整體美感
# WP 專案總覽

<p align="center">
  <strong>吳嘉恩</strong> · 國立金門大學 資訊工程學系 · s111410509
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express-000000?logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/SQLite3-044a64?logo=sqlite&logoColor=white" alt="SQLite3">
  <img src="https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/EJS-A91E50?logo=ejs&logoColor=white" alt="EJS">
</p>

一頁式靜態網站，集中展示 `wp/_wp` 內所有專案。採用暗色主題、3D 技術標籤雲、粒子背景。

---

作業製作說明
本學期所有作業主要透過AI協助完成,使用了OPENCODE、Gemini、Claude

###使用的 AI 工具

Gemini:專案內容討論、尋求開發建議、方向規劃、修改建議
OpenCode:程式碼撰寫與實作和偵錯除錯

---

## 目錄

- [專案架構](#專案架構)
- [內容總覽](#內容總覽)
  - [AI 部落格系統](#1-ai-部落格系統)
  - [墨 · Ink 部落格（期中專案）](#2-墨--ink-部落格期中專案)
  - [HTML 作品](#3-html-作品)
  - [JavaScript 練習](#4-javascript-練習)
- [快速開始](#快速開始)
- [目錄結構](#目錄結構)
- [技術標籤雲](#技術標籤雲)
- [授權](#授權)

---

## 專案架構

```
_wp/                          ← 總倉庫根目錄
├── portfolio/                ← 本專案（入口頁面）
│   ├── index.html            ← 主頁（暗色主題、3D 標籤雲、粒子背景）
│   └── README.md             ← 本文件
├── AI/                       ← AI 部落格系統（全端）
│   ├── server.js             ← 主伺服器（Express + SQLite3）
│   ├── selo.js               ← 進階版（含約會配對系統）
│   ├── public/index.html     ← 前端頁面
│   └── blog.db               ← SQLite 資料庫
├── mid/program/              ← 期中專案 · 墨 Ink 部落格
│   ├── server.js             ← 主伺服器
│   ├── views/                ← EJS 樣板（首頁、文章、關於、聯絡等）
│   ├── public/               ← 靜態資源
│   │   ├── index.html        ← 隨筆小站
│   │   ├── snake.html        ← 貪食蛇
│   │   ├── whack.html        ← 打地鼠
│   │   ├── maze.html         ← 迷宮
│   │   ├── news.html         ← 時事新聞
│   │   ├── market.html       ← 股市/加密貨幣行情
│   │   ├── leaderboard.html  ← 排行榜
│   │   ├── login.html        ← 登入頁
│   │   ├── ink_background.js ← 水墨動畫粒子背景
│   │   └── uploads/          ← 上傳圖片
│   └── blog.db               ← SQLite 資料庫
├── homework/                 ← 作業練習
│   ├── form.html             ← HTML 表單設計
│   ├── personaldata.html     ← 個人資料頁面
│   ├── math1/                ← JavaScript 函數練習（10 題）
│   ├── Understanding Blog/   ← JS 概念練習（10 題）
│   ├── java/js/              ← 基礎 JS 練習（10 題）
│   ├── js  practise/         ← JS 實作練習（10 題）
│   ├── 03/                   ← 基本練習
│   └── 04/                   ← 進階練習（11 題）
└── blog.db                   ← AI 部落格資料庫
```

---

## 內容總覽

### 1. AI 部落格系統

**技術棧：** Node.js + Express + SQLite3 (sql.js) + 原生 HTML/CSS/JS

全端部落格系統，支援用戶註冊/登入、文章 CRUD、留言、交友、按讚/倒讚、分享等功能。

**功能列表：**

| 功能 | 說明 |
|------|------|
| 用戶認證 | 註冊、登入、登出（SHA256 密碼加密） |
| 文章 CRUD | 發布、編輯、刪除、列表瀏覽（公開） |
| 留言系統 | 新增、刪除留言 |
| 交友系統 | 瀏覽用戶、發送邀請、接受/拒絕、移除好友 |
| 按讚/倒讚 | 每用戶每篇文章限一次，公開顯示計數 |
| 分享功能 | 支援 Facebook、Twitter、Line、複製連結 |
| 公開瀏覽 | 文章、留言、按讚數無需登入即可查看 |

**API 端點：**


| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/register` | 註冊新用戶 |
| POST | `/login` | 登入 |
| POST | `/logout` | 登出 |
| GET | `/blog` | 取得所有文章（公開） |
| GET | `/blog/:id` | 取得單篇文章（公開） |
| POST | `/blog` | 發布文章 |
| PUT | `/blog/:id` | 編輯文章 |
| DELETE | `/blog/:id` | 刪除文章 |
| GET/POST/DELETE | `/blog/:id/comments` | 留言 CRUD |
| GET | `/users` | 所有用戶列表 |
| GET/POST/PUT/DELETE | `/friends` | 交友 CRUD |
| GET/POST/DELETE | `/posts/:id/likes` | 按讚/倒讚 |
| GET/POST | `/posts/:id/shares` | 分享 |

**啟動方式：**
```bash
cd AI
npm install
node server.js
# 或使用進階版（含約會配對）
node selo.js
# 開啟 http://localhost:3000
```

---

### 2. 墨 · Ink 部落格（期中專案）

**技術棧：** Node.js + Express + SQLite3 + EJS + Vanilla JavaScript

全功能部落格系統，包含 Markdown 編輯器、圖片上傳、RSS/Sitemap、客戶端搜尋引擎、新聞聚合、股市/加密貨幣行情、三款遊戲（貪食蛇、打地鼠、迷宮）、排行榜、聯絡表單。採用經典 WordPress 風格雙欄佈局，搭配水墨動畫 Canvas 粒子背景。

**功能列表：**

| 功能模組 | 說明 |
|----------|------|
| 📝 部落格 CRUD | 文章新增/編輯/刪除/列表，支援分頁與標籤篩選 |
| ✏️ Markdown 編輯器 | 工具列（粗體/標題/程式碼區塊/圖片等）、即時預覽、草稿自動儲存 |
| 🔍 客戶端搜尋 | 雙層架構（SQL LIKE + 客戶端索引評分），支援 `Ctrl+K` 快捷鍵 |
| 🎨 水墨動畫背景 | Canvas 粒子系統，滑鼠互動、深色模式自動切換 |
| 🖼️ 經典部落格主題 | 仿 WordPress 雙欄佈局，黑白灰色調 |
| 📡 RSS / Sitemap | 標準 RSS 2.0 + XML Sitemap，支援 SEO |
| 🖼 圖片上傳 | 拖放/選取上傳，UUID 重新命名，5MB 限制 |
| 👤 使用者認證 | 註冊/登入（localStorage Token） |
| 🐍 貪食蛇 | 20×20 Canvas，霓虹視覺風格，分數提交 |
| 🎯 打地鼠（捕墨） | 3×3 九宮格反應遊戲，連擊系統，墨花濺射動畫 |
| 🏃 迷宮（墨陣） | DFS 遞迴回溯演算法，關卡遞增（6×6→18×18） |
| 📰 時事新聞 | RSS 聚合（UDN + ETtoday + 自由時報）+ 國際新聞 |
| 📊 股市/加密貨幣行情 | 即時行情顯示 |
| 🏆 排行榜 | SQL 排序取前 5 名 |
| ℹ️ 關於 / 聯絡 / 隱私權 | EJS 伺服端渲染靜態頁面 |

**API 端點：**

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/` | 首頁文章列表（分頁 + 標籤篩選） |
| GET/POST | `/posts` | 文章 CRUD |
| GET/POST | `/post/:id` | 文章檢視/更新/刪除 |
| GET | `/api/search` | SQL LIKE 搜尋 |
| GET | `/api/search-index` | 完整搜尋索引 |
| GET | `/api/tags` | 熱門標籤 |
| POST | `/api/upload` | 圖片上傳 |
| POST | `/api/auth/register` | 註冊 |
| POST | `/api/auth/login` | 登入 |
| GET/POST | `/api/notes` | 隨筆 CRUD |
| GET | `/api/news/taiwan` | 台灣新聞 RSS 聚合 |
| GET | `/api/news/world` | 國際新聞 |
| GET/POST | `/api/scores` | 遊戲排行榜 |
| GET | `/rss.xml` | RSS Feed |
| GET | `/sitemap.xml` | XML Sitemap |

**啟動方式：**
```bash
cd mid/program
npm install
node server.js
# 開啟 http://localhost:3000/s111410509/
```

**可直接開啟的靜態頁面：**
- [靜態部落格](../mid/program/public/classic-blog.html)
- [貪食蛇](../mid/program/public/snake.html)
- [打地鼠](../mid/program/public/whack.html)
- [迷宮](../mid/program/public/maze.html)
- [新聞](../mid/program/public/news.html)
- [行情](../mid/program/public/market.html)
- [排行榜](../mid/program/public/leaderboard.html)
- [登入](../mid/program/public/login.html)

---

### 3. HTML 作品

#### 表單設計
完整 HTML 表單範例，包含 15+ 種輸入類型（文字、Email、密碼、數字、電話、日期、顏色、檔案上傳、下拉選單、checkbox、radio 等），採用現代 CSS 樣式美化。

- [開啟頁面](../homework/form.html)
- 技術：HTML5 + CSS3

#### 個人資料頁面
個人介紹頁面，包含自我介紹、技能標籤（羽球、C/C++、SQL、Linux）、興趣愛好與聯絡按鈕。

- [開啟頁面](../homework/personaldata.html)
- 技術：HTML5 + CSS3

---

### 4. JavaScript 練習

所有練習均為 Node.js 腳本，需在命令列執行：

```bash
node 檔名.js
```

| 目錄 | 題數 | 涵蓋主題 |
|------|------|----------|
| `math1/` | 10 | Callback、IIFE、Arrow Function、Closure、Filter、setTimeout |
| `Understanding Blog/` | 10 | 解構、forEach、JSON、Error-first callback、權限檢查 |
| `java/js/` | 10 | 奇偶數、購物車、平均成績、九九乘法表、庫存系統 |
| `js  practise/` | 10 | 同 java/js 系列，不同實作 |
| `04/` | 11 | helloworld、成績管理、購物車、數列、倒數 |
| `03/` | 1 | 基本 hello world |

---

## 快速開始

### 瀏覽入口頁面

直接使用瀏覽器開啟：

```bash
portfolio/index.html
```

### 啟動 AI 部落格

```bash
cd AI
npm install
node server.js
# 連線 http://localhost:3000
```

### 啟動墨 · Ink 部落格

```bash
cd mid/program
npm install
node server.js
# 連線 http://localhost:3000/s111410509/
```

---

## 目錄結構

```
_wp/
├── portfolio/              # 本專案（入口總覽頁面）
│   ├── index.html          # 暗色主題入口頁
│   └── README.md
├── AI/                     # AI 部落格系統
│   ├── server.js           # 主伺服器
│   ├── selo.js             # 進階版（含約會配對）
│   ├── public/index.html   # 前端
│   ├── blog.db             # 資料庫
│   ├── package.json
│   └── README.md
├── mid/
│   └── program/            # 墨 · Ink 部落格（期中專案）
│       ├── server.js
│       ├── views/          # EJS 樣板
│       ├── public/         # 靜態頁面與遊戲
│       ├── blog.db
│       ├── package.json
│       └── README.md
├── homework/               # 作業練習
│   ├── form.html           # HTML 表單
│   ├── personaldata.html   # 個人資料
│   ├── math1/              # JS 練習
│   ├── Understanding Blog/ # JS 練習
│   ├── java/js/            # JS 練習
│   ├── js  practise/       # JS 練習
│   ├── 03/                 # 基本練習
│   └── 04/                 # 進階練習
└── blog.db                 # AI 部落格資料庫
```

---

## 技術標籤雲

入口頁面首頁的 3D 球體標籤雲，支援以下互動：

- 🖱 **拖曳旋轉** — 滑鼠拖曳自由旋轉球體
- 🔍 **懸浮高亮** — 滑鼠懸停時標籤發光，顯示 tooltip
- 👆 **點擊定位** — 點擊標籤滾動至專案區
- 🔄 **自動旋轉** — 閒置 2 秒後恢復自動旋轉
- 📱 **觸控相容** — 支援觸控裝置手勢操作

涵蓋技術：Node.js、Express、SQLite3、EJS、HTML5、CSS3、JavaScript、REST API、bcrypt、Multer、Markdown、RSS、Canvas、SEO、Full-Stack、SQL、Linux、Git、JSON、AJAX、SPA、RWD、Auth

---

## 授權

本專案為國立金門大學資訊工程學系網頁設計課程作業，僅供學習用途。
