import type { PoolClient } from "pg";

import { pool } from "../db/pool.js";
import { logger } from "../utils/logger.js";

type GatherNodeRow = {
  node_key: string;
  display_name: string;
  scene: string;
  skill_type: string;
  base_duration_seconds: number;
  max_parallel_jobs: number;
  success_rate: number;
  output_item_key: string;
  output_min: number;
  output_max: number;
};

type GatherJobRow = {
  id: number;
  profile_id: number;
  node_key: string;
  status: string;
  started_at: Date;
  expected_end_at: Date;
  duration_seconds: number;
  completed_at: Date | null;
  progress_percentage: number;
  result_json: any;
};

export type GatherJobSummary = {
  id: number;
  nodeKey: string;
  nodeName: string;
  status: string;
  startedAt: string;
  expectedEndAt: string;
  progressPercentage: number;
  result?: {
    items: { itemKey: string; quantity: number }[];
    experience: number;
    claimed: boolean;
    completedAt: string;
    offline: boolean;
  };
};

const ACTIVE_STATUSES = ["queued", "running"];

export function calculateLevelFromExperience(exp: number): number {
  let level = 1;
  let threshold = 100;
  while (exp >= threshold) {
    level += 1;
    threshold += Math.floor(100 * Math.pow(level, 1.35));
    if (level >= 120) break;
  }
  return level;
}

function mergeItems(items: { itemKey: string; quantity: number }[]) {
  const map = new Map<string, number>();
  for (const item of items) {
    map.set(item.itemKey, (map.get(item.itemKey) ?? 0) + item.quantity);
  }
  return Array.from(map.entries()).map(([itemKey, quantity]) => ({
    itemKey,
    quantity
  }));
}

function generateGatherOutcome(
  node: GatherNodeRow,
  cycles: number
): { items: { itemKey: string; quantity: number }[]; experience: number } {
  const drops: { itemKey: string; quantity: number }[] = [];
  for (let i = 0; i < cycles; i += 1) {
    if (Math.random() <= node.success_rate) {
      const quantity =
        node.output_min +
        Math.floor(Math.random() * (node.output_max - node.output_min + 1));
      drops.push({ itemKey: node.output_item_key, quantity });
    }
  }
  const merged = mergeItems(drops);
  const experience = Math.max(10, Math.round(node.base_duration_seconds * cycles * 0.2));
  return { items: merged, experience };
}

async function ensureNode(nodeKey: string, client: PoolClient) {
  const { rows } = await client.query<GatherNodeRow>(
    `
      SELECT
        node_key,
        display_name,
        scene,
        skill_type,
        base_duration_seconds,
        max_parallel_jobs,
        success_rate,
        output_item_key,
        output_min,
        output_max
      FROM gather_nodes
      WHERE node_key = $1
    `,
    [nodeKey]
  );
  if (rows.length === 0) {
    throw new Error(`找不到採集點 ${nodeKey}`);
  }
  return rows[0];
}

export async function startGatherJob(options: {
  profileId: number;
  nodeKey: string;
  cycles?: number;
}) {
  const { profileId, nodeKey } = options;
  const cycles = Math.max(1, Math.min(options.cycles ?? 1, 20));

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const node = await ensureNode(nodeKey, client);

    const { rows: activeCountRows } = await client.query<{ count: string }>(
      `
        SELECT COUNT(*)::text AS count
        FROM gather_jobs
        WHERE profile_id = $1
          AND node_key = $2
          AND status = ANY($3::text[])
      `,
      [profileId, nodeKey, ACTIVE_STATUSES]
    );

    const activeCount = Number(activeCountRows[0].count);
    if (activeCount >= node.max_parallel_jobs) {
      throw new Error(
        `此採集點已達到同時作業上限 (${node.max_parallel_jobs})`
      );
    }

    const durationSeconds = node.base_duration_seconds * cycles;
    const expectedEndAt = new Date(Date.now() + durationSeconds * 1000);

    const { rows } = await client.query<GatherJobRow>(
      `
        INSERT INTO gather_jobs (
          profile_id, node_key, status, started_at,
          expected_end_at, duration_seconds, result_json
        )
        VALUES ($1, $2, 'running', NOW(), $3, $4, $5::jsonb)
        RETURNING *
      `,
      [
        profileId,
        nodeKey,
        expectedEndAt,
        durationSeconds,
        JSON.stringify({
          cycles,
          items: [],
          experience: 0,
          claimed: false,
          offline: false
        })
      ]
    );

    await client.query("COMMIT");
    const job = rows[0];
    return {
      id: job.id,
      nodeKey: job.node_key,
      status: job.status,
      startedAt: job.started_at.toISOString(),
      expectedEndAt: job.expected_end_at.toISOString(),
      progressPercentage: job.progress_percentage
    };
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error({ error }, "建立採集作業失敗");
    throw error;
  } finally {
    client.release();
  }
}

