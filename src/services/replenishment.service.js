import { getProductMetrics } from "./metrics.service.js";

const LEAD_TIME_DAYS = 5;
const SAFETY_STOCK = 20;
const VARIABILITY_FACTOR = 1.2;

function calculateRecommendedQty(avgDailySales) {
  return Math.ceil(
    avgDailySales * LEAD_TIME_DAYS * VARIABILITY_FACTOR + SAFETY_STOCK
  );
}

export const getReplenishmentDecision = async (productId) => {
  const metrics = await getProductMetrics(productId);
  const { avgDailySales, stock, daysLeft, status } = metrics;

  if (avgDailySales === 0) {
    return {
      productId,
      action: "NO_ACTION",
      recommendedQty: 0,
      urgency: "LOW",
      reason: "No recent sales data",
    };
  }

  let action = "NO_ACTION";
  let recommendedQty = 0;
  let urgency = "LOW";
  let reason = "Stock level is sufficient";

  if (stock === 0) {
    action = "REORDER";
    urgency = "HIGH";
  } else if (status === "CRITICAL") {
    action = "REORDER";
    urgency = "HIGH";
  } else if (status === "LOW") {
    action = "REORDER";
    urgency = "MEDIUM";
  }

  if (action === "REORDER") {
    recommendedQty = calculateRecommendedQty(avgDailySales);
    reason = stock === 0
      ? `Out of stock. Avg sales: ${avgDailySales.toFixed(1)}/day, Stock: ${stock}`
      : `Avg sales: ${avgDailySales.toFixed(1)}/day, Stock: ${stock}, Days left: ${daysLeft.toFixed(1)}`;
  }

  return {
    productId,
    action,
    recommendedQty,
    urgency,
    reason,
  };
};
