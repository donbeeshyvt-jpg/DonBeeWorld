export const currencySeeds = [
  {
    key: "coin",
    displayName: "金幣",
    displayNameEn: "Gold Coin",
    description: "冬蜜大陸世界的主要流通貨幣"
  },
  {
    key: "soul",
    displayName: "魂幣",
    displayNameEn: "Soul Coin",
    description: "透過贊助與高危挑戰獲得的珍稀貨幣"
  }
];

export const currencyRateSeed = {
  baseCurrency: "soul",
  quoteCurrency: "coin",
  rate: 100.0,
  notes: "預設 1 魂幣 = 100 金幣"
};

export const itemSeeds = [
  {
    itemKey: "tent_honey_nectar",
    displayName: "蜜泉精華",
    displayNameEn: "Honey Spring Essence",
    category: "material",
    subtype: "ingredient",
    rarity: "common",
    description: "從蜜泉林採集到的濃縮蜜汁，可用於調酒與烹飪。",
    descriptionEn: "Concentrated nectar harvested from Honey Springs.",
    stackLimit: 999,
    equipSlot: null,
    baseStats: null,
    priceCoin: 40,
    priceSoul: 0,
    sourceNotes: "巡旅營地採集；任務需求"
  },
  {
    itemKey: "tent_ice_shard",
    displayName: "冰晶碎片",
    displayNameEn: "Crystalized Ice Shard",
    category: "material",
    subtype: "ore",
    rarity: "uncommon",
    description: "散發寒氣的冰晶，煉金與鍛造皆可使用。",
    descriptionEn: "Chilled shard used in alchemy and forging.",
    stackLimit: 999,
    equipSlot: null,
    baseStats: null,
    priceCoin: 90,
    priceSoul: 0,
    sourceNotes: "冰晶礦脈採集；戰亂副本掉落"
  },
  {
    itemKey: "tavern_honeybrew",
    displayName: "Honeybrew 蜜釀",
    displayNameEn: "Honeybrew",
    category: "consumable",
    subtype: "drink",
    rarity: "common",
    description: "增益酒館調酒，飲用後提升採集效率 10% 持續 10 分鐘",
    descriptionEn: "Boost gathering efficiency by 10% for 10 minutes",
    stackLimit: 20,
    equipSlot: null,
    baseStats: { gatheringBoost: 0.1, durationMinutes: 10 },
    priceCoin: 120,
    priceSoul: 0,
    sourceNotes: "酒館史萊姆調酒師；新手任務獎勵"
  },
  {
    itemKey: "workshop_forge_pickaxe",
    displayName: "冬蜜工坊鋼鎬",
    displayNameEn: "Winter Steel Pickaxe",
    category: "tool",
    subtype: "mining",
    rarity: "rare",
    description: "適用於地下工作室的採礦工具，提供 +15 採礦效率",
    descriptionEn: "+15 mining efficiency tool for the Underground Workshop",
    stackLimit: 1,
    equipSlot: "tool",
    baseStats: { miningEfficiency: 15 },
    priceCoin: 2400,
    priceSoul: 0,
    sourceNotes: "地下工作室鍛造；戰亂居酒屋軍需商店"
  },
  {
    itemKey: "izakaya_battleblade",
    displayName: "戰亂居酒屋戰刃",
    displayNameEn: "Battleblade of the Izakaya",
    category: "weapon",
    subtype: "sword",
    rarity: "epic",
    description: "戰鬥力 +25，並對冰屬敵人附加額外傷害",
    descriptionEn: "+25 attack, extra damage vs ice foes",
    stackLimit: 1,
    equipSlot: "weapon",
    baseStats: { attack: 25, elementalBonus: "ice" },
    priceCoin: 0,
    priceSoul: 12,
    sourceNotes: "戰亂居酒屋副本首領掉落；魂幣黑市"
  },
  {
    itemKey: "tent_gather_bundle",
    displayName: "巡旅採集補給包",
    displayNameEn: "Traveling Gatherer Pack",
    category: "bundle",
    subtype: "gathering",
    rarity: "uncommon",
    description: "包含採集工具與增益，離線收益加成 5%",
    descriptionEn: "Bundle with tools and weather charm",
    stackLimit: 1,
    equipSlot: null,
    baseStats: { offlineBonus: 0.05 },
    priceCoin: 800,
    priceSoul: 2,
    sourceNotes: "帳篷巡旅營地任務；魂幣商店限購"
  },
  {
    itemKey: "workshop_frostcap",
    displayName: "霜帽蘑菇",
    displayNameEn: "Frostcap Mushroom",
    category: "material",
    subtype: "fungus",
    rarity: "uncommon",
    description: "地下工作室培養的稀有真菌，可製作寒霜藥水。",
    descriptionEn: "Rare fungus grown in the workshop for frost potions.",
    stackLimit: 999,
    equipSlot: null,
    baseStats: null,
    priceCoin: 120,
    priceSoul: 0,
    sourceNotes: "真菌培養場收成；冒險副本獎勵"
  },
  {
    itemKey: "market_honey_extract",
    displayName: "冬蜜濃縮液",
    displayNameEn: "Winter Nectar Extract",
    category: "material",
    subtype: "elixir",
    rarity: "rare",
    description: "可用於高級調酒與煉金，市場交易熱門品。",
    descriptionEn: "Premium extract for high-tier brewing and alchemy.",
    stackLimit: 200,
    equipSlot: null,
    baseStats: null,
    priceCoin: 320,
    priceSoul: 0,
    sourceNotes: "市場波動品；活動掉落"
  },
  {
    itemKey: "battlefield_token",
    displayName: "戰場功勳令",
    displayNameEn: "Battlefield Token",
    category: "currency",
    subtype: "token",
    rarity: "rare",
    description: "參與戰亂居酒屋副本所獲得的功勳，可兌換軍需用品。",
    descriptionEn: "Token earned from battlefield raids, redeemable for gear.",
    stackLimit: 999,
    equipSlot: null,
    baseStats: null,
    priceCoin: 0,
    priceSoul: 0,
    sourceNotes: "戰亂副本掉落；活動獎勵"
  }
];

