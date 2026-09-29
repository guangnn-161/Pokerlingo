"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PlayingCard } from "@/components/playing-card";
import {
  BOT_STYLES,
  actPoker,
  newPokerGame,
  pokerLegal,
  pokerPot,
  chooseBotAction,
  observeBot,
  type PokerGame,
  type PokerAction,
} from "@/lib/poker-game";
export function BotTable() {
  const [game, setGame] = useState<PokerGame | null>(null),
    [raise, setRaise] = useState("6"),
    [paused, setPaused] = useState(false),
    [fast, setFast] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (!game || game.street === "Complete" || game.actor === 0 || paused)
      return;
    const timer = setTimeout(
      () => {
        try {
          const next = actPoker(
            game,
            chooseBotAction(observeBot(game), Math.random),
          );
          setGame((current) => (current === game ? next : current));
        } catch (e) {
          setError(
            e instanceof Error ? e.message : "Unable to play this action.",
          );
          setPaused(true);
        }
      },
      fast ? 200 : 1100,
    );
    return () => clearTimeout(timer);
  }, [game, paused, fast]);
  const legal = game ? pokerLegal(game) : null,
    turn = game?.actor === 0 && game.street !== "Complete";
  function deal(reset = false) {
    setGame(
      newPokerGame(
        crypto.getRandomValues(new Uint32Array(1))[0]!,
        reset ? undefined : (game ?? undefined),
      ),
    );
    setPaused(false);
    setError("");
    setRaise("6");
  }
  function act(action: PokerAction) {
    if (!game || !turn) return;
    try {
      setGame(actPoker(game, action));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid action.");
    }
  }
  const seatPlayers =
    game?.players ??
    ["You", ...BOT_STYLES.map((b) => b.name)].map((name) => ({
      name,
      stack: 200,
      hole: [],
      folded: false,
      bet: 0,
      lastAction: "",
      startStack: 200,
    }));
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">POKER / SIX-MAX PRACTICE</p>
          <h1>
            Six seats. <br />
            <span>Five different opponents.</span>
          </h1>
          <p>
            Play a full Hold’em hand, read your opponents and choose your own
            line. Blinds 1 / 2 chips · 100 BB starting stacks · no rake.
          </p>
        </div>
        <Link className="button secondary" href="/learn/poker-variants">
          Learn the rules ↗
        </Link>
      </div>
      <div className="tabs">
        <span className="button primary">Six-player table</span>
        <Link className="button secondary" href="/practice/poker/random">
          Random EV drills ↗
        </Link>
        <Link className="button secondary" href="/practice/poker/guided">
          Guided examples ↗
        </Link>
        <Link className="button secondary" href="/practice/gto">
          GTO tables ↗
        </Link>
      </div>
      <div className="practice-layout bot-layout">
        <section className="table-panel">
          <div className="table-toolbar">
            <strong>HOLD’EM · 6 PLAYERS</strong>
            <span>
              {game
                ? `HAND ${game.hand} · ${game.street}`
                : "YOUR SEAT IS READY"}
            </span>
          </div>
          <div className="six-table" aria-label="Six-player Hold’em table">
            <div className="six-felt" />
            <div className="six-center">
              <p>
                {game?.street === "Complete"
                  ? "HAND COMPLETE"
                  : (game?.street ?? "TEXAS HOLD’EM")}
              </p>
              <div className="card-row">
                {Array.from({ length: 5 }, (_, i) => (
                  <PlayingCard key={i} small card={game?.board[i]} />
                ))}
              </div>
              <strong>
                {game?.street === "Complete" ? "Settled pot" : "Pot"} ·{" "}
                {game ? pokerPot(game) : 0} chips
              </strong>
              <small>
                {game && game.street !== "Complete"
                  ? `${game.players[game.actor]!.name} to act`
                  : "Practice chips only"}
              </small>
            </div>
            {seatPlayers.map((p, i) => (
              <div
                key={i}
                className={`six-seat six-seat-${i} ${game?.actor === i ? "acting" : ""} ${p.folded ? "folded" : ""}`}
                aria-label={`Seat ${i + 1}: ${p.name}${game?.actor === i ? ", acting" : ""}`}
              >
                <div className="seat-name">
                  <b>{p.name}</b>
                  {game?.dealer === i && <span title="Dealer button">D</span>}
                </div>
                <small>
                  {i === 0 ? "YOUR SEAT" : BOT_STYLES[i - 1]!.style}
                </small>
                <div className="card-row">
                  {[0, 1].map((n) => (
                    <PlayingCard
                      key={n}
                      small
                      card={
                        i === 0 || (game?.reveal && !p.folded)
                          ? p.hole[n]
                          : undefined
                      }
                    />
                  ))}
                </div>
                <strong>{p.stack} chips</strong>
                <small className="seat-action">
                  {p.folded ? "Folded" : p.lastAction || "Waiting"}
                  {p.bet > 0 && game?.street !== "Complete"
                    ? ` · ${p.bet} in`
                    : ""}
                </small>
              </div>
            ))}
          </div>
          <div className="decision-bar" aria-live="polite">
            {!game ? (
              <>
                <h3>Your seat is waiting.</h3>
                <p>
                  Five opponents, five tendencies. Start with 200 practice
                  chips.
                </p>
                <button className="button primary" onClick={() => deal()}>
                  Take a seat & deal →
                </button>
              </>
            ) : game.street === "Complete" ? (
              <>
                <h3>
                  {game.players[0]!.stack - game.players[0]!.startStack >= 0
                    ? "Hand complete."
                    : "Review the hand. Keep learning."}
                </h3>
                <p>
                  Your result:{" "}
                  {game.players[0]!.stack - game.players[0]!.startStack > 0
                    ? "+"
                    : ""}
                  {game.players[0]!.stack - game.players[0]!.startStack} chips.
                  Stacks carry into the next hand; empty seats reload to 200.
                </p>
                <button className="button primary" onClick={() => deal()}>
                  Deal next hand →
                </button>
                <button className="button secondary" onClick={() => deal(true)}>
                  Reset practice stacks
                </button>
              </>
            ) : turn && legal ? (
              <>
                <h3>
                  Your turn ·{" "}
                  {legal.canCheck
                    ? legal.canRaise
                      ? "Check or bet"
                      : "Check"
                    : `Call ${legal.call} chips${legal.canRaise ? ", raise" : ""} or fold`}
                </h3>
                <p>
                  Pot {pokerPot(game)} · Your stack {game.players[0]!.stack}.{" "}
                  {legal.canRaise
                    ? "Raise amount is your total contribution on this street."
                    : "Raising is unavailable until betting reopens and another player can respond."}
                </p>
                <div className="actions">
                  <button
                    className="button secondary"
                    onClick={() => act({ type: "fold" })}
                  >
                    Fold
                  </button>
                  <button
                    className="button primary"
                    onClick={() =>
                      act({ type: legal.canCheck ? "check" : "call" })
                    }
                  >
                    {legal.canCheck ? "Check" : `Call ${legal.call}`}
                  </button>
                  {legal.canRaise && (
                    <button
                      className="button secondary"
                      onClick={() => act({ type: "raise", to: legal.maxTo })}
                    >
                      All-in {legal.maxTo}
                    </button>
                  )}
                </div>
                {legal.canRaise && (
                  <div className="raise-control">
                    <label className="field">
                      {game.currentBet ? "Raise to" : "Bet"} (chips)
                      <input
                        type="number"
                        step="1"
                        min={Math.min(legal.minTo, legal.maxTo)}
                        max={legal.maxTo}
                        value={raise}
                        onChange={(e) => setRaise(e.target.value)}
                      />
                    </label>
                    <button
                      className="button primary"
                      disabled={
                        !Number.isInteger(Number(raise)) ||
                        Number(raise) > legal.maxTo ||
                        Number(raise) < Math.min(legal.minTo, legal.maxTo)
                      }
                      onClick={() => act({ type: "raise", to: Number(raise) })}
                    >
                      {game.currentBet ? "Raise" : "Bet"}
                    </button>
                    <small>
                      Minimum {Math.min(legal.minTo, legal.maxTo)} · maximum{" "}
                      {legal.maxTo}
                    </small>
                  </div>
                )}
              </>
            ) : (
              <>
                <h3>
                  {paused
                    ? "Table paused."
                    : `${game.players[game.actor]!.name} is thinking…`}
                </h3>
                <p>
                  {game.players[0]!.folded
                    ? "You folded. Watch how the rest of the hand plays out."
                    : "Watch the betting and the pot before your turn."}
                </p>
              </>
            )}
            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}
            {game && game.street !== "Complete" && (
              <div className="table-playback">
                <button
                  className="button secondary"
                  onClick={() => setPaused((p) => !p)}
                >
                  {paused ? "Resume bots" : "Pause bots"}
                </button>
                <label>
                  <input
                    type="checkbox"
                    checked={fast}
                    onChange={(e) => setFast(e.target.checked)}
                  />{" "}
                  Fast bot turns
                </label>
              </div>
            )}
          </div>
        </section>
        <aside className="coach-panel">
          <section className="coach-card">
            <p className="eyebrow">READ THE ROOM</p>
            <h3>Play the player.</h3>
            <p>
              These are deliberately distinct heuristic opponents. They use
              their own cards, the board and public betting state. They cannot
              inspect your cards or future cards.
            </p>
            <div className="bot-roster">
              {BOT_STYLES.map((b, i) => (
                <div key={b.name}>
                  <strong>
                    {b.name} · {b.style}
                  </strong>
                  <p>{b.detail}</p>
                  <small>
                    {i === 2
                      ? "Try value betting; bluff less."
                      : i === 4
                        ? "Expect pressure; avoid calling only from frustration."
                        : i === 3
                          ? "Respect rare raises; watch for cheap steals."
                          : i === 1
                            ? "Use position and stronger bluff catchers."
                            : "Look at position before challenging a strong range."}
                  </small>
                </div>
              ))}
            </div>
          </section>
          <section className="coach-card">
            <p className="eyebrow">HAND HISTORY</p>
            <h3>Follow the action.</h3>
            <ol className="hand-history">
              {game?.log.map((line, i) => <li key={i}>{line}</li>) ?? (
                <li>The first hand starts when you take your seat.</li>
              )}
            </ol>
            {game?.street === "Complete" && (
              <p>
                Main pots, side pots, split pots and uncalled chips are settled
                separately. The odd chip in a split goes clockwise from the
                button.
              </p>
            )}
          </section>
        </aside>
      </div>
      <p className="notice">
        The bots are practice opponents, not solved GTO strategies. This table
        plays six-max Hold’em. The separate EV drills cover four poker variants;
        the GTO lab explicitly models heads-up push/fold. Session stacks are
        local to this page and reset on reload.
      </p>
    </>
  );
}
