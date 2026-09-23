import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@pokerlingo/db";
import { profiles, users } from "@pokerlingo/db/schema";
import type { CurrentUser } from "@pokerlingo/contracts/auth";

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const [row] = await db.select({ user: users, profile: profiles })
    .from(users).leftJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(users.id, session.user.id)).limit(1);
  if (!row) return null;
  return {
    id: row.user.id, email: row.user.email, name: row.user.name, image: row.user.image,
    role: row.user.role,
    profile: row.profile ? {
      handle: row.profile.handle, displayName: row.profile.displayName, visibility: row.profile.visibility
    } : null
  };
}