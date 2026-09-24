import { z } from "zod";

export const demoActionSchema = z.enum(["fold", "call", "raise"]);
export const demoScenarioSchema = z.object({
  id: z.string(),
  title: z.string(),
  game: z.literal("nlhe"),
  topic: z.string(),
  difficulty: z.number().int().min(1).max(5),
  heroHand: z.string(),
  board: z.array(z.string()),
  prompt: z.string(),
  actions: z.array(demoActionSchema),
  assumptions: z.array(z.string())
});
export type DemoScenario = z.infer<typeof demoScenarioSchema>;

export const demoAttemptRequestSchema = z.object({
  scenarioId: z.string().min(1),
  action: demoActionSchema
});
export type DemoAttemptRequest = z.infer<typeof demoAttemptRequestSchema>;

export const demoAttemptResultSchema = z.object({
  selectedAction: demoActionSchema,
  recommendedAction: demoActionSchema,
  selectedEvBb: z.number(),
  evLossBb: z.number().nonnegative(),
  score: z.number().int().min(0).max(100),
  explanation: z.string(),
  assumptions: z.array(z.string()),
  demo: z.literal(true)
});
export type DemoAttemptResult = z.infer<typeof demoAttemptResultSchema>;

export const demoDashboardSchema = z.object({
  xp: z.number().int(),
  level: z.number().int(),
  mastery: z.number(),
  quests: z.array(z.object({ id: z.string(), title: z.string(), progress: z.number(), target: z.number() })),
  leaderboard: z.array(z.object({ rank: z.number().int(), handle: z.string(), score: z.number() })),
  friends: z.array(z.object({ handle: z.string(), status: z.string() }))
});
export type DemoDashboard = z.infer<typeof demoDashboardSchema>;
