import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { pool } from "../db/pool.js";
import { logger } from "../utils/logger.js";

const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../migrations"
);

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGSERIAL PRIMARY KEY,
      version TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const result = await pool.query<{
    version: string;
  }>("SELECT version FROM schema_migrations ORDER BY version ASC");
  return new Set(result.rows.map((row) => row.version));
}

async function applyMigration(version: string, sql: string) {
  logger.info({ version }, "套用 migration");
  await pool.query("BEGIN");
  try {
    await pool.query(sql);
    await pool.query(
      "INSERT INTO schema_migrations (version, applied_at) VALUES ($1, NOW())",
      [version]
    );
    await pool.query("COMMIT");
    logger.info({ version }, "完成");
  } catch (error) {
    await pool.query("ROLLBACK");
    logger.error({ version, error }, "套用 migration 失敗");
    throw error;
  }
}

async function resetDatabase() {
  logger.warn("執行資料庫重置：將刪除所有使用者資料");
  await pool.query("BEGIN");
  try {
    await pool.query(`
      DO $$
      DECLARE
        statement RECORD;
      BEGIN
        FOR statement IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'schema_migrations') LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(statement.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `);
    await pool.query("TRUNCATE schema_migrations");
    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    logger.error({ error }, "重置資料庫失敗");
    throw error;
  }
}

async function run() {
  const shouldReset = process.argv.includes("--reset");
  await ensureMigrationsTable();

  if (shouldReset) {
    await resetDatabase();
  }

  const files = await fs.readdir(MIGRATIONS_DIR);
  const sqlFiles = files.filter((file) => file.endsWith(".sql")).sort();

  const appliedVersions = await getAppliedMigrations();

  for (const file of sqlFiles) {
    const version = path.basename(file, ".sql");
    if (appliedVersions.has(version)) {
      logger.debug({ version }, "已套用，略過");
      continue;
    }
    const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), "utf-8");
    await applyMigration(version, sql);
  }

  logger.info("所有 migrations 已同步");
  await pool.end();
}

run().catch((error) => {
  logger.error({ error }, "migration 腳本終止");
  process.exitCode = 1;
});

