DO $$ BEGIN
  CREATE TYPE scenario_status AS ENUM ('draft', 'reviewed', 'published');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE quest_cadence AS ENUM ('daily', 'weekly', 'recovery');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE quest_status AS ENUM ('active', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS scenarios (
  id text PRIMARY KEY,
  title text NOT NULL,
  game text NOT NULL,
  topic text NOT NULL,
  difficulty integer NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  rules_version text NOT NULL,
  state_json text NOT NULL,
  explanation_md text NOT NULL,
  tags_json text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  status scenario_status NOT NULL DEFAULT 'draft',
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT scenarios_version_unique UNIQUE (id, version)
);
CREATE INDEX IF NOT EXISTS scenarios_status_topic_idx ON scenarios(status, topic);

CREATE TABLE IF NOT EXISTS attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scenario_id text NOT NULL REFERENCES scenarios(id),
  scenario_version integer NOT NULL,
  selected_action_json text NOT NULL,
  ev_loss_bb text NOT NULL,
  score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  mistake_tag text,
  duration_ms integer NOT NULL CHECK (duration_ms >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS attempts_user_created_idx ON attempts(user_id, created_at);
CREATE INDEX IF NOT EXISTS attempts_user_scenario_idx ON attempts(user_id, scenario_id);

CREATE TABLE IF NOT EXISTS daily_puzzles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_date text NOT NULL,
  game text NOT NULL,
  scenario_id text NOT NULL REFERENCES scenarios(id),
  solution_version integer NOT NULL,
  publish_at timestamptz NOT NULL,
  close_at timestamptz NOT NULL,
  CONSTRAINT daily_puzzles_date_game_unique UNIQUE (puzzle_date, game)
);

CREATE TABLE IF NOT EXISTS daily_puzzle_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_id uuid NOT NULL REFERENCES daily_puzzles(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ev_loss text NOT NULL,
  duration_ms integer NOT NULL CHECK (duration_ms >= 0),
  is_first_attempt integer NOT NULL DEFAULT 1,
  selected_action_json text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT daily_puzzle_first_score_unique UNIQUE (puzzle_id, user_id, is_first_attempt)
);

CREATE TABLE IF NOT EXISTS quest_templates (
  id text PRIMARY KEY,
  cadence quest_cadence NOT NULL,
  key text NOT NULL,
  rules_json text NOT NULL,
  xp_reward integer NOT NULL CHECK (xp_reward >= 0),
  version integer NOT NULL DEFAULT 1,
  active integer NOT NULL DEFAULT 1,
  CONSTRAINT quest_template_key_version_unique UNIQUE (key, version)
);

CREATE TABLE IF NOT EXISTS user_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id text NOT NULL REFERENCES quest_templates(id),
  period_start timestamptz NOT NULL,
  progress_json text NOT NULL,
  status quest_status NOT NULL DEFAULT 'active',
  completed_at timestamptz,
  CONSTRAINT user_quest_period_unique UNIQUE (user_id, template_id, period_start)
);

CREATE TABLE IF NOT EXISTS xp_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type text NOT NULL,
  source_id text NOT NULL,
  xp_delta integer NOT NULL,
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT xp_ledger_idempotency_unique UNIQUE (idempotency_key)
);
CREATE INDEX IF NOT EXISTS xp_ledger_user_created_idx ON xp_ledger(user_id, created_at);

CREATE TABLE IF NOT EXISTS mastery_scores (
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_key text NOT NULL,
  score integer NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  sample_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, topic_key)
);
