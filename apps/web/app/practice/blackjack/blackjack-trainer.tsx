"use client";
import { useState } from "react";
import Link from "next/link";
import { PlayingCard, Chips } from "@/components/playing-card";
import { recordDecision } from "@/components/progress";
import {
  createRound,
  playAction,
  legalActions,
  handTotal,
  strategy,
  defaultRules,
  type Action,
  type Round,
  type TableRules,
} from "@/lib/blackjack-game";
export function BlackjackTrainer() {
  const [rules, setRules] = useState<TableRules>(defaultRules),
    [round, setRound] = useState<Round | null>(null),
    [net, setNet] = useState(0),
    [feedback, setFeedback] = useState<{
      correct: boolean;
      text: string;
      action: string;
    } | null>(null),
    [hint, setHint] = useState(false),
    [score, setScore] = useState({ total: 0, correct: 0, hands: 0 }),
    [error, setError] = useState("");
  const playing = round?.phase === "playing",
    legal = round ? legalActions(round) : [];
  function deal() {
    try {
      const next = createRound(rules);
      setRound(next);
      setFeedback(null);
      setHint(false);
      setError("");
      setScore((s) => ({ ...s, hands: s.hands + 1 }));
      if (next.phase === "settled") setNet((n) => n + next.net);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to deal.");
    }
  }
  function act(action: Action) {
    if (!round || !legal.includes(action)) return;
    try {
      const advice = strategy(round),
        next = playAction(round, action),
        correct = advice.action === action;
      setRound(next);
      setHint(false);
      setFeedback({ correct, text: advice.reason, action: advice.action });
      setScore((s) => ({
        ...s,
        total: s.total + 1,
        correct: s.correct + Number(correct),
      }));
      recordDecision("blackjack", correct);
      if (next.phase === "settled") setNet((n) => n + next.net);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to play this action.");
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">BLACKJACK / BASIC STRATEGY</p>
          <h1>
            One hand.
            <br />
            <span>A better decision.</span>
          </h1>
          <p>
            Play complete rounds, get feedback on each move and learn to
            separate skill from luck.
          </p>
        </div>
        <Link href="/learn/blackjack-strategy" className="button secondary">
          Study the strategy ↗
        </Link>
      </div>
      <div className="practice-layout">
        <div className="table-panel">
          <div className="table-toolbar">
            <strong>
              <i className="status-dot" />
              BLACKJACK · 6 DECKS
            </strong>
            <span>Practice balance: {1000 + net} · Bet: 10</span>
          </div>
          <div className="bj-stage">
            <div className="bj-dealer">
              <p>
                DEALER{" "}
                {round && !playing ? `· ${handTotal(round.dealer).total}` : ""}
              </p>
              <div className="card-row">
                {round ? (
                  round.dealer.map((c, i) => (
                    <PlayingCard
                      key={i}
                      card={i === 1 && playing ? undefined : c}
                    />
                  ))
                ) : (
                  <>
                    <PlayingCard />
                    <PlayingCard />
                  </>
                )}
              </div>
            </div>
            <div className="bj-table-text">
              BLACKJACK PAYS {rules.payout === 1.5 ? "3 TO 2" : "6 TO 5"}
              <small>
                DEALER {rules.dealerHitsSoft17 ? "HITS" : "STANDS ON"} SOFT 17 ·
                PRACTICE CHIPS ONLY
              </small>
            </div>
            <div className="bj-players">
              {round ? (
                round.hands.map((h, i) => (
                  <div
                    className={`bj-hand ${playing && round.active === i ? "current" : ""}`}
                    key={i}
                  >
                    <p>
                      {round.hands.length > 1 ? `HAND ${i + 1}` : "YOUR HAND"} ·
                      BET {h.bet}
                    </p>
                    <div className="card-row">
                      {h.cards.map((c, j) => (
                        <PlayingCard card={c} key={j} />
                      ))}
                    </div>
                    <span className="hand-total">
                      {handTotal(h.cards).soft ? "Soft " : ""}
                      {handTotal(h.cards).total}
                    </span>
                    {h.outcome && (
                      <span className="hand-outcome">
                        {h.outcome} · {(h.net ?? 0) > 0 ? "+" : ""}
                        {h.net}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="bj-hand">
                  <p>YOUR SEAT</p>
                  <div className="card-row">
                    <PlayingCard card="As" />
                    <PlayingCard card="Jh" />
                  </div>
                  <span className="hand-total">Ready when you are</span>
                </div>
              )}
            </div>
            <div style={{ marginTop: 18 }}>
              <Chips value="10" />
            </div>
          </div>
          <div className="decision-bar">
            <h3>
              {playing
                ? "What’s your next move?"
                : round
                  ? "The result is in. Keep practicing."
                  : "Your table is ready."}
            </h3>
            {round && !playing && (
              <p className="round-result">
                Round result: {round.net > 0 ? "+" : ""}
                {round.net} practice chips. A good decision can still lose.
              </p>
            )}
            {!round && (
              <p>
                Deal a hand to begin. Your coach will explain each decision.
              </p>
            )}
            <div className="actions">
              {playing ? (
                (
                  ["hit", "stand", "double", "split", "surrender"] as Action[]
                ).map((a) => (
                  <button
                    className={`button ${a === "hit" || a === "stand" ? "primary" : "secondary"}`}
                    key={a}
                    disabled={!legal.includes(a)}
                    onClick={() => act(a)}
                  >
                    {a[0]!.toUpperCase() + a.slice(1)}
                  </button>
                ))
              ) : (
                <button className="button primary" onClick={deal}>
                  {round ? "Deal next hand →" : "Deal first hand →"}
                </button>
              )}
            </div>
            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
        <aside className="coach-panel">
          <div
            className={`coach-card ${feedback ? (feedback.correct ? "correct" : "incorrect") : ""}`}
            aria-live="polite"
          >
            <p className="eyebrow">YOUR STRATEGY COACH</p>
            <h3>
              {feedback
                ? feedback.correct
                  ? "Well played."
                  : `The reference prefers ${feedback.action}.`
                : "Learn with every hand."}
            </h3>
            <p>
              {feedback?.text ||
                "Make your decision first. We compare it with a multi-deck basic-strategy reference under your table rules."}
            </p>
            {playing && (
              <>
                <button
                  className="button secondary"
                  onClick={() => setHint(!hint)}
                >
                  {hint ? "Hide hint" : "Show a hint"}
                </button>
                {hint && round && (
                  <p>
                    <strong>{strategy(round).action.toUpperCase()}</strong> —{" "}
                    {strategy(round).reason}
                  </p>
                )}
              </>
            )}
            <dl className="fact-list">
              <dt>Hands dealt</dt>
              <dd>{score.hands}</dd>
              <dt>Correct decisions</dt>
              <dd>
                {score.correct} / {score.total}
              </dd>
              <dt>Accuracy</dt>
              <dd>
                {score.total
                  ? Math.round((100 * score.correct) / score.total) + "%"
                  : "—"}
              </dd>
            </dl>
          </div>
          <section className="coach-card">
            <p className="eyebrow">TABLE RULES</p>
            <h3>Set your practice conditions.</h3>
            <div className="rule-controls">
              <label className="field">
                Dealer on soft 17
                <select
                  disabled={playing}
                  value={rules.dealerHitsSoft17 ? "hit" : "stand"}
                  onChange={(e) =>
                    setRules((r) => ({
                      ...r,
                      dealerHitsSoft17: e.target.value === "hit",
                    }))
                  }
                >
                  <option value="stand">Stand (S17)</option>
                  <option value="hit">Hit (H17)</option>
                </select>
              </label>
              <label className="field">
                Blackjack payout
                <select
                  disabled={playing}
                  value={rules.payout}
                  onChange={(e) =>
                    setRules((r) => ({
                      ...r,
                      payout: Number(e.target.value) as 1.5 | 1.2,
                    }))
                  }
                >
                  <option value={1.5}>3:2</option>
                  <option value={1.2}>6:5</option>
                </select>
              </label>
              <label className="rule-check">
                <input
                  type="checkbox"
                  checked={rules.doubleAfterSplit}
                  disabled={playing}
                  onChange={(e) =>
                    setRules((r) => ({
                      ...r,
                      doubleAfterSplit: e.target.checked,
                    }))
                  }
                />
                Double after split
              </label>
              <label className="rule-check">
                <input
                  type="checkbox"
                  checked={rules.surrender}
                  disabled={playing}
                  onChange={(e) =>
                    setRules((r) => ({ ...r, surrender: e.target.checked }))
                  }
                />
                Late surrender
              </label>
            </div>
            <p className="quiet">
              Change between rounds. One split; split aces receive one card
              each. Dealer checks for blackjack first. A fresh 6-deck shoe is
              shuffled each round.
            </p>
            <Link className="text-link" href="/learn/house-edge">
              Why the rules change the math ↗
            </Link>
          </section>
        </aside>
      </div>
      <p className="notice">
        The coach uses total-dependent multi-deck basic strategy, without
        card-counting or composition-dependent exceptions. Split 21 pays 1:1.
        Hints remain available during practice; accuracy is a learning aid.
      </p>
    </>
  );
}
