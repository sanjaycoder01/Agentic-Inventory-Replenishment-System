import "dotenv/config";
import { Worker } from "bullmq";
import { connectDB } from "../config/db.js";
import { redisConnection } from "../config/redis.js";
import { REPLENISHMENT_QUEUE_NAME } from "../queue/replenishment.queue.js";
import { getProductMetrics } from "../services/metrics.service.js";
import { getAIReplenishmentDecision } from "../services/aiAgent.service.js";
import ReplenishmentLog from "../models/replenishmentLog.model.js";

await connectDB();

const worker = new Worker(
  REPLENISHMENT_QUEUE_NAME,
  async (job) => {
    const { productId, orderId } = job.data;

    console.log(`Processing job ${job.id} for product ${productId}`);

    const [metrics, decision] = await Promise.all([
      getProductMetrics(productId),
      getAIReplenishmentDecision(productId),
    ]);

    const log = await ReplenishmentLog.create({
      productId,
      orderId,
      decision: decision.decision,
      recommendedQty: decision.recommendedQty,
      confidence: decision.confidence,
      explanation: decision.explanation,
      source: decision.source,
      metrics: {
        totalSales: metrics.totalSales,
        avgDailySales: metrics.avgDailySales,
        stock: metrics.stock,
        daysLeft: metrics.daysLeft,
        status: metrics.status,
      },
    });

    console.log("Final Decision:", decision);

    return { logId: log._id.toString(), decision };
  },
  {
    connection: redisConnection,
    limiter: {
      max: 10,
      duration: 1000,
    },
  }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed for product ${job.data.productId}`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

console.log("Replenishment worker started. Waiting for jobs...");
