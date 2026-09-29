"use client";
import { useState } from "react";
import type { Lesson } from "@/lib/lessons";
export function LessonQuiz({ quiz }: { quiz: Lesson["quiz"] }) {
  const [answer, setAnswer] = useState<number | null>(null);
  return (
    <section className="quiz">
      <p className="eyebrow">CHECK YOUR UNDERSTANDING</p>
      <h3>{quiz.question}</h3>
      {quiz.options.map((o, i) => (
        <button
          key={o}
          className={`button ${answer === i ? "primary" : "secondary"}`}
          aria-pressed={answer === i}
          onClick={() => setAnswer(i)}
        >
          {o}
        </button>
      ))}
      {answer !== null && (
        <p className="quiz-result" aria-live="polite">
          <strong>
            {answer === quiz.correct
              ? "Correct. "
              : "Try that reasoning again. "}
          </strong>
          {quiz.why}
        </p>
      )}
    </section>
  );
}
