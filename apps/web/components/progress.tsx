"use client";
import { useEffect, useState } from "react";
export type Progress = {
  poker: number;
  blackjack: number;
  correct: number;
  lessons: string[];
};
const empty: Progress = { poker: 0, blackjack: 0, correct: 0, lessons: [] },
  key = "pokerlingo-practice-v1";
export function readProgress(): Progress {
  try {
    const p = JSON.parse(localStorage.getItem(key) || "null");
    if (
      p &&
      [p.poker, p.blackjack, p.correct].every(
        (n) => Number.isSafeInteger(n) && n >= 0,
      ) &&
      Array.isArray(p.lessons)
    )
      return {
        ...p,
        lessons: p.lessons.filter((x: unknown) => typeof x === "string"),
      };
  } catch {}
  return { ...empty, lessons: [] };
}
export function recordDecision(game: "poker" | "blackjack", correct: boolean) {
  try {
    const p = readProgress();
    p[game]++;
    p.correct += Number(correct);
    localStorage.setItem(key, JSON.stringify(p));
    window.dispatchEvent(new Event("practice-progress"));
  } catch {}
}
export function LessonComplete({ id }: { id: string }) {
  const [done, setDone] = useState(false);
  useEffect(() => setDone(readProgress().lessons.includes(id)), [id]);
  return (
    <button
      className={done ? "button secondary" : "button primary"}
      onClick={() => {
        const p = readProgress();
        if (!p.lessons.includes(id)) p.lessons.push(id);
        try {
          localStorage.setItem(key, JSON.stringify(p));
        } catch {}
        setDone(true);
      }}
    >
      {done ? "✓ Lesson completed" : "Mark as learned ✓"}
    </button>
  );
}
export function ProgressStrip() {
  const [p, setP] = useState(empty);
  useEffect(() => {
    const refresh = () => setP(readProgress());
    refresh();
    window.addEventListener("practice-progress", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("practice-progress", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  const total = p.poker + p.blackjack;
  return (
    <div className="progress-strip">
      <div>
        <span className="metric-icon">◎</span>
        <span>
          <strong>{total}</strong>
          <small>Decisions practiced</small>
        </span>
      </div>
      <div>
        <span className="metric-icon">↗</span>
        <span>
          <strong>
            {total ? Math.round((100 * p.correct) / total) + "%" : "—"}
          </strong>
          <small>Decision accuracy</small>
        </span>
      </div>
      <div>
        <span className="metric-icon">▤</span>
        <span>
          <strong>{p.lessons.length}</strong>
          <small>Lessons completed</small>
        </span>
      </div>
      <p>
        Your practice, your pace.
        <br />
        <span>Saved in this browser.</span>
      </p>
    </div>
  );
}
