import { PoolClient } from "pg";

import { pool } from "../db/pool.js";
import { logger } from "../utils/logger.js";
import {
  currencySeeds,
  currencyRateSeed,
  itemSeeds,
  gatherNodeSeeds,
  questSeeds,
  npcShopSeeds,
  adventureMissionSeeds,
  marketItemSeeds
} from "../config/staticData.js";

type ShopSeed = {
  shopKey: string;
  npcKey: string;
  displayName: string;
  displayNameEn: string;
  scene: string;
  notes: string | null;
};

function buildShopSeeds(): ShopSeed[] {
  const map = new Map<string, ShopSeed>();
  for (const entry of npcShopSeeds) {
    if (!map.has(entry.shopKey)) {
      map.set(entry.shopKey, {
        shopKey: entry.shopKey,
        npcKey: entry.npcKey,
        displayName: entry.displayName,
        displayNameEn: entry.displayNameEn,
        scene: entry.scene,
        notes: entry.notes ?? null
      });
    }
  }
  return Array.from(map.values());
}

async function upsertCurrencies(client: PoolClient) {
  for (const currency of currencySeeds) {
    await client.query(
      `
        INSERT INTO currencies (currency_key, display_name, display_name_en, description)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (currency_key) DO UPDATE
        SET display_name = EXCLUDED.display_name,
            display_name_en = EXCLUDED.display_name_en,
            description = EXCLUDED.description
      `,
      [
        currency.key,
        currency.displayName,
        currency.displayNameEn,
        currency.description
      ]
    );
  }

  await client.query(
    `
      INSERT INTO currency_rates (base_currency, quote_currency, rate, notes)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (base_currency, quote_currency) DO UPDATE
      SET rate = EXCLUDED.rate,
          notes = EXCLUDED.notes,
          effective_at = NOW()
    `,
    [
      currencyRateSeed.baseCurrency,
      currencyRateSeed.quoteCurrency,
      currencyRateSeed.rate,
      currencyRateSeed.notes
    ]
  );
}

async function upsertItems(client: PoolClient) {
  for (const item of itemSeeds) {
    await client.query(
      `
        INSERT INTO items (
          item_key, display_name, display_name_en, category, subtype, rarity,
          description, description_en, stack_limit, equip_slot, base_stats,
          price_coin, price_soul, source_notes
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14
        )
        ON CONFLICT (item_key) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          display_name_en = EXCLUDED.display_name_en,
          category = EXCLUDED.category,
          subtype = EXCLUDED.subtype,
          rarity = EXCLUDED.rarity,
          description = EXCLUDED.description,
          description_en = EXCLUDED.description_en,
          stack_limit = EXCLUDED.stack_limit,
          equip_slot = EXCLUDED.equip_slot,
          base_stats = EXCLUDED.base_stats,
          price_coin = EXCLUDED.price_coin,
          price_soul = EXCLUDED.price_soul,
          source_notes = EXCLUDED.source_notes,
          created_at = items.created_at
      `,
      [
        item.itemKey,
        item.displayName,
        item.displayNameEn,
        item.category,
        item.subtype,
        item.rarity,
        item.description,
        item.descriptionEn,
        item.stackLimit,
        item.equipSlot,
        item.baseStats ? JSON.stringify(item.baseStats) : null,
        item.priceCoin,
        item.priceSoul,
        item.sourceNotes
      ]
    );
  }
}

