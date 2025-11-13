-- 核心擴充
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 帳號與身份
CREATE TABLE accounts (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_plain TEXT NOT NULL,
  password_hash TEXT,
  display_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE account_roles (
  account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by BIGINT REFERENCES accounts(id),
  PRIMARY KEY (account_id, role)
);

CREATE TABLE account_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

-- 角色與屬性
CREATE TABLE profiles (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  profile_name TEXT NOT NULL,
  avatar_url TEXT,
  biography TEXT,
  level INT NOT NULL DEFAULT 1,
  experience BIGINT NOT NULL DEFAULT 0,
  hp INT NOT NULL DEFAULT 100,
  attack INT NOT NULL DEFAULT 10,
  magic INT NOT NULL DEFAULT 10,
  defense INT NOT NULL DEFAULT 10,
  speed INT NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, profile_name)
);

CREATE TABLE profile_skills (
  id BIGSERIAL PRIMARY KEY,
  profile_id BIGINT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_key TEXT NOT NULL,
  level INT NOT NULL DEFAULT 1,
  experience BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profile_id, skill_key)
);

CREATE TABLE profile_equipment (
  id BIGSERIAL PRIMARY KEY,
  profile_id BIGINT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slot TEXT NOT NULL,
  item_key TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  UNIQUE (profile_id, slot)
);

-- 貨幣與錢包
CREATE TABLE currencies (
  currency_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  display_name_en TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE currency_rates (
  id BIGSERIAL PRIMARY KEY,
  base_currency TEXT NOT NULL REFERENCES currencies(currency_key),
  quote_currency TEXT NOT NULL REFERENCES currencies(currency_key),
  rate NUMERIC(18,6) NOT NULL,
  effective_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by BIGINT REFERENCES accounts(id),
  notes TEXT,
  UNIQUE (base_currency, quote_currency)
);

CREATE TABLE wallets (
  id BIGSERIAL PRIMARY KEY,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('account', 'profile')),
  owner_id BIGINT NOT NULL,
  currency_key TEXT NOT NULL REFERENCES currencies(currency_key),
  balance BIGINT NOT NULL DEFAULT 0,
  locked_amount BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (owner_type, owner_id, currency_key)
);