export const gatherNodeSeeds = [
  {
    nodeKey: "tent_honey_harvest",
    displayName: "蜜泉林採集",
    displayNameEn: "Honey Spring Harvest",
    scene: "traveling_tent",
    skillType: "harvesting",
    minLevel: 1,
    baseDurationSeconds: 120,
    maxParallelJobs: 2,
    energyCost: 5,
    successRate: 0.95,
    outputItemKey: "tent_honey_nectar",
    outputMin: 2,
    outputMax: 4,
    respawnSeconds: 60,
    seasonEventBonus: "靈蜜季節 +2 產量",
    notes: "新手任務引導；完成後解鎖進階採集"
  },
  {
    nodeKey: "tent_ice_mine",
    displayName: "冰晶礦脈",
    displayNameEn: "Crystalized Ice Mine",
    scene: "traveling_tent",
    skillType: "mining",
    minLevel: 5,
    baseDurationSeconds: 180,
    maxParallelJobs: 1,
    energyCost: 6,
    successRate: 0.9,
    outputItemKey: "tent_ice_shard",
    outputMin: 1,
    outputMax: 3,
    respawnSeconds: 90,
    seasonEventBonus: "雪暴事件成功率 +10%",
    notes: "需要鋼鎬"
  }
];

export const questSeeds = [
  {
    questKey: "tavern_daily_honeybrew",
    displayName: "酒館日常：蜜釀補給",
    displayNameEn: "Tavern Daily: Honeybrew",
    questType: "daily",
    scene: "tavern",
    description: "協助冬蜜準備今晚的蜜釀供應。",
    descriptionEn: "Help Donae restock tonight's honeybrew.",
    requirements: [
      { type: "collect", target: "tent_honey_nectar", amount: 10 }
    ],
    rewardItems: [{ itemKey: "tavern_honeybrew", quantity: 5 }],
    rewardCoin: 500,
    rewardSoul: 0,
    unlockConditions: ["profile_level>=1"],
    repeatable: true,
    cooldownMinutes: 1440,
    gmNotes: "新手每日任務，完成後開啟贊助教學"
  },
  {
    questKey: "tent_story_crystal_rescue",
    displayName: "主線：冰晶救援",
    displayNameEn: "Story: Crystal Rescue",
    questType: "story",
    scene: "traveling_tent",
    description: "巡旅營地遭受寒霜侵襲，收集冰晶修復魔法結界。",
    descriptionEn: "Collect ice crystals to repair the protective ward.",
    requirements: [
      { type: "collect", target: "tent_ice_shard", amount: 15 },
      { type: "defeat", target: "izakaya_ice_wraith", amount: 1 }
    ],
    rewardItems: [
      { itemKey: "workshop_forge_pickaxe", quantity: 1 },
      { itemKey: "tent_gather_bundle", quantity: 1 }
    ],
    rewardCoin: 1200,
    rewardSoul: 1,
    unlockConditions: ["previous_complete:tent_story_intro"],
    repeatable: false,
    cooldownMinutes: 0,
    gmNotes: "完成後解鎖冰晶礦脈採集點"
  }
];

