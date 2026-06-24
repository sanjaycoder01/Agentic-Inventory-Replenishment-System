import { SQSClient } from "@aws-sdk/client-sqs";

const client = new SQSClient({
  region: process.env.AWS_REGION
});

console.log("SQS client initialized successfully");