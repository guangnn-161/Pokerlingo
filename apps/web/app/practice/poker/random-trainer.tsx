"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  variantNames,
  type PokerVariant,
  type RandomPokerSpot,
  type VariantEquityResult,
  type gradePokerDecision,
} from "@pokerlingo/math";
import { PlayingCard } from "@/components/playing-card";
import { recordDecision } from "@/components/progress";
type Result = {
  spot: RandomPokerSpot;
  equity: VariantEquityResult;
  grade: ReturnType<typeof gradePokerDecision>;
};
const rules: Record<PokerVariant, string> = {
  holdem:
    "Best five from two hole cards and five community cards. Use zero, one or two hole cards.",
  omaha:
    "Four hole cards. Exactly two hole cards and three community cards must make your hand.",
  shortdeck:
    "36 cards, ranks 6–A. Flush beats full house; straight beats trips. A–6–7–8–9 is the low straight.",
  stud: "Individual seven-card hands; no community board. Best five wins. Opponent upcards are common to every possible hand in the shown range.",
};
export function RandomPokerTrainer() {
  const [variant, setVariant] = useState<PokerVariant>("holdem"),
    [street, setStreet] = useState<"mixed" | "early" | "middle" | "late">(
      "mixed",
    ),
    [result, setResult] = useState<Result | null>(null),
    [choice, setChoice] = useState<"fold" | "call" | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [ready, setReady] = useState(false),
    [score, setScore] = useState({ graded: 0, correct: 0, close: 0 }),
    [seedInput, setSeedInput] = useState("");
  const worker = useRef<Worker | null>(null),
    request = useRef(0),
    timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const w = new Worker(new URL("./equity.worker.ts", import.meta.url));
    worker.current = w;
    setReady(true);
    w.onmessage = ({ data }) => {
      if (data.id !== request.current) return;
      if (timeout.current) clearTimeout(timeout.current);
      setBusy(false);
      if (data.error) setError(data.error);
      else setResult(data);
    };
    w.onerror = () => {
      setBusy(false);
      setError("The calculator could not run. Reload this page to restart it.");
      setReady(false);
    };
    return () => {
      w.terminate();
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, []);
  function generate(replay = false) {
    if (!worker.current || !ready) return;
    const seed = replay
      ? Number(seedInput)
      : crypto.getRandomValues(new Uint32Array(1))[0]!;
    if (!Number.isSafeInteger(seed) || seed < 0 || seed > 4294967295) {
      setError("Use a whole-number seed from 0 to 4294967295.");
      return;
    }
    setBusy(true);
    setResult(null);
    setChoice(null);
    setError("");
    setSeedInput(String(seed));
    const id = ++request.current;
    worker.current.postMessage({ id, variant, seed, street });
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      if (request.current === id) {
        request.current++;
        setBusy(false);
        setError(
          "Calculation took too long. Choose a later street or reload to retry.",
        );
      }
    }, 60000);
  }
  function answer(action: "fold" | "call") {
    if (!result || choice || busy) return;
    setChoice(action);
    const close = result.grade.best === "close",
      correct = result.grade.best === action;
    setScore((s) => ({
      graded: s.graded + Number(!close),
      correct: s.correct + Number(correct),
      close: s.close + Number(close),
    }));
    if (!close) recordDecision("poker", correct);
  }
  function clear() {
    request.current++;
    setResult(null);
    setChoice(null);
    setBusy(false);
    setError("");
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">POKER / RANDOM EV PRACTICE</p>
          <h1>
            A fresh hand.
            <br />
            <span>A calculated decision.</span>
          </h1>
          <p>
            Cards, ranges and prices change every time. Your answer is evaluated
            from showdown equity and the price of calling.
          </p>
        </div>
        <Link className="button secondary" href="/learn/poker-variants">
          Learn the four games ↗
        </Link>
      </div>
      <div className="tabs">
        <Link className="button secondary" href="/practice/poker">
          Six-player table ↗
        </Link>
        <span className="button primary">Random situations</span>
        <Link className="button secondary" href="/practice/poker/guided">
          Guided examples ↗
        </Link>
        <Link className="button secondary" href="/practice/gto">
          GTO tables ↗
        </Link>
      </div>
      <section className="content-panel random-controls">
        <div className="form-grid">
          <label className="field">
            Poker variant
            <select
              value={variant}
              onChange={(e) => {
                setVariant(e.target.value as PokerVariant);
                clear();
              }}
            >
              {Object.entries(variantNames).map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Situation
            <select
              value={street}
              onChange={(e) => {
                setStreet(e.target.value as typeof street);
                clear();
              }}
            >
              <option value="mixed">Mix the streets</option>
              <option value="early">
                {variant === "stud" ? "Fifth street" : "Flop"}
              </option>
              <option value="middle">
                {variant === "stud" ? "Sixth street" : "Turn"}
              </option>
              <option value="late">
                {variant === "stud" ? "Seventh street" : "River"}
              </option>
            </select>
          </label>
        </div>
        <p>{rules[variant]}</p>
        <button
          className="button primary"
          disabled={!ready || busy}
          onClick={() => generate()}
        >
          {busy
            ? "Dealing & calculating…"
            : result
              ? "New random spot →"
              : "Deal a random spot →"}
        </button>
        <details className="seed-controls">
          <summary>Reproduce a situation</summary>
          <label className="field">
            Seed
            <input
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              inputMode="numeric"
            />
          </label>
          <button
            className="button secondary"
            disabled={!ready || busy || seedInput.trim() === ""}
            onClick={() => generate(true)}
          >
            Load this seed
          </button>
          <small>
            Use the same game and street setting. A seed recreates the cards and
            sample.
          </small>
        </details>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
      </section>
      {result && (
        <div className="practice-layout">
          <section className="table-panel">
            <div className="table-toolbar">
              <strong>{variantNames[result.spot.variant]} · 6 seats</strong>
              <span>{result.spot.street}</span>
            </div>
            <div className="random-table">
              <div
                className="folded-seats"
                aria-label="Four other seats have folded"
              >
                {[3, 4, 5, 6].map((n) => (
                  <span key={n}>
                    SEAT {n}
                    <small>Folded</small>
                  </span>
                ))}
              </div>
              <div className="random-opponent">
                <p>
                  SEAT 2 · OPPONENT · {result.spot.opponents.length} POSSIBLE
                  HANDS
                </p>
                <div className="card-row">
                  {result.spot.variant === "stud"
                    ? result.spot.visibleOpponent.map((c, i) => (
                        <PlayingCard card={c} small key={i} />
                      ))
                    : Array.from(
                        { length: result.spot.variant === "omaha" ? 4 : 2 },
                        (_, i) => <PlayingCard small key={i} />,
                      )}
                </div>
              </div>
              {result.spot.board.length > 0 && (
                <div className="random-board">
                  <p>COMMUNITY CARDS</p>
                  <div className="card-row">
                    {result.spot.board.map((c) => (
                      <PlayingCard card={c} key={c} />
                    ))}
                  </div>
                </div>
              )}
              <div className="random-pot">
                POT{" "}
                <strong>
                  {result.spot.pot} {variant === "stud" ? "units" : "BB"}
                </strong>
                <span>Including opponent’s bet</span>
              </div>
              <div className="random-hero">
                <p>SEAT 1 · YOUR {result.spot.hero.length} CARDS</p>
                <div className="card-row">
                  {result.spot.hero.map((c) => (
                    <PlayingCard card={c} key={c} />
                  ))}
                </div>
              </div>
            </div>
            <div className="decision-bar">
              <h3>
                Call {result.spot.call} {variant === "stud" ? "units" : "BB"},
                or fold?
              </h3>
              <p>
                {variant === "stud"
                  ? "Final call with the opponent all-in (2 units)."
                  : "The opponent is all-in."}{" "}
                No future betting, no rake. Remaining cards run out to showdown.
              </p>
              <div className="actions">
                <button
                  className="button secondary"
                  disabled={Boolean(choice)}
                  onClick={() => answer("fold")}
                >
                  Fold
                </button>
                <button
                  className="button primary"
                  disabled={Boolean(choice)}
                  onClick={() => answer("call")}
                >
                  Call {result.spot.call}
                </button>
              </div>
            </div>
          </section>
          <aside className="coach-panel">
            <section className="coach-card" aria-live="polite">
              <p className="eyebrow">EV COACH</p>
              <h3>
                {choice
                  ? result.grade.best === "close"
                    ? "Too close to grade confidently."
                    : choice === result.grade.best
                      ? "The numbers support your choice."
                      : `The model prefers ${result.grade.best}.`
                  : "Make the decision first."}
              </h3>
              {choice ? (
                <>
                  <dl className="fact-list">
                    <dt>Equity</dt>
                    <dd>{(100 * result.equity.equity).toFixed(2)}%</dd>
                    <dt>Break-even equity</dt>
                    <dd>{(100 * result.grade.required).toFixed(2)}%</dd>
                    <dt>Fold EV</dt>
                    <dd>0.00</dd>
                    <dt>Call EV</dt>
                    <dd>
                      {result.grade.callEv.toFixed(2)}{" "}
                      {variant === "stud" ? "units" : "BB"}
                    </dd>
                  </dl>
                  <p className="formula">
                    EV(call) = equity × ({result.spot.pot} + {result.spot.call})
                    − {result.spot.call}
                  </p>
                  <p>
                    {result.equity.method === "exact-range"
                      ? `Exact over all ${result.equity.samples} equally weighted hands in this range.`
                      : `Monte Carlo: ${result.equity.samples.toLocaleString()} samples. Approximate sampling margin: ±${result.grade.evError.toFixed(2)} ${variant === "stud" ? "units" : "BB"} (about 95%; range assumptions are separate).`}
                  </p>
                  <p>
                    {result.grade.best === "close"
                      ? "This spot is excluded from accuracy: the EV difference is zero or smaller than the sampling uncertainty."
                      : "Folding is zero additional EV. Chips committed earlier are already in the pot."}
                  </p>
                  <button
                    className="button primary"
                    disabled={busy}
                    onClick={() => generate()}
                  >
                    Next random spot →
                  </button>
                </>
              ) : (
                <p>
                  Compare the call price with your chance against the range
                  below. The calculator uses these actual cards; no answer was
                  selected in advance.
                </p>
              )}
              <p>
                Correct graded decisions: {score.correct} / {score.graded} ·
                Close spots: {score.close}
              </p>
            </section>
            <section className="coach-card">
              <p className="eyebrow">OPPONENT MODEL</p>
              <h3>{result.spot.rangeStyle}</h3>
              <p>
                Each of these twelve combinations is equally likely. They are
                alternatives, not twelve players. This is the assumed range
                after the opponent’s bet; it is not inferred from real
                opponents.
              </p>
              <details open>
                <summary>See all possible hands</summary>
                <div className="range-combos">
                  {result.spot.opponents.map((o, i) => (
                    <code key={i}>{o.join(" ")}</code>
                  ))}
                </div>
              </details>
              <p>
                Made-hand-heavy ranges keep the strongest current hands from a
                larger random pool. Wide ranges sample without that filter.
                Future cards remain random.
              </p>
            </section>
          </aside>
        </div>
      )}
      {!result && !busy && (
        <div className="content-panel">
          <h2>Four games. Four rule sets.</h2>
          <p>
            Choose a game and deal. Hold’em, Omaha and Short Deck use community
            boards; Stud gives each player a separate seven-card hand. Change
            the game whenever you want a different exercise.
          </p>
        </div>
      )}
      <p className="notice">
        Each drill starts at a six-seat table after four players have folded.
        Their cards are unknown; the displayed range is the one remaining
        opponent. These are generated decision exercises with an explicit
        opponent model. EV accuracy depends on that model. They are separate
        from the heads-up push/fold equilibrium tables and are not full-game GTO
        solutions.
      </p>
    </>
  );
}