CREATE TABLE currency_transactions (
  id BIGSERIAL PRIMARY KEY,
  wallet_id BIGINT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  currency_key TEXT NOT NULL REFERENCES currencies(currency_key),
  direction TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
  source_type TEXT NOT NULL,
  source_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

CREATE TABLE currency_exchange_logs (
  id BIGSERIAL PRIMARY KEY,
  from_currency TEXT NOT NULL REFERENCES currencies(currency_key),
  to_currency TEXT NOT NULL REFERENCES currencies(currency_key),
  from_amount BIGINT NOT NULL,
  to_amount BIGINT NOT NULL,
  rate_applied NUMERIC(18,6) NOT NULL,
  account_id BIGINT REFERENCES accounts(id),
  profile_id BIGINT REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

CREATE TABLE sponsorship_orders (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL UNIQUE,
  amount_coin BIGINT NOT NULL DEFAULT 0,
  amount_soul BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('pending','paid','failed','refunded')),
  gateway TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 物品與倉庫
CREATE TABLE items (
  item_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  display_name_en TEXT,
  category TEXT NOT NULL,
  subtype TEXT,
  rarity TEXT,
  description TEXT,
  description_en TEXT,
  stack_limit INT NOT NULL DEFAULT 1,
  equip_slot TEXT,
  base_stats JSONB,
  price_coin BIGINT NOT NULL DEFAULT 0,
  price_soul BIGINT NOT NULL DEFAULT 0,
  source_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inventory (
  id BIGSERIAL PRIMARY KEY,
  profile_id BIGINT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL REFERENCES items(item_key),
  quantity BIGINT NOT NULL DEFAULT 0,
  bound BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  UNIQUE (profile_id, item_key, metadata)
);

-- 採集與生產
CREATE TABLE gather_nodes (
  node_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  display_name_en TEXT,
  scene TEXT NOT NULL,
  skill_type TEXT NOT NULL,
  min_level INT NOT NULL DEFAULT 1,
  base_duration_seconds INT NOT NULL,
  max_parallel_jobs INT NOT NULL DEFAULT 1,
  energy_cost INT NOT NULL DEFAULT 0,
  success_rate NUMERIC(5,4) NOT NULL DEFAULT 1.0,
  output_item_key TEXT NOT NULL REFERENCES items(item_key),
  output_min INT NOT NULL DEFAULT 1,
  output_max INT NOT NULL DEFAULT 1,
  respawn_seconds INT NOT NULL DEFAULT 60,
  season_event_bonus TEXT,
  notes TEXT
);

CREATE TABLE gather_jobs (
  id BIGSERIAL PRIMARY KEY,
  profile_id BIGINT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  node_key TEXT NOT NULL REFERENCES gather_nodes(node_key),
  status TEXT NOT NULL CHECK (status IN ('queued','running','completed','failed','cancelled')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expected_end_at TIMESTAMPTZ NOT NULL,
  duration_seconds INT NOT NULL,
  completed_at TIMESTAMPTZ,
  progress_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  result_json JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE TABLE gather_results (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT NOT NULL REFERENCES gather_jobs(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL REFERENCES items(item_key),
  quantity BIGINT NOT NULL,
  experience_gained BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 冒險與戰鬥
CREATE TABLE adventure_missions (
  mission_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  display_name_en TEXT,
  scene TEXT NOT NULL,
  mission_type TEXT NOT NULL,
  recommended_power INT NOT NULL,
  power_scaling NUMERIC(6,4) NOT NULL DEFAULT 0,
  min_duration_seconds INT NOT NULL,
  max_duration_seconds INT NOT NULL,
  success_formula TEXT NOT NULL,
  reward_coin BIGINT NOT NULL DEFAULT 0,
  reward_soul BIGINT NOT NULL DEFAULT 0,
  reward_experience BIGINT NOT NULL DEFAULT 0,
  unlock_conditions JSONB NOT NULL DEFAULT '[]'::JSONB,
  allow_auto_repeat BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE adventure_runs (
  id BIGSERIAL PRIMARY KEY,
  mission_key TEXT NOT NULL REFERENCES adventure_missions(mission_key),
  profile_id BIGINT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('queued','running','success','failed')),
  party_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB,
  loot_json JSONB NOT NULL DEFAULT '[]'::JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT
);

CREATE TABLE battle_logs (
  id BIGSERIAL PRIMARY KEY,
  adventure_run_id BIGINT NOT NULL REFERENCES adventure_runs(id) ON DELETE CASCADE,
  turn_index INT NOT NULL,
  log_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 任務與成就
CREATE TABLE quests (
  quest_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  display_name_en TEXT,
  quest_type TEXT NOT NULL,
  scene TEXT NOT NULL,
  description TEXT,
  description_en TEXT,
  requirements_json JSONB NOT NULL DEFAULT '[]'::JSONB,
  reward_items_json JSONB NOT NULL DEFAULT '[]'::JSONB,
  reward_coin BIGINT NOT NULL DEFAULT 0,
  reward_soul BIGINT NOT NULL DEFAULT 0,
  unlock_conditions JSONB NOT NULL DEFAULT '[]'::JSONB,
  repeatable BOOLEAN NOT NULL DEFAULT FALSE,
  cooldown_minutes INT NOT NULL DEFAULT 0,
  gm_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE quest_progress (
  id BIGSERIAL PRIMARY KEY,
  quest_key TEXT NOT NULL REFERENCES quests(quest_key) ON DELETE CASCADE,
  profile_id BIGINT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('locked','in_progress','completed','claimed')),
  progress_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (quest_key, profile_id)
);

CREATE TABLE achievements (
  achievement_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  display_name_en TEXT,
  category TEXT NOT NULL,
  description TEXT,
  description_en TEXT,
  requirements_json JSONB NOT NULL DEFAULT '[]'::JSONB,
  reward_items_json JSONB NOT NULL DEFAULT '[]'::JSONB,
  reward_coin BIGINT NOT NULL DEFAULT 0,
  reward_soul BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE achievement_progress (
  id BIGSERIAL PRIMARY KEY,
  achievement_key TEXT NOT NULL REFERENCES achievements(achievement_key) ON DELETE CASCADE,
  profile_id BIGINT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  progress_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (achievement_key, profile_id)
);

-- NPC 與商店
CREATE TABLE npcs (
  npc_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  display_name_en TEXT,
  scene TEXT NOT NULL,
  avatar_url TEXT,
  description TEXT,
  description_en TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE shops (
  shop_key TEXT PRIMARY KEY,
  npc_key TEXT NOT NULL REFERENCES npcs(npc_key),
  display_name TEXT NOT NULL,
  display_name_en TEXT,
  scene TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE shop_items (
  id BIGSERIAL PRIMARY KEY,
  shop_key TEXT NOT NULL REFERENCES shops(shop_key) ON DELETE CASCADE,
  item_key TEXT NOT NULL REFERENCES items(item_key),
  price_coin BIGINT NOT NULL DEFAULT 0,
  price_soul BIGINT NOT NULL DEFAULT 0,
  max_stock INT,
  restock_minutes INT,
  limit_per_player INT,
  requires_quest TEXT,
  notes TEXT,
  UNIQUE (shop_key, item_key)
);

-- 市場與股市
CREATE TABLE market_items (
  market_item_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  display_name_en TEXT,
  category TEXT NOT NULL,
  base_price BIGINT NOT NULL,
  min_price BIGINT NOT NULL,
  max_price BIGINT NOT NULL,
  daily_delta_min BIGINT NOT NULL,
  daily_delta_max BIGINT NOT NULL,
  volatility NUMERIC(6,4) NOT NULL,
  event_modifier TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE market_ticks (
  id BIGSERIAL PRIMARY KEY,
  market_item_key TEXT NOT NULL REFERENCES market_items(market_item_key) ON DELETE CASCADE,
  price BIGINT NOT NULL,
  delta BIGINT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE market_orders (
  id BIGSERIAL PRIMARY KEY,
  market_item_key TEXT NOT NULL REFERENCES market_items(market_item_key) ON DELETE CASCADE,
  profile_id BIGINT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_type TEXT NOT NULL CHECK (order_type IN ('buy','sell')),
  currency_key TEXT NOT NULL REFERENCES currencies(currency_key),
  price BIGINT NOT NULL,
  quantity BIGINT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open','partial','filled','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE market_order_history (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES market_orders(id) ON DELETE CASCADE,
  quantity BIGINT NOT NULL,
  price BIGINT NOT NULL,
  dealt_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 聊天與公告
CREATE TABLE chat_channels (
  channel_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  channel_type TEXT NOT NULL DEFAULT 'public',
  restrictions JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE TABLE chat_messages (
  id BIGSERIAL PRIMARY KEY,
  channel_key TEXT NOT NULL REFERENCES chat_channels(channel_key),
  account_id BIGINT REFERENCES accounts(id),
  profile_id BIGINT REFERENCES profiles(id),
  message TEXT NOT NULL,
  formatting TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE announcements (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_at TIMESTAMPTZ,
  created_by BIGINT REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE scheduled_broadcasts (
  id BIGSERIAL PRIMARY KEY,
  channel_key TEXT NOT NULL REFERENCES chat_channels(channel_key),
  message TEXT NOT NULL,
  cron_expression TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by BIGINT REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_run_at TIMESTAMPTZ
);

-- 後台／審計
CREATE TABLE admin_logs (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT REFERENCES accounts(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE import_jobs (
  id BIGSERIAL PRIMARY KEY,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued','processing','completed','failed')),
  payload JSONB NOT NULL,
  created_by BIGINT REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE TABLE audit_trails (
  id BIGSERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  changed_by BIGINT REFERENCES accounts(id),
  change_diff JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE event_log (
  id BIGSERIAL PRIMARY KEY,
  event_key TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 預設資料
INSERT INTO npcs (npc_key, display_name, display_name_en, scene, description, description_en)
VALUES
  ('donbee_tavern_keeper', '冬蜜・酒館店主', 'Donbee the Tavern Keeper', 'tavern', '冬蜜酒館的經營者，掌管公告與贊助。', 'Proprietor of the Winter Nectar Tavern.'),
  ('underground_blacksmith', '地下鐵匠', 'Underground Blacksmith', 'underground_workshop', '負責鍛造與裝備維護。', 'Master smith of the underground workshop.'),
  ('izakaya_quartermaster', '戰亂軍需官', 'War Quartermaster', 'eastern_izakaya', '提供戰場補給與稀有武器。', 'Supplies the eastern battlefield brigades.');

INSERT INTO chat_channels (channel_key, display_name, channel_type)
VALUES
  ('global', '全域頻道', 'public'),
  ('trade', '交易頻道', 'trade'),
  ('gm', 'GM 系統頻道', 'system');

