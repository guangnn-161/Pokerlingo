"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ProgressSummary } from "@pokerlingo/contracts/learning";
import { getProgress, TrainingApiError } from "@/lib/training-client";
import { questLabel, questProgress } from "@/lib/training-state";

export function TrainingDashboard() {
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getProgress().then(setProgress).catch((cause: unknown) => {
      if (cause instanceof TrainingApiError && cause.status === 401) window.location.assign("/login");
      else setError("Your progress could not be loaded. Please refresh and try again.");
    });
  }, []);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR LEARNING HUB</p>
          <h1>Build a habit. <span>See the decision.</span></h1>
          <p>Short, scored decisions for poker and blackjack. The result explains the model after you commit.</p>
        </div>
        <Link className="button secondary" href="/training/progress">View progress ↗</Link>
      </div>
      {error && <p className="error-message" role="alert">{error}</p>}
      <section className="training-metrics" aria-label="Learning progress">
        <div><small>LEVEL</small><strong>{progress?.level ?? "—"}</strong></div>
        <div><small>XP</small><strong>{progress?.xp ?? "—"}</strong></div>
        <div><small>MASTERY</small><strong>{progress ? `${progress.mastery}%` : "—"}</strong></div>
        <div><small>EV LOSS / SPOT</small><strong>{progress ? `${progress.averageEvLossBb.toFixed(2)} BB` : "—"}</strong></div>
      </section>
      <section className="training-action-grid" aria-label="Training choices">
        <Link href="/training/daily" className="training-action-card daily-action">
          <span className="pill">DAILY</span><h2>One deliberate decision.</h2>
          <p>A fresh prompt, scored on your first answer. Repeat attempts stay available as practice.</p><strong>Open today&apos;s challenge →</strong>
        </Link>
        <Link href="/training/scenarios" className="training-action-card">
          <span className="pill">SCENARIOS</span><h2>Train a specific spot.</h2>
          <p>Choose a game, take a position, then compare the EV of your action with the reference model.</p><strong>Browse scenarios →</strong>
        </Link>
      </section>
      <section className="content-panel training-quests">
        <div className="section-heading"><h2>Current quests</h2><Link className="text-link" href="/training/progress">All progress →</Link></div>
        {!progress && !error && <p role="status">Loading your quests…</p>}
        {progress?.quests.length === 0 && <p>No active quests yet. Complete a Daily or scenario to start your streak.</p>}
        {progress?.quests.map((quest) => (
          <article key={quest.id} className="quest-row">
            <div><strong>{questLabel(quest.cadence, quest.key)}</strong><small>{quest.progress} of {quest.target} completed</small></div>
            <div className="quest-meter" aria-label={`${questProgress(quest)} percent complete`}><span style={{ width: `${questProgress(quest)}%` }} /></div>
            <b>{quest.status === "completed" ? "Done" : `${questProgress(quest)}%`}</b>
          </article>
        ))}
      </section>
    </>
  );
}
