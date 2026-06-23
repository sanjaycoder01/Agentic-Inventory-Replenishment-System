import { Router } from "express";
import { getReplenishmentDecision } from "../services/replenishment.service.js";

const router = Router();

router.get("/:productId", async (req, res) => {
  try {
    const data = await getReplenishmentDecision(req.params.productId);
    res.json(data);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

export default router;
