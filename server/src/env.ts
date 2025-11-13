import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL 必須是合法的 PostgreSQL 連線字串"),
  PORT: z.string().optional(),
  ADMIN_API_KEY: z.string().optional()
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("環境變數驗證失敗:", parsed.error.flatten().fieldErrors);
  throw new Error("請檢查 .env / 系統環境變數設定");
}

export const env = {
  databaseUrl: parsed.data.DATABASE_URL,
  port: parsed.data.PORT ? Number(parsed.data.PORT) : 4000,
  adminKey: parsed.data.ADMIN_API_KEY ?? null
};

