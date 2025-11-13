import type { PoolClient } from "pg";

type ItemInput = {
  itemKey: string;
  displayName: string;
  displayNameEn?: string | null;
  category: string;
  subtype?: string | null;
  rarity?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  stackLimit?: number;
  equipSlot?: string | null;
  priceCoin?: number;
  priceSoul?: number;
  sourceNotes?: string | null;
  baseStats?: Record<string, unknown> | null;
};

type GatherNodeInput = {
  nodeKey: string;
  displayName: string;
  displayNameEn?: string | null;
  scene: string;
  skillType: string;
  minLevel: number;
  baseDurationSeconds: number;
  maxParallelJobs: number;
  energyCost: number;
  successRate: number;
  outputItemKey: string;
  outputMin: number;
  outputMax: number;
  respawnSeconds: number;
  seasonEventBonus?: string | null;
  notes?: string | null;
};

type QuestInput = {
  questKey: string;
  displayName: string;
  displayNameEn?: string | null;
  questType: string;
  scene: string;
  description?: string | null;
  descriptionEn?: string | null;
  requirements?: unknown[];
  rewardItems?: unknown[];
  rewardCoin?: number;
  rewardSoul?: number;
  unlockConditions?: unknown[];
  repeatable?: boolean;
  cooldownMinutes?: number;
  gmNotes?: string | null;
};

type MarketItemInput = {
  marketItemKey: string;
  displayName: string;
  displayNameEn?: string | null;
  category: string;
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  dailyDeltaMin: number;
  dailyDeltaMax: number;
  volatility: number;
  eventModifier?: string | null;
  notes?: string | null;
};

type ShopInput = {
  shopKey: string;
  npcKey: string;
  displayName: string;
  displayNameEn?: string | null;
  scene: string;
  notes?: string | null;
  items: {
    itemKey: string;
    priceCoin?: number;
    priceSoul?: number;
    maxStock?: number | null;
    restockMinutes?: number | null;
    limitPerPlayer?: number | null;
    requiresQuest?: string | null;
    notes?: string | null;
  }[];
};

async function logAuditTrail(
  client: PoolClient,
  entityType: string,
  entityId: string,
  action: string,
  changedBy?: number | null,
  diff?: Record<string, unknown>
) {
  await client.query(
    `
      INSERT INTO audit_trails (entity_type, entity_id, action, changed_by, change_diff)
      VALUES ($1, $2, $3, $4, $5::jsonb)
    `,
    [entityType, entityId, action, changedBy ?? null, JSON.stringify(diff ?? {})]
  );
}

export async function upsertItems(
  client: PoolClient,
  items: ItemInput[],
  accountId?: number | null
) {
  for (const item of items) {
    await client.query(
      `
        INSERT INTO items (
          item_key, display_name, display_name_en, category, subtype, rarity,
          description, description_en, stack_limit, equip_slot, base_stats,
          price_coin, price_soul, source_notes
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
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
          source_notes = EXCLUDED.source_notes
      `,
      [
        item.itemKey,
        item.displayName,
        item.displayNameEn ?? null,
        item.category,
        item.subtype ?? null,
        item.rarity ?? null,
        item.description ?? null,
        item.descriptionEn ?? null,
        item.stackLimit ?? 1,
        item.equipSlot ?? null,
        item.baseStats ? JSON.stringify(item.baseStats) : null,
        item.priceCoin ?? 0,
        item.priceSoul ?? 0,
        item.sourceNotes ?? null
      ]
    );
    await logAuditTrail(client, "items", item.itemKey, "upsert", accountId, item);
  }
}

export async function upsertGatherNodes(
  client: PoolClient,
  nodes: GatherNodeInput[],
  accountId?: number | null
) {
  for (const node of nodes) {
    await client.query(
      `
        INSERT INTO gather_nodes (
          node_key, display_name, display_name_en, scene, skill_type,
          min_level, base_duration_seconds, max_parallel_jobs, energy_cost,
          success_rate, output_item_key, output_min, output_max,
          respawn_seconds, season_event_bonus, notes
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
        node.displayNameEn ?? null,
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
        node.seasonEventBonus ?? null,
        node.notes ?? null
      ]
    );
    await logAuditTrail(client, "gather_nodes", node.nodeKey, "upsert", accountId, node);
  }
}

export async function upsertQuests(
  client: PoolClient,
  quests: QuestInput[],
  accountId?: number | null
) {
  for (const quest of quests) {
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
        quest.displayNameEn ?? null,
        quest.questType,
        quest.scene,
        quest.description ?? null,
        quest.descriptionEn ?? null,
        JSON.stringify(quest.requirements ?? []),
        JSON.stringify(quest.rewardItems ?? []),
        quest.rewardCoin ?? 0,
        quest.rewardSoul ?? 0,
        JSON.stringify(quest.unlockConditions ?? []),
        quest.repeatable ?? false,
        quest.cooldownMinutes ?? 0,
        quest.gmNotes ?? null
      ]
    );
    await logAuditTrail(client, "quests", quest.questKey, "upsert", accountId, quest);
  }
}

export async function upsertMarketItems(
  client: PoolClient,
  items: MarketItemInput[],
  accountId?: number | null
) {
  for (const item of items) {
    await client.query(
      `
        INSERT INTO market_items (
          market_item_key, display_name, display_name_en, category,
          base_price, min_price, max_price, daily_delta_min,
          daily_delta_max, volatility, event_modifier, notes
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
        item.displayNameEn ?? null,
        item.category,
        item.basePrice,
        item.minPrice,
        item.maxPrice,
        item.dailyDeltaMin,
        item.dailyDeltaMax,
        item.volatility,
        item.eventModifier ?? null,
        item.notes ?? null
      ]
    );
    await logAuditTrail(
      client,
      "market_items",
      item.marketItemKey,
      "upsert",
      accountId,
      item
    );
  }
}

export async function upsertShops(
  client: PoolClient,
  shops: ShopInput[],
  accountId?: number | null
) {
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
        shop.displayNameEn ?? null,
        shop.scene,
        shop.notes ?? null
      ]
    );

    if (shop.items?.length) {
      await client.query(`DELETE FROM shop_items WHERE shop_key = $1`, [
        shop.shopKey
      ]);

      for (const item of shop.items) {
        await client.query(
          `
            INSERT INTO shop_items (
              shop_key, item_key, price_coin, price_soul, max_stock,
              restock_minutes, limit_per_player, requires_quest, notes
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
          `,
          [
            shop.shopKey,
            item.itemKey,
            item.priceCoin ?? 0,
            item.priceSoul ?? 0,
            item.maxStock ?? null,
            item.restockMinutes ?? null,
            item.limitPerPlayer ?? null,
            item.requiresQuest ?? null,
            item.notes ?? null
          ]
        );
      }
    }

    await logAuditTrail(client, "shops", shop.shopKey, "upsert", accountId, shop);
  }
}

