import { Router } from "express";
import { getProductMetrics } from "../services/metrics.service.js";

const router = Router();

router.get("/:productId", async (req, res) => {
  try {
    const data = await getProductMetrics(req.params.productId);
    res.json(data);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

export default router;
