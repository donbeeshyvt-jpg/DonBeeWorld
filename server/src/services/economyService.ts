import type { PoolClient } from "pg";

import { pool } from "../db/pool.js";

type WalletRow = {
  id: number;
  balance: string;
  locked_amount: string;
};

async function ensureWallet(
  client: PoolClient,
  ownerType: "profile",
  ownerId: number,
  currencyKey: string
): Promise<WalletRow> {
  const { rows } = await client.query<WalletRow & { created: boolean }>(
    `
      INSERT INTO wallets (owner_type, owner_id, currency_key)
      VALUES ($1, $2, $3)
      ON CONFLICT (owner_type, owner_id, currency_key) DO UPDATE
      SET owner_type = wallets.owner_type
      RETURNING id, balance::text, locked_amount::text
    `,
    [ownerType, ownerId, currencyKey]
  );
  return rows[0];
}

export async function getWalletBalances(profileId: number) {
  const { rows } = await pool.query<{
    currency_key: string;
    balance: string;
    locked_amount: string;
  }>(
    `
      SELECT currency_key, balance::text, locked_amount::text
      FROM wallets
      WHERE owner_type = 'profile'
        AND owner_id = $1
    `,
    [profileId]
  );

  const balances: Record<
    string,
    { balance: number; lockedAmount: number }
  > = {};
  for (const row of rows) {
    balances[row.currency_key] = {
      balance: Number(row.balance),
      lockedAmount: Number(row.locked_amount)
    };
  }
  return balances;
}

export async function adjustWalletBalance(opts: {
  client: PoolClient;
  profileId: number;
  currencyKey: string;
  amount: number;
  reason: string;
  source?: string;
}) {
  const { client, profileId, currencyKey, amount } = opts;
  const wallet = await ensureWallet(client, "profile", profileId, currencyKey);
  const newBalance = Number(wallet.balance) + amount;
  if (newBalance < 0) {
    throw new Error(`貨幣 ${currencyKey} 餘額不足`);
  }
  await client.query(
    `
      UPDATE wallets
      SET balance = $2, updated_at = NOW()
      WHERE id = $1
    `,
    [wallet.id, newBalance]
  );

  await client.query(
    `
      INSERT INTO currency_transactions (
        wallet_id, amount, currency_key, direction, source_type, source_reference
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [
      wallet.id,
      Math.abs(amount),
      currencyKey,
      amount >= 0 ? "credit" : "debit",
      opts.reason,
      opts.source ?? null
    ]
  );
}

export async function getCurrencyRate(base: string, quote: string) {
  const { rows } = await pool.query<{
    rate: string;
  }>(
    `
      SELECT rate::text
      FROM currency_rates
      WHERE base_currency = $1
        AND quote_currency = $2
    `,
    [base, quote]
  );
  if (rows.length === 0) {
    throw new Error(`找不到 ${base}/${quote} 匯率設定`);
  }
  return Number(rows[0].rate);
}

export async function exchangeCurrency(options: {
  profileId: number;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const rate = await getCurrencyRate(options.fromCurrency, options.toCurrency);
    const quoteAmount = Math.floor(options.amount * rate);
    await adjustWalletBalance({
      client,
      profileId: options.profileId,
      currencyKey: options.fromCurrency,
      amount: -options.amount,
      reason: "exchange",
      source: `${options.fromCurrency}->${options.toCurrency}`
    });
    await adjustWalletBalance({
      client,
      profileId: options.profileId,
      currencyKey: options.toCurrency,
      amount: quoteAmount,
      reason: "exchange",
      source: `${options.fromCurrency}->${options.toCurrency}`
    });
    await client.query(
      `
        INSERT INTO currency_exchange_logs (
          from_currency, to_currency, from_amount, to_amount,
          rate_applied, profile_id
        ) VALUES ($1,$2,$3,$4,$5,$6)
      `,
      [
        options.fromCurrency,
        options.toCurrency,
        options.amount,
        quoteAmount,
        rate,
        options.profileId
      ]
    );
    await client.query("COMMIT");
    return { fromAmount: options.amount, toAmount: quoteAmount, rate };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

