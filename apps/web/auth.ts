import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@pokerlingo/db";
import { profiles } from "@pokerlingo/db/schema";

const providers: Provider[] = [];
if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(GitHub({ clientId: process.env.AUTH_GITHUB_ID, clientSecret: process.env.AUTH_GITHUB_SECRET }));
}
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(Google({ clientId: process.env.AUTH_GOOGLE_ID, clientSecret: process.env.AUTH_GOOGLE_SECRET }));
}
if (process.env.AUTH_RESEND_KEY && process.env.EMAIL_FROM) {
  providers.push(Resend({ apiKey: process.env.AUTH_RESEND_KEY, from: process.env.EMAIL_FROM }));
}
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db), providers, trustHost: true,
  session: { strategy: "database", maxAge: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
  callbacks: { session: async ({ session, user }) => { if (session.user) session.user.id = user.id; return session; } },
  events: {
    createUser: async ({ user }) => {
      if (!user.id) return;
      await db.insert(profiles).values({ userId: user.id, displayName: user.name ?? null, avatarUrl: user.image ?? null }).onConflictDoNothing();
    }
  },
  pages: { signIn: "/login" }
});