import type { NextFunction, Request, Response } from "express";

import { validateSessionToken } from "../services/authService.js";

export async function requireSession(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.header("Authorization");
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = header.slice(7).trim();
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const session = await validateSessionToken(token);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  req.auth = {
    token,
    accountId: session.accountId,
    profileId: session.profileId,
    account: session.account,
    profile: session.profile
  };

  return next();
}

