import mongoose from "mongoose";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import Order from "../models/order.model.js";
import { getProductMetrics } from "./metrics.service.js";
import { getReplenishmentDecision } from "./replenishment.service.js";

const AgentState = Annotation.Root({
  metrics: Annotation,
  trend: Annotation,
  ruleDecision: Annotation,
  aiRaw: Annotation,
  finalDecision: Annotation,
});

async function getDemandTrend(productId) {
  const objectId = new mongoose.Types.ObjectId(productId);
  const now = new Date();
  const last7 = new Date(now);
  last7.setDate(now.getDate() - 7);
  const prior14 = new Date(now);
  prior14.setDate(now.getDate() - 14);

  const [recent, prior] = await Promise.all([
    Order.aggregate([
      { $match: { productId: objectId, orderDate: { $gte: last7 } } },
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]),
    Order.aggregate([
      {
        $match: {
          productId: objectId,
          orderDate: { $gte: prior14, $lt: last7 },
        },
      },
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]),
  ]);

  const recentWeekSales = recent[0]?.total ?? 0;
  const priorWeekSales = prior[0]?.total ?? 0;
  const recentDaily = recentWeekSales / 7;
  const priorDaily = priorWeekSales / 7;
  const changePercent =
    priorDaily > 0
      ? ((recentDaily - priorDaily) / priorDaily) * 100
      : recentDaily > 0
        ? 100
        : 0;

  let trend = "STABLE";
  if (changePercent > 10) trend = "INCREASING";
  else if (changePercent < -10) trend = "DECREASING";

  return {
    recentWeekSales,
    priorWeekSales,
    trend,
    changePercent: Number(changePercent.toFixed(1)),
  };
}

function buildPrompt(metrics, trend, ruleDecision) {
  return `You are an inventory management expert.

Given:
- Product ID: ${metrics.productId}
- Avg daily sales (30d): ${metrics.avgDailySales}
- Total sales (30d): ${metrics.totalSales}
- Current stock: ${metrics.stock}
- Days of inventory left: ${metrics.daysLeft}
- Stock status: ${metrics.status}
- Demand trend (last 7d vs prior 7d): ${trend.trend} (${trend.changePercent}% change)
- Recent week sales: ${trend.recentWeekSales} units
- Prior week sales: ${trend.priorWeekSales} units
- Rule-based suggestion: ${ruleDecision.action}, qty ${ruleDecision.recommendedQty}

Decide:
1. Should we reorder? Use decision "REORDER" or "NO_ACTION"
2. Recommended quantity (integer, 0 if no reorder)
3. Confidence: "HIGH", "MEDIUM", or "LOW"
4. Brief explanation considering demand trend and stock risk

Rules:
- Be logical and realistic
- If demand is INCREASING and stock is LOW/CRITICAL, consider ordering more than the rule engine
- If demand is DECREASING and stock is OK, prefer NO_ACTION
- Output valid JSON only, no markdown

JSON schema:
{
  "decision": "REORDER" | "NO_ACTION",
  "recommendedQty": number,
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "explanation": "string"
}`;
}

function parseAIJson(content) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(jsonText);
}

function validateAIDecision(parsed) {
  if (!parsed || typeof parsed !== "object") return null;

  let decision = parsed.decision ?? parsed.action;
  if (decision === "YES") decision = "REORDER";
  if (decision === "NO") decision = "NO_ACTION";
  if (!["REORDER", "NO_ACTION"].includes(decision)) return null;

  const recommendedQty = Number(
    parsed.recommendedQty ?? parsed.recommendedQuantity ?? 0
  );
  if (!Number.isFinite(recommendedQty) || recommendedQty < 0) return null;
  if (decision === "NO_ACTION" && recommendedQty !== 0) {
    parsed.recommendedQty = 0;
  }

  const confidence = String(parsed.confidence ?? "MEDIUM").toUpperCase();
  if (!["HIGH", "MEDIUM", "LOW"].includes(confidence)) return null;

  const explanation = String(parsed.explanation ?? parsed.reason ?? "").trim();
  if (!explanation) return null;

  return {
    decision,
    recommendedQty:
      decision === "NO_ACTION" ? 0 : Math.ceil(recommendedQty),
    confidence,
    explanation,
  };
}

function ruleToAIDecision(ruleDecision) {
  return {
    decision: ruleDecision.action,
    recommendedQty: ruleDecision.recommendedQty,
    confidence: ruleDecision.urgency,
    explanation: ruleDecision.reason,
    source: "rules",
  };
}

async function analyzeNode(state) {
  if (!process.env.OPENAI_API_KEY) {
    return { aiRaw: null };
  }

  try {
    const llm = new ChatOpenAI({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0,
    });

    const prompt = buildPrompt(state.metrics, state.trend, state.ruleDecision);
    const response = await llm.invoke(prompt);
    const content =
      typeof response.content === "string"
        ? response.content
        : response.content.map((c) => c.text ?? "").join("");

    return { aiRaw: content };
  } catch (err) {
    console.warn("AI analysis failed, falling back to rules:", err.message);
    return { aiRaw: null };
  }
}

function decideNode(state) {
  if (state.aiRaw) {
    try {
      const parsed = parseAIJson(state.aiRaw);
      const validated = validateAIDecision(parsed);
      if (validated) {
        return {
          finalDecision: {
            productId: state.metrics.productId,
            ...validated,
            source: "ai",
          },
        };
      }
    } catch {
      // fall through to rule engine
    }
  }

  return {
    finalDecision: {
      productId: state.metrics.productId,
      ...ruleToAIDecision(state.ruleDecision),
    },
  };
}

const agentGraph = new StateGraph(AgentState)
  .addNode("analyze", analyzeNode)
  .addNode("decide", decideNode)
  .addEdge(START, "analyze")
  .addEdge("analyze", "decide")
  .addEdge("decide", END)
  .compile();

export const getAIReplenishmentDecision = async (productId) => {
  const [metrics, ruleDecision, trend] = await Promise.all([
    getProductMetrics(productId),
    getReplenishmentDecision(productId),
    getDemandTrend(productId),
  ]);

  const result = await agentGraph.invoke({
    metrics,
    ruleDecision,
    trend,
    aiRaw: null,
    finalDecision: null,
  });

  return result.finalDecision;
};
