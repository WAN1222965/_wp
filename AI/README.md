# Node.js + SQLite 網誌系統開發摘要
---
## 對話紀錄
### 第一次對話
- **使用者**：請用node.js+sqlite寫一個簡易的網誌系統,放在blog/下
- **我**：建立了一個基本的 REST API，包含文章 CRUD 功能，使用 Express + sql.js + SQLite
### 第二次對話
- **使用者**：再加上留言功能 美化排版 新增新用戶 登入
- **我**：
  1. 新增 users 表單，用於用戶註冊/登入
  2. 修改 comments 表格結構，關聯 user_id
  3. 新增 POST /register、POST /login、POST /logout API
  4. 修改文章和留言 API 需要登入才能發布
  5. 建立美化的前端 HTML/CSS/JS 頁面
### 第三次對話
- **使用者**：幫我新增交友功能
- **我**：
  1. 新增 friends 表格
  2. 新增 GET /users、GET /friends、POST /friends、PUT /friends/:id、DELETE /friends/:id API
  3. 前端新增好友頁面、顯示待確認邀請、加入/移除好友功能
### 第四次對話
- **使用者**：請把我們這次對話的摘要寫入WP/_wp/AI/note裡
- **我**：將摘要寫入 note 檔案
### 第五次對話
- **使用者**：我的對話紀錄要完整保留,而你的要呈現摘要並將程式碼的功能標示
- **我**：重新編輯 note 檔案，保留完整對話紀錄並標示程式碼功能
### 第六次對話
- **使用者**：請為這個專案寫一個更詳細的解說報告,並解說程式碼的原理 大約1500行幫我把程式碼,再加上按讚分享並公開
- **我**：
  1. 新增 likes 表格 - 儲存按讚資料（支援 like/dislike）
  2. 新增 shares 表格 - 儲存分享資料
  3. 新增按讚/倒讚/取消 API
  4. 新增分享文章 API
  5. 修改文章列表 API 加入按讚數、倒讚數、分享數
  6. 前端顯示按讚、倒讚、分享按鈕
  7. 公開文章 - 任何人無需登入即可觀看文章
