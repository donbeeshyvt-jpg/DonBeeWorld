import { Pool } from "pg";

import { env } from "../env.js";
import { logger } from "../utils/logger.js";

export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000
});

pool.on("connect", () => {
  logger.debug("PostgreSQL 連線建立");
});

pool.on("error", (error) => {
  logger.error({ error }, "PostgreSQL 連線錯誤");
});

