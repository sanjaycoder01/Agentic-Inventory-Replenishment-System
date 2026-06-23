import "dotenv/config";
import { connectDB, disconnectDB } from "../config/db.js";
import Product from "../models/product.model.js";
import Inventory from "../models/inventory.model.js";
import Order from "../models/order.model.js";
import { generateAllData } from "../services/dataGenerator.service.js";

async function validateData() {
  const totalOrders = await Order.countDocuments();
  const recentOrders = await Order.find()
    .sort({ orderDate: -1 })
    .limit(5)
    .populate("productId", "name")
    .lean();

  const demandByProduct = await Order.aggregate([
    {
      $group: {
        _id: "$productId",
        totalSold: { $sum: "$quantity" },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { totalSold: -1 } },
  ]);

  const productNames = await Product.find(
    { _id: { $in: demandByProduct.map((d) => d._id) } },
    { name: 1 }
  ).lean();
  const nameById = Object.fromEntries(
    productNames.map((p) => [p._id.toString(), p.name])
  );

  console.log("\n--- Validation ---");
  console.log("Total orders:", totalOrders);

  console.log("\nRecent orders (latest 5):");
  for (const order of recentOrders) {
    console.log(
      `  ${order.productId?.name ?? order.productId} | qty: ${order.quantity} | ${order.orderDate.toISOString()}`
    );
  }

  console.log("\nTop 5 products by demand:");
  for (const row of demandByProduct.slice(0, 5)) {
    console.log(
      `  ${nameById[row._id.toString()] ?? row._id}: ${row.totalSold} units (${row.orderCount} orders)`
    );
  }

  console.log("\nBottom 3 products by demand:");
  for (const row of demandByProduct.slice(-3)) {
    console.log(
      `  ${nameById[row._id.toString()] ?? row._id}: ${row.totalSold} units (${row.orderCount} orders)`
    );
  }

  if (demandByProduct.length >= 2) {
    const topSold = demandByProduct[0].totalSold;
    const bottomSold = demandByProduct[demandByProduct.length - 1].totalSold;
    const ratio = topSold / Math.max(bottomSold, 1);

    if (ratio < 2) {
      console.warn(
        "\n⚠️  Demand looks too flat (top/bottom ratio < 2). Re-run seed for better variation."
      );
    } else {
      console.log(`\n✔ Demand variation looks good (top/bottom ratio: ${ratio.toFixed(1)}x)`);
    }
  }
}

async function seed() {
  await connectDB();

  await Promise.all([
    Product.deleteMany({}),
    Inventory.deleteMany({}),
    Order.deleteMany({}),
  ]);

  const { products, inventory, orders } = generateAllData();

  await Product.insertMany(products);
  await Inventory.insertMany(inventory);
  await Order.insertMany(orders);

  console.log(`Seeded ${products.length} products`);
  console.log(`Seeded ${inventory.length} inventory records`);
  console.log(`Seeded ${orders.length} orders`);

  await validateData();

  await disconnectDB();
}

seed().catch(async (err) => {
  console.error("Seed failed:", err.message);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
