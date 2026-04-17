function mathTool(num1, num2, action) 
{
  return action(num1, num2);
}
console.log(mathTool(10, 5, (a, b) => a + b)); // 15
console.log(mathTool(10, 5, (a, b) => a - b)); // 5