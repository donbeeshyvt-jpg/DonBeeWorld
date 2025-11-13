import { Router } from "express";

import {
  buyMarketItem,
  getMarketOverview,
  sellMarketItem,
  simulateMarketTick
} from "../services/marketService.js";
import { requireSession } from "../middleware/requireSession.js";

export const marketRouter = Router();

marketRouter.get("/items", async (_req, res, next) => {
  try {
    const overview = await getMarketOverview();
    return res.json({ items: overview });
  } catch (error) {
    return next(error);
  }
});

marketRouter.post("/buy", requireSession, async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { marketItemKey, quantity, currency } = req.body ?? {};
    if (!marketItemKey || !quantity) {
      return res
        .status(400)
        .json({ message: "缺少 marketItemKey 或 quantity" });
    }
    const result = await buyMarketItem({
      profileId: req.auth.profileId,
      marketItemKey,
      quantity: Number(quantity),
      currency: (currency ?? "coin") === "soul" ? "soul" : "coin"
    });
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
});

marketRouter.post("/sell", requireSession, async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { marketItemKey, quantity, currency } = req.body ?? {};
    if (!marketItemKey || !quantity) {
      return res
        .status(400)
        .json({ message: "缺少 marketItemKey 或 quantity" });
    }
    const result = await sellMarketItem({
      profileId: req.auth.profileId,
      marketItemKey,
      quantity: Number(quantity),
      currency: (currency ?? "coin") === "soul" ? "soul" : "coin"
    });
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
});

marketRouter.post("/tick", requireSession, async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const results = await simulateMarketTick(req.auth.accountId);
    return res.json({ results });
  } catch (error) {
    return next(error);
  }
});

