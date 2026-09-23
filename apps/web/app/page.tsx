import Link from "next/link";
import { auth } from "@/auth";

const cardStyle = {
  border: "1px solid #d7d7d7",
  borderRadius: 12,
  padding: "1.25rem",
  background: "#fff"
};

export default async function Home() {
  const session = await auth();
  const learner = session?.user;

  return <main style={{ maxWidth: 920, margin: "4rem auto", fontFamily: "system-ui", padding: "0 1rem", color: "#171717" }}>
    <section style={{ marginBottom: "2.5rem" }}>
      <p style={{ color: "#a16207", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", margin: 0 }}>Poker · Blackjack · Probability</p>
      <h1 style={{ fontSize: "clamp(2.25rem, 6vw, 4rem)", margin: ".35rem 0 .75rem" }}>Pokerlingo</h1>
      <p style={{ fontSize: "1.15rem", maxWidth: 660, lineHeight: 1.6 }}>
        Practice decisions, understand EV, and build a safer mathematical intuition for games of chance.
      </p>
      {learner ? <div style={{ display: "flex", gap: ".75rem", alignItems: "center", flexWrap: "wrap" }}>
        <span>Signed in as <strong>{learner.name ?? learner.email ?? "learner"}</strong>.</span>
        <Link href="/profile">Open profile</Link>
        <Link href="/api/me">Session API</Link>
      </div> : <Link href="/login" style={{ display: "inline-block", marginTop: ".5rem", padding: ".7rem 1rem", background: "#171717", color: "white", borderRadius: 8, textDecoration: "none" }}>Sign in to save progress</Link>}
    </section>

    <section aria-label="Learning areas" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1rem" }}>
      <article style={cardStyle}><h2>Decision practice</h2><p>Scenario engines for poker and blackjack will live here. Each answer records assumptions and explains the EV.</p></article>
      <article style={cardStyle}><h2>Math lab</h2><p>Explore probability, odds, variance and expected value before applying them at the table.</p></article>
      <article style={cardStyle}><h2>Daily progress</h2><p>Daily puzzles, missions, ranks and friends are designed to attach to your account profile.</p></article>
    </section>
  </main>;
}
