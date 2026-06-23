import mongoose from "mongoose";

const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Home",
  "Sports",
  "General",
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateLast30Days() {
  const now = new Date();
  const past = new Date(now);
  past.setDate(now.getDate() - 30);

  return new Date(
    past.getTime() + Math.random() * (now.getTime() - past.getTime())
  );
}

function pickProductId(productIds) {
  const topFive = productIds.slice(0, 5);

  if (Math.random() < 0.7 && topFive.length > 0) {
    return topFive[getRandomInt(0, topFive.length - 1)];
  }

  return productIds[getRandomInt(0, productIds.length - 1)];
}

export function generateProducts(count = getRandomInt(20, 50)) {
  return Array.from({ length: count }, (_, i) => ({
    _id: new mongoose.Types.ObjectId(),
    name: `Product-${i + 1}`,
    category: CATEGORIES[getRandomInt(0, CATEGORIES.length - 1)],
    price: getRandomInt(100, 80000),
  }));
}

export function generateInventory(products) {
  return products.map((product) => ({
    productId: product._id,
    stock: getRandomInt(50, 200),
    warehouse: "BLR-1",
  }));
}

export function generateOrders(products, orderCount = getRandomInt(1000, 2000)) {
  const productIds = products.map((p) => p._id);
  const orders = [];

  for (let i = 0; i < orderCount; i++) {
    orders.push({
      productId: pickProductId(productIds),
      quantity: getRandomInt(1, 5),
      orderDate: randomDateLast30Days(),
    });
  }

  return orders;
}

export function generateAllData() {
  const products = generateProducts();
  const inventory = generateInventory(products);
  const orders = generateOrders(products);

  return { products, inventory, orders };
}
