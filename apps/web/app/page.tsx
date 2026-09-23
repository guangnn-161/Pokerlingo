import Link from "next/link";
import { auth } from "@/auth";
export default async function Home() {
  const session = await auth();
  return <main style={{ maxWidth: 760, margin: "4rem auto", fontFamily: "system-ui", padding: "0 1rem" }}>
    <h1>Pokerlingo</h1>
    <p>Educational practice for poker, blackjack and decision-making under uncertainty.</p>
    <p>{session?.user ? `Signed in as ${session.user.email ?? session.user.name ?? "learner"}.` : "Sign in to save your learning progress."}</p>
    <Link href={session?.user ? "/api/me" : "/login"}>{session?.user ? "View session API" : "Sign in"}</Link>
  </main>;
}