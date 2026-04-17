function myFilter(arr, callback) {
  const result = [];
  for (let item of arr) {
    if (callback(item)) {
      result.push(item);
    }
  }
  return result;
}

const nums = [1, 5, 8, 12];
console.log(myFilter(nums, (n) => n > 7));/ [8, 12] /