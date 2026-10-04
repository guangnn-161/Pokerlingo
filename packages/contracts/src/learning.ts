import { z } from "zod";
import { gameKeySchema } from "./game";

export const actionSchema = z.object({ type: z.string().min(1), size: z.string().min(1).optional() }).strict();
export type LearningAction = z.infer<typeof actionSchema>;

export const learningPromptSchema = z.object({
  scenarioId: z.string(), revisionId: z.string().uuid(), game: gameKeySchema, title: z.string(),
  difficulty: z.number().int().min(1).max(5), rulesVersion: z.string(), promptState: z.unknown(), tags: z.array(z.string())
}).strict();
export type LearningPrompt = z.infer<typeof learningPromptSchema>;

export const learningSolutionSchema = z.object({
  bestAction: actionSchema, selectedEvs: z.record(z.number()), referenceEvBb: z.number(),
  explanationMd: z.string(), assumptions: z.array(z.string()), engineVersion: z.string(), calculationMethod: z.string()
}).strict();
export type LearningSolution = z.infer<typeof learningSolutionSchema>;

export const attemptRequestSchema = z.object({
  revisionId: z.string().uuid(), action: actionSchema, submissionId: z.string().min(8).max(200), durationMs: z.number().int().min(0).max(3600000).optional()
}).strict();
export type AttemptRequest = z.infer<typeof attemptRequestSchema>;

export const attemptResultSchema = z.object({
  attemptId: z.string().uuid(), revisionId: z.string().uuid(), selectedAction: actionSchema, bestAction: actionSchema,
  evLossBb: z.number(), score: z.number().int().min(0).max(100), mistakeTag: z.string().nullable(),
  explanationMd: z.string(), assumptions: z.array(z.string()), engineVersion: z.string(), calculationMethod: z.string()
}).strict();
export type AttemptResult = z.infer<typeof attemptResultSchema>;

export const dailyGetSchema = z.object({
  puzzleId: z.string().uuid(), puzzleDate: z.string(), game: gameKeySchema, prompt: learningPromptSchema,
  hasSubmitted: z.boolean(), canReveal: z.boolean()
}).strict();

export const dailyPostRequestSchema = z.object({
  game: gameKeySchema, action: actionSchema, submissionId: z.string().min(8).max(200), durationMs: z.number().int().min(0).max(3600000).optional()
}).strict();
export type DailyPostRequest = z.infer<typeof dailyPostRequestSchema>;

export const dailyAttemptResultSchema = z.object({
  attemptId: z.string().uuid(), puzzleId: z.string().uuid(), isFirstAttempt: z.boolean(),
  selectedAction: actionSchema, bestAction: actionSchema, evLossBb: z.number(), score: z.number().int().min(0).max(100),
  mistakeTag: z.string().nullable(), explanationMd: z.string(), assumptions: z.array(z.string()),
  engineVersion: z.string(), calculationMethod: z.string()
}).strict();
export type DailyAttemptResult = z.infer<typeof dailyAttemptResultSchema>;

export const progressSummarySchema = z.object({
  xp: z.number(), level: z.number().int(), mastery: z.number(), practiced: z.number().int(), averageEvLossBb: z.number(),
  quests: z.array(z.object({
    id: z.string().uuid(), key: z.string(), cadence: z.enum(["daily","weekly","recovery"]),
    periodStart: z.string().nullable(), progress: z.number().int(), target: z.number().int(), status: z.enum(["active","completed"])
  }).strict())
}).strict();

export const canonicalActionKey = (action: LearningAction) => action.size ? action.type + ":" + action.size : action.type;
