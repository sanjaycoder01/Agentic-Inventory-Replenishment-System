import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/inventory-replenishment";

export async function connectDB() {
  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connected");
}

export async function disconnectDB() {
  await mongoose.disconnect();
  console.log("MongoDB disconnected");
}
