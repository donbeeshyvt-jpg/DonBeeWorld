import http from "http";
import express from "express";
import cors from "cors";

import { env } from "./env.js";
import { pool } from "./db/pool.js";
import { logger } from "./utils/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { gatheringRouter } from "./routes/gatheringRoutes.js";
import { economyRouter } from "./routes/economyRoutes.js";
import { marketRouter } from "./routes/marketRoutes.js";
import { chatRouter } from "./routes/chatRoutes.js";
import { initSocketServer } from "./realtime/socketServer.js";
import { adminRouter } from "./routes/adminRoutes.js";
import { authRouter } from "./routes/authRoutes.js";

const app = express();

const allowedOrigin =
  process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use(express.json());

app.get("/health", async (_req, res) => {
  const start = Date.now();
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", elapsedMs: Date.now() - start });
  } catch (error) {
    logger.error({ error }, "健康檢查失敗");
    res.status(503).json({ status: "error", elapsedMs: Date.now() - start });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/gather", gatheringRouter);
app.use("/api/economy", economyRouter);
app.use("/api/market", marketRouter);
app.use("/api/chat", chatRouter);
app.use("/api/admin", adminRouter);

app.use(errorHandler);

const httpServer = http.createServer(app);
initSocketServer(httpServer, allowedOrigin);

httpServer.listen(env.port, () => {
  logger.info(`DonBeeWorld Server 啟動於 http://localhost:${env.port}`);
});

