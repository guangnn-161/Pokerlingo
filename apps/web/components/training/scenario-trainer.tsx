"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GameKey } from "@pokerlingo/contracts/game";
import type { AttemptResult, LearningAction, LearningPrompt } from "@pokerlingo/contracts/learning";
import { getScenarios, submitScenario, TrainingApiError } from "@/lib/training-client";
import { actionLabel, gameLabel, promptActions, scenarioViewState } from "@/lib/training-state";

type PromptState = { prompt?: string; heroHand?: string; board?: string[]; actions?: unknown };
function promptState(value: unknown): PromptState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  return {
    prompt: typeof source.prompt === "string" ? source.prompt : undefined,
    heroHand: typeof source.heroHand === "string" ? source.heroHand : undefined,
    board: Array.isArray(source.board) ? source.board.filter((card): card is string => typeof card === "string") : undefined,
    actions: source.actions
  };
}

const availableGames: GameKey[] = ["nlhe", "blackjack"];

export function ScenarioTrainer() {
  const [game, setGame] = useState<GameKey>("nlhe");
  const [scenarios, setScenarios] = useState<LearningPrompt[]>([]);
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  function load(nextGame = game) {
    const id = ++requestId.current;
    setLoading(true); setError(""); setResult(null); setIndex(0);
    getScenarios(nextGame).then((nextScenarios) => {
      if (id === requestId.current) setScenarios(nextScenarios);
    }).catch((cause: unknown) => {
      if (id !== requestId.current) return;
      if (cause instanceof TrainingApiError && cause.status === 401) window.location.assign("/login");
      else setError("Scenarios could not be loaded. Please try again.");
      setScenarios([]);
    }).finally(() => { if (id === requestId.current) setLoading(false); });
  }
  useEffect(() => { load(game); }, [game]); // eslint-disable-line react-hooks/exhaustive-deps

  const scenario = scenarios[index] ?? null;
  const state = useMemo(() => scenario ? promptState(scenario.promptState) : {}, [scenario]);
  const view = scenarioViewState({ pending, result });
  const actions: LearningAction[] = promptActions(state.actions);

  async function choose(action: LearningAction) {
    if (!scenario || view.actionsDisabled) return;
    setPending(true); setError("");
    try {
      setResult(await submitScenario({ revisionId: scenario.revisionId, action, submissionId: crypto.randomUUID() }));
    } catch (cause) {
      if (cause instanceof TrainingApiError && cause.status === 401) window.location.assign("/login");
      else setError(cause instanceof TrainingApiError && cause.code === "ACTION_NOT_SCORABLE" ? "That action is unavailable for this model. Choose another action." : "Your answer could not be recorded. Please try again.");
    } finally { setPending(false); }
  }
  function nextScenario() {
    setResult(null); setError("");
    if (scenarios.length > 1) setIndex((current) => (current + 1) % scenarios.length);
  }

  return <>
    <div className="page-heading"><div><p className="eyebrow">SCENARIO PRACTICE</p><h1>Choose the action. <span>Then read the model.</span></h1><p>Reference actions and EV remain hidden until your answer is safely recorded.</p></div></div>
    <div className="tabs" role="tablist" aria-label="Scenario game">
      {availableGames.map((item) => <button key={item} type="button" className={game === item ? "selected" : ""} role="tab" aria-selected={game === item} onClick={() => setGame(item)} disabled={pending}>{gameLabel(item)}</button>)}
    </div>
    {loading && <section className="content-panel"><p role="status">Loading {gameLabel(game)} scenarios…</p></section>}
    {error && <section className="content-panel"><p role="alert" className="error-message">{error}</p><button className="button secondary" type="button" onClick={() => load()}>Try again</button></section>}
    {!loading && !error && !scenario && <section className="content-panel training-empty"><h2>No live scenarios yet</h2><p>There is no published {gameLabel(game)} scenario right now. Try another game or return for the next release.</p></section>}
    {!loading && !error && scenario && <section className="content-panel scenario-card">
      <div className="scenario-meta"><span className="pill">{gameLabel(scenario.game)}</span><span>Difficulty {scenario.difficulty}/5</span><span>{scenario.tags.join(" · ")}</span></div>
      <h2>{scenario.title}</h2>
      {state.heroHand && <p className="scenario-hand"><strong>Your hand</strong> {state.heroHand}</p>}
      {state.board?.length ? <p className="scenario-hand"><strong>Board</strong> {state.board.join(" ")}</p> : null}
      <p className="scenario-prompt">{state.prompt ?? "Read the situation and choose the action with the best expected value."}</p>
      <div className="scenario-actions" role="group" aria-label="Choose your action">
        {actions.map((action) => <button key={`${action.type}:${action.size ?? ""}`} type="button" className="button primary" aria-pressed={false} disabled={view.actionsDisabled} onClick={() => choose(action)}>{pending ? "Recording…" : actionLabel(action)}</button>)}
      </div>
      {!actions.length && <p className="error-message" role="alert">This scenario has no available actions. Please choose another one.</p>}
      {view.feedback && <section className="training-feedback" aria-live="polite"><p className="eyebrow">RESULT</p><h3>{view.feedback.headline}</h3><div className="feedback-stats"><span><small>SCORE</small><b>{view.feedback.score}/100</b></span><span><small>EV LOSS</small><b>{view.feedback.evLossBb.toFixed(2)} BB</b></span><span><small>REFERENCE</small><b>{view.feedback.bestAction}</b></span></div><p>{view.feedback.explanation}</p>{view.feedback.assumptions.length > 0 && <p className="quiet">Assumptions: {view.feedback.assumptions.join(" · ")}</p>}<button className="button secondary" type="button" onClick={nextScenario}>Try another scenario →</button></section>}
    </section>}
  </>;
}
