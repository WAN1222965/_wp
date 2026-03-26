function checkNumber(n) {
    if (n % 2 === 0) {
        return "這是偶數";
    } else {
        return "這是奇數";
    }
}
console.log("數字 10 是：" + checkNumber(10));
console.log("數字 7 是：" + checkNumber(7));