### 第七次對話
- **使用者**：改300行新增按讚功能 2. 新增分享功能 3. 公開文章（不需要登入就能觀看） 幫我加上不用解說報告
- **我**：更新 note 檔案到約 300 行
---
## 程式碼功能標示
### server.js 主要功能
```javascript
// ===== 1. 引入模組 =====
const express = require('express');           // Web 框架
const initSqlJs = require('sql.js');          // SQLite 資料庫
const fs = require('fs');                     // 檔案系統
const path = require('path');                 // 路徑處理
const crypto = require('crypto');             // 加密/隨機產生器
```
```javascript
// ===== 2. 建立 Express 應用 =====
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));  // 靜態檔案服務
```
```javascript
// ===== 3. 資料庫初始化 =====
async function initDB() {
  // 建立 users 表格 - 儲存用戶資料
  db.run(`CREATE TABLE IF NOT EXISTS users (...)`);
  
  // 建立 posts 表格 - 儲存文章資料
  db.run(`CREATE TABLE IF NOT EXISTS posts (...)`);
  
  // 建立 comments 表格 - 儲存留言資料
  db.run(`CREATE TABLE IF NOT EXISTS comments (...)`);
  
  // 建立 friends 表格 - 儲存好友關係
  db.run(`CREATE TABLE IF NOT EXISTS friends (...)`);
  
  // 建立 likes 表格 - 儲存按讚/倒讚資料
  db.run(`CREATE TABLE IF NOT EXISTS likes (...);  // 支援 type: like/dislike
  
  // 建立 shares 表格 - 儲存分享資料
  db.run(`CREATE TABLE IF NOT EXISTS shares (...);
}
function saveDB() { ... }  // 儲存資料庫到檔案
```
```javascript
// ===== 4. 資料庫操作函式 =====
function queryAll(sql, params) { ... }  // 查詢多筆資料
function queryOne(sql, params) { ... }  // 查詢單筆資料
function run(sql, params) { ... }       // 執行新增/修改/刪除
```
```javascript
// ===== 5. 用戶認證 API =====
app.post('/register', ...)   // 註冊新用戶
app.post('/login', ...)      // 登入驗證
app.post('/logout', ...)     // 登出
```
```javascript
// ===== 6. 文章 CRUD API =====
app.get('/blog', ...)        // 取得所有文章（公開，無需登入）
app.get('/blog/:id', ...)    // 取得單篇文章（含留言、按讚、分享）
app.post('/blog', ...)       // 發布文章（需登入）
app.put('/blog/:id', ...)    // 編輯文章（需登入，僅作者）
app.delete('/blog/:id', ...) // 刪除文章（需登入，僅作者）
```
```javascript
// ===== 7. 留言 API =====
app.get('/blog/:id/comments', ...)           // 取得文章留言
app.post('/blog/:id/comments', ...)          // 新增留言（需登入）
app.delete('/blog/:id/comments/:commentId', ...) // 刪除留言（需登入，僅作者）
```
```javascript
// ===== 8. 交友 API =====
app.get('/users', ...)          // 取得所有用戶（需登入）
app.get('/friends', ...)        // 取得好友名單（含待確認）
app.post('/friends', ...)       // 發送交友邀請
app.put('/friends/:id', ...)    // 接受/拒絕邀請
app.delete('/friends/:id', ...) // 移除好友
```
```javascript
// ===== 9. 按讚/倒讚 API =====
app.get('/posts/:id/likes', ...)      // 取得按讚/倒讚數
app.post('/posts/:id/likes', ...)     // 按讚或倒讚（需登入）
app.delete('/posts/:id/likes', ...)    // 取消按讚（需登入）
```
```javascript
// ===== 10. 分享 API =====
app.get('/posts/:id/shares', ...)      // 取得分享記錄
app.post('/posts/:id/shares', ...)     // 分享文章（需登入）
```
```javascript
// ===== 11. 啟動伺服器 =====
initDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});
```
---
### public/index.html 主要功能
```html
<!-- ===== 1. CSS 樣式 ===== -->
<style>
  * { ... }                // 基礎重設
  body { ... }            // 頁面基礎樣式
  .container { ... }      // 內容容器
  header { ... }          // 頁首導覽列
  .btn, .card, .modal 等 // 按鈕、卡片、彈窗樣式
  .post-stats { ... }     // 按讚、倒讚、分享、留言數顯示
  .share-menu { ... }     // 分享選單樣式
</style>
```
```html
<!-- ===== 2. HTML 結構 ===== -->
<header>...</header>           <!-- 頁首（含登入/登出按鈕） -->
<div id="postList">...</div>    <!-- 文章列表 -->
<div id="postDetail">...</div>  <!-- 文章詳情 -->
<div id="friendsSection">...</div> <!-- 好友頁面 -->
<!-- 彈窗 Modal -->
<div id="loginModal">...</div>    <!-- 登入表單 -->
<div id="registerModal">...</div> <!-- 註冊表單 -->
<div id="postModal">...</div>     <!-- 發布/編輯文章表單 -->
```
```javascript
// ===== 3. JavaScript 功能 =====
let token, user;           // 登入狀態
let editingPostId;         // 編輯中的文章ID
let currentPostId;         // 目前瀏覽的文章ID
// API 請求包裝函式
async function api(path, options) { ... }
// 文章相關
async function loadPosts() { ... }    // 載入文章列表
async function viewPost(id) { ... }   // 顯示文章詳情
function showList() { ... }           // 返回文章列表
async function savePost() { ... }     // 儲存文章
async function deletePost(id) { ... } // 刪除文章
function editPost(id) { ... }         // 編輯文章表單
// 留言相關
async function addComment() { ... }   // 新增留言
async function deleteComment(id) { ... } // 刪除留言
// 用戶相關
async function register() { ... }     // 註冊
async function login() { ... }        // 登入
async function logout() { ... }       // 登出
function updateUserArea() { ... }     // 更新用戶區塊顯示
// 好友相關
async function showFriends() { ... }      // 顯示好友頁面
async function loadFriends() { ... }     // 載入好友列表
async function addFriend(id) { ... }     // 加好友
async function removeFriend(id) { ... }  // 移除好友
async function respondFriend(id, status) { ... } // 回應交友邀請
// 按讚/倒讚功能
async function toggleLike(postId, type) { ... }  // 切換按讚/倒讚狀態
// 分享功能
async function showShare(postId) { ... }   // 顯示分享選單
async function sharePost(postId, platform) { ... } // 分享文章
// 工具函式
function escapeHtml(str) { ... }     // HTML 跳脫防止 XSS
function showModal(id) { ... }        // 顯示彈窗
function closeModal(id) { ... }       // 關閉彈窗
```
---
## 資料庫結構
### users 表
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INTEGER | 主鍵，自動遞增 |
| username | TEXT | 使用者名稱（唯一） |
| password | TEXT | 密碼（SHA256 加密） |
| display_name | TEXT | 顯示名稱 |
| created_at | TEXT | 創建時間 |
### posts 表
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INTEGER | 主鍵，自動遞增 |
| user_id | INTEGER | 發文者ID（外鍵） |
| title | TEXT | 文章標題 |
| content | TEXT | 文章內容 |
| created_at | TEXT | 創建時間 |
### comments 表
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INTEGER | 主鍵，自動遞增 |
| post_id | INTEGER | 文章ID（外鍵） |
| user_id | INTEGER | 留言者ID（外鍵） |
| content | TEXT | 留言內容 |
| created_at | TEXT | 創建時間 |
### friends 表
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INTEGER | 主鍵，自動遞增 |
| user_id | INTEGER | 發送邀請者ID（外鍵） |
| friend_id | INTEGER | 接收者ID（外鍵） |
| status | TEXT | 狀態（pending/accepted） |
| created_at | TEXT | 創建時間 |
### likes 表
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INTEGER | 主鍵，自動遞增 |
| post_id | INTEGER | 文章ID（外鍵） |
| user_id | INTEGER | 按讚者ID（外鍵） |
| type | TEXT | 類型（like/dislike） |
| created_at | TEXT | 創建時間 |
| UNIQUE | | post_id + user_id + type 唯一 |
### shares 表
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INTEGER | 主鍵，自動遞增 |
| post_id | INTEGER | 文章ID（外鍵） |
| user_id | INTEGER | 分享者ID（外鍵） |
| platform | TEXT | 分享平台（Facebook/Twitter/Line/Copy） |
| created_at | TEXT | 創建時間 |
---
## API 端點總覽
### 用戶認證
| 方法 | 路徑 | 說明 | 權限 |
|------|------|------|------|
| POST | /register | 註冊新用戶 | 公開 |
| POST | /login | 登入 | 公開 |
| POST | /logout | 登出 | 需登入 |
### 文章
| 方法 | 路徑 | 說明 | 權限 |
|------|------|------|------|
| GET | /blog | 取得所有文章 | 公開 |
| GET | /blog/:id | 取得單篇文章 | 公開 |
| POST | /blog | 發布文章 | 需登入 |
| PUT | /blog/:id | 編輯文章 | 需登入（僅作者） |
| DELETE | /blog/:id | 刪除文章 | 需登入（僅作者） |
### 留言
| 方法 | 路徑 | 說明 | 權限 |
|------|------|------|------|
| GET | /blog/:id/comments | 取得文章留言 | 公開 |
| POST | /blog/:id/comments | 新增留言 | 需登入 |
| DELETE | /blog/:id/comments/:commentId | 刪除留言 | 需登入（僅作者） |
### 交友
| 方法 | 路徑 | 說明 | 權限 |
|------|------|------|------|
| GET | /users | 取得所有用戶 | 需登入 |
| GET | /friends | 取得好友名單 | 需登入 |
| POST | /friends | 發送交友邀請 | 需登入 |
| PUT | /friends/:id | 回應交友邀請 | 需登入 |
| DELETE | /friends/:id | 移除好友 | 需登入 |
### 按讚/倒讚
| 方法 | 路徑 | 說明 | 權限 |
|------|------|------|------|
| GET | /posts/:id/likes | 取得按讚/倒讚數 | 公開 |
| POST | /posts/:id/likes | 按讚或倒讚 | 需登入 |
| DELETE | /posts/:id/likes | 取消按讚 | 需登入 |
### 分享
| 方法 | 路徑 | 說明 | 權限 |
|------|------|------|------|
| GET | /posts/:id/shares | 取得分享記錄 | 公開 |
| POST | /posts/:id/shares | 分享文章 | 需登入 |
---
## 功能說明
### 1. 公開文章
- 任何人都可以直接瀏覽文章列表和文章內容
- 不需要登入即可查看按讚數、倒讚數、留言數、分享數
- 只有發布文章、留言、按讚、分享需要登入
### 2. 按讚/倒讚功能
- 登入用戶可以對文章按讚或倒讚
- 每篇文章每個用戶只能按讚或倒讚一次
- 顯示按讚總數和倒讚總數
- 登入用戶可看到自己是否已按讚或倒讚
### 3. 分享功能
- 登入用戶可以分享文章到不同平台
- 支援平台：Facebook、Twitter、Line、複製連結
- 顯示分享總數
### 4. 交友功能
- 登入用戶可以瀏覽其他用戶
- 發送交友邀請（狀態為 pending）
- 對方可以接受或拒絕邀請
- 接受後成為好友（狀態為 accepted）
- 好友可以移除好友關係
---
## 檔案結構
| 檔案 | 說明 |
|------|------|
| server.js | 後端伺服器（Express + SQLite） |
| public/index.html | 前端頁面 |
| package.json | 專案設定 |
| blog.db | SQLite 資料庫 |
| note | 本摘要檔案 |
## 啟動方式
```bash
npm start
```
然後訪問 http://localhost:3000
---
## 安全性考量
### 密碼加密
- 使用 SHA256 雜湊演算法加密密碼
- 不儲存明文密碼
### SQL 注入防護
- 使用 prepared statements
- 參數化查詢
### XSS 防護
- 前端使用 escapeHtml 函式跳脫 HTML
- 防止跨站腳本攻擊
### 權限控制
- 發布、編輯、刪除文章需登入且為作者
- 刪除留言需登入且為作者
- 好友操作需登入
### 公開/私有權限
- 瀏覽文章、留言、按讚名單、分享記錄為公開
- 發布、修改、刪除需登入
- 用戶列表、好友列表需登入

### blog3
功能解說
後端 (server.js)
功能	說明
users 資料表	儲存用戶帳號、密碼、顯示名稱
posts 資料表	儲存文章標題、內容、作者
comments 資料表	儲存文章留言
friends 資料表	好友申請系統（pending/accepted）
likes 資料表	按讚/倒讚記錄
shares 資料表	分享記錄
API 端點
- POST /register - 註冊
- POST /login - 登入
- GET /blog - 取得文章列表
- GET /blog/:id - 取得單篇文章（含留言、按讚數）
- POST /blog - 發布文章
- POST /posts/:id/likes - 按讚/倒讚
- POST /posts/:id/shares - 分享文章
前端 (index.html)
- 用戶登入/註冊模態框
- 文章列表顯示（含按讚/倒讚/分享數）
- 文章詳情頁面（含留言功能）
- 好友管理頁面
- 網址參數 ?id=1 可直接開啟指定文章
技術栈
- Express.js - 後端伺服器
- sql.js - 瀏覽器端 SQLite 資料庫
- 原生 HTML/CSS/JS - 前端
整體是個輕量級的個人部落格，資料存在 blog.db 檔案中。
/你的專案資料夾
├── server.js
├── package.json
└── /public
    └── index.html 剛剛的 HTML