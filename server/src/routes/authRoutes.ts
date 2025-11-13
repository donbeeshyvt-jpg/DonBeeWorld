import { Router } from "express";

import {
  loginAccount,
  registerAccount,
  validateSessionToken
} from "../services/authService.js";
import { requireSession } from "../middleware/requireSession.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res, next) => {
  try {
    const { username, password } = req.body ?? {};
    if (typeof username !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "請提供 username 與 password" });
    }

    const trimmedUsername = username.trim();
    if (!trimmedUsername || trimmedUsername.length < 3) {
      return res.status(400).json({ message: "帳號至少 3 個字元" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "密碼至少 6 個字元" });
    }

    const session = await registerAccount({
      username: trimmedUsername,
      password
    });
    return res.status(201).json(session);
  } catch (error) {
    if (error instanceof Error && error.message === "USERNAME_TAKEN") {
      return res.status(409).json({ message: "帳號已存在" });
    }
    return next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body ?? {};
    if (typeof username !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "請提供 username 與 password" });
    }
    const session = await loginAccount({
      username: username.trim(),
      password
    });
    return res.json(session);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({ message: "帳號或密碼錯誤" });
    }
    return next(error);
  }
});

authRouter.get("/me", requireSession, async (req, res) => {
  if (!req.auth) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return res.json({
    token: req.auth.token,
    account: req.auth.account,
    profile: req.auth.profile
  });
});

authRouter.get("/session/:token", async (req, res) => {
  const token = req.params.token;
  if (!token) {
    return res.status(400).json({ message: "token 不可為空" });
  }
  const session = await validateSessionToken(token);
  if (!session) {
    return res.status(404).json({ message: "Session 不存在" });
  }
  return res.json({
    token,
    account: session.account,
    profile: session.profile
  });
});

