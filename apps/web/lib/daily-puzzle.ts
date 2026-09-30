import { and, eq } from "drizzle-orm";
import { db } from "@pokerlingo/db";
import { dailyPuzzles, scenarios } from "@pokerlingo/db/schema";

export async function publishDailyPuzzle(args: {
  puzzleDate: string;
  game: string;
  scenarioId: string;
  publishAt: Date;
  closeAt: Date;
}) {
  const [scenario] = await db.select().from(scenarios).where(and(
    eq(scenarios.id, args.scenarioId),
    eq(scenarios.status, "published"),
  )).limit(1);

  if (!scenario) throw new Error("Only published scenarios can become daily puzzles.");

  const [row] = await db.insert(dailyPuzzles).values({
    puzzleDate: args.puzzleDate,
    game: args.game,
    scenarioId: scenario.id,
    solutionVersion: scenario.version,
    publishAt: args.publishAt,
    closeAt: args.closeAt,
  }).onConflictDoUpdate({
    target: [dailyPuzzles.puzzleDate, dailyPuzzles.game],
    set: {
      scenarioId: scenario.id,
      solutionVersion: scenario.version,
      publishAt: args.publishAt,
      closeAt: args.closeAt,
    },
  }).returning();

  return row;
}
