import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@pokerlingo/db";
import { scenarios } from "@pokerlingo/db/schema";
import { getCurrentUser } from "@/lib/current-user";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const topic = new URL(request.url).searchParams.get("topic");
  const filters = [eq(scenarios.status, "published")];
  if (topic) filters.push(eq(scenarios.topic, topic));

  const rows = await db.select().from(scenarios).where(and(...filters));
  return NextResponse.json(rows.map((row) => ({
    id: row.id,
    game: row.game,
    title: row.title,
    difficulty: row.difficulty,
    rulesVersion: row.rulesVersion,
    state: JSON.parse(row.stateJson),
    tags: JSON.parse(row.tagsJson),
    topic: row.topic,
    explanationMd: row.explanationMd,
    version: row.version,
    status: row.status,
    source: row.source ?? undefined,
  })));
}
