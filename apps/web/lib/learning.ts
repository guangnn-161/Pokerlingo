import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@pokerlingo/db";
import { attempts, masteryScores, questTemplates, userQuests, xpLedger } from "@pokerlingo/db/schema";

export function calculateScore(evLossBb: number, durationMs: number) {
  const safeLoss = Math.max(0, evLossBb);
  const lossPenalty = safeLoss * 20;
  const timePenalty = Math.min(20, Math.max(0, durationMs) / 15000);
  return Math.max(0, Math.min(100, Math.round(100 - lossPenalty - timePenalty)));
}

export function mistakeTagFor(topic: string, actionType: string) {
  const normalized = topic.toLowerCase();
  if (normalized.includes("pot") || normalized.includes("odds")) return "pot_odds";
  if (normalized.includes("range")) return "range_construction";
  if (normalized.includes("blocker")) return "blocker";
  if (normalized.includes("bluff")) return "underbluff";
  return actionType === "fold" ? "overfold" : "decision";
}

export async function recordAttempt(args: {
  userId: string;
  scenarioId: string;
  scenarioVersion: number;
  selectedAction: unknown;
  evLossBb: number;
  score: number;
  mistakeTag: string | null;
  durationMs: number;
}) {
  const [row] = await db.insert(attempts).values({
    userId: args.userId,
    scenarioId: args.scenarioId,
    scenarioVersion: args.scenarioVersion,
    selectedActionJson: JSON.stringify(args.selectedAction),
    evLossBb: String(args.evLossBb),
    score: args.score,
    mistakeTag: args.mistakeTag,
    durationMs: args.durationMs,
  }).returning();
  return row;
}

export async function awardXp(args: {
  userId: string;
  sourceType: string;
  sourceId: string;
  xpDelta: number;
}) {
  const idempotencyKey = `${args.sourceType}:${args.sourceId}:${args.userId}`;
  await db.insert(xpLedger).values({
    userId: args.userId,
    sourceType: args.sourceType,
    sourceId: args.sourceId,
    xpDelta: args.xpDelta,
    idempotencyKey,
  }).onConflictDoNothing({ target: xpLedger.idempotencyKey });
}

export function levelForXp(xp: number) {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 50)) + 1);
}

export async function updateMastery(userId: string, topicKey: string, score: number) {
  const current = await db.select().from(masteryScores)
    .where(and(eq(masteryScores.userId, userId), eq(masteryScores.topicKey, topicKey))).limit(1);
  const old = current[0];
  const next = old ? Math.round(old.score * 0.8 + score * 0.2) : Math.round(score);
  await db.insert(masteryScores).values({
    userId, topicKey, score: next, sampleCount: old ? old.sampleCount + 1 : 1,
  }).onConflictDoUpdate({
    target: [masteryScores.userId, masteryScores.topicKey],
    set: { score: next, sampleCount: sql`${masteryScores.sampleCount} + 1`, updatedAt: new Date() },
  });
  return next;
}

export async function ensureUserQuests(userId: string, periodStart: Date) {
  const templates = await db.select().from(questTemplates).where(eq(questTemplates.active, 1));
  for (const template of templates) {
    await db.insert(userQuests).values({
      userId,
      templateId: template.id,
      periodStart,
      progressJson: JSON.stringify({ progress: 0, target: 1 }),
      status: "active",
    }).onConflictDoNothing();
  }
}

export async function progressSummary(userId: string) {
  const [xpRow] = await db.select({ total: sql<number>`coalesce(sum(${xpLedger.xpDelta}), 0)` })
    .from(xpLedger).where(eq(xpLedger.userId, userId));
  const [attemptRow] = await db.select({
    practiced: sql<number>`count(*)`,
    averageEvLossBb: sql<number>`coalesce(avg(cast(${attempts.evLossBb} as numeric)), 0)`,
  }).from(attempts).where(eq(attempts.userId, userId));
  const masteryRows = await db.select().from(masteryScores).where(eq(masteryScores.userId, userId));
  const mastery = masteryRows.length
    ? masteryRows.reduce((sum, row) => sum + row.score, 0) / masteryRows.length
    : 0;
  return {
    xp: Number(xpRow?.total ?? 0),
    level: levelForXp(Number(xpRow?.total ?? 0)),
    mastery: Math.round(mastery * 10) / 10,
    practiced: Number(attemptRow?.practiced ?? 0),
    averageEvLossBb: Number(attemptRow?.averageEvLossBb ?? 0),
  };
}

export function gradeReference(args: {
  scenarioId: string;
  selectedAction: { type: string; size?: string };
  referenceAction: { type: string; size?: string };
  referenceEvBb: number;
  selectedEvBb: number;
  explanationMd: string;
  assumptions: string[];
  engineVersion: string;
  calculationMethod: string;
  topic: string;
  durationMs: number;
}) {
  const evLossBb = Math.max(0, args.referenceEvBb - args.selectedEvBb);
  const score = calculateScore(evLossBb, args.durationMs);
  const mistakeTag = evLossBb > 0 ? mistakeTagFor(args.topic, args.selectedAction.type) : null;
  return {
    scenarioId: args.scenarioId,
    selectedAction: args.selectedAction,
    bestAction: args.referenceAction,
    evLossBb,
    score,
    mistakeTag,
    explanationMd: args.explanationMd,
    assumptions: args.assumptions,
    engineVersion: args.engineVersion,
    calculationMethod: args.calculationMethod,
  };
}
