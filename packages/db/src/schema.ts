import { relations } from "drizzle-orm";
import { index, integer, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";\nimport { sql } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const visibilityEnum = pgEnum("profile_visibility", ["private", "friends", "public"]);
export const scenarioStatusEnum = pgEnum("scenario_status", ["draft", "reviewed", "published"]);
export const questCadenceEnum = pgEnum("quest_cadence", ["daily", "weekly", "recovery"]);
export const questStatusEnum = pgEnum("quest_status", ["active", "completed"]);

export const users = pgTable("users", {
  id: text("id").primaryKey(), name: text("name"), email: text("email").unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }), image: text("image"),
  role: roleEnum("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});
export const accounts = pgTable("accounts", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), provider: text("provider").notNull(), providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"), access_token: text("access_token"), expires_at: integer("expires_at"),
  token_type: text("token_type"), scope: text("scope"), id_token: text("id_token"), session_state: text("session_state")
}, (table) => [primaryKey({ columns: [table.provider, table.providerAccountId] })]);
export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull()
}, (table) => [index("sessions_user_id_idx").on(table.userId)]);
export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(), token: text("token").notNull(), expires: timestamp("expires", { withTimezone: true }).notNull()
}, (table) => [primaryKey({ columns: [table.identifier, table.token] })]);
export const profiles = pgTable("profiles", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  handle: text("handle"), displayName: text("display_name"), avatarUrl: text("avatar_url"),
  timezone: text("timezone").notNull().default("UTC"), visibility: visibilityEnum("visibility").notNull().default("private"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [uniqueIndex("profiles_handle_unique").on(table.handle)]);
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(), userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(), requestId: text("request_id").notNull(), ipHash: text("ip_hash"), metadata: text("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [index("audit_logs_user_created_idx").on(table.userId, table.createdAt)]);

export const scenarioRevisions = pgTable("scenario_revisions", {
  id: uuid("id").defaultRandom().primaryKey(),
  scenarioId: text("scenario_id").notNull(),
  version: integer("version").notNull(),
  game: text("game").notNull(), title: text("title").notNull(), topic: text("topic").notNull(),
  difficulty: integer("difficulty").notNull(), rulesVersion: text("rules_version").notNull(),
  promptJson: text("prompt_json").notNull(), solutionJson: text("solution_json").notNull(),
  tagsJson: text("tags_json").notNull(), status: scenarioStatusEnum("status").notNull().default("draft"),
  source: text("source"), createdAt: timestamp("created_at",{withTimezone:true}).notNull().defaultNow()
}, (table)=>[
  uniqueIndex("scenario_revisions_key_version_unique").on(table.scenarioId, table.version),
  index("scenario_revisions_published_idx").on(table.status, table.game)
]);

export const attempts = pgTable("attempts", {
  id: uuid("id").defaultRandom().primaryKey(), userId: text("user_id").notNull().references(()=>users.id,{onDelete:"cascade"}),
  revisionId: uuid("revision_id").notNull().references(()=>scenarioRevisions.id),
  submissionId: text("submission_id").notNull(),
  selectedActionJson: text("selected_action_json").notNull(), evLossBb: text("ev_loss_bb").notNull(),
  score: integer("score").notNull(), mistakeTag: text("mistake_tag"), durationMs: integer("duration_ms").notNull().default(0),
  createdAt: timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
}, (table)=>[
  uniqueIndex("attempts_user_submission_unique").on(table.userId,table.submissionId),
  index("attempts_user_created_idx").on(table.userId,table.createdAt),
  index("attempts_user_revision_idx").on(table.userId,table.revisionId)
]);

export const dailyPuzzles = pgTable("daily_puzzles", {
  id: uuid("id").defaultRandom().primaryKey(), puzzleDate: text("puzzle_date").notNull(), game: text("game").notNull(),
  revisionId: uuid("revision_id").notNull().references(()=>scenarioRevisions.id), publishAt: timestamp("publish_at",{withTimezone:true}).notNull(),
  closeAt: timestamp("close_at",{withTimezone:true}).notNull(),
}, (table)=>[uniqueIndex("daily_puzzles_date_game_unique").on(table.puzzleDate,table.game)]);

export const dailyPuzzleAttempts = pgTable("daily_puzzle_attempts", {
  id: uuid("id").defaultRandom().primaryKey(), puzzleId: uuid("puzzle_id").notNull().references(()=>dailyPuzzles.id,{onDelete:"cascade"}),
  userId: text("user_id").notNull().references(()=>users.id,{onDelete:"cascade"}), submissionId: text("submission_id").notNull(),
  evLoss: text("ev_loss").notNull(), score: integer("score").notNull(), durationMs: integer("duration_ms").notNull().default(0),
  isFirstAttempt: integer("is_first_attempt").notNull().default(1), selectedActionJson: text("selected_action_json").notNull(),
  createdAt: timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
}, (table)=>[
  uniqueIndex("daily_puzzle_submission_unique").on(table.puzzleId,table.userId,table.submissionId),
  uniqueIndex("daily_puzzle_first_score_unique").on(table.puzzleId,table.userId).where(sql`${table.isFirstAttempt} = 1`)
]);

export const questTemplates = pgTable("quest_templates", {
  id: text("id").primaryKey(), cadence: questCadenceEnum("cadence").notNull(), key: text("key").notNull(),
  rulesJson: text("rules_json").notNull(), xpReward: integer("xp_reward").notNull(), version: integer("version").notNull().default(1),
  active: integer("active").notNull().default(1),
}, (table)=>[uniqueIndex("quest_template_key_version_unique").on(table.key,table.version)]);

export const userQuests = pgTable("user_quests", {
  id: uuid("id").defaultRandom().primaryKey(), userId: text("user_id").notNull().references(()=>users.id,{onDelete:"cascade"}),
  templateId: text("template_id").notNull().references(()=>questTemplates.id), periodStart: timestamp("period_start",{withTimezone:true}).notNull(),
  progressJson: text("progress_json").notNull(), status: questStatusEnum("status").notNull().default("active"), completedAt: timestamp("completed_at",{withTimezone:true}),
}, (table)=>[uniqueIndex("user_quest_period_unique").on(table.userId,table.templateId,table.periodStart)]);

export const xpLedger = pgTable("xp_ledger", {
  id: uuid("id").defaultRandom().primaryKey(), userId: text("user_id").notNull().references(()=>users.id,{onDelete:"cascade"}),
  sourceType: text("source_type").notNull(), sourceId: text("source_id").notNull(), xpDelta: integer("xp_delta").notNull(),
  idempotencyKey: text("idempotency_key").notNull(), createdAt: timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
}, (table)=>[uniqueIndex("xp_ledger_idempotency_unique").on(table.idempotencyKey),index("xp_ledger_user_created_idx").on(table.userId,table.createdAt)]);

export const masteryScores = pgTable("mastery_scores", {
  userId: text("user_id").notNull().references(()=>users.id,{onDelete:"cascade"}), topicKey: text("topic_key").notNull(),
  score: integer("score").notNull().default(0), sampleCount: integer("sample_count").notNull().default(0),
  updatedAt: timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
}, (table)=>[primaryKey({columns:[table.userId,table.topicKey]})]);

export const usersRelations = relations(users, ({ one, many }) => ({ profile: one(profiles), accounts: many(accounts), sessions: many(sessions), auditLogs: many(auditLogs) }));
export const profilesRelations = relations(profiles, ({ one }) => ({ user: one(users, { fields: [profiles.userId], references: [users.id] }) }));
