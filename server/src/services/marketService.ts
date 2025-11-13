import type { PoolClient } from "pg";

import { pool } from "../db/pool.js";
import {
  adjustWalletBalance,
  getCurrencyRate
} from "./economyService.js";

type MarketItemRow = {
  market_item_key: string;
  display_name: string;
  display_name_en: string;
  category: string;
  base_price: number;
  min_price: number;
  max_price: number;
  daily_delta_min: number;
  daily_delta_max: number;
  volatility: number;
  event_modifier: string | null;
  price: number;
  delta: number;
  occurred_at: Date | null;
};

type InventoryRow = {
  id: number;
  quantity: number;
};

async function getInventoryRow(
  client: PoolClient,
  profileId: number,
  itemKey: string
): Promise<InventoryRow | null> {
  const { rows } = await client.query<InventoryRow>(
    `
      SELECT id, quantity
      FROM inventory
      WHERE profile_id = $1
        AND item_key = $2
        AND metadata = '{}'::jsonb
      FOR UPDATE
    `,
    [profileId, itemKey]
  );
  if (rows.length === 0) {
    return null;
  }
  return rows[0];
}

async function addInventory(
  client: PoolClient,
  profileId: number,
  itemKey: string,
  quantity: number
) {
  await client.query(
    `
      INSERT INTO inventory (profile_id, item_key, quantity, metadata)
      VALUES ($1, $2, $3, '{}'::jsonb)
      ON CONFLICT (profile_id, item_key, metadata) DO UPDATE
      SET quantity = inventory.quantity + EXCLUDED.quantity
    `,
    [profileId, itemKey, quantity]
  );
}

