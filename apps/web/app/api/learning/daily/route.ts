import { and, eq, lte, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@pokerlingo/db";
import { dailyPuzzles, scenarios, dailyPuzzleAttempts } from "@pokerlingo/db/schema";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const now = new Date();
  const puzzleDate = now.toISOString().slice(0, 10);
  const [puzzle] = await db.select().from(dailyPuzzles).where(and(
    eq(dailyPuzzles.puzzleDate, puzzleDate),
    lte(dailyPuzzles.publishAt, now),
    gt(dailyPuzzles.closeAt, now),
  )).limit(1);

  if (!puzzle) return NextResponse.json({ error: "DAILY_PUZZLE_NOT_FOUND" }, { status: 404 });

  const [scenario] = await db.select().from(scenarios).where(and(
    eq(scenarios.id, puzzle.scenarioId),
    eq(scenarios.status, "published"),
  )).limit(1);

  if (!scenario) return NextResponse.json({ error: "SCENARIO_NOT_FOUND" }, { status: 404 });

  const [submitted] = await db.select({ id: dailyPuzzleAttempts.id }).from(dailyPuzzleAttempts).where(and(
    eq(dailyPuzzleAttempts.puzzleId, puzzle.id),
    eq(dailyPuzzleAttempts.userId, user.id),
    eq(dailyPuzzleAttempts.isFirstAttempt, 1),
  )).limit(1);

  return NextResponse.json({
    id: puzzle.id,
    puzzleDate,
    game: puzzle.game,
    scenario: {
      id: scenario.id, game: scenario.game, title: scenario.title, difficulty: scenario.difficulty,
      rulesVersion: scenario.rulesVersion, state: JSON.parse(scenario.stateJson), tags: JSON.parse(scenario.tagsJson),
      topic: scenario.topic, explanationMd: scenario.explanationMd, version: scenario.version, status: scenario.status,
      source: scenario.source ?? undefined,
    },
    hasSubmitted: Boolean(submitted),
    canReveal: Boolean(submitted),
  });
}