export const npcShopSeeds = [
  {
    shopKey: "tavern_honeybartender",
    npcKey: "donbee_tavern_keeper",
    displayName: "酒館調酒師",
    displayNameEn: "Tavern Bartender",
    scene: "tavern",
    itemKey: "tavern_honeybrew",
    priceCoin: 150,
    priceSoul: 0,
    maxStock: 40,
    restockMinutes: 60,
    limitPerPlayer: 5,
    requiresQuest: null,
    notes: "常駐販售；可配合活動打折"
  },
  {
    shopKey: "tavern_honeybartender",
    npcKey: "donbee_tavern_keeper",
    displayName: "酒館調酒師",
    displayNameEn: "Tavern Bartender",
    scene: "tavern",
    itemKey: "tent_gather_bundle",
    priceCoin: 600,
    priceSoul: 1,
    maxStock: 10,
    restockMinutes: 120,
    limitPerPlayer: 2,
    requiresQuest: "quest:tavern_daily_honeybrew",
    notes: "魂幣找零示範用項目"
  }
];

export const adventureMissionSeeds = [
  {
    missionKey: "izakaya_raid_warlord",
    displayName: "戰亂居酒屋：暴君討伐",
    displayNameEn: "Izakaya Raid: Warlord",
    scene: "eastern_izakaya",
    missionType: "raid",
    recommendedPower: 2500,
    powerScaling: 0.15,
    minDurationSeconds: 1800,
    maxDurationSeconds: 3600,
    successFormula: "base + (team_power * 0.12) - boss_resistance",
    rewardCoin: 2800,
    rewardSoul: 4,
    rewardExperience: 4500,
    unlockConditions: ["quest:tent_story_crystal_rescue"],
    allowAutoRepeat: false
  },
  {
    missionKey: "tent_patrol_scout",
    displayName: "巡旅營地：防衛巡邏",
    displayNameEn: "Tent Patrol: Defend",
    scene: "traveling_tent",
    missionType: "patrol",
    recommendedPower: 600,
    powerScaling: 0.08,
    minDurationSeconds: 900,
    maxDurationSeconds: 1800,
    successFormula: "base + (player_speed * 0.2)",
    rewardCoin: 900,
    rewardSoul: 0,
    rewardExperience: 1200,
    unlockConditions: ["profile_level>=3"],
    allowAutoRepeat: true
  }
];

export const marketItemSeeds = [
  {
    marketItemKey: "market_honey_extract",
    displayName: "冬蜜濃縮液",
    displayNameEn: "Winter Nectar Extract",
    category: "consumable",
    basePrice: 320,
    minPrice: 200,
    maxPrice: 540,
    dailyDeltaMin: -40,
    dailyDeltaMax: 60,
    volatility: 0.12,
    eventModifier: "season:harvest_festival=1.2",
    notes: "基礎採集素材；豐收祭上漲"
  },
  {
    marketItemKey: "market_ice_shard",
    displayName: "冰晶碎片",
    displayNameEn: "Ice Shard",
    category: "material",
    basePrice: 480,
    minPrice: 260,
    maxPrice: 720,
    dailyDeltaMin: -60,
    dailyDeltaMax: 80,
    volatility: 0.18,
    eventModifier: "event:blizzard_week=1.4",
    notes: "冒險副本需求大；雪暴事件價格翻倍"
  },
  {
    marketItemKey: "market_war_bond",
    displayName: "戰亂軍票",
    displayNameEn: "War Bond",
    category: "currency",
    basePrice: 1500,
    minPrice: 800,
    maxPrice: 2600,
    dailyDeltaMin: -150,
    dailyDeltaMax: 220,
    volatility: 0.25,
    eventModifier: "event:warcry_week=1.5",
    notes: "可兌換軍需官稀有裝備"
  },
  {
    marketItemKey: "market_soul_fragment",
    displayName: "魂幣碎片",
    displayNameEn: "Soul Fragment",
    category: "currency",
    basePrice: 1200,
    minPrice: 600,
    maxPrice: 2000,
    dailyDeltaMin: -100,
    dailyDeltaMax: 150,
    volatility: 0.2,
    eventModifier: "event:any=1.0",
    notes: "可合成魂幣；匯率取決於魂幣價值"
  }
];

