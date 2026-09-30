import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { ensureUserQuests, progressSummary } from "@/lib/learning";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  await ensureUserQuests(user.id, new Date());
  return NextResponse.json(await progressSummary(user.id));
}
