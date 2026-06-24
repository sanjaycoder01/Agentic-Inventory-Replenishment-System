import "dotenv/config";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/db.js";
import Product from "../models/product.model.js";
import ReplenishmentLog from "../models/replenishmentLog.model.js";
import { createOrder } from "../services/order.service.js";

async function simulate() {
  await connectDB();

  const product = await Product.findOne({ name: "Product-5" });
  if (!product) {
    throw new Error("Product-5 not found. Run npm run seed first.");
  }

  const order = await createOrder({
    productId: product._id,
    quantity: 3,
  });

  console.log(`Order created: ${order._id}`);
  console.log(`Replenishment job queued for product: ${product.name}`);
  console.log("Check worker terminal for processing output.");

  await new Promise((resolve) => setTimeout(resolve, 8000));

  const log = await ReplenishmentLog.findOne({ orderId: order._id }).sort({
    createdAt: -1,
  });

  if (log) {
    console.log("\nStored replenishment log:");
    console.log(JSON.stringify(log, null, 2));
  } else {
    console.log(
      "\nNo log yet — ensure Redis is running and start the worker with: npm run worker"
    );
  }

  await disconnectDB();
}

simulate().catch(async (err) => {
  console.error("Simulation failed:", err.message);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
