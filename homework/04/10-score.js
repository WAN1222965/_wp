const students = [
  { name: "小明", score: 60 },
  { name: "小華", score: 95 }
];
let top = students[0];
for (let s of students) {
  if (s.score > top.score) top = s;
}
console.log(`第一名是：${top.name} (${top.score}分)`);