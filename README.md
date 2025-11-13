# DonBeeWorld 開發說明

本資料夾是全新重製的「DonBeeWorld」專案主體，依照 `.plan.md` 的八大章節逐步落實。核心目標：

- 以史萊姆酒館為主軸，結合 Melvor Idle 風格的多技能成長、採集與冒險系統。
- 建立雙貨幣（`金幣` / `魂幣`）經濟、可調整的市場波動與贊助管道。
- 提供 GM / 內容營運後台、即時聊天（含 Discord 擴充）、離線收益回報等功能。

## 目錄結構（初始）

```
docs/
  ├─ gdd/                  # 遊戲設計文件
  ├─ architecture/         # 系統架構與模組說明
  ├─ data/                 # 資料表規格、匯入匯出模板
  └─ operations/           # 後台/營運/Discord 流程
README.md                  # 本檔案
```

## 使用方式

1. 先閱讀 `docs/gdd/overview.md`、`docs/architecture/system_overview.md`，掌握整體世界觀與技術架構。
2. 資料相關設定（任務、採集點、商品、裝備等）請依 `docs/data/specs/` 的規格建立 Google Sheet 或 CSV，再透過後台匯入。
3. 營運/GM 流程（公告、跑馬燈、Discord 連動）請參考 `docs/operations/` 內的說明。

變更流程、模組拆解、測試與部署規範，皆在 `.plan.md` 與各資料夾內同步維護；開發時務必更新對應文件，保持擴充性與可追蹤性。***

## 快速指令

| 功能             | 指令                               |
| ---------------- | ---------------------------------- |
| 後端開發         | `cd server && npm run dev`        |
| 資料庫遷移       | `cd server && npm run db:migrate` |
| 初始資料匯入     | `cd server && npm run db:seed`    |
| 單元測試         | `cd server && npm run test`       |
| 前端開發         | `cd client && npm run dev`        |

更多部署與監控細節請參考 `docs/operations/deployment.md`。***

