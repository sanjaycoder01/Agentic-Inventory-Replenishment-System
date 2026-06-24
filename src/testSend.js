import "dotenv/config";
import { connectDB, disconnectDB } from "./config/db.js";
import Product from "./models/product.model.js";
import { sendToQueue } from "./queue/sqsProducer.js";

await connectDB();

let productId = process.argv[2];

if (!productId) {
  const product = await Product.findOne({ name: "Product-5" });
  productId = product?._id?.toString() ?? "test-product-123";
}

await sendToQueue(productId);
console.log(`Queued productId: ${productId}`);

await disconnectDB();
