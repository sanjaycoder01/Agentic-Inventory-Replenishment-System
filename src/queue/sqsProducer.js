import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

function getSqsRegion() {
  const queueUrl = process.env.SQS_QUEUE_URL;
  const match = queueUrl?.match(/sqs\.([^.]+)\.amazonaws\.com/);
  return match?.[1] ?? process.env.AWS_REGION;
}

const sqs = new SQSClient({
  region: getSqsRegion(),
});

export const sendToQueue = async (productId) => {
  const command = new SendMessageCommand({
    QueueUrl: process.env.SQS_QUEUE_URL,
    MessageBody: JSON.stringify({ productId }),
  });

  const response = await sqs.send(command);

  console.log("Message sent:", response.MessageId);
  return response;
};
