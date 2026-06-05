自己打程式雛形，由AI修改錯誤的程式
<<<<<<< HEAD
AI問答 https://gemini.google.com/share/6146ebd99297
你可以每一題開一個新的 `.js` 檔案來練習。

---

##摘要

##我的測試結果

```sh
....
##1. 偶數檢查器
PS C:\Users\a0977\OneDrive\Desktop\wp\homework\java\js> node 01.js
數字 10 是：這是偶數
數字 7 是：這是奇數

##2. 購物車結帳
PS C:\Users\a0977\OneDrive\Desktop\wp\homework\java\js> node 02.js
總金額為：700

##3. 幸運數字搜尋
PS C:\Users\a0977\OneDrive\Desktop\wp\homework\java\js> node 03.js
抽到了 7！總共抽了 12 次。

##4. 權限檢查
PS C:\Users\a0977\OneDrive\Desktop\wp\homework\java\js> node 04.js
歡迎管理員：wan

##5. 成績篩選
PS C:\Users\a0977\OneDrive\Desktop\wp\homework\java\js> node 05.js
及格名單： [ 70, 89, 60, 95 ]

##6. JSON 資料轉換
PS C:\Users\a0977\OneDrive\Desktop\wp\homework\java\js> node 06.js
原本的 JSON：{"name": "小明", "score": 85}
修改後的 JSON：{"name":"小明","score":95}

## 7. 平均成績計算
PS C:\Users\a0977\OneDrive\Desktop\wp\homework\java\js> node 07.js
平均分數：80

## 8. 九九乘法表：2 的倍數
PS C:\Users\a0977\OneDrive\Desktop\wp\homework\java\js> node 08.js 
2 x 1 = 2
2 x 2 = 4
2 x 3 = 6
2 x 4 = 8
2 x 5 = 10
2 x 6 = 12
2 x 7 = 14
2 x 8 = 16
2 x 9 = 18

## 9. 尋找數列最大值
PS C:\Users\a0977\OneDrive\Desktop\wp\homework\java\js> node 09.js
最大值是：99

## 10. 簡單庫存系統
PS C:\Users\a0977\OneDrive\Desktop\wp\homework\java\js> node 10.js
✅ 商品：手機 剩餘庫存：5
⚠️ 警告：耳機 已售罄！
✅ 商品：電腦 剩餘庫存：3
                                
### 1. 偶數檢查器 (Function + If)
```javascript
function checkNumber(n) {
    if (n % 2 === 0) {
        return "這是偶數";
    } else {
        return "這是奇數";
    }
}
console.log("數字 10 是：" + checkNumber(10));
console.log("數字 7 是：" + checkNumber(7));
```
**輸出結果：**
> 數字 10 是：這是偶數
> 數字 7 是：這是奇數

---

### 2. 購物車結帳 (Array + For)
```javascript
let prices = [100, 250, 50, 300];
let sum = 0;
for (let i = 0; i < prices.length; i++) {
    sum += prices[i];
}
console.log("總金額為：" + sum);
```
**輸出結果：**
> 總金額為：700

---

### 3. 幸運數字搜尋 (While + Random)
```javascript
let target = 7;
let guess = 0;
let times = 0;
while (guess !== target) {
    guess = Math.floor(Math.random() * 10) + 1; // 產生 1~10 隨機數
    times++;
    console.log("第 " + times + " 次抽到：" + guess);
}
console.log("終於抽到 7 了！總共花了 " + times + " 次。");
```
**輸出結果（每次執行會不同）：**
> 第 1 次抽到：3
> 第 2 次抽到：9
> 第 3 次抽到：7
> 終於抽到 7 了！總共花了 3 次。

---

### 4. 權限檢查 (Object + If)
```javascript
let user = {
    name: "小華",
    age: 20,
    isAdmin: true
};

