import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

import { pool } from "../db/pool.js";
import type { PoolClient } from "pg";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

type AccountRow = {
  id: number;
  username: string;
};

type ProfileRow = {
  id: number;
  profile_name: string;
  avatar_url: string | null;
};

export type AuthSession = {
  token: string;
  account: {
    id: number;
    username: string;
  };
  profile: {
    id: number;
    profileName: string;
    avatarUrl: string | null;
  };
};

export async function registerAccount(options: {
  username: string;
  password: string;
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query<AccountRow>(
      `SELECT id, username FROM accounts WHERE username = $1`,
      [options.username]
    );
    if (existing.rowCount && existing.rows.length > 0) {
      throw new Error("USERNAME_TAKEN");
    }

    const passwordHash = await bcrypt.hash(options.password, 10);

    const accountResult = await client.query<AccountRow>(
      `
        INSERT INTO accounts (username, password_plain, password_hash, created_at, updated_at)
        VALUES ($1, NULL, $2, NOW(), NOW())
        RETURNING id, username
      `,
      [options.username, passwordHash]
    );
    const account = accountResult.rows[0];

    const profileResult = await client.query<ProfileRow>(
      `
        INSERT INTO profiles (account_id, profile_name, avatar_url, created_at, updated_at)
        VALUES ($1, $2, NULL, NOW(), NOW())
        RETURNING id, profile_name, avatar_url
      `,
      [account.id, `${account.username}`]
    );
    const profile = profileResult.rows[0];

    const session = await createSession(client, account.id, profile.id);

    await client.query("COMMIT");
    return formatSession(session, account, profile);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function loginAccount(options: {
  username: string;
  password: string;
}) {
  const client = await pool.connect();
  try {
    const accountResult = await client.query<
      AccountRow & { password_hash: string | null }
    >(
      `
        SELECT id, username, password_hash
        FROM accounts
        WHERE username = $1
      `,
      [options.username]
    );

    if (accountResult.rowCount === 0) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const account = accountResult.rows[0];
    if (!account.password_hash) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const valid = await bcrypt.compare(options.password, account.password_hash);
    if (!valid) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const profileResult = await client.query<ProfileRow>(
      `
        SELECT id, profile_name, avatar_url
        FROM profiles
        WHERE account_id = $1
        ORDER BY created_at ASC
        LIMIT 1
      `,
      [account.id]
    );

    if (profileResult.rowCount === 0) {
      throw new Error("PROFILE_NOT_FOUND");
    }

    const profile = profileResult.rows[0];
    const session = await createSession(client, account.id, profile.id);
    return formatSession(session, account, profile);
  } finally {
    client.release();
  }
}

export async function validateSessionToken(token: string) {
  const result = await pool.query<{
    session_token: string;
    account_id: number;
    profile_id: number;
    username: string;
    profile_name: string;
    avatar_url: string | null;
    expires_at: Date;
  }>(
    `
      SELECT
        s.session_token,
        s.account_id,
        (s.metadata ->> 'profileId')::BIGINT AS profile_id,
        a.username,
        p.profile_name,
        p.avatar_url,
        s.expires_at
      FROM account_sessions s
      JOIN accounts a ON a.id = s.account_id
      LEFT JOIN profiles p ON p.id = (s.metadata ->> 'profileId')::BIGINT
      WHERE s.session_token = $1
      LIMIT 1
    `,
    [token]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];
  if (row.expires_at.getTime() < Date.now()) {
    await pool.query(
      `DELETE FROM account_sessions WHERE session_token = $1`,
      [token]
    );
    return null;
  }

  if (!row.profile_id) {
    const fallbackProfile = await pool.query<ProfileRow>(
      `
        SELECT id, profile_name, avatar_url
        FROM profiles
        WHERE account_id = $1
        ORDER BY created_at ASC
        LIMIT 1
      `,
      [row.account_id]
    );
    if (fallbackProfile.rowCount === 0) {
      return null;
    }
    row.profile_id = fallbackProfile.rows[0].id;
    row.profile_name = fallbackProfile.rows[0].profile_name;
    row.avatar_url = fallbackProfile.rows[0].avatar_url;
  }

  return {
    accountId: row.account_id,
    profileId: Number(row.profile_id),
    account: {
      id: row.account_id,
      username: row.username
    },
    profile: {
      id: Number(row.profile_id),
      profileName: row.profile_name,
      avatarUrl: row.avatar_url
    }
  };
}

export async function revokeSession(token: string) {
  await pool.query(`DELETE FROM account_sessions WHERE session_token = $1`, [
    token
  ]);
}

async function createSession(client: PoolClient, accountId: number, profileId: number) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  const result = await client.query<{
    session_token: string;
    expires_at: Date;
    metadata: { profileId: number };
  }>(
    `
      INSERT INTO account_sessions (session_token, account_id, expires_at, metadata)
      VALUES ($1, $2, $3, $4::jsonb)
      RETURNING session_token, expires_at, metadata
    `,
    [token, accountId, expiresAt, JSON.stringify({ profileId })]
  );

  return result.rows[0];
}

function formatSession(
  session: { session_token: string },
  account: AccountRow,
  profile: ProfileRow
): AuthSession {
  return {
    token: session.session_token,
    account: {
      id: account.id,
      username: account.username
    },
    profile: {
      id: profile.id,
      profileName: profile.profile_name,
      avatarUrl: profile.avatar_url
    }
  };
}

