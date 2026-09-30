"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PlayingCard } from "@/components/playing-card";
import { CountChallenge } from "@/components/count-challenge";
import { countingDeck, hiLo, runningCount } from "@/lib/card-counting";
export function CountingTrainer() {
  const [decks, setDecks] = useState(1),
    [shoe, setShoe] = useState<string[]>([]),
    [cursor, setCursor] = useState(0),
    [batch, setBatch] = useState(1),
    [pace, setPace] = useState(1500),
    [auto, setAuto] = useState(false),
    [hidden, setHidden] = useState(false),
    [review, setReview] = useState(false),
    [checks, setChecks] = useState({ total: 0, correct: 0 }),
    [session, setSession] = useState(0);
  const finished = shoe.length > 0 && cursor === shoe.length;
  function start() {
    setShoe(countingDeck(decks));
    setCursor(0);
    setAuto(false);
    setHidden(false);
    setReview(false);
    setChecks({ total: 0, correct: 0 });
    setSession((s) => s + 1);
  }
  function next() {
    setCursor((c) => Math.min(c + batch, shoe.length));
    setHidden(false);
    setReview(false);
  }
  useEffect(() => {
    if (!auto || finished || !shoe.length) return;
    const timer = setTimeout(() => {
      setCursor((c) => Math.min(c + batch, shoe.length));
      setHidden(false);
      setReview(false);
    }, pace);
    return () => clearTimeout(timer);
  }, [auto, finished, shoe.length, cursor, batch, pace]);
  useEffect(() => {
    if (finished) setAuto(false);
  }, [finished]);
  const shown = shoe.slice(Math.max(0, cursor - batch), cursor),
    seen = shoe.slice(0, cursor);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">BLACKJACK / HI-LO COUNTING</p>
          <h1>
            Keep the count.
            <br />
            <span>Keep your focus.</span>
          </h1>
          <p>
            Practice recognition, running count and true-count conversion from a
            real shuffled shoe.
          </p>
        </div>
        <Link className="button secondary" href="/learn/card-counting">
          Read the counting guide ↗
        </Link>
      </div>
      <div className="tabs">
        <span className="button primary">Flash practice</span>
        <Link
          className="button secondary"
          href="/practice/blackjack?counting=1"
        >
          Count while playing ↗
        </Link>
      </div>
      <div className="practice-layout">
        <section className="table-panel">
          <div className="table-toolbar">
            <strong>
              HI-LO · {decks} {decks === 1 ? "DECK" : "DECKS"}
            </strong>
            <span>
              {cursor} / {shoe.length || decks * 52} exposed
            </span>
          </div>
          <div className="count-stage">
            <p className="eyebrow">
              {finished
                ? "SHOE COMPLETE"
                : auto
                  ? "WATCH THE CARDS"
                  : "ONE BATCH AT A TIME"}
            </p>
            <div className="card-row">
              {shown.length ? (
                shown.map((c, i) => (
                  <PlayingCard
                    key={`${cursor}-${i}`}
                    card={hidden ? undefined : c}
                  />
                ))
              ) : (
                <PlayingCard />
              )}
            </div>
            <p>
              {shoe.length
                ? "Track only cards you have seen."
                : "Start a shoe to begin."}
            </p>
          </div>
          <div className="decision-bar">
            <div className="actions">
              <button className="button primary" onClick={start}>
                {shoe.length ? "New shuffled shoe" : "Start shoe"}
              </button>
              <button
                className="button secondary"
                disabled={!shoe.length || finished || auto}
                onClick={next}
              >
                Next {batch === 1 ? "card" : "3 cards"} →
              </button>
              <button
                className="button secondary"
                disabled={!shoe.length || finished}
                onClick={() => {
                  setReview(false);
                  setAuto((a) => !a);
                }}
              >
                {auto ? "Pause" : "Auto deal"}
              </button>
              <button
                className="button secondary"
                disabled={!cursor || auto}
                onClick={() => setHidden((v) => !v)}
              >
                {hidden ? "Show cards" : "Hide cards"}
              </button>
            </div>
            <div className="rule-controls">
              <label className="field">
                Decks
                <select
                  value={decks}
                  disabled={cursor > 0 && !finished}
                  onChange={(e) => {
                    setDecks(Number(e.target.value));
                    setShoe([]);
                    setCursor(0);
                  }}
                >
                  <option value={1}>1 deck</option>
                  <option value={2}>2 decks</option>
                  <option value={6}>6 decks</option>
                </select>
              </label>
              <label className="field">
                Cards per batch
                <select
                  value={batch}
                  disabled={auto || (cursor > 0 && !finished)}
                  onChange={(e) => setBatch(Number(e.target.value))}
                >
                  <option value={1}>One card</option>
                  <option value={3}>Three cards</option>
                </select>
              </label>
              <label className="field">
                Auto pace
                <select
                  value={pace}
                  onChange={(e) => setPace(Number(e.target.value))}
                >
                  <option value={3000}>3 seconds</option>
                  <option value={1500}>1.5 seconds</option>
                  <option value={700}>0.7 seconds</option>
                </select>
              </label>
            </div>
          </div>
        </section>
        <aside className="coach-panel">
          <section className="coach-card">
            <p className="eyebrow">COUNT CHECKPOINT</p>
            <h3>Pause. Recall. Check.</h3>
            <p>
              Correct checkpoints: {checks.correct} / {checks.total}
            </p>
            {cursor > 0 && !auto ? (
              <CountChallenge
                key={`${session}-${cursor}`}
                running={runningCount(seen)}
                unseen={shoe.length - cursor}
                onCheck={(correct) =>
                  setChecks((s) => ({
                    total: s.total + 1,
                    correct: s.correct + Number(correct),
                  }))
                }
              />
            ) : (
              <p>
                {auto
                  ? "Pause the stream to enter your counts."
                  : "Expose at least one card first."}
              </p>
            )}
            {cursor > 0 && !auto && (
              <>
                <button
                  className="button secondary"
                  onClick={() => setReview((r) => !r)}
                >
                  {review ? "Hide breakdown" : "Review exposed cards"}
                </button>
                {review && (
                  <p className="count-history">
                    {seen
                      .map((c) => `${c} (${hiLo(c) > 0 ? "+" : ""}${hiLo(c)})`)
                      .join(" · ")}
                  </p>
                )}
              </>
            )}
          </section>
          <section className="coach-card">
            <p className="eyebrow">THE THREE TAGS</p>
            <dl className="fact-list">
              <dt>2, 3, 4, 5, 6</dt>
              <dd>+1</dd>
              <dt>7, 8, 9</dt>
              <dd>0</dd>
              <dt>10, J, Q, K, A</dt>
              <dd>−1</dd>
            </dl>
            <p>
              Reset to zero at every shuffle. A complete shoe returns to zero; a
              partial shoe usually does not.
            </p>
            <Link className="text-link" href="/learn/card-counting">
              Learn why the count works ↗
            </Link>
          </section>
        </aside>
      </div>
      <p className="notice">
        This exercise grades count arithmetic, not betting returns. At the live
        practice table, the hidden dealer card stays out of your count until
        revealed. Scores reset with a new flash shoe.
      </p>
    </>
  );
}
