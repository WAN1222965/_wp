let inventoryJson = '[{"name":"手機", "stock":5}, {"name":"耳機", "stock":0}, {"name":"電腦", "stock":3}]';
let items = JSON.parse(inventoryJson);

for (let i = 0; i < items.length; i++) {
    if (items[i].stock === 0) {
        console.log("⚠️ 警告：" + items[i].name + " 已售罄！");
    } else {
        console.log("✅ 商品：" + items[i].name + " 剩餘庫存：" + items[i].stock);
    }
}