async function upsertGatherNodes(client: PoolClient) {
  for (const node of gatherNodeSeeds) {
    await client.query(
      `
        INSERT INTO gather_nodes (
          node_key, display_name, display_name_en, scene, skill_type,
          min_level, base_duration_seconds, max_parallel_jobs, energy_cost,
          success_rate, output_item_key, output_min, output_max, respawn_seconds,
          season_event_bonus, notes
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16
        )
        ON CONFLICT (node_key) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          display_name_en = EXCLUDED.display_name_en,
          scene = EXCLUDED.scene,
          skill_type = EXCLUDED.skill_type,
          min_level = EXCLUDED.min_level,
          base_duration_seconds = EXCLUDED.base_duration_seconds,
          max_parallel_jobs = EXCLUDED.max_parallel_jobs,
          energy_cost = EXCLUDED.energy_cost,
          success_rate = EXCLUDED.success_rate,
          output_item_key = EXCLUDED.output_item_key,
          output_min = EXCLUDED.output_min,
          output_max = EXCLUDED.output_max,
          respawn_seconds = EXCLUDED.respawn_seconds,
          season_event_bonus = EXCLUDED.season_event_bonus,
          notes = EXCLUDED.notes
      `,
      [
        node.nodeKey,
        node.displayName,
        node.displayNameEn,
        node.scene,
        node.skillType,
        node.minLevel,
        node.baseDurationSeconds,
        node.maxParallelJobs,
        node.energyCost,
        node.successRate,
        node.outputItemKey,
        node.outputMin,
        node.outputMax,
        node.respawnSeconds,
        node.seasonEventBonus,
        node.notes
      ]
    );
  }
}

async function upsertQuests(client: PoolClient) {
  for (const quest of questSeeds) {
    await client.query(
      `
        INSERT INTO quests (
          quest_key, display_name, display_name_en, quest_type, scene,
          description, description_en, requirements_json, reward_items_json,
          reward_coin, reward_soul, unlock_conditions, repeatable,
          cooldown_minutes, gm_notes
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15
        )
        ON CONFLICT (quest_key) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          display_name_en = EXCLUDED.display_name_en,
          quest_type = EXCLUDED.quest_type,
          scene = EXCLUDED.scene,
          description = EXCLUDED.description,
          description_en = EXCLUDED.description_en,
          requirements_json = EXCLUDED.requirements_json,
          reward_items_json = EXCLUDED.reward_items_json,
          reward_coin = EXCLUDED.reward_coin,
          reward_soul = EXCLUDED.reward_soul,
          unlock_conditions = EXCLUDED.unlock_conditions,
          repeatable = EXCLUDED.repeatable,
          cooldown_minutes = EXCLUDED.cooldown_minutes,
          gm_notes = EXCLUDED.gm_notes
      `,
      [
        quest.questKey,
        quest.displayName,
        quest.displayNameEn,
        quest.questType,
        quest.scene,
        quest.description,
        quest.descriptionEn,
        JSON.stringify(quest.requirements),
        JSON.stringify(quest.rewardItems),
        quest.rewardCoin,
        quest.rewardSoul,
        JSON.stringify(quest.unlockConditions),
        quest.repeatable,
        quest.cooldownMinutes,
        quest.gmNotes
      ]
    );
  }
}

async function upsertShops(client: PoolClient) {
  const shops = buildShopSeeds();
  for (const shop of shops) {
    await client.query(
      `
        INSERT INTO shops (shop_key, npc_key, display_name, display_name_en, scene, notes)
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (shop_key) DO UPDATE SET
          npc_key = EXCLUDED.npc_key,
          display_name = EXCLUDED.display_name,
          display_name_en = EXCLUDED.display_name_en,
          scene = EXCLUDED.scene,
          notes = EXCLUDED.notes
      `,
      [
        shop.shopKey,
        shop.npcKey,
        shop.displayName,
        shop.displayNameEn,
        shop.scene,
        shop.notes
      ]
    );
  }

  for (const entry of npcShopSeeds) {
    await client.query(
      `
        INSERT INTO shop_items (
          shop_key, item_key, price_coin, price_soul, max_stock,
          restock_minutes, limit_per_player, requires_quest, notes
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9
        )
        ON CONFLICT (shop_key, item_key) DO UPDATE SET
          price_coin = EXCLUDED.price_coin,
          price_soul = EXCLUDED.price_soul,
          max_stock = EXCLUDED.max_stock,
          restock_minutes = EXCLUDED.restock_minutes,
          limit_per_player = EXCLUDED.limit_per_player,
          requires_quest = EXCLUDED.requires_quest,
          notes = EXCLUDED.notes
      `,
      [
        entry.shopKey,
        entry.itemKey,
        entry.priceCoin,
        entry.priceSoul,
        entry.maxStock,
        entry.restockMinutes,
        entry.limitPerPlayer,
        entry.requiresQuest,
        entry.notes
      ]
    );
  }
}

