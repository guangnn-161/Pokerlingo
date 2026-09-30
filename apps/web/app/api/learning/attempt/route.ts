import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@pokerlingo/db";
import { scenarios } from "@pokerlingo/db/schema";
import { attemptRequestSchema } from "@pokerlingo/contracts/learning";
import { getCurrentUser } from "@/lib/current-user";
import { awardXp, gradeReference, recordAttempt, updateMastery } from "@/lib/learning";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = attemptRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_REQUEST", details: parsed.error.flatten() }, { status: 400 });

  const [scenario] = await db.select().from(scenarios).where(and(
    eq(scenarios.id, parsed.data.scenarioId),
    eq(scenarios.status, "published"),
  )).limit(1);

  if (!scenario) return NextResponse.json({ error: "SCENARIO_NOT_FOUND" }, { status: 404 });

  const state = JSON.parse(scenario.stateJson) as {
    referenceActionType?: string;
    referenceActionSize?: string;
    referenceEvBb?: number;
    selectedEvs?: Record<string, number>;
    assumptions?: string[];
    engineVersion?: string;
    calculationMethod?: string;
  };

  const selectedEvBb = state.selectedEvs?.[parsed.data.action.type];
  if (typeof state.referenceEvBb !== "number" || typeof selectedEvBb !== "number" || !state.referenceActionType) {
    return NextResponse.json({ error: "SCENARIO_NOT_SCORABLE" }, { status: 422 });
  }

  const result = gradeReference({
    scenarioId: scenario.id,
    selectedAction: parsed.data.action,
    referenceAction: { type: state.referenceActionType, size: state.referenceActionSize },
    referenceEvBb: state.referenceEvBb,
    selectedEvBb,
    explanationMd: scenario.explanationMd,
    assumptions: state.assumptions ?? [],
    engineVersion: state.engineVersion ?? "reference-v1",
    calculationMethod: state.calculationMethod ?? "content-reference",
    topic: scenario.topic,
    durationMs: parsed.data.durationMs,
  });

  const attempt = await recordAttempt({
    userId: user.id,
    scenarioId: scenario.id,
    scenarioVersion: scenario.version,
    selectedAction: parsed.data.action,
    evLossBb: result.evLossBb,
    score: result.score,
    mistakeTag: result.mistakeTag,
    durationMs: parsed.data.durationMs,
  });
  await updateMastery(user.id, scenario.topic, result.score);
  await awardXp({ userId: user.id, sourceType: "attempt", sourceId: attempt.id, xpDelta: result.score >= 80 ? 10 : 5 });

  return NextResponse.json({ ...result, attemptId: attempt.id });
}
