# 墨 — 系統再造記錄

> 以「修正」為核心的全面系統重構，記錄從原始簡陋部落格進化為全端內容平台的所有改造。

---

## 目錄

- [改造總覽](#改造總覽)
- [伺服器層 (server.js)](#伺服器層-serverjs)
- [檢視層 (EJS 模板)](#檢視層-ejs-模板)
- [客戶端功能 (public/)](#客戶端功能-public)
- [遊戲模組 (三合一)](#遊戲模組-三合一)
- [資料庫擴充](#資料庫擴充)
- [深色模式系統](#深色模式系統)
- [SEO 與社交分享](#seo-與社交分享)
- [錯誤修正清單](#錯誤修正清單)
- [diff 總結](#diff-總結)

---

## 改造總覽

| 面向 | 改造前 | 改造後 |
|------|--------|--------|
| EJS 模板數量 | 3（index, post, new） | 7（+edit, about, contact, privacy + partials） |
| 資料庫表格 | 6（users, posts, tags, post_tags, comments, scores） | 9（+news_likes, news_comments, news_commentary, contact_messages） |
| 遊戲數量 | 0 | 3（貪吃蛇, 捕墨打地鼠, 墨陣迷宮） |
| 深色模式 | 無 | 全站統一切換（localStorage 持久化 + 系統偏好偵測） |
| SEO | 無 | OG / Twitter Card / JSON-LD / Canonical / Sitemap / RSS |
| API 端點 | ~15 | ~30+ |
| 總檔案變更 | - | 26 個檔案，+2265 / -555 行 |

---

## 伺服器層 (server.js)

### 新增中介軟體與設定

```javascript
const Parser = require('rss-parser');
const { marked } = require('marked');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
```

- **marked**：Markdown → HTML 渲染（取代所有手動轉換）
- **multer + uuid**：圖片上傳儲存（5MB 限制，UUID 更名）
- **rss-parser**：RSS 新聞聚合

### 新增路由

#### 頁面路由
| 路由 | 方法 | 說明 |
|------|------|------|
| `/about` | GET | 關於頁面 |
| `/contact` | GET/POST | 聯絡表單（含資料庫儲存） |
| `/privacy` | GET | 隱私權政策 |
| `/notes` | GET | 隨筆小站入口 |

#### 新聞評論系統 (CRUD)
| 路由 | 方法 | 說明 |
|------|------|------|
| `/api/news/commentary/:category` | GET | 依分類取得評論 |
| `/api/news/commentary` | POST | 新增評論 |
| `/api/news/commentary/:id` | PUT | 更新評論 |
| `/api/news/commentary/:id` | DELETE | 刪除評論 |

#### RSS / Sitemap
| 路由 | 說明 |
|------|------|
| `/rss.xml` | 標準 RSS 2.0（最新 20 篇，CDATA 包裝） |
| `/sitemap.xml` | XML Sitemap（含静态頁面 + 文章頁面） |

#### 其他
| 路由 | 說明 |
|------|------|
| `/api/subscribe` | 電子報訂閱（記憶體暫存） |
| `/api/upload/url` | 註冊圖片 URL |
| `/api/news/taiwan` | 台灣新聞 RSS 聚合（UDN + ETtoday + 自由） |
| `/api/news/world` | 國際新聞 RSS（BBC + CNN） |

### 修復：埠號衝突自動降級

```javascript
function startServer(port) {
  const server = app.listen(port, '0.0.0.0');
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      startServer(port + 1);  // 自動嘗試下一埠
    }
  });
}
```

### 修復：database column migration

```javascript
db.run("ALTER TABLE posts ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP", err => err && null);
// 此 idiomatic 模式允許舊資料庫無痛升級
```

---

## 檢視層 (EJS 模板)

### index.ejs — 首頁全面重寫

- **導航欄**：引入 `partials/navbar`（所有頁面一致）
- **Hero 區域**：站點描述 + 快速動作（新文章、RSS、深色切換）
- **標籤雲**：即時從 API 載入依文章數排序
- **客戶端搜尋引擎**：
  - 快取所有文章的輕量 JSON 索引
  - 客戶端評分比對（標題權重 10、內文權重 3）
  - 關鍵字高亮、搜尋結果覆蓋文章列表
- **分頁 UI**：支援標籤篩選下的分頁連結
- **深色模式**：全站統一 `localStorage` + `data-theme` 屬性
- **Footer**：引入 `partials/footer`

改造前為純靜態頁面，無搜尋、無分頁、無標籤篩選、無主題切換。

### post.ejs — 文章頁全面重寫

新增功能：
- **閱讀進度條**：`#progressBar` 隨捲動填充漸層
- **浮動 TOC**：從 Markdown 標題自動生成（h2/h3），支援 active 追蹤
- **AI 摘要**：`post.summary` 區塊（標示紫色左框）
- **程式碼沙盒**：按下「▶ 執行」在 iframe 中安全執行
- **社交分享按鈕**：Facebook / LINE / Twitter
- **留言系統**：名稱輸入 + 內容 + 送出
- **電子報訂閱**：Email 輸入 + 訂閱按鈕
- **GitHub Discussions 區塊**：預留嵌入空間
- **回到頂部按鈕**：捲過 400px 後浮現
- **閱讀時間計算**：中文字數 / 500
- **Prism.js** 程式碼高亮（Tomorrow 主題 + 行號 + Autoloader）
- **刪除文章**：確認對話框 → POST 刪除

URL 路徑從 `/post?id=` 改為 `/post/:id`（RESTful）。

### new.ejs / edit.ejs — Markdown 編輯器

- **工具列**：粗體、斜體、H2、H3、無序/有序列表、程式碼區塊、連結、圖片、引用
- **編輯/預覽分頁**：marked 即時渲染
- **圖片上傳**：點擊按鈕 → 選擇檔案 → 自動插入 Markdown
- **Toast 通知**：圖片上傳成功/失敗浮動提示
- **自動儲存草稿**：每 10 秒存 `localStorage`，載入時還原
- **新增欄位**：標籤（逗號分隔）、AI 摘要、Meta 描述（SEO）

修復項目：
- 圖片上傳按鈕選擇器從 `button:last-child` 改為 `[onclick*="imageUpload"]`
- 編輯頁的草稿鍵值從固定值改為 `blog_draft_<%= post.id %>`（避免跨文章衝突）

### 新增模板

- `about.ejs`、`contact.ejs`、`privacy.ejs` — 靜態頁面
- `partials/navbar.ejs`、`partials/footer.ejs` — 全站共用組件

---

## 客戶端功能 (public/)

### blog.js — 改造 +19 行

- 移除全域 `const canvas` / `const ctx` 以避免與遊戲腳本命名衝突
- 改為 IIFE 包裹或函式作用域封裝
- 新增程式遊樂場（playground）的執行邏輯
- 新增 TOC 自動生成與 active 狀態追蹤

### ink_background.js — 修復 +6 行

- 原始問題：全域宣告 `const canvas`、`const ctx` 與 `maze.js` 衝突
- 修復方式：全部程式碼包裹在 IIFE 內
- 暴露 `window.createInk(x, y, count, isAuto)` 供 maze.js 撞牆特效呼叫
- 暴露 `window.inkBg.updateTheme()` 供深色模式動態切換

### script.js — +8 行

- 深色模式同步
- 隨筆小站的行為調整

### blog.js 搜尋引擎 — 完整重構

- 新增 `searchIndex` 快取 + 防重複請求（`searchIndexPromise`）
- 搜尋結果覆蓋文章列表（隱藏原始列表、顯示結果卡片）
- 支援 Ctrl+K / Cmd+K 快速啟用搜尋（post.ejs）

### style.css — +10 行

- 新增 CSS 變數系統（`--bg`, `--text`, `--accent`, `--bg-card`, `--tag-bg` 等）
- `data-theme` 屬性切換

### game_styles.css — 完全重寫 (83 行)

- 霓虹深色主題（`#0f172a` 深藍底色）
- `.neon-glow`、`.neon-text`、`.neon-border` 發光效果
- 迷宮、貪吃蛇、打地鼠統一視覺風格

---

## 遊戲模組 (三合一)

### 墨跡貪吃蛇 (snake.js)

- **引擎**：原始 `setInterval` → `requestAnimationFrame` + 幀率控制（15 FPS）
- **視覺**：霓虹藍蛇身 + CSS `shadowBlur` 發光
- **機制**：20px 網格移動、穿牆、吃食物增長
- **碰撞**：撞到自己 → Game Over → 自動提交分數 → 1.5 秒重生
- **操作**：方向鍵 + WASD + 觸控滑動
- **HTML 改造**：+151 行（佈局、深色主題、水墨背景 Canvas）

### 捕墨打地鼠 (whack.js / whack.html)

- 3×3 九宮格，墨點隨機彈出（間隔遞減加速）
- 30 秒倒數計時
- 連擊系統：3 連擊得 2 分、5 連擊得 3 分
- 墨花濺射 CSS 動畫（`@keyframes splash`）
- 最高分 `localStorage` 跨階段保留

### 墨陣迷宮 (maze.js / maze.html)

- **演算法重寫**：從簡單隨機牆 → DFS 遞迴回溯法（Recursive Backtracking）
- 完美迷宮保證（任意兩點唯一路徑）
- 撞牆 → 呼叫 `createInk()` 水墨噴濺 → 退回起點重置步數
- 關卡遞增：6×6 → 18×18
- 計分公式：`max(200 − 失誤×10 − 步數 + 關卡×20, 1)`

---

## 資料庫擴充

### 新增表格

```sql
-- 新聞評論（專業版，含改寫標題與分析內容）
CREATE TABLE news_commentary (
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
);

-- 聯絡表單
CREATE TABLE contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### posts 表擴充欄位

| 欄位 | 類型 | 說明 |
|------|------|------|
| `updated_at` | DATETIME | 最後更新時間 |
| `meta_description` | TEXT | SEO 描述 |
| `summary` | TEXT | AI 摘要 |

---

## 深色模式系統

### 改造要點

1. **CSS 變數系統**：所有顏色以 `--bg`、`--text` 等變數控制
2. **`data-theme` 屬性**：`<html data-theme="dark">` 切入深色模式
3. **`localStorage` 持久化**：所有頁面統一讀寫 `localStorage.getItem('theme')`
4. **系統偏好偵測**：`matchMedia('(prefers-color-scheme: dark)')`
5. **跨頁面同步**：切換後在任何頁面保留設定

### 適用範圍

| 頁面 | 支援 |
|------|------|
| 首頁 (index.ejs) | ✅ |
| 文章頁 (post.ejs) | ✅ |
| 編輯器 (new/edit.ejs) | ✅ |
| 隨筆小站 (index.html) | ✅ |
| 遊戲 (snake/whack/maze) | ✅ |
| 排行榜 (leaderboard.html) | ✅ |
| 時事新聞 (news.html) | ✅ |

### 修復：動態切換

```javascript
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('theme', t);
  document.querySelectorAll('.theme-btn-label').forEach(btn => {
    btn.textContent = t === 'dark' ? '☀️ 淺色' : '🌙 深色';
  });
}
```

---

## SEO 與社交分享

### 每篇文章自動生成

| 標籤 | 說明 |
|------|------|
| `og:title` | Open Graph 標題 |
| `og:description` | 摘要或前 160 字 |
| `og:type=article` | 內容類型 |
| `og:url` | 永久連結 |
| `twitter:card=summary` | Twitter Card |
| JSON-LD Schema.org Article | 結構化資料 |
| `link rel="canonical"` | 防止重複內容 |
| `meta name="description"` | 搜尋結果描述 |
| `meta name="keywords"` | 標籤關鍵字 |
| `meta name="robots"` | 編輯頁標示 `noindex` |

### RSS Feed

標準 RSS 2.0（`/rss.xml`），含：
- CDATA 包裝標題與摘要
- 完整文章連結
- 發佈日期
- atom:link self 參照

### Sitemap

自動產生 XML Sitemap（`/sitemap.xml`），含：
- 所有文章 URL（`changefreq=weekly`, `priority=0.8`）
- 靜態頁面（首頁、關於、聯絡）

---

## 錯誤修正清單

| # | 問題 | 檔案 | 修復方式 |
|---|------|------|----------|
| 1 | `ink_background.js` 全域 `const canvas/ctx` 與 `maze.js` 命名衝突 | `ink_background.js` | 包裹 IIFE，僅暴露 `window.createInk` / `window.inkBg` |
| 2 | 圖片上傳按鈕選擇器錯誤（`button:last-child` 無法選取） | `new.ejs`、`edit.ejs` | 改為 `[onclick*="imageUpload"]` 屬性選擇器 |
| 3 | 編輯頁草稿儲存鍵值跨文章衝突 | `edit.ejs` | 加入 `post.id` 前綴：`blog_draft_<%= post.id %>` |
| 4 | `EADDRINUSE` 伺服器啟動失敗 | `server.js` | 自動迴圈 `startServer(port + 1)` |
| 5 | 深色模式切換不跨頁面持久化 | 所有 EJS + HTML | 統一讀寫 `localStorage('theme')` + `data-theme` |
| 6 | `null_file` 殘餘空檔案 | 專案根目錄 | 刪除 `null_file` |
| 7 | 遊戲 Canvas 與部落格 Canvas 命名衝突 | `snake.js`、`maze.js`、`whack.js` | 使用各自作用域的 canvas ID |
| 8 | 迷宮演算法非完美迷宮（存在無法到達區域） | `maze.js` | 改為 DFS 遞迴回溯演算法 |
| 9 | 貪吃蛇使用 `setInterval` 導致跳幀 | `snake.js` | 改為 `requestAnimationFrame` + 幀率計數器 |
| 10 | 缺少 `updated_at` 欄位導致文章修改時間無法記錄 | `server.js` + posts 表 | ALTER TABLE 補上 + 更新時寫入 `datetime('now')` |

---

## diff 總結

```
 26 files changed, 2265 insertions(+), 555 deletions(-)
```

| 檔案 | 變更幅度 | 性質 |
|------|----------|------|
| `server.js` | +177 / -?? | 新增路由、中介軟體、資料庫擴充、錯誤處理 |
| `views/index.ejs` | +47 / -?? | 首頁全面重寫（搜尋、分頁、標籤雲、深色模式、Footer） |
| `views/post.ejs` | +59 / -?? | 文章頁全面重寫（TOC、進度條、沙盒、分享、留言、RSS） |
| `views/new.ejs` | +168 / -?? | Markdown 編輯器（工具列、預覽、上傳、草稿、Toast） |
| `views/edit.ejs` | +167 / -?? | 編輯器（與 new 對稱，草稿鍵值修復） |
| `public/snake.js` | +169 / -?? | 引擎重寫（rAF）、霓虹視覺、觸控操作 |
| `public/maze.js` | +334 / -?? | DFS 演算法迷宮生成、撞牆水墨特效、關卡遞增 |
| `public/whack.js` | +91 / -?? | 連擊系統、墨花濺射動畫、加速機制 |
| `public/ink_background.js` | +6 / -?? | IIFE 包裹、window 介面暴露 |

---

*本文件記錄「墨」部落格系統在 2026 年 5 月進行的全面改版與錯誤修正。*
