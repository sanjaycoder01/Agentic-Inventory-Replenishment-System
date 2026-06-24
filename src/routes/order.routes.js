import { Router } from "express";
import { createOrder } from "../services/order.service.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { productId, quantity, orderDate } = req.body;
    const order = await createOrder({ productId, quantity, orderDate });
    res.status(201).json({
      message: "Order created. Replenishment job queued.",
      order,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

export default router;
