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
        Practice better decisions, understand EV and build stronger mathematical intuition for games of chance.
      </p>
      <div style={{ display: "flex", gap: ".75rem", alignItems: "center", flexWrap: "wrap" }}>
        <Link href="/demo" style={{ display: "inline-block", padding: ".7rem 1rem", background: "#a16207", color: "white", borderRadius: 8, textDecoration: "none", fontWeight: 700 }}>Open the Preflop Trainer</Link>
        {learner ? <>
          <span>Signed in as <strong>{learner.name ?? learner.email ?? "learner"}</strong>.</span>
          <Link href="/profile">Open profile</Link>
          <Link href="/api/me">Session details</Link>
        </> : <Link href="/login" style={{ color: "#171717" }}>Sign in to save progress</Link>}
      </div>
    </section>

    <section aria-label="Learning areas" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1rem" }}>
      <article style={cardStyle}><h2>Decision drills</h2><p>Practice a poker spot, choose an action and receive immediate EV feedback with the reasoning behind it.</p></article>
      <article style={cardStyle}><h2>Math lab</h2><p>The math package is separated from the UI: poker pot odds/EV, blackjack basics, roulette house edge and sportsbook overround.</p></article>
      <article style={cardStyle}><h2>Daily progress</h2><p>The demo displays XP, quests, a leaderboard and friends through typed mock data ready for the product layer.</p></article>
    </section>
  </main>;
}
