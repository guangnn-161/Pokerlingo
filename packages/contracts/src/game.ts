import { z } from "zod";
export const gameKeySchema = z.enum(["nlhe", "blackjack", "roulette", "baccarat", "sportsbook"]);
export type GameKey = z.infer<typeof gameKeySchema>;
export const actionSchema = z.object({ type: z.string(), size: z.string().optional() });
export type Action = z.infer<typeof actionSchema>;
export const calculationResultSchema = z.object({
  engineVersion: z.string(), assumptions: z.array(z.string()), ev: z.string().optional()
});
export type CalculationResult = z.infer<typeof calculationResultSchema>;