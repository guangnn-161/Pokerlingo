import { z } from "zod";
import { gameKeySchema } from "./game";

export const scenarioStatusSchema = z.enum(["draft", "reviewed", "published"]);
export const scenarioActionSchema = z.object({ type: z.string().min(1), size: z.string().optional() });
export const scenarioSchema = z.object({
  id: z.string().min(1), game: gameKeySchema, title: z.string().min(1),
  difficulty: z.number().int().min(1).max(5), rulesVersion: z.string().min(1),
  state: z.unknown(), tags: z.array(z.string()), topic: z.string().min(1),
  explanationMd: z.string().min(1), version: z.number().int().positive(),
  status: scenarioStatusSchema, source: z.string().min(1).optional(),
});
export type Scenario = z.infer<typeof scenarioSchema>;
export const attemptRequestSchema = z.object({
  scenarioId: z.string().min(1), action: scenarioActionSchema,
  durationMs: z.number().int().min(0).max(86_400_000),
});
export type AttemptRequest = z.infer<typeof attemptRequestSchema>;
export const attemptResultSchema = z.object({
  scenarioId: z.string(), selectedAction: scenarioActionSchema,
  bestAction: scenarioActionSchema.nullable(), evLossBb: z.number().nonnegative(),
  score: z.number().int().min(0).max(100), mistakeTag: z.string().nullable(),
  explanationMd: z.string(), assumptions: z.array(z.string()),
  engineVersion: z.string(), calculationMethod: z.string(),
});
export type AttemptResult = z.infer<typeof attemptResultSchema>;
export const dailyPuzzleStateSchema = z.object({
  id: z.string(), puzzleDate: z.string(), game: gameKeySchema,
  scenario: scenarioSchema, hasSubmitted: z.boolean(), canReveal: z.boolean(),
});
export type DailyPuzzleState = z.infer<typeof dailyPuzzleStateSchema>;
export const questProgressSchema = z.object({
  id: z.string(), title: z.string(), cadence: z.enum(["daily", "weekly", "recovery"]),
  progress: z.number().min(0), target: z.number().positive(),
  xpReward: z.number().int().nonnegative(), status: z.enum(["active", "completed"]),
});
export type QuestProgress = z.infer<typeof questProgressSchema>;
export const progressSummarySchema = z.object({
  xp: z.number().int().nonnegative(), level: z.number().int().positive(),
  mastery: z.number().min(0).max(100), quests: z.array(questProgressSchema),
  practiced: z.number().int().nonnegative(), averageEvLossBb: z.number().nonnegative(),
});
export type ProgressSummary = z.infer<typeof progressSummarySchema>;
