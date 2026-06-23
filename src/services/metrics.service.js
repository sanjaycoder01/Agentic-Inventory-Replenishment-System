import mongoose from "mongoose";
import Order from "../models/order.model.js";
import Inventory from "../models/inventory.model.js";

function getLast30DaysDate() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date;
}

function getStockStatus(daysLeft) {
  if (daysLeft < 3) return "CRITICAL";
  if (daysLeft < 7) return "LOW";
  return "OK";
}

export const getProductMetrics = async (productId) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    const error = new Error("Invalid product ID");
    error.statusCode = 400;
    throw error;
  }

  const last30Days = getLast30DaysDate();
  const objectId = new mongoose.Types.ObjectId(productId);

  const [salesResult, inventory] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          productId: objectId,
          orderDate: { $gte: last30Days },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$quantity" },
        },
      },
    ]),
    Inventory.findOne({ productId: objectId }),
  ]);

  const totalSales = salesResult[0]?.totalSales ?? 0;
  const avgDailySales = totalSales / 30;
  const stock = inventory?.stock ?? 0;
  const daysLeft =
    avgDailySales > 0 ? stock / avgDailySales : stock;
  const status = getStockStatus(daysLeft);

  return {
    productId,
    totalSales,
    avgDailySales: Number(avgDailySales.toFixed(2)),
    stock,
    daysLeft: Number(daysLeft.toFixed(2)),
    status,
  };
};