if (user.isAdmin) {
    console.log("歡迎管理員：" + user.name);
} else {
    console.log("你好：" + user.name + "，你沒有管理權限。");
}
```
**輸出結果：**
> 歡迎管理員：小華

---

### 5. 成績篩選 (Array + If + For)
```javascript
let scores = [45, 72, 88, 59, 61, 100];
let passed = [];
for (let i = 0; i < scores.length; i++) {
    if (scores[i] >= 60) {
        passed.push(scores[i]);
    }
}
console.log("及格的分數有：" + passed);
```
**輸出結果：**
> 及格的分數有：72,88,61,100

---

### 6. JSON 資料轉換 (JSON)
```javascript
let jsonString = '{"name": "小明", "score": 85}';
let obj = JSON.parse(jsonString); // 轉成物件
obj.score = 95; // 修改分數
let newJson = JSON.stringify(obj); // 轉回字串
console.log("原本的 JSON：" + jsonString);
console.log("修改後的 JSON：" + newJson);
```
**輸出結果：**
> 原本的 JSON：{"name": "小明", "score": 85}
> 修改後的 JSON：{"name":"小明","score":95}

---

### 7. 平均成績計算 (Object Array + For)
```javascript
let students = [
    { name: "A", grade: 80 },
    { name: "B", grade: 90 },
    { name: "C", grade: 70 }
];
let totalGrade = 0;
for (let i = 0; i < students.length; i++) {
    totalGrade += students[i].grade;
}
console.log("全班平均分數為：" + (totalGrade / students.length));
```
**輸出結果：**
> 全班平均分數為：80

---

### 8. 九九乘法表：2 的倍數 (Nested For)
```javascript
for (let i = 2; i <= 2; i++) { // 示範只印出 2 的那列
    for (let j = 1; j <= 9; j++) {
        console.log(i + " x " + j + " = " + (i * j));
    }
}
```
**輸出結果：**
> 2 x 1 = 2
> 2 x 2 = 4
> ... (略)
> 2 x 9 = 18

---

### 9. 尋找數列最大值 (Function + Return + For)
```javascript
function findMax(arr) {
    let max = arr[0];
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] > max) {
            max = arr[i];
        }
    }
    return max;
}
let numbers = [12, 45, 7, 99, 23];
console.log("最大值是：" + findMax(numbers));
```
**輸出結果：**
> 最大值是：99

---

### 10. 簡單庫存系統 (綜合應用)
```javascript
let inventoryJson = '[{"name":"手機", "stock":5}, {"name":"耳機", "stock":0}, {"name":"電腦", "stock":3}]';
let items = JSON.parse(inventoryJson);

for (let i = 0; i < items.length; i++) {
    if (items[i].stock === 0) {
        console.log("⚠️ 警告：" + items[i].name + " 已售罄！");
    } else {
        console.log("✅ 商品：" + items[i].name + " 剩餘庫存：" + items[i].stock);
    }
}
```
**輸出結果：**
> ✅ 商品：手機 剩餘庫存：5
> ⚠️ 警告：耳機 已售罄！
> ✅ 商品：電腦 剩餘庫存：3

---

### 💡 小建議
你可以先把這些代碼複製到你的 `01.js` 到 `10.js` 中，然後試著**修改裡面的數字**（例如把 60 分及格改成 70 分），看看輸出的結果會怎麼變化，這對理解邏輯最有幫助。

**如果你哪一題的邏輯看不懂（例如為什麼要 `JSON.parse`？或是 `%` 是什麼？），隨時跟我說，我單獨為你拆解！**
=======
AI問答 https://gemini.google.com/share/6146ebd99297
你可以每一題開一個新的 `.js` 檔案來練習。

---

##摘要

##我的測試結果

```sh
....
##1. 偶數檢查器
PS C:\Users\a0977\OneDrive\Desktop\wp\homework\java\js> node 01.js
數字 10 是：這是偶數
數字 7 是：這是奇數

##2. 購物車結帳
PS C:\Users\a0977\OneDrive\Desktop\wp\homework\java\js> node 02.js
總金額為：700

##3. 幸運數字搜尋
PS C:\Users\a0977\OneDrive\Desktop\wp\homework\java\js> node 03.js
抽到了 7！總共抽了 12 次。

##4. 權限檢查
PS C:\Users\a0977\OneDrive\Desktop\wp\homework\java\js> node 04.js
歡迎管理員：wan

##5. 成績篩選
PS C:\Users\a0977\OneDrive\Desktop\wp\homework\java\js> node 05.js
及格名單： [ 70, 89, 60, 95 ]

##6. JSON 資料轉換
PS C:\Users\a0977\OneDrive\Desktop\wp\homework\java\js> node 06.js
原本的 JSON：{"name": "小明", "score": 85}
修改後的 JSON：{"name":"小明","score":95}

## 7. 平均成績計算
PS C:\Users\a0977\OneDrive\Desktop\wp\homework\java\js> node 07.js
平均分數：80

## 8. 九九乘法表：2 的倍數
PS C:\Users\a0977\OneDrive\Desktop\wp\homework\java\js> node 08.js 
2 x 1 = 2
2 x 2 = 4
2 x 3 = 6
2 x 4 = 8
2 x 5 = 10
2 x 6 = 12
2 x 7 = 14
2 x 8 = 16
2 x 9 = 18

## 9. 尋找數列最大值
PS C:\Users\a0977\OneDrive\Desktop\wp\homework\java\js> node 09.js
最大值是：99

## 10. 簡單庫存系統
PS C:\Users\a0977\OneDrive\Desktop\wp\homework\java\js> node 10.js
✅ 商品：手機 剩餘庫存：5
⚠️ 警告：耳機 已售罄！
✅ 商品：電腦 剩餘庫存：3
                                
