# System Architecture Overview

此文件概述「冬蜜大陸世界」正式版的技術架構、模組邊界與資料流，並特別說明雙貨幣與市場/交易互通設計。

## 1. 高階拓樸

```
玩家前端 (Next.js SPA)
    │  WebSocket / REST
    ▼
API Gateway (Express/Fastify)
    │
    ├─ Service 層（採集、冒險、任務、裝備、寵物、聊天、GM 後台、Market）
    │        │
    │        ├─ PostgreSQL (核心資料庫)
    │        ├─ Redis / In-memory (即時聊天、排程)
    │        └─ Storage (圖像資產、匯入匯出檔案)
    │
    ├─ Discord Bot Service（同步公告、查詢指令）
    └─ Notification Hub（跑馬燈、Email/SMS 擴充預留）
```

## 2. 核心模組

| 模組 | 功能摘要 | 主要資料表 |
| --- | --- | --- |
| `Account` | 帳號管理、登入、修改帳號、自助刪除、忘記密碼提示 | `accounts`, `account_sessions`, `account_settings` |
| `Profile` | 角色資料、屬性、裝備欄、技能成長、寵物擁有 | `profiles`, `profile_attributes`, `profile_equipment`, `profile_skills`, `profile_pets` |
| `Gathering` | 採集/採礦/釣魚/採藥時間進度、多工、離線紀錄 | `gather_nodes`, `gather_jobs`, `gather_results` |
| `Crafting` | 配方、加工、煉金、烹飪 | `recipes`, `recipe_inputs`, `recipe_outputs` |
| `Adventure/Battle` | 冒險派遣、副本、戰鬥結果、Boss | `adventure_missions`, `adventure_runs`, `battle_logs` |
| `Quest/Achievement` | 任務、成就、每日/季節活動 | `quests`, `quest_rewards`, `quest_progress`, `achievements`, `achievement_progress` |
| `Economy` | 雙貨幣、匯率、贊助、商城、交易紀錄 | `currencies`, `currency_rates`, `sponsorship_orders`, `shops`, `shop_items`, `transactions` |
| `Market` | 股票/自由市場，商品價格波動、玩家掛單 | `market_items`, `market_ticks`, `market_orders`, `market_order_history` |
| `Inventory` | 全部物資管理，可買賣、丟棄、倉庫 | `items`, `inventory`, `item_images` |
| `NPC` | NPC 設定、對話、交易、任務掛勾 | `npcs`, `npc_dialogues`, `npc_stores` |
| `Chat/Notification` | 即時聊天、公告、跑馬燈、Discord 同步 | `chat_messages`, `announcements`, `scheduled_broadcasts` |
| `GM/Admin` | 後台操作、審計、Google Sheet 匯入匯出 | `admin_logs`, `import_jobs`, `audit_trails` |

## 3. 雙貨幣與交易互通

- 貨幣類型僅有 `Coin`（金幣）與 `Soul`（魂幣）。  
- `currency_rates` 表保存目前匯率（預設 1 Soul = 100 Coin），可在後台更新。
- 所有物資（任務獎勵、採集產出、商店、NPC、玩家掛單、市場交易）都使用 `items` 與 `inventory` 表統一管理；貨幣也是 `items` 的特例，方便在交易流程中共通計算。
- 購買流程：
  1. 若玩家使用魂幣購買，依當前匯率折算所需魂幣；不足部分以金幣補足（或反之）。
  2. 找零時優先以金幣返還；若需要折算魂幣則記錄在 `currency_exchange_logs`。
- 市場系統每間隔（預設每日）執行排程計算價格波動，更新 `market_ticks`，並觸發通知／跑馬燈。所有 NPC 商店、玩家自由交易、後台手動調整，皆讀寫相同資料表，因此能互通。

## 4. 圖像與資產管理

- 所有圖示（道具、NPC、技能、裝備、寵物）使用 32px/64px 格式。後台支援拖拉/上傳到 S3 或本地 storage，並寫回 `item_images` 或對應表。
- 若未上傳圖像，前端使用預設佔位符。

## 5. 匯入匯出與 Google Sheet

- 規格表放於 `docs/data/specs/*.csv`；後台提供 CSV / Google Sheet 的匯入功能：
  - 任務、採集點、配方、裝備、NPC、商店、寵物、活動等都可透過表格匯入/匯出。
  - 匯入工作建立在 `import_jobs`，並寫入 `audit_trails` 方便追蹤。

## 6. Discord 與外部服務

- 狀態查詢（錢包、裝備、排行榜）、市場即時價格、戰鬥結果、公告、跑馬燈等都可同步到 Discord 指定頻道。
- 後台可設定 Bot Token、頻道 ID、觸發指令。

## 7. 安全與審計

- 所有 GM 操作、匯入、貨幣調整、公告發布都寫入 `admin_logs` 與 `audit_trails`。
- 資料庫提供 view / materialized view 供營運分析使用，並整合 BI 工具（可選 Superset、Metabase）。

> 詳細 schema 與 API 說明請參考 `docs/data/` 與 `docs/architecture/modules/*.md`。***

