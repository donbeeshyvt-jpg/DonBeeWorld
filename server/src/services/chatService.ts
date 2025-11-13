import type { PoolClient } from "pg";

import { pool } from "../db/pool.js";
import { emitAnnouncement, emitChatMessage } from "../realtime/socketHub.js";
import { refreshBroadcastJobs } from "../realtime/broadcastScheduler.js";
import { relayChatToDiscord } from "../integrations/discordBridge.js";

type ChatMessagePayload = {
  id: number;
  channelKey: string;
  message: string;
  formatting: string | null;
  createdAt: string;
  profile?: {
    id: number;
    name: string;
    avatarUrl: string | null;
  };
  accountId?: number | null;
};

export async function postMessage(
  options: {
    channelKey: string;
    message: string;
    formatting?: string | null;
    profileId?: number;
    accountId?: number;
    source?: string;
  },
  config: { broadcast?: boolean } = { broadcast: true }
): Promise<ChatMessagePayload> {
  const { channelKey, message } = options;
  const { rows } = await pool.query<
    {
      id: number;
      channel_key: string;
      message: string;
      formatting: string | null;
      created_at: Date;
      profile_id: number | null;
      account_id: number | null;
      profile_name: string | null;
      avatar_url: string | null;
    }
  >(
    `
      WITH inserted AS (
        INSERT INTO chat_messages (channel_key, account_id, profile_id, message, formatting)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, channel_key, message, formatting, created_at, profile_id, account_id
      )
      SELECT i.*, p.profile_name, p.avatar_url
      FROM inserted i
      LEFT JOIN profiles p ON p.id = i.profile_id
    `,
    [
      channelKey,
      options.accountId ?? null,
      options.profileId ?? null,
      message,
      options.formatting ?? null
    ]
  );

  const row = rows[0];
  const payload: ChatMessagePayload = {
    id: row.id,
    channelKey: row.channel_key,
    message: row.message,
    formatting: row.formatting,
    createdAt: row.created_at.toISOString(),
    accountId: row.account_id
  };

  if (row.profile_id) {
    payload.profile = {
      id: row.profile_id,
      name: row.profile_name ?? "匿名冒險者",
      avatarUrl: row.avatar_url
    };
  }

  if (config.broadcast !== false) {
    emitChatMessage(payload);
  }

  await relayChatToDiscord(payload, options.source ?? "api");
  return payload;
}

export async function listRecentMessages(channelKey: string, limit = 50) {
  const { rows } = await pool.query<
    {
      id: number;
      channel_key: string;
      message: string;
      formatting: string | null;
      created_at: Date;
      profile_id: number | null;
      profile_name: string | null;
      avatar_url: string | null;
    }
  >(
    `
      SELECT
        cm.id,
        cm.channel_key,
        cm.message,
        cm.formatting,
        cm.created_at,
        p.id AS profile_id,
        p.profile_name,
        p.avatar_url
      FROM chat_messages cm
      LEFT JOIN profiles p ON p.id = cm.profile_id
      WHERE cm.channel_key = $1
      ORDER BY cm.created_at DESC
      LIMIT $2
    `,
    [channelKey, limit]
  );

  return rows
    .map((row) => ({
      id: row.id,
      channelKey: row.channel_key,
      message: row.message,
      formatting: row.formatting,
      createdAt: row.created_at.toISOString(),
      profile: row.profile_id
        ? {
            id: row.profile_id,
            name: row.profile_name ?? "冒險者",
            avatarUrl: row.avatar_url
          }
        : undefined
    }))
    .reverse();
}

export async function createAnnouncement(options: {
  title: string;
  content: string;
  startAt?: Date;
  endAt?: Date | null;
  createdBy?: number;
}) {
  const { rows } = await pool.query<
    {
      id: number;
      title: string;
      content: string;
      start_at: Date;
      end_at: Date | null;
    }
  >(
    `
      INSERT INTO announcements (title, content, start_at, end_at, created_by)
      VALUES ($1, $2, COALESCE($3, NOW()), $4, $5)
      RETURNING id, title, content, start_at, end_at
    `,
    [
      options.title,
      options.content,
      options.startAt ?? null,
      options.endAt ?? null,
      options.createdBy ?? null
    ]
  );

  const announcement = {
    id: rows[0].id,
    title: rows[0].title,
    content: rows[0].content,
    startAt: rows[0].start_at.toISOString(),
    endAt: rows[0].end_at ? rows[0].end_at.toISOString() : null
  };

  emitAnnouncement(announcement);
  return announcement;
}

export async function listActiveAnnouncements() {
  const now = new Date();
  const { rows } = await pool.query<{
    id: number;
    title: string;
    content: string;
    start_at: Date;
    end_at: Date | null;
  }>(
    `
      SELECT id, title, content, start_at, end_at
      FROM announcements
      WHERE start_at <= $1
        AND (end_at IS NULL OR end_at >= $1)
      ORDER BY start_at DESC
    `,
    [now]
  );

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    startAt: row.start_at.toISOString(),
    endAt: row.end_at ? row.end_at.toISOString() : null
  }));
}

export async function scheduleBroadcast(options: {
  channelKey: string;
  message: string;
  cronExpression: string;
  createdBy?: number;
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<{ id: number }>(
      `
        INSERT INTO scheduled_broadcasts (
          channel_key, message, cron_expression, created_by
        )
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `,
      [
        options.channelKey,
        options.message,
        options.cronExpression,
        options.createdBy ?? null
      ]
    );
    await client.query("COMMIT");
    await refreshBroadcastJobs(dispatchScheduledBroadcast);
    return rows[0].id;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function dispatchScheduledBroadcast(broadcast: {
  id: number;
  channel_key: string;
  message: string;
}) {
  await postMessage(
    {
      channelKey: broadcast.channel_key,
      message: broadcast.message,
      formatting: null,
      accountId: null,
      profileId: null,
      source: "broadcast"
    },
    { broadcast: true }
  );
}

export async function initializeChatSystem() {
  await refreshBroadcastJobs(dispatchScheduledBroadcast);
}

export async function withTransaction<T>(
  handler: (client: PoolClient) => Promise<T>
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await handler(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

