let listA = [1, 2]; let listB = [3, 4];
function process(a, b) {
  a.push(99);
  b = [100];
}
process(listA, listB);
console.log("Q8: listA =", listA, "listB =", listB);