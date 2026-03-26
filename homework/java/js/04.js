let user = {
    name: "wan",
    age: 20,
    isAdmin: true
};

if (user.isAdmin) {
    console.log("歡迎管理員：" + user.name);
} else {
    console.log("你好：" + user.name + "，你沒有管理權限。");
}