# 系統模組分層說明

> 版本：0.2.0  
> 更新日期：2025-11-12

本文件針對主要後端服務模組與資料流進行更細分解，以利團隊分工與 OOAD 設計。

## 1. 分層架構

```
Presentation (Next.js | Discord Bot)
    │
Application Services (API Gateway Controllers)
    │
Domain Services (內部模組：Account, Profile, Gathering, Adventure, Economy, Market, Chat, Admin, Localization)
    │
Repositories / Integrations (PostgreSQL, Redis, Storage, External APIs)
    │
Infrastructure (Config, Logger, Scheduler, Auth, WebSocket Hub)
```

### 1.1 Application Services

- 每個 REST / WebSocket / GraphQL 端點對應到一個 `Controller`。
- 透過 `asyncHandler` 統一錯誤處理，並注入 Domain Service。
- 採用 `zod`/`io-ts` 驗證請求，統一回傳格式。

### 1.2 Domain Services

| Service | 職責 | 主要事件 |
| --- | --- | --- |
| `AccountService` | 帳號註冊、登入、修改帳號名、忘記密碼彈窗、自刪帳號、GM 管理 | `AccountCreated`, `PasswordViewed`, `AccountDeleted` |
| `ProfileService` | 角色建立、屬性成長、裝備套用、技能經驗 | `ProfileLeveled`, `EquipmentUpdated` |
| `GatheringService` | 採集排程、離線成果、進度同步 | `GatheringStarted`, `GatheringFinished` |
| `AdventureService` | 副本派遣、戰鬥結算、戰報同步 | `AdventureStarted`, `AdventureCompleted` |
| `EconomyService` | 貨幣結算、匯率換算、贊助入帳 | `CurrencyTransferred`, `ExchangeSettled` |
| `MarketService` | 市場掛單、股市波動、NPC 共用庫存 | `MarketOrderPlaced`, `MarketTickUpdated` |
| `QuestService` | 任務與成就進度、獎勵發放 | `QuestProgressed`, `AchievementUnlocked` |
| `ChatService` | 即時聊天、公告排程、Discord 同步 | `MessagePosted`, `AnnouncementBroadcasted` |
| `AdminService` | 後台操作、權限控管、審計紀錄 | `AdminActionLogged` |
| `LocalizationService` | 語系載入、Google Sheet 匯入 | `LocaleUpdated` |

## 2. 關鍵流程

### 2.1 採集 → 倉庫 → 市場

1. 玩家在帳篷營地下任務，建立 `gather_jobs`。
2. 伺服器排程更新進度，完成後寫入 `gather_results` 與 `inventory`。
3. 若玩家設定自動上架，呼叫 `MarketService.createListing`，放入世界市場。
4. 成交後觸發 `EconomyService`，依貨幣類型更新錢包與交易紀錄。

### 2.2 魂幣贊助 → 商店購買 → 找零

1. 贊助成功後，`EconomyService.creditSoulCoin` 增加魂幣。
2. 玩家於酒館購買魂幣專屬禮包；若價值 150 金幣且匯率 1:100：
   - 扣除 2 魂幣 → 找零 50 金幣。
   - 系統產生 `currency_exchange_logs`。

### 2.3 GM 後台新增裝備

1. GM 透過後台表單或 Google Sheet 匯入，提交裝備資料。
2. `AdminService` 呼叫 `ItemRepository.upsertMany`，更新 `items`、`item_stats`。
3. 寫入 `audit_trails`，並通知前端刷新快取。

## 3. 外部整合

- **Discord Bot**：使用 `discord.js` 監聽指令，透過內部 REST API 查詢遊戲資訊；亦可訂閱 WebSocket 事件推播戰報。
- **Google Sheet**：使用 Google API 下載 CSV，對應 `docs/data/specs/` 欄位；可由後台手動匯入或排程同步。
- **存儲**：玩家頭像、物資圖示、活動橫幅存於 S3/MinIO；資料庫僅存 URL 與 metadata。

## 4. 排程與事件

- `Quartz` / `BullMQ` 排程每日市場波動、離線採集結算、公告排程。
- 事件匯流排（如 `Redis Pub/Sub` 或 `Kafka`）可用於聊天與戰報廣播。
- 將重要事件記錄在 `event_log` 以利偵錯。

## 5. 安全設計

- Session Token 存於 `account_sessions`，支援多端登入。
- `requireAdmin` / `requireGM` 中介層檢查權限、審計。
- 聊天與公告需過濾敏感詞、支援玩家檢舉流程。
- API rate limit、資源鎖（交易、上架）防止濫用。

## 6. 可擴充性

- 模組皆以介面定義，方便未來替換資料儲存（如切分微服務）。
- 新增技能或區域時，只需增加對應的 `Config` 與 `Service` 實作，再更新資料規格模板。

> 更詳細的資料表欄位與 API 請參考 `docs/data/specs/` 與 `docs/architecture/api_contracts/`（待後續補充）。*** End Patch

