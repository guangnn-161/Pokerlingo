import { z } from "zod";
import { gameKeySchema } from "./game";
export const scenarioSchema = z.object({
  id: z.string(), game: gameKeySchema, title: z.string(), difficulty: z.number().int().min(1).max(5),
  rulesVersion: z.string(), state: z.unknown(), tags: z.array(z.string())
});
export type Scenario = z.infer<typeof scenarioSchema>;