async function awardGatherRewards(
  client: PoolClient,
  job: GatherJobRow,
  node: GatherNodeRow
) {
  const cycles = job.result_json.cycles ?? 1;
  const { items, experience } = generateGatherOutcome(node, cycles);

  const experiencePerItem =
    items.length > 0 ? Math.floor(experience / items.length) : 0;
  const extraExperience =
    items.length > 0 ? experience - experiencePerItem * items.length : experience;

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const experienceForThisItem =
      items.length > 0
        ? experiencePerItem + (index === 0 ? extraExperience : 0)
        : 0;
    await client.query(
      `
        INSERT INTO inventory (profile_id, item_key, quantity, metadata)
        VALUES ($1, $2, $3, '{}'::jsonb)
        ON CONFLICT (profile_id, item_key, metadata) DO UPDATE
        SET quantity = inventory.quantity + EXCLUDED.quantity
      `,
      [job.profile_id, item.itemKey, item.quantity]
    );

    await client.query(
      `
        INSERT INTO gather_results (job_id, item_key, quantity, experience_gained)
        VALUES ($1, $2, $3, $4)
      `,
      [job.id, item.itemKey, item.quantity, experienceForThisItem]
    );
  }

  const skillKey = `gathering_${node.skill_type}`;
  const { rows } = await client.query<{
    experience: string;
  }>(
    `
      INSERT INTO profile_skills (profile_id, skill_key, level, experience)
      VALUES ($1, $2, 1, $3)
      ON CONFLICT (profile_id, skill_key) DO UPDATE
      SET experience = profile_skills.experience + EXCLUDED.experience
      RETURNING experience::text
    `,
    [job.profile_id, skillKey, experience]
  );

  const totalExp = Number(rows[0].experience);
  const newLevel = calculateLevelFromExperience(totalExp);
  await client.query(
    `
      UPDATE profile_skills
      SET level = $1, updated_at = NOW()
      WHERE profile_id = $2 AND skill_key = $3
    `,
    [newLevel, job.profile_id, skillKey]
  );

  return { items, experience };
}

async function completeJobIfDue(jobId: number) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<GatherJobRow>(
      `
        SELECT *
        FROM gather_jobs
        WHERE id = $1
        FOR UPDATE
      `,
      [jobId]
    );
    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }
    const job = rows[0];
    if (job.status !== "running") {
      await client.query("ROLLBACK");
      return job;
    }

    const node = await ensureNode(job.node_key, client);
    const { items, experience } = await awardGatherRewards(client, job, node);
    const updatedResult = {
      ...(job.result_json ?? {}),
      items,
      experience,
      claimed: false,
      offline: true
    };

    const { rows: updatedRows } = await client.query<GatherJobRow>(
      `
        UPDATE gather_jobs
        SET status = 'completed',
            completed_at = NOW(),
            progress_percentage = 100,
            result_json = $2::jsonb
        WHERE id = $1
        RETURNING *
      `,
      [job.id, JSON.stringify(updatedResult)]
    );

    await client.query("COMMIT");
    return updatedRows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error({ error }, "結算採集作業失敗");
    throw error;
  } finally {
    client.release();
  }
}

function computeProgress(job: GatherJobRow) {
  const now = Date.now();
  const elapsedMs = now - job.started_at.getTime();
  const progress = Math.min(
    100,
    Math.max(0, (elapsedMs / (job.duration_seconds * 1000)) * 100)
  );
  return progress;
}

export async function listGatherJobs(profileId: number): Promise<GatherJobSummary[]> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: dueJobs } = await client.query<{ id: number }>(
      `
        SELECT id
        FROM gather_jobs
        WHERE profile_id = $1
          AND status = 'running'
          AND expected_end_at <= NOW()
      `,
      [profileId]
    );

    for (const job of dueJobs) {
      await completeJobIfDue(job.id);
    }

    const { rows } = await client.query<
      GatherJobRow & {
        node_display_name: string;
      }
    >(
      `
        SELECT gj.*, gn.display_name AS node_display_name
        FROM gather_jobs gj
        JOIN gather_nodes gn ON gn.node_key = gj.node_key
        WHERE gj.profile_id = $1
        ORDER BY gj.started_at DESC
      `,
      [profileId]
    );

    const summaries: GatherJobSummary[] = [];
    for (const job of rows) {
      let progress = job.progress_percentage;
      if (job.status === "running") {
        progress = computeProgress(job);
        await client.query(
          `UPDATE gather_jobs SET progress_percentage = $2 WHERE id = $1`,
          [job.id, progress]
        );
      }

      const summary: GatherJobSummary = {
        id: job.id,
        nodeKey: job.node_key,
        nodeName: job.node_display_name,
        status: job.status,
        startedAt: job.started_at.toISOString(),
        expectedEndAt: job.expected_end_at.toISOString(),
        progressPercentage: Number(progress.toFixed(2))
      };

      if (job.status === "completed" && job.result_json) {
        summary.result = {
          items: job.result_json.items ?? [],
          experience: job.result_json.experience ?? 0,
          claimed: job.result_json.claimed ?? false,
          completedAt: job.completed_at
            ? job.completed_at.toISOString()
            : job.expected_end_at.toISOString(),
          offline: Boolean(job.result_json.offline)
        };
      }

      summaries.push(summary);
    }

    await client.query("COMMIT");
    return summaries;
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error({ error }, "取得採集作業列表失敗");
    throw error;
  } finally {
    client.release();
  }
}

export async function claimGatherResult(options: { jobId: number; profileId: number }) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query<GatherJobRow>(
      `
        UPDATE gather_jobs
        SET result_json = jsonb_set(
              result_json,
              '{claimed}',
              'true'::jsonb,
              true
            )
        WHERE id = $1
          AND profile_id = $2
          AND status = 'completed'
        RETURNING *
      `,
      [options.jobId, options.profileId]
    );

    if (rows.length === 0) {
      throw new Error("找不到可領取的採集結果");
    }
    return rows[0];
  } finally {
    client.release();
  }
}

