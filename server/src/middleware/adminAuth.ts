import type { Request, Response, NextFunction } from "express";

import { env } from "../env.js";

export function requireAdminKey(req: Request, res: Response, next: NextFunction) {
  if (!env.adminKey) {
    return res.status(501).json({ message: "ADMIN_API_KEY 未設定" });
  }
  const headerKey = req.header("x-admin-key");
  if (headerKey !== env.adminKey) {
    return res.status(401).json({ message: "Admin key 驗證失敗" });
  }
  return next();
}