### 1. 偶數檢查器 (Function + If)
```javascript
function checkNumber(n) {
    if (n % 2 === 0) {
        return "這是偶數";
    } else {
        return "這是奇數";
    }
}
console.log("數字 10 是：" + checkNumber(10));
console.log("數字 7 是：" + checkNumber(7));
```
**輸出結果：**
> 數字 10 是：這是偶數
> 數字 7 是：這是奇數

---

### 2. 購物車結帳 (Array + For)
```javascript
let prices = [100, 250, 50, 300];
let sum = 0;
for (let i = 0; i < prices.length; i++) {
    sum += prices[i];
}
console.log("總金額為：" + sum);
```
**輸出結果：**
> 總金額為：700

---

### 3. 幸運數字搜尋 (While + Random)
```javascript
let target = 7;
let guess = 0;
let times = 0;
while (guess !== target) {
    guess = Math.floor(Math.random() * 10) + 1; // 產生 1~10 隨機數
    times++;
    console.log("第 " + times + " 次抽到：" + guess);
}
console.log("終於抽到 7 了！總共花了 " + times + " 次。");
```
**輸出結果（每次執行會不同）：**
> 第 1 次抽到：3
> 第 2 次抽到：9
> 第 3 次抽到：7
> 終於抽到 7 了！總共花了 3 次。

---

### 4. 權限檢查 (Object + If)
```javascript
let user = {
    name: "小華",
    age: 20,
    isAdmin: true
};

if (user.isAdmin) {
    console.log("歡迎管理員：" + user.name);
} else {
    console.log("你好：" + user.name + "，你沒有管理權限。");
}
```
**輸出結果：**
> 歡迎管理員：小華

---

### 5. 成績篩選 (Array + If + For)
```javascript
let scores = [45, 72, 88, 59, 61, 100];
let passed = [];
for (let i = 0; i < scores.length; i++) {
    if (scores[i] >= 60) {
        passed.push(scores[i]);
    }
}
console.log("及格的分數有：" + passed);
```
**輸出結果：**
> 及格的分數有：72,88,61,100

---

### 6. JSON 資料轉換 (JSON)
```javascript
let jsonString = '{"name": "小明", "score": 85}';
let obj = JSON.parse(jsonString); // 轉成物件
obj.score = 95; // 修改分數
let newJson = JSON.stringify(obj); // 轉回字串
console.log("原本的 JSON：" + jsonString);
console.log("修改後的 JSON：" + newJson);
```
**輸出結果：**
> 原本的 JSON：{"name": "小明", "score": 85}
> 修改後的 JSON：{"name":"小明","score":95}

---

### 7. 平均成績計算 (Object Array + For)
```javascript
let students = [
    { name: "A", grade: 80 },
    { name: "B", grade: 90 },
    { name: "C", grade: 70 }
];
let totalGrade = 0;
for (let i = 0; i < students.length; i++) {
    totalGrade += students[i].grade;
}
console.log("全班平均分數為：" + (totalGrade / students.length));
```
**輸出結果：**
> 全班平均分數為：80

---

### 8. 九九乘法表：2 的倍數 (Nested For)
```javascript
for (let i = 2; i <= 2; i++) { // 示範只印出 2 的那列
    for (let j = 1; j <= 9; j++) {
        console.log(i + " x " + j + " = " + (i * j));
    }
}
```
**輸出結果：**
> 2 x 1 = 2
> 2 x 2 = 4
> ... (略)
> 2 x 9 = 18

---

### 9. 尋找數列最大值 (Function + Return + For)
```javascript
function findMax(arr) {
    let max = arr[0];
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] > max) {
            max = arr[i];
        }
    }
    return max;
}
let numbers = [12, 45, 7, 99, 23];
console.log("最大值是：" + findMax(numbers));
```
**輸出結果：**
> 最大值是：99

---

### 10. 簡單庫存系統 (綜合應用)
```javascript
let inventoryJson = '[{"name":"手機", "stock":5}, {"name":"耳機", "stock":0}, {"name":"電腦", "stock":3}]';
let items = JSON.parse(inventoryJson);

for (let i = 0; i < items.length; i++) {
    if (items[i].stock === 0) {
        console.log("⚠️ 警告：" + items[i].name + " 已售罄！");
    } else {
        console.log("✅ 商品：" + items[i].name + " 剩餘庫存：" + items[i].stock);
    }
}
```
**輸出結果：**
> ✅ 商品：手機 剩餘庫存：5
> ⚠️ 警告：耳機 已售罄！
> ✅ 商品：電腦 剩餘庫存：3

---

### 💡 小建議
你可以先把這些代碼複製到你的 `01.js` 到 `10.js` 中，然後試著**修改裡面的數字**（例如把 60 分及格改成 70 分），看看輸出的結果會怎麼變化，這對理解邏輯最有幫助。

**如果你哪一題的邏輯看不懂（例如為什麼要 `JSON.parse`？或是 `%` 是什麼？），隨時跟我說，我單獨為你拆解！**
>>>>>>> 6e0c4c416e2a2b52f4dd688af7805246e7aeca49
