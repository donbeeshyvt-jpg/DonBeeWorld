# 資料規格與匯入模板

此資料夾提供 Google Sheet／CSV 匯入的欄位定義，對應後端資料表與後台匯入流程。所有欄位皆使用 UTF-8、逗號分隔（`,`），字串請勿含換行；若需換行請使用 `\n` 轉義。

## 1. 檔案一覽

- `items_template.csv`：道具、裝備、消耗品。
- `gather_nodes_template.csv`：採集點與技能設定。
- `quests_template.csv`：任務、條件、獎勵。
- `npc_shops_template.csv`：NPC 商店庫存、價格。
- `market_items_template.csv`：市場 / 股市項目設定。
- `adventure_missions_template.csv`：冒險派遣、副本定義。

> 依需求可新增其他模板，請同步更新此檔並於後台匯入模組註冊。

## 2. 命名規範

- `key` 欄位使用 `snake_case`，並以場景前綴，例如 `tavern_honeybrew`, `workshop_forge_pickaxe`.
- `display_name` 需支援多語：預設為繁體中文；若使用 Google Sheet，可增設 `display_name_en` 等欄位並透過匯入程式寫入 i18n。
- `category` 需與系統內定義的一致，如 `weapon`, `armor`, `consumable`, `material`, `soulshop`.
- 價格欄位分為 `price_coin`、`price_soul`，若未使用請填 `0`。

## 3. 匯入流程

1. 從 Google Sheet 匯出 CSV，或於本地編輯這些模板。
2. 前往 GM 後台 → `資料匯入`，選擇對應模板上傳。
3. 系統會先進行欄位驗證，通過後再套用至資料庫並記錄於 `import_jobs`。
4. 可於 `audit_trails` 查閱歷史匯入紀錄。

## 4. 備註

- 若需批次刪除或復原，可在後台使用「回滾至匯入版本」功能。
- 建議在正式套用前，先於測試伺服器匯入並確認資料正確性。
- 任何新增欄位請先更新 migration 與 seed，再同步至模板。*** End Patch

