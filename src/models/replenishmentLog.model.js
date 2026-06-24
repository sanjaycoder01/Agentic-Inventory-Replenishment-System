import mongoose from "mongoose";

const replenishmentLogSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    decision: {
      type: String,
      enum: ["REORDER", "NO_ACTION"],
      required: true,
    },
    recommendedQty: { type: Number, required: true },
    confidence: {
      type: String,
      enum: ["HIGH", "MEDIUM", "LOW"],
      required: true,
    },
    explanation: { type: String, required: true },
    source: { type: String, enum: ["ai", "rules"], required: true },
    metrics: {
      totalSales: Number,
      avgDailySales: Number,
      stock: Number,
      daysLeft: Number,
      status: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ReplenishmentLog", replenishmentLogSchema);
