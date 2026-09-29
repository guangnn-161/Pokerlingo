import Link from "next/link";
import { lessons } from "@/lib/lessons";
export const metadata = { title: "Learning library · Pokerlingo" };
export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>;
}) {
  const { game } = await searchParams;
  const filter =
    game === "poker" ? "Poker" : game === "blackjack" ? "Blackjack" : "All";
  const selected =
    filter === "All"
      ? lessons
      : lessons.filter((l) => l.game === filter || l.game === "Foundations");
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE LEARNING LIBRARY</p>
          <h1>
            Learn the math.
            <br />
            <span>See the game differently.</span>
          </h1>
          <p>
            Short lessons, worked examples and a question to make the idea
            stick.
          </p>
        </div>
        <Link href="/math" className="button secondary">
          Try the math lab ↗
        </Link>
      </div>
      <nav className="tabs" aria-label="Filter lessons">
        {["All", "Poker", "Blackjack"].map((f) => (
          <Link
            key={f}
            className={filter === f ? "selected" : ""}
            href={f === "All" ? "/learn" : `/learn?game=${f.toLowerCase()}`}
          >
            {f === "All" ? "All lessons" : f}
          </Link>
        ))}
      </nav>
      <div className="lesson-grid">
        {selected.map((l, i) => (
          <Link key={l.id} href={`/learn/${l.id}`} className="lesson-card">
            <span className="eyebrow">
              {l.game} · {l.minutes} MIN READ
            </span>
            <span className="lesson-number">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h2>{l.title}</h2>
            <p>{l.subtitle}</p>
            <span className="text-link">Read the lesson ↗</span>
          </Link>
        ))}
      </div>
      <p className="notice">
        Examples are original teaching exercises. Each lesson states its
        assumptions and links further reading. Practice uses chips with no cash
        value.
      </p>
    </>
  );
}