async function upsertAdventureMissions(client: PoolClient) {
  for (const mission of adventureMissionSeeds) {
    await client.query(
      `
        INSERT INTO adventure_missions (
          mission_key, display_name, display_name_en, scene, mission_type,
          recommended_power, power_scaling, min_duration_seconds,
          max_duration_seconds, success_formula, reward_coin, reward_soul,
          reward_experience, unlock_conditions, allow_auto_repeat
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15
        )
        ON CONFLICT (mission_key) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          display_name_en = EXCLUDED.display_name_en,
          scene = EXCLUDED.scene,
          mission_type = EXCLUDED.mission_type,
          recommended_power = EXCLUDED.recommended_power,
          power_scaling = EXCLUDED.power_scaling,
          min_duration_seconds = EXCLUDED.min_duration_seconds,
          max_duration_seconds = EXCLUDED.max_duration_seconds,
          success_formula = EXCLUDED.success_formula,
          reward_coin = EXCLUDED.reward_coin,
          reward_soul = EXCLUDED.reward_soul,
          reward_experience = EXCLUDED.reward_experience,
          unlock_conditions = EXCLUDED.unlock_conditions,
          allow_auto_repeat = EXCLUDED.allow_auto_repeat
      `,
      [
        mission.missionKey,
        mission.displayName,
        mission.displayNameEn,
        mission.scene,
        mission.missionType,
        mission.recommendedPower,
        mission.powerScaling,
        mission.minDurationSeconds,
        mission.maxDurationSeconds,
        mission.successFormula,
        mission.rewardCoin,
        mission.rewardSoul,
        mission.rewardExperience,
        JSON.stringify(mission.unlockConditions),
        mission.allowAutoRepeat
      ]
    );
  }
}

async function upsertMarketItems(client: PoolClient) {
  for (const item of marketItemSeeds) {
    await client.query(
      `
        INSERT INTO market_items (
          market_item_key, display_name, display_name_en, category, base_price,
          min_price, max_price, daily_delta_min, daily_delta_max, volatility,
          event_modifier, notes
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
        )
        ON CONFLICT (market_item_key) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          display_name_en = EXCLUDED.display_name_en,
          category = EXCLUDED.category,
          base_price = EXCLUDED.base_price,
          min_price = EXCLUDED.min_price,
          max_price = EXCLUDED.max_price,
          daily_delta_min = EXCLUDED.daily_delta_min,
          daily_delta_max = EXCLUDED.daily_delta_max,
          volatility = EXCLUDED.volatility,
          event_modifier = EXCLUDED.event_modifier,
          notes = EXCLUDED.notes
      `,
      [
        item.marketItemKey,
        item.displayName,
        item.displayNameEn,
        item.category,
        item.basePrice,
        item.minPrice,
        item.maxPrice,
        item.dailyDeltaMin,
        item.dailyDeltaMax,
        item.volatility,
        item.eventModifier,
        item.notes
      ]
    );
  }
}

async function main() {
  logger.info("開始執行資料初始化");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await upsertCurrencies(client);
    await upsertItems(client);
    await upsertGatherNodes(client);
    await upsertQuests(client);
    await upsertShops(client);
    await upsertAdventureMissions(client);
    await upsertMarketItems(client);
    await client.query("COMMIT");
    logger.info("資料初始化完成");
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error({ error }, "資料初始化失敗");
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  logger.error({ error }, "執行 seed 腳本時發生未預期錯誤");
  process.exitCode = 1;
});

