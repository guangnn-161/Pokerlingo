import { z } from "zod";
import { gameKeySchema, type GameKey } from "@pokerlingo/contracts/game";
import {
  attemptRequestSchema,
  attemptResultSchema,
  dailyAttemptResultSchema,
  dailyGetSchema,
  dailyPostRequestSchema,
  learningPromptSchema,
  progressSummarySchema,
  type AttemptRequest,
  type DailyPostRequest
} from "@pokerlingo/contracts/learning";

export class TrainingApiError extends Error {
  constructor(public readonly status: number, public readonly code: string) {
    super(code);
    this.name = "TrainingApiError";
  }
}

const errorSchema = z.object({ error: z.string() });
const dataEnvelope = <T extends z.ZodTypeAny>(schema: T) => z.object({ data: schema }).strict();

async function request<T extends z.ZodTypeAny>(path: string, schema: T, init?: RequestInit): Promise<z.infer<T>> {
  const response = await fetch(path, {
    cache: "no-store",
    ...init,
    headers: { "content-type": "application/json", ...init?.headers }
  });
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const parsed = errorSchema.safeParse(payload);
    throw new TrainingApiError(response.status, parsed.success ? parsed.data.error : "REQUEST_FAILED");
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) throw new TrainingApiError(response.status, "INVALID_RESPONSE");
  return parsed.data;
}

export function getProgress() {
  return request("/api/learning/progress", dataEnvelope(progressSummarySchema)).then((response) => response.data);
}

export function getScenarios(game: GameKey) {
  return request(`/api/learning/scenarios?game=${encodeURIComponent(gameKeySchema.parse(game))}`, dataEnvelope(z.array(learningPromptSchema)))
    .then((response) => response.data);
}

export function submitScenario(input: AttemptRequest) {
  return request("/api/learning/attempt", attemptResultSchema, {
    method: "POST",
    body: JSON.stringify(attemptRequestSchema.parse(input))
  });
}

export function getDaily(game: GameKey) {
  return request(`/api/learning/daily?game=${encodeURIComponent(gameKeySchema.parse(game))}`, dataEnvelope(dailyGetSchema))
    .then((response) => response.data);
}

export function submitDaily(input: DailyPostRequest) {
  return request("/api/learning/daily", dailyAttemptResultSchema, {
    method: "POST",
    body: JSON.stringify(dailyPostRequestSchema.parse(input))
  });
}
