"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { GameKey } from "@pokerlingo/contracts/game";
import type { DailyAttemptResult, LearningAction, LearningPrompt } from "@pokerlingo/contracts/learning";
import { getDaily, submitDaily, TrainingApiError } from "@/lib/training-client";
import { actionLabel, dailyViewState, gameLabel } from "@/lib/training-state";

type PromptState = { prompt?: string; heroHand?: string; board?: string[]; actions?: string[] };
function toPromptState(value: unknown): PromptState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  return {
    prompt: typeof source.prompt === "string" ? source.prompt : undefined,
    heroHand: typeof source.heroHand === "string" ? source.heroHand : undefined,
    board: Array.isArray(source.board) ? source.board.filter((card): card is string => typeof card === "string") : undefined,
    actions: Array.isArray(source.actions) ? source.actions.filter((action): action is string => typeof action === "string") : undefined
  };
}
const games: GameKey[] = ["nlhe", "blackjack"];

export function DailyTrainer() {
  const [game, setGame] = useState<GameKey>("nlhe");
  const [prompt, setPrompt] = useState<LearningPrompt | null>(null);
  const [result, setResult] = useState<DailyAttemptResult | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  function load(nextGame = game) {
    setLoading(true); setPrompt(null); setResult(null); setError(""); setErrorCode(null);
    getDaily(nextGame).then((daily) => setPrompt(daily.prompt)).catch((cause: unknown) => {
      if (cause instanceof TrainingApiError && cause.status === 401) window.location.assign("/login");
      else if (cause instanceof TrainingApiError && cause.code === "DAILY_NOT_FOUND") setErrorCode(cause.code);
      else setError("Today’s challenge could not be loaded. Please try again.");
    }).finally(() => setLoading(false));
  }
  useEffect(() => { load(game); }, [game]); // eslint-disable-line react-hooks/exhaustive-deps

  const state = useMemo(() => prompt ? toPromptState(prompt.promptState) : {}, [prompt]);
  const view = dailyViewState({ errorCode, result });
  const actions: LearningAction[] = (state.actions ?? []).map((type) => ({ type }));
  async function choose(action: LearningAction) {
    if (!prompt || pending || result) return;
    setPending(true); setError("");
    try { setResult(await submitDaily({ game, action, submissionId: crypto.randomUUID() })); }
    catch (cause) {
      if (cause instanceof TrainingApiError && cause.status === 401) window.location.assign("/login");
      else setError(cause instanceof TrainingApiError && cause.code === "ACTION_NOT_SCORABLE" ? "That action is unavailable for this model. Choose another action." : "Your answer could not be recorded. Please try again.");
    } finally { setPending(false); }
  }
  function practiceAgain() { setResult(null); setError(""); }

  return <>
    <div className="page-heading"><div><p className="eyebrow">DAILY CHALLENGE</p><h1>One prompt. <span>One considered answer.</span></h1><p>Your first recorded answer earns today&apos;s score. Later answers are clearly marked as practice.</p></div></div>
    <div className="tabs" role="tablist" aria-label="Daily challenge game">{games.map((item) => <button key={item} type="button" className={game === item ? "selected" : ""} role="tab" aria-selected={game === item} disabled={pending} onClick={() => setGame(item)}>{gameLabel(item)}</button>)}</div>
    {loading && <section className="content-panel"><p role="status">Finding today&apos;s {gameLabel(game)} challenge…</p></section>}
    {error && <section className="content-panel"><p className="error-message" role="alert">{error}</p><button className="button secondary" type="button" onClick={() => load()}>Try again</button></section>}
    {!loading && view.mode === "empty" && <section className="content-panel training-empty"><p className="eyebrow">NO PUZZLE TODAY</p><h2>No {gameLabel(game)} Daily is live yet.</h2><p>Try another game or work through a scored scenario while the next challenge is prepared.</p><Link className="button primary" href="/training/scenarios">Go to scenarios →</Link></section>}
    {!loading && !error && view.mode !== "empty" && prompt && <section className="content-panel scenario-card">
      <div className="scenario-meta"><span className="pill">{gameLabel(game)}</span><span>Daily challenge</span></div><h2>{prompt.title}</h2>
      {state.heroHand && <p className="scenario-hand"><strong>Your hand</strong> {state.heroHand}</p>}{state.board?.length ? <p className="scenario-hand"><strong>Board</strong> {state.board.join(" ")}</p> : null}
      <p className="scenario-prompt">{state.prompt ?? "Read the situation and choose the action with the best expected value."}</p>
      {view.mode === "ready" && <div className="scenario-actions" role="group" aria-label="Choose your Daily action">{actions.map((action) => <button key={action.type} className="button primary" type="button" disabled={pending} onClick={() => choose(action)}>{pending ? "Recording…" : actionLabel(action)}</button>)}</div>}
      {view.mode === "ready" && !actions.length && <p className="error-message" role="alert">This Daily has no available actions. Try a scenario instead.</p>}
      {view.feedback && <section className="training-feedback" aria-live="polite"><p className="eyebrow">DAILY RESULT</p><h3>{view.feedback.headline}</h3><div className="feedback-stats"><span><small>SCORE</small><b>{view.feedback.score}/100</b></span><span><small>EV LOSS</small><b>{view.feedback.evLossBb.toFixed(2)} BB</b></span><span><small>REFERENCE</small><b>{view.feedback.bestAction}</b></span></div><p>{view.feedback.explanation}</p>{view.feedback.assumptions.length > 0 && <p className="quiet">Assumptions: {view.feedback.assumptions.join(" · ")}</p>}<button className="button secondary" type="button" onClick={practiceAgain}>Practice another action →</button></section>}
    </section>}
  </>;
}
