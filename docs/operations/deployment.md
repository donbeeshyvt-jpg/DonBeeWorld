# 部署與營運指引

> 更新日期：2025-11-12

## 1. 環境需求

- Node.js 20+
- PostgreSQL 16（預設資料庫名稱 `donbee_world_dev`）
- `npm` 或 `pnpm`
- 前後端共用環境變數：

```
# server/.env
DATABASE_URL=postgres://postgres:password@localhost:5432/donbee_world_dev
ADMIN_API_KEY=請自行產生

# client/.env.local
NEXT_PUBLIC_API_BASE=http://localhost:4000
```

## 2. 初始化流程

```bash
cd server
npm install
npm run db:migrate
npm run db:seed

cd ../client
npm install
```

本機開發啟動：

```bash
cd server && npm run dev
# 另開視窗
cd client && npm run dev
```

## 3. 測試與品質檢查

- `npm run lint`：ESLint 與 Prettier 檢查
- `npm run test`：Vitest 單元測試（涵蓋採集系統等關鍵邏輯）
- `npm run db:reset`：重新套用 migration 並重建初始資料

建議在 CI 中設置：

1. `npm ci`
2. `npm run lint`
3. `npm run test -- --coverage`
4. `npm run build`

## 4. 部署流程

1. **資料庫**：在雲端 PostgreSQL 建立新實例，執行 `npm run db:migrate`、`npm run db:seed`。
2. **後端**：
   ```bash
   npm install --production
   npm run build
   node dist/index.js
   ```
   建議使用 `pm2` 或 `systemd` 管理行程，並將 `ADMIN_API_KEY` 以環境變數設定。
3. **前端**：
   ```bash
   npm install
   npm run build
   npm run start
   ```
   可部署於 Vercel / Netlify，記得在平台設定 `NEXT_PUBLIC_API_BASE` 指向後端位址。

## 5. 監控與排程

- **健康檢查**：`GET /health`，可掛在 Load Balancer 或 Uptime Robot 追蹤。
- **排程**：
  - 市場價格波動：使用 `admin` API 觸發 `POST /api/market/tick` 或由 cron job 定時呼叫。
  - 跑馬燈：`scheduled_broadcasts` 透過 `node-cron` 自動執行，更新後可呼叫 `POST /api/admin/broadcasts/reload` 重新載入。
- **日誌**：`pino` 以 JSON 格式輸出，建議串接 ELK/Graylog。
- **備份**：每日匯出 PostgreSQL dumps (`pg_dump`)，並備份 `shops/items` 匯出檔案。

## 6. 匯入/匯出流程

- 匯入：`POST /api/admin/import`（需帶 `x-admin-key`），可一次帶入 `items / gatherNodes / quests / shops / marketItems`。
- 匯出：`GET /api/admin/export` 回傳 JSON 檔，可另存為 CSV 或 Google Sheet。

## 7. Discord 與外部整合

- 於 `server/src/integrations/discordBridge.ts` 設定 Token，呼叫 `configureDiscord({ enabled: true })` 後即可同步訊息。
- 若需贊助支付，可擴充 `/api/market/buy` 為第三方支付回呼。

## 8. 上線檢查清單

- [ ] `.env` / `.env.local` 已設定
- [ ] migration + seed 在新環境跑過一次
- [ ] `npm run lint` / `npm run test` 全數通過
- [ ] 貨幣匯率 (`currency_rates`) 與商店 (`shops`) 已匯入最新版本
- [ ] Discord Bot 與公告頻道測試完成
- [ ] Admin API key 已更新並保存在密鑰管理服務

> 若有新模組（如副本、活動、季票）請同步更新此文件與 `.plan.md` 的 To-dos。***

