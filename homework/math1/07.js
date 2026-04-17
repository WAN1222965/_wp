const users = [{name: "chia", age: 25}, {name: "wan", age: 17}];
const adults = users.filter(user => user.age >= 18);
console.log(adults);