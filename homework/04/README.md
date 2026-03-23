## 習題 4 

AI 問答 -- https://gemini.google.com/share/5bec3b39170d

## 我的測試結果

```sh
....

ccc@teacherdeiMac 04 % node 10-score.js
第一名是：小華 (95分)
```

## 摘要

為了讓你更清楚程式運作的邏輯，我將每一題的**完整測試程式碼**與 **Console（控制台）輸出的預期結果**整理如下：

---

### 1. 基礎數字運算
**程式碼：**
```javascript
function checkNumber(num) {
  if (num > 0) return "正數";
  if (num < 0) return "負數";
  return "這是零";
}

console.log("測試 10:", checkNumber(10));
console.log("測試 -5:", checkNumber(-5));
console.log("測試 0:", checkNumber(0));
```
**測試結果：**
> 測試 10: 正數  
> 測試 -5: 負數  
> 測試 0: 這是零

---

### 2. 九九乘法表
**程式碼：**
```javascript
for (let i = 1; i <= 3; i++) { // 為節省版面，僅示範到 3
  let row = "";
  for (let j = 1; j <= 3; j++) {
    row += `${i} * ${j} = ${i * j}  `;
  }
  console.log(row);
}
```
**測試結果：**
> 1 * 1 = 1  1 * 2 = 2  1 * 3 = 3  
> 2 * 1 = 2  2 * 2 = 4  2 * 3 = 6  
> 3 * 1 = 3  3 * 2 = 6  3 * 3 = 9

---

### 3. 陣列加總與平均
**程式碼：**
```javascript
const data = [10, 20, 30, 40, 50];
let sum = 0;
for (let i = 0; i < data.length; i++) {
  sum += data[i];
}
const result = { total: sum, average: sum / data.length };
console.log("運算結果：", result);
```
**測試結果：**
> 運算結果： { total: 150, average: 30 }

---

### 4. 猜數字遊戲
**程式碼：**
```javascript
let target = 3; 
let guess = 0;
while (guess !== target) {
  guess++; // 模擬從 1 開始猜
  console.log("當前猜測數字：" + guess);
}
console.log("中獎！數字是 " + guess);
```
**測試結果：**
> 當前猜測數字：1  
> 當前猜測數字：2  
> 當前猜測數字：3  
> 中獎！數字是 3

---

### 5. 聯絡人清單
**程式碼：**
```javascript
let user = {
  name: "Gemini",
  email: "old@mail.com",
  updateEmail: function(newEmail) {
    this.email = newEmail;
  }
};
console.log("更新前：", user.email);
user.updateEmail("hello@google.com");
console.log("更新後：", user.email);
```
**測試結果：**
> 更新前： old@mail.com  
> 更新後： hello@google.com

---

### 6. 訂單篩選器
**程式碼：**
```javascript
const jsonString = '[{"id":1, "price":800}, {"id":2, "price":1500}, {"id":3, "price":2000}]';
const orders = JSON.parse(jsonString);
let highValue = [];

for (let i = 0; i < orders.length; i++) {
  if (orders[i].price > 1000) highValue.push(orders[i].id);
}
console.log("高額訂單 ID 清單：", highValue);
```
**測試結果：**
> 高額訂單 ID 清單： [ 2, 3 ]

---

### 7. 購物車計算
**程式碼：**
```javascript
const cart = [
  { name: "咖啡", price: 50, qty: 2 },
  { name: "三明治", price: 80, qty: 1 }
];
let total = 0;
for (let item of cart) {
  total += item.price * item.qty;
}
console.log("應付總金額：", total);
```
**測試結果：**
> 應付總金額： 180

---

### 8. 倒數計時器
**程式碼：**
```javascript
function countDown(n) {
  while (n >= 0) {
    if (n === 0) console.log("時間到！");
    else console.log(n + "...");
    n--;
  }
}
countDown(3);
```
**測試結果：**
> 3...  
> 2...  
> 1...  
> 時間到！

---

### 9. 字串反轉工具
**程式碼：**
```javascript
function reverseString(str) {
  return str.split("").reverse().join("");
}
const original = "Apple";
console.log(`${original} 反轉後為: ${reverseString(original)}`);
```
**測試結果：**
> Apple 反轉後為: elppA

---

### 10. 成績管理系統
**程式碼：**
```javascript
const students = [
  { name: "小明", score: 60 },
  { name: "小華", score: 95 }
];
let top = students[0];
for (let s of students) {
  if (s.score > top.score) top = s;
}
console.log(`第一名是：${top.name} (${top.score}分)`);
```
**測試結果：**
> 第一名是：小華 (95分)

---

這些練習涵蓋了開發中最常見的資料處理方式。如果你對哪一題的程式語法（例如 `JSON.parse` 或 `this`）感到困惑，歡迎告訴我，我為你解釋！

**需要我挑選其中一題，教你如何用更簡潔的「現代 JS ES6+」寫法重新達成嗎？**


