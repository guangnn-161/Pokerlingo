import { profileUpdateSchema } from "@pokerlingo/contracts/api";
import { db } from "@pokerlingo/db";
import { auditLogs, profiles } from "@pokerlingo/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { fail, ipHash, ok, requireSameOrigin, requestId } from "@/lib/api";
import { takeRateLimit } from "@/lib/rate-limit";

export async function PATCH(request: Request) {
  if (!requireSameOrigin(request)) {
    return fail(request, 403, "ORIGIN_FORBIDDEN", "Nguồn yêu cầu không hợp lệ.");
  }

  const user = await getCurrentUser();
  if (!user) return fail(request, 401, "UNAUTHENTICATED", "Bạn cần đăng nhập.");

  const limit = await takeRateLimit(`profile:${ipHash(request)}`, 10);
  if (!limit.allowed) {
    return fail(
      request,
      429,
      "RATE_LIMITED",
      "Bạn cập nhật hồ sơ quá nhiều lần. Vui lòng thử lại sau.",
    );
  }

  const parsed = profileUpdateSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return fail(
      request,
      400,
      "VALIDATION_ERROR",
      "Thông tin hồ sơ không hợp lệ.",
      { fields: parsed.error.flatten().fieldErrors },
    );
  }

  const [profile] = await db
    .insert(profiles)
    .values({ userId: user.id, ...parsed.data, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: { ...parsed.data, updatedAt: new Date() },
    })
    .returning();

  await db.insert(auditLogs).values({
    userId: user.id,
    action: "profile.updated",
    requestId: requestId(request),
    ipHash: ipHash(request),
    metadata: JSON.stringify({ fields: Object.keys(parsed.data) }),
  });

  return ok(request, profile);
}
