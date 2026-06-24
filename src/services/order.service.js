import mongoose from "mongoose";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import { enqueueReplenishmentJob } from "../queue/replenishment.queue.js";

export async function createOrder({ productId, quantity, orderDate }) {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    const error = new Error("Invalid product ID");
    error.statusCode = 400;
    throw error;
  }

  const product = await Product.findById(productId);
  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  if (!quantity || quantity < 1) {
    const error = new Error("Quantity must be at least 1");
    error.statusCode = 400;
    throw error;
  }

  const order = await Order.create({
    productId,
    quantity,
    orderDate: orderDate ? new Date(orderDate) : new Date(),
  });

  await enqueueReplenishmentJob(productId, { orderId: order._id });

  return order;
}
