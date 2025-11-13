import { Router } from "express";

import {
  exchangeCurrency,
  getWalletBalances
} from "../services/economyService.js";
import { requireSession } from "../middleware/requireSession.js";

export const economyRouter = Router();

economyRouter.use(requireSession);

economyRouter.get("/wallets", async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const balances = await getWalletBalances(req.auth.profileId);
    return res.json({ balances });
  } catch (error) {
    return next(error);
  }
});

economyRouter.post("/exchange", async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { fromCurrency, toCurrency, amount } = req.body ?? {};
    if (!fromCurrency || !toCurrency || !amount) {
      return res
        .status(400)
        .json({ message: "請提供 fromCurrency / toCurrency / amount" });
    }
    const result = await exchangeCurrency({
      profileId: req.auth.profileId,
      fromCurrency,
      toCurrency,
      amount: Number(amount)
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

