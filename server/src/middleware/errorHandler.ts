import type { ErrorRequestHandler } from "express";

import { logger } from "../utils/logger.js";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  logger.error({ error }, "API 錯誤");
  if (res.headersSent) {
    return res.end();
  }
  const message =
    error instanceof Error ? error.message : "系統發生未預期錯誤";
  return res.status(500).json({ message });
};

