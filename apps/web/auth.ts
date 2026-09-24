import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@pokerlingo/db";
import { profiles } from "@pokerlingo/db/schema";

const providers: Provider[] = [];
const githubId = process.env.AUTH_GITHUB_ID?.trim();
const githubSecret = process.env.AUTH_GITHUB_SECRET?.trim();
const googleId = process.env.AUTH_GOOGLE_ID?.trim();
const googleSecret = process.env.AUTH_GOOGLE_SECRET?.trim();

if (githubId && githubSecret) {
  providers.push(GitHub({ clientId: githubId, clientSecret: githubSecret }));
}
if (googleId && googleSecret) {
  providers.push(Google({ clientId: googleId, clientSecret: googleSecret }));
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
