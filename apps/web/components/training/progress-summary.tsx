"use client";

import { useEffect, useState } from "react";
import type { ProgressSummary as Progress } from "@pokerlingo/contracts/learning";
import { getProgress, TrainingApiError } from "@/lib/training-client";
import { questLabel, questProgress } from "@/lib/training-state";

export function ProgressSummary() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    getProgress().then(setProgress).catch((cause: unknown) => {
      if (cause instanceof TrainingApiError && cause.status === 401) window.location.assign("/login");
      else setError("Your progress could not be loaded. Please refresh and try again.");
    });
  }, []);
  return <>
    <div className="page-heading"><div><p className="eyebrow">LEARNING RECORD</p><h1>Progress that explains <span>what to train next.</span></h1><p>Scores are model-specific. Read each assumption before treating a result as a rule for another game.</p></div></div>
    {error && <p className="error-message" role="alert">{error}</p>}
    <section className="training-metrics" aria-label="Learning summary">
      <div><small>LEVEL</small><strong>{progress?.level ?? "—"}</strong></div><div><small>XP</small><strong>{progress?.xp ?? "—"}</strong></div><div><small>SPOTS PRACTICED</small><strong>{progress?.practiced ?? "—"}</strong></div><div><small>AVG EV LOSS</small><strong>{progress ? `${progress.averageEvLossBb.toFixed(2)} BB` : "—"}</strong></div>
    </section>
    <section className="content-panel training-quests"><h2>Quest history</h2>{!progress && !error && <p role="status">Loading your learning record…</p>}{progress?.quests.map((quest) => <article key={quest.id} className="quest-row"><div><strong>{questLabel(quest.cadence, quest.key)}</strong><small>{quest.periodStart ?? "Current period"}</small></div><div className="quest-meter"><span style={{ width: `${questProgress(quest)}%` }} /></div><b>{quest.status === "completed" ? "Done" : `${quest.progress}/${quest.target}`}</b></article>)}</section>
  </>;
}
