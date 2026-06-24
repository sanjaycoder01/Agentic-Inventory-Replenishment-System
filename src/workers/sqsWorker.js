import "dotenv/config";
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import { connectDB } from "../config/db.js";
import { getProductMetrics } from "../services/metrics.service.js";
import { getAIReplenishmentDecision } from "../services/aiAgent.service.js";
import ReplenishmentLog from "../models/replenishmentLog.model.js";

function getSqsRegion() {
  const queueUrl = process.env.SQS_QUEUE_URL;
  const match = queueUrl?.match(/sqs\.([^.]+)\.amazonaws\.com/);
  return match?.[1] ?? process.env.AWS_REGION;
}

const sqs = new SQSClient({
  region: getSqsRegion(),
});

const QUEUE_URL = process.env.SQS_QUEUE_URL;

const UNRECOVERABLE_ERRORS = ["Invalid product ID", "Product not found"];

async function deleteMessage(receiptHandle) {
  await sqs.send(
    new DeleteMessageCommand({
      QueueUrl: QUEUE_URL,
      ReceiptHandle: receiptHandle,
    })
  );
}

const pollQueue = async () => {
  try {
    const command = new ReceiveMessageCommand({
      QueueUrl: QUEUE_URL,
      MaxNumberOfMessages: 5,
      WaitTimeSeconds: 10,
    });

    const response = await sqs.send(command);

    if (response.Messages) {
      for (const message of response.Messages) {
        try {
          const { productId } = JSON.parse(message.Body);

          console.log("Processing product:", productId);

          const [metrics, decision] = await Promise.all([
            getProductMetrics(productId),
            getAIReplenishmentDecision(productId),
          ]);

          await ReplenishmentLog.create({
            productId,
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

          await deleteMessage(message.ReceiptHandle);

          console.log("Message deleted ✅");
        } catch (err) {
          console.error("Error processing message:", err.message);

          if (UNRECOVERABLE_ERRORS.includes(err.message)) {
            await deleteMessage(message.ReceiptHandle);
            console.log("Unrecoverable message deleted ✅");
          }
        }
      }
    }
  } catch (err) {
    console.error("Poll error:", err.message);
  }

  setTimeout(pollQueue, 2000);
};

await connectDB();
console.log("SQS worker started. Polling for messages...");
pollQueue();
