JavaScript 函數實作練習題紀錄
本文件記錄了 10 個關於 JavaScript 函數核心觀念的實作練習，涵蓋 Callback、IIFE、陣列處理、傳址陷阱及非同步操作。

習題 1：Callback 基礎實作
程式碼

JavaScript
function mathTool(num1, num2, action) {
    return action(num1, num2);
}

console.log(mathTool(10, 5, function(a, b) {
    return a + b;
}));

console.log(mathTool(10, 5, function(a, b) {
    return a - b;
}));
測試結果

Plaintext
15
5
摘要
使用回呼函數（Callback Function）實現加法與減法，展現高階函數的靈活性。

習題 2：匿名函數與立即執行 (IIFE)
程式碼

JavaScript
(function() {
    let count = 100;
    console.log("Count is: " + count);
})();
測試結果

Plaintext
Count is: 100
摘要
使用 IIFE 建立區域作用域變數，避免變數污染全域空間，確保封裝性。

習題 3：箭頭函數與陣列轉換
程式碼

JavaScript
const prices = [100, 200, 300, 400];
const result = prices.map(p => p * 0.8);
console.log(result);
測試結果

Plaintext
[80, 160, 240, 320]
摘要
利用 map 方法搭配簡潔的箭頭函數進行陣列轉換。

習題 4：陣列參數的「破壞性修改」
程式碼

JavaScript
function cleanData(arr) {
    arr.pop();
    arr.unshift("Start");
}

let myData = [1, 2, 3];
cleanData(myData);
console.log(myData);
測試結果

Plaintext
["Start", 1, 2]
摘要
透過陣列方法直接修改傳入的引用（Reference）物件，達成破壞性修改。

習題 5：函數回傳函數 (Higher-Order Function)
程式碼

JavaScript
function multiplier(factor) {
    return (n) => n * factor;
}

const double = multiplier(2);
console.log(double(10));
測試結果

Plaintext
20
摘要
建立一個回傳函數的高階函數，利用閉包（Closure）特性鎖定 factor 參數。

習題 6：Callback 篩選器 (手寫 filter)
程式碼

JavaScript
function myFilter(arr, callback) {
    let result = [];
    for (let i = 0; i < arr.length; i++) {
        if (callback(arr[i])) {
            result.push(arr[i]);
        }
    }
    return result;
}

let data = [1, 5, 8, 12];
let filtered = myFilter(data, n => n > 7);
console.log(filtered);
測試結果

Plaintext
[8, 12]
摘要
手動實作類似 Array.prototype.filter 的函數，理解篩選邏輯與 Callback 應用。

習題 7：箭頭函數處理物件
程式碼

JavaScript
const users = [
    { name: "Alice", age: 25 },
    { name: "Bob", age: 17 }
];

const adults = users.filter(user => user.age >= 18);
console.log(adults);
測試結果

Plaintext
[{ name: "Alice", age: 25 }]
摘要
使用內建 filter 方法篩選符合條件的物件陣列。

習題 8：參數傳址陷阱：重新賦值 vs 修改
程式碼

JavaScript
let listA = [1, 2];
let listB = [3, 4];

function process(a, b) {
    a.push(99);    // 修改原始陣列
    b = [100];     // 重新賦值，不影響原始陣列
}

process(listA, listB);
console.log(listA);
console.log(listB);
測試結果

Plaintext
[1, 2, 99]
[3, 4]
摘要
說明傳址修改（Mutation）與重新賦值（Reassignment）在記憶體操作上的差異。

習題 9：延遲執行的 Callback
程式碼

JavaScript
setTimeout(() => {
    const arr = ["Task", "Completed"];
    console.log(arr.join(" "));
}, 2000);
測試結果

Plaintext
(等待 2 秒後出現)
Task Completed
摘要
使用 setTimeout 實現非同步延遲執行。

習題 10：綜合應用：計算總價
程式碼

JavaScript
function calculateTotal(cart, discountFunc) {
    let total = cart.reduce((sum, price) => sum + price, 0);
    return discountFunc(total);
}

let cart = [100, 200, 300];
let result = calculateTotal(cart, function(total) {
    return total - 50;
});

console.log(result);
測試結果

Plaintext
550