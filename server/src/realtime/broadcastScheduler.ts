import cron, { ScheduledTask } from "node-cron";

import { pool } from "../db/pool.js";

type BroadcastRecord = {
  id: number;
  channel_key: string;
  message: string;
  cron_expression: string;
};

const activeTasks = new Map<number, ScheduledTask>();

function clearTasks() {
  for (const task of activeTasks.values()) {
    task.stop();
  }
  activeTasks.clear();
}

export async function refreshBroadcastJobs(
  handler: (broadcast: BroadcastRecord) => Promise<void>
) {
  clearTasks();
  const { rows } = await pool.query<BroadcastRecord>(
    `
      SELECT id, channel_key, message, cron_expression
      FROM scheduled_broadcasts
      WHERE is_active = TRUE
    `
  );

  for (const broadcast of rows) {
    if (!cron.validate(broadcast.cron_expression)) {
      continue;
    }
    const task = cron.schedule(broadcast.cron_expression, async () => {
      await handler(broadcast);
      await pool.query(
        `
          UPDATE scheduled_broadcasts
          SET last_run_at = NOW()
          WHERE id = $1
        `,
        [broadcast.id]
      );
    });
    activeTasks.set(broadcast.id, task);
  }
}

