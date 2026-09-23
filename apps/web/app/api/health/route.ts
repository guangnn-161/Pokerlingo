import { sql } from "drizzle-orm";
import { db } from "@pokerlingo/db";
import { fail, ok } from "@/lib/api";

export async function GET(request: Request) {
  try {
    await db.execute(sql`select 1`);
    return ok(request, { status: "ok", service: "pokerlingo-web", version: process.env.VERCEL_GIT_COMMIT_SHA ?? "local", database: "reachable" });
  } catch {
    return fail(request, 503, "DEPENDENCY_UNAVAILABLE", "Database is unavailable.");
  }
}