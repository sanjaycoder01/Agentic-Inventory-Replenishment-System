import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    stock: { type: Number, required: true },
    warehouse: { type: String, required: true },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export default mongoose.model("Inventory", inventorySchema);
