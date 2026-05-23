# WP 專案總覽

吳嘉恩 · 國立金門大學 資訊工程學系 · s111410509

一頁式靜態網站，集中展示 `wp/_wp` 內所有專案。採用暗色主題、3D 技術標籤雲、粒子背景。

## 內容

| 分類 | 說明 |
|------|------|
| **AI 部落格系統** | Node.js + Express + SQLite3 全端部落格，需啟動伺服器 |
| **墨 · Ink 部落格** | 期中專案，含部落格、遊戲、新聞、行情，部分頁面可獨立開啟 |
| **HTML 作品** | 表單設計、個人資料頁面 |
| **JavaScript 練習** | math1、Understanding Blog、java/js 等 5 組練習 |

## 開啟

直接瀏覽器開啟 `index.html`：

```
portfolio/index.html
```

## 技術標籤雲

首頁的 3D 球體標籤雲支援：
- 🖱 拖曳旋轉
- 懸浮高亮（含 tooltip）
- 點擊定位到專案區
- 自動旋轉（閒置 2 秒後恢復）
- 觸控裝置相容

## 啟動伺服器

完整功能需執行後端：

```bash
# AI 部落格
cd AI
npm install
node server.js

# 墨 · Ink 部落格
cd mid/program
npm install
node server.js
```

## 目錄結構

```
_wp/
├── portfolio/          # 本專案
│   └── index.html
├── AI/                 # AI 部落格系統
├── mid/program/        # 期中專案
├── homework/           # 作業練習
│   ├── form            # HTML 表單
│   ├── personaldata    # 個人資料
│   ├── math1/          # JS 函數練習
│   ├── Understanding Blog/
│   ├── java/js/
│   └── ...
└── blog.db
```
