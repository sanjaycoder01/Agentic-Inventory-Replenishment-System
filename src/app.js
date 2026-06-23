import "dotenv/config";
import express from "express";
import { connectDB } from "./config/db.js";
import metricsRoutes from "./routes/metrics.routes.js";
import replenishmentRoutes from "./routes/replenishment.routes.js";
import aiReplenishmentRoutes from "./routes/aiReplenishment.routes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/metrics", metricsRoutes);
app.use("/replenish", replenishmentRoutes);
app.use("/ai-replenish", aiReplenishmentRoutes);

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start app:", err.message);
  process.exit(1);
});
