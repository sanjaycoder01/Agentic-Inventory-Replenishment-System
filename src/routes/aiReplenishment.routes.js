import { Router } from "express";
import { getAIReplenishmentDecision } from "../services/aiAgent.service.js";

const router = Router();

router.get("/:productId", async (req, res) => {
  try {
    const data = await getAIReplenishmentDecision(req.params.productId);
    res.json(data);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

export default router;
