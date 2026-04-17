習題 1：物件存取實作 (Dot vs Bracket)
程式碼

JavaScript
const post = { id: 1, title: "Hello World", content: "Markdown content" };

console.log(post.title);     // 點符號
console.log(post["title"]);   // 中括號
測試結果

Plaintext
Hello World
Hello World
摘要
練習兩種存取物件屬性的方式。點符號適合已知屬性名，中括號則具備動態存取變數屬性的靈活性。

習題 2：物件解構賦值 (Destructuring)
程式碼

JavaScript
const req = { body: { title: "JS教學", content: "內容在此", author: "Gemini" } };

const { title, content } = req.body;
console.log(title, content);
測試結果

Plaintext
JS教學 內容在此
摘要
模擬從 req.body 取出資料。透過解構賦值能在一行內將物件屬性提取為同名常數。

習題 3：陣列遍歷與樣板字面值
程式碼

JavaScript
const posts = [{id: 1, t: "A"}, {id: 2, t: "B"}];
let html = "";

posts.forEach(post => {
  html += `<div>${post.t}</div>`;
});
console.log(html);
測試結果

Plaintext
<div>A</div><div>B</div>
摘要
利用 forEach 遍歷資料陣列，並結合「反引號」樣板字面值動態生成 HTML 字串。

習題 4：字典物件動態新增
程式碼

JavaScript
const params = {};
params.id = 99; 

console.log(params);
測試結果

Plaintext
{ id: 99 }
摘要
建立空物件並動態賦值，模擬後端解析 URL 參數（URL Params）存入物件的行為。

習題 5：錯誤優先回呼模式 (Error-First Callback)
程式碼

JavaScript
function fetchData(id, callback) {
    const fakeData = { id: id, status: "success" };
    callback(null, fakeData);
}

fetchData(101, (err, data) => {
    if (!err) console.log("成功：", data);
});
測試結果

Plaintext
成功： { id: 101, status: 'success' }
摘要
實作 Node.js 標準的回呼慣例：第一個參數為錯誤 (null)，第二個為回傳資料。

習題 6：JSON 字串轉換與解析
程式碼

JavaScript
const jsonStr = '{"title": "Post 1", "tags": ["js", "node"]}';
let obj = JSON.parse(jsonStr);

console.log(obj.tags[1]);
測試結果

Plaintext
node
摘要
使用 JSON.parse 將字串轉回物件，並透過索引值存取陣列內部的深層資料。

習題 7：模擬資料庫查詢行為
程式碼

JavaScript
function fakeGet(sql, params, callback) {
    const fakeRow = { id: 1, title: "掌握 JavaScript 函數" };
    callback(null, fakeRow);
}

fakeGet("SELECT...", [1], (err, row) => {
    console.log("抓到的文章標題是：", row.title);
});
測試結果

Plaintext
抓到的文章標題是： 掌握 JavaScript 函數
摘要
模擬非同步資料庫查詢，學習如何在 Callback 中接收並處理單筆物件資料。

習題 8：樣板字面值中的邏輯判斷
程式碼

JavaScript
const user = "Guest";
const html = `<h1>Welcome, ${user || "Stranger"}</h1>`;

console.log(html);
測試結果

Plaintext
<h1>Welcome, Guest</h1>
摘要
在 ${} 插槽中使用邏輯或 || 運算子，實作簡易的預設值顯示邏輯。

習題 9：字串截斷與摘要產生
程式碼

JavaScript
const contents = ["Very long content here"];
const summaries = contents.map(text => `${text.substring(0, 10)}...`);

console.log(summaries[0]);
測試結果

Plaintext
Very long ...
摘要
使用 substring 進行字串處理，模擬部落格首頁的文章摘要（Snippet）生成。

習題 10：權限驗證邏輯封裝
程式碼

JavaScript
function checkAdmin(role, callback) {
    if (role !== "admin") return callback("Access Denied");
    callback(null, "Welcome");
}

checkAdmin("guest", (err, msg) => {
    if (err) console.log("錯誤：", err);
    else console.log(msg);
});
測試結果

Plaintext
錯誤： Access Denied
摘要
綜合應用「衛句 (Guard Clause)」與「錯誤優先回呼」，實作簡單的權限檢查邏輯。