async function deductInventory(
  client: PoolClient,
  profileId: number,
  itemKey: string,
  quantity: number
) {
  const row = await getInventoryRow(client, profileId, itemKey);
  if (!row || row.quantity < quantity) {
    throw new Error("倉庫沒有足夠的物品可出售");
  }
  const remaining = row.quantity - quantity;
  if (remaining === 0) {
    await client.query(`DELETE FROM inventory WHERE id = $1`, [row.id]);
  } else {
    await client.query(
      `UPDATE inventory SET quantity = $2 WHERE id = $1`,
      [row.id, remaining]
    );
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function getMarketOverview() {
  const { rows } = await pool.query<MarketItemRow>(
    `
      SELECT
        mi.*,
        COALESCE(mt.price, mi.base_price) AS price,
        COALESCE(mt.delta, 0) AS delta,
        mt.occurred_at
      FROM market_items mi
      LEFT JOIN LATERAL (
        SELECT price, delta, occurred_at
        FROM market_ticks
        WHERE market_item_key = mi.market_item_key
        ORDER BY occurred_at DESC
        LIMIT 1
      ) mt ON TRUE
      ORDER BY mi.market_item_key
    `
  );

  return rows.map((row) => ({
    marketItemKey: row.market_item_key,
    displayName: row.display_name,
    displayNameEn: row.display_name_en,
    category: row.category,
    price: row.price,
    delta: row.delta,
    occurredAt: row.occurred_at ? row.occurred_at.toISOString() : null,
    basePrice: row.base_price,
    minPrice: row.min_price,
    maxPrice: row.max_price
  }));
}

export async function simulateMarketTick(executorAccountId?: number) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: items } = await client.query<MarketItemRow>(
      `
        SELECT
          mi.*,
          COALESCE(mt.price, mi.base_price) AS price
        FROM market_items mi
        LEFT JOIN LATERAL (
          SELECT price
          FROM market_ticks
          WHERE market_item_key = mi.market_item_key
          ORDER BY occurred_at DESC
          LIMIT 1
        ) mt ON TRUE
      `
    );

    const results: { marketItemKey: string; newPrice: number }[] = [];
    for (const item of items) {
      const delta = randomInt(item.daily_delta_min, item.daily_delta_max);
      const rawPrice = item.price + delta;
      const clamped = clamp(rawPrice, item.min_price, item.max_price);
      await client.query(
        `
          INSERT INTO market_ticks (market_item_key, price, delta, occurred_at)
          VALUES ($1, $2, $3, NOW())
        `,
        [item.market_item_key, clamped, delta]
      );
      results.push({ marketItemKey: item.market_item_key, newPrice: clamped });
    }

    if (executorAccountId) {
      await client.query(
        `
          INSERT INTO admin_logs (account_id, action, metadata)
          VALUES ($1, 'market_tick', $2::jsonb)
        `,
        [executorAccountId, JSON.stringify(results)]
      );
    }

    await client.query("COMMIT");
    return results;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getCurrentPrice(
  client: PoolClient,
  marketItemKey: string
): Promise<number> {
  const { rows } = await client.query<{ price: number }>(
    `
      SELECT price
      FROM market_ticks
      WHERE market_item_key = $1
      ORDER BY occurred_at DESC
      LIMIT 1
    `,
    [marketItemKey]
  );
  if (rows.length === 0) {
    const { rows: baseRows } = await client.query<{ base_price: number }>(
      `
        SELECT base_price
        FROM market_items
        WHERE market_item_key = $1
      `,
      [marketItemKey]
    );
    if (baseRows.length === 0) {
      throw new Error(`找不到市場項目 ${marketItemKey}`);
    }
    return baseRows[0].base_price;
  }
  return rows[0].price;
}

export async function buyMarketItem(options: {
  profileId: number;
  marketItemKey: string;
  quantity: number;
  currency: "coin" | "soul";
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const price = await getCurrentPrice(client, options.marketItemKey);
    const totalCoinCost = price * options.quantity;
    if (options.currency === "coin") {
      await adjustWalletBalance({
        client,
        profileId: options.profileId,
        currencyKey: "coin",
        amount: -totalCoinCost,
        reason: "market_purchase",
        source: options.marketItemKey
      });
    } else {
      const rate = await getCurrencyRate("soul", "coin");
      const soulCost = Math.ceil(totalCoinCost / rate);
      const changeCoin = soulCost * rate - totalCoinCost;
      await adjustWalletBalance({
        client,
        profileId: options.profileId,
        currencyKey: "soul",
        amount: -soulCost,
        reason: "market_purchase",
        source: options.marketItemKey
      });
      if (changeCoin > 0) {
        await adjustWalletBalance({
          client,
          profileId: options.profileId,
          currencyKey: "coin",
          amount: changeCoin,
          reason: "soul_change",
          source: options.marketItemKey
        });
      }
    }

    await addInventory(
      client,
      options.profileId,
      options.marketItemKey,
      options.quantity
    );

    await client.query("COMMIT");
    return { totalCoinCost, currency: options.currency };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function sellMarketItem(options: {
  profileId: number;
  marketItemKey: string;
  quantity: number;
  currency: "coin" | "soul";
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const price = await getCurrentPrice(client, options.marketItemKey);
    const totalCoinValue = price * options.quantity;
    await deductInventory(
      client,
      options.profileId,
      options.marketItemKey,
      options.quantity
    );

    if (options.currency === "coin") {
      await adjustWalletBalance({
        client,
        profileId: options.profileId,
        currencyKey: "coin",
        amount: totalCoinValue,
        reason: "market_sell",
        source: options.marketItemKey
      });
    } else {
      const rate = await getCurrencyRate("soul", "coin");
      const soulGain = Math.floor(totalCoinValue / rate);
      const coinRemainder = totalCoinValue - soulGain * rate;
      if (soulGain > 0) {
        await adjustWalletBalance({
          client,
          profileId: options.profileId,
          currencyKey: "soul",
          amount: soulGain,
          reason: "market_sell",
          source: options.marketItemKey
        });
      }
      if (coinRemainder > 0) {
        await adjustWalletBalance({
          client,
          profileId: options.profileId,
          currencyKey: "coin",
          amount: coinRemainder,
          reason: "market_sell_change",
          source: options.marketItemKey
        });
      }
    }

    await client.query("COMMIT");
    return { totalCoinValue, currency: options.currency };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

