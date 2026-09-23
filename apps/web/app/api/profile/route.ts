import { eq } from "drizzle-orm";
import { profileUpdateSchema } from "@pokerlingo/contracts/api";
import { db } from "@pokerlingo/db";
import { auditLogs, profiles } from "@pokerlingo/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { fail, ipHash, ok, requireSameOrigin, requestId } from "@/lib/api";
import { takeRateLimit } from "@/lib/rate-limit";

export async function PATCH(request: Request) {
  if (!requireSameOrigin(request)) return fail(request, 403, "ORIGIN_FORBIDDEN", "Invalid request origin.");
  const user = await getCurrentUser();
  if (!user) return fail(request, 401, "UNAUTHENTICATED", "Sign in is required.");
  const limit = takeRateLimit(`profile:${user.id}`, 10);
  if (!limit.allowed) return fail(request, 429, "RATE_LIMITED", "Too many profile updates.");
  const parsed = profileUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(request, 400, "VALIDATION_ERROR", "Profile update is invalid.", { fields: parsed.error.flatten().fieldErrors });
  const [profile] = await db.insert(profiles).values({ userId: user.id, ...parsed.data, updatedAt: new Date() })
    .onConflictDoUpdate({ target: profiles.userId, set: { ...parsed.data, updatedAt: new Date() } })
    .returning();
  await db.insert(auditLogs).values({
    userId: user.id, action: "profile.updated", requestId: requestId(request), ipHash: ipHash(request),
    metadata: JSON.stringify({ fields: Object.keys(parsed.data) })
  });
  return ok(request, profile);
}