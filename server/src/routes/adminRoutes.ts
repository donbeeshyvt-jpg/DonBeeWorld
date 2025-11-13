import { Router } from "express";

import { pool } from "../db/pool.js";
import { requireAdminKey } from "../middleware/adminAuth.js";
import {
  upsertGatherNodes,
  upsertItems,
  upsertMarketItems,
  upsertQuests,
  upsertShops
} from "../services/adminService.js";
import { refreshBroadcastJobs } from "../realtime/broadcastScheduler.js";
import { postMessage } from "../services/chatService.js";

export const adminRouter = Router();

adminRouter.use(requireAdminKey);

adminRouter.post("/import", async (req, res, next) => {
  const { items, gatherNodes, quests, shops, marketItems, accountId } =
    req.body ?? {};
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (Array.isArray(items) && items.length > 0) {
      await upsertItems(client, items, accountId ?? null);
    }
    if (Array.isArray(gatherNodes) && gatherNodes.length > 0) {
      await upsertGatherNodes(client, gatherNodes, accountId ?? null);
    }
    if (Array.isArray(quests) && quests.length > 0) {
      await upsertQuests(client, quests, accountId ?? null);
    }
    if (Array.isArray(shops) && shops.length > 0) {
      await upsertShops(client, shops, accountId ?? null);
    }
    if (Array.isArray(marketItems) && marketItems.length > 0) {
      await upsertMarketItems(client, marketItems, accountId ?? null);
    }
    await client.query("COMMIT");
    return res.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
});

adminRouter.get("/export", async (_req, res, next) => {
  try {
    const [items, gatherNodes, quests, shops, marketItems] = await Promise.all([
      pool.query("SELECT * FROM items ORDER BY item_key"),
      pool.query("SELECT * FROM gather_nodes ORDER BY node_key"),
      pool.query("SELECT * FROM quests ORDER BY quest_key"),
      pool.query(
        `
          SELECT s.*, jsonb_agg(si.* ORDER BY si.item_key) AS items
          FROM shops s
          LEFT JOIN shop_items si ON si.shop_key = s.shop_key
          GROUP BY s.shop_key
        `
      ),
      pool.query("SELECT * FROM market_items ORDER BY market_item_key")
    ]);
    return res.json({
      items: items.rows,
      gatherNodes: gatherNodes.rows,
      quests: quests.rows,
      shops: shops.rows,
      marketItems: marketItems.rows
    });
  } catch (error) {
    return next(error);
  }
});

adminRouter.post("/currency/rate", async (req, res, next) => {
  const { baseCurrency, quoteCurrency, rate, notes } = req.body ?? {};
  if (!baseCurrency || !quoteCurrency || !rate) {
    return res
      .status(400)
      .json({ message: "缺少 baseCurrency / quoteCurrency / rate" });
  }
  try {
    await pool.query(
      `
        INSERT INTO currency_rates (base_currency, quote_currency, rate, notes)
        VALUES ($1,$2,$3,$4)
        ON CONFLICT (base_currency, quote_currency) DO UPDATE SET
          rate = EXCLUDED.rate,
          notes = EXCLUDED.notes,
          effective_at = NOW()
      `,
      [baseCurrency, quoteCurrency, rate, notes ?? null]
    );
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

adminRouter.post("/broadcasts/reload", async (_req, res, next) => {
  try {
    await refreshBroadcastJobs(async (broadcast) => {
      await postMessage(
        {
          channelKey: broadcast.channel_key,
          message: broadcast.message,
          source: "manual-broadcast"
        },
        { broadcast: true }
      );
    });
    return res.json({ reloaded: true });
  } catch (error) {
    return next(error);
  }
});

