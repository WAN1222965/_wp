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