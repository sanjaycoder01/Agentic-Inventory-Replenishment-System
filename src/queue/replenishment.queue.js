import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

export const REPLENISHMENT_QUEUE_NAME = "replenishment";

export const replenishmentQueue = new Queue(REPLENISHMENT_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export async function enqueueReplenishmentJob(productId, options = {}) {
  const { orderId, delay } = options;

  return replenishmentQueue.add(
    "replenish-job",
    { productId: productId.toString(), orderId: orderId?.toString() ?? null },
    delay ? { delay } : undefined
  );
}
