let jsonString = '{"name": "小明", "score": 85}';
let obj = JSON.parse(jsonString); // 轉成物件
obj.score = 95; // 修改分數
let newJson = JSON.stringify(obj); // 轉回字串
console.log("原本的 JSON：" + jsonString);
console.log("修改後的 JSON：" + newJson);