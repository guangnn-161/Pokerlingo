CREATE TYPE "scenario_status" AS ENUM ('draft','reviewed','published');
CREATE TYPE "quest_cadence" AS ENUM ('daily','weekly','recovery');
CREATE TYPE "quest_status" AS ENUM ('active','completed');

CREATE TABLE "scenario_revisions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "scenario_id" text NOT NULL, "version" integer NOT NULL, "game" text NOT NULL, "title" text NOT NULL, "topic" text NOT NULL,
  "difficulty" integer NOT NULL, "rules_version" text NOT NULL, "prompt_json" text NOT NULL, "solution_json" text NOT NULL,
  "tags_json" text NOT NULL, "status" "scenario_status" DEFAULT 'draft' NOT NULL, "source" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "scenario_revisions_key_version_unique" UNIQUE ("scenario_id","version")
);
CREATE INDEX "scenario_revisions_published_idx" ON "scenario_revisions" ("status","game");

CREATE FUNCTION "prevent_published_scenario_revision_mutation"() RETURNS trigger AS $$
BEGIN
  IF OLD.status = 'published' THEN
    RAISE EXCEPTION 'published scenario revisions are immutable';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "scenario_revisions_immutable_after_publish"
BEFORE UPDATE OR DELETE ON "scenario_revisions"
FOR EACH ROW EXECUTE FUNCTION "prevent_published_scenario_revision_mutation"();

CREATE TABLE "attempts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "revision_id" uuid NOT NULL REFERENCES "scenario_revisions"("id"), "submission_id" text NOT NULL,
  "selected_action_json" text NOT NULL, "ev_loss_bb" text NOT NULL, "score" integer NOT NULL, "mistake_tag" text,
  "duration_ms" integer DEFAULT 0 NOT NULL, "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "attempts_user_submission_unique" UNIQUE ("user_id","submission_id")
);
CREATE INDEX "attempts_user_created_idx" ON "attempts" ("user_id","created_at");
CREATE INDEX "attempts_user_revision_idx" ON "attempts" ("user_id","revision_id");

CREATE TABLE "daily_puzzles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "puzzle_date" text NOT NULL, "game" text NOT NULL,
  "revision_id" uuid NOT NULL REFERENCES "scenario_revisions"("id"), "publish_at" timestamp with time zone NOT NULL,
  "close_at" timestamp with time zone NOT NULL,
  CONSTRAINT "daily_puzzles_date_game_unique" UNIQUE ("puzzle_date","game"),
  CONSTRAINT "daily_puzzles_close_after_publish" CHECK ("close_at" > "publish_at")
);
CREATE TABLE "daily_puzzle_attempts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "puzzle_id" uuid NOT NULL REFERENCES "daily_puzzles"("id") ON DELETE cascade,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade, "submission_id" text NOT NULL, "ev_loss" text NOT NULL,
  "score" integer NOT NULL, "duration_ms" integer DEFAULT 0 NOT NULL, "is_first_attempt" integer DEFAULT 1 NOT NULL,
  "selected_action_json" text NOT NULL, "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "daily_puzzle_submission_unique" UNIQUE ("puzzle_id","user_id","submission_id")
);
CREATE UNIQUE INDEX "daily_puzzle_first_score_unique" ON "daily_puzzle_attempts" ("puzzle_id","user_id") WHERE "is_first_attempt" = 1;
CREATE TABLE "quest_templates" (
  "id" text PRIMARY KEY NOT NULL, "cadence" "quest_cadence" NOT NULL, "key" text NOT NULL, "rules_json" text NOT NULL,
  "xp_reward" integer NOT NULL, "version" integer DEFAULT 1 NOT NULL, "active" integer DEFAULT 1 NOT NULL,
  CONSTRAINT "quest_template_key_version_unique" UNIQUE ("key","version")
);
CREATE TABLE "user_quests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "template_id" text NOT NULL REFERENCES "quest_templates"("id"), "period_start" timestamp with time zone NOT NULL,
  "progress_json" text NOT NULL, "status" "quest_status" DEFAULT 'active' NOT NULL, "completed_at" timestamp with time zone,
  CONSTRAINT "user_quest_period_unique" UNIQUE ("user_id","template_id","period_start")
);
CREATE TABLE "xp_ledger" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "source_type" text NOT NULL, "source_id" text NOT NULL, "xp_delta" integer NOT NULL, "idempotency_key" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL, CONSTRAINT "xp_ledger_idempotency_unique" UNIQUE ("idempotency_key")
);
CREATE INDEX "xp_ledger_user_created_idx" ON "xp_ledger" ("user_id","created_at");
CREATE TABLE "mastery_scores" (
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade, "topic_key" text NOT NULL,
  "score" integer DEFAULT 0 NOT NULL, "sample_count" integer DEFAULT 0 NOT NULL, "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("user_id","topic_key")
);
