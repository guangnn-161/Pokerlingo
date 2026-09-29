"use client";
import { useState } from "react";
import { trueCount } from "@/lib/card-counting";
export function CountChallenge({
  running,
  unseen,
  onCheck,
}: {
  running: number;
  unseen: number;
  onCheck?: (correct: boolean) => void;
}) {
  const [rc, setRc] = useState(""),
    [tc, setTc] = useState(""),
    [checked, setChecked] = useState(false);
  const exact = trueCount(running, unseen);
  const valid =
    rc.trim() !== "" &&
    Number.isInteger(Number(rc)) &&
    (exact === null || (tc.trim() !== "" && Number.isFinite(Number(tc))));
  const rcCorrect = Number(rc) === running,
    tcCorrect =
      exact === null || Math.abs(Number(tc) - Number(exact.toFixed(1))) < 0.051;
  return (
    <div className="count-challenge">
      <p>
        Unseen cards: {unseen} · about {(unseen / 52).toFixed(2)} decks. Divide
        unseen cards by 52 first, then divide your running count by that value.
        Round your true count to one decimal.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid || checked) return;
          setChecked(true);
          onCheck?.(rcCorrect && tcCorrect);
        }}
      >
        <div className="form-grid">
          <label className="field">
            Your running count
            <input
              aria-label="Your running count"
              type="number"
              step="1"
              required
              disabled={checked}
              value={rc}
              onChange={(e) => setRc(e.target.value)}
            />
          </label>
          {exact !== null && (
            <label className="field">
              Your true count
              <input
                aria-label="Your true count"
                type="number"
                step="0.1"
                required
                disabled={checked}
                value={tc}
                onChange={(e) => setTc(e.target.value)}
              />
            </label>
          )}
        </div>
        <button
          className="button primary"
          disabled={!valid || checked}
          type="submit"
        >
          Check my count
        </button>
      </form>
      {checked && (
        <div className="count-feedback" role="status">
          <strong>
            {rcCorrect && tcCorrect
              ? "Both counts correct."
              : "Let’s reconcile the count."}
          </strong>
          <p>
            Running count: {running > 0 ? "+" : ""}
            {running}.{" "}
            {exact === null
              ? "Shoe complete; true count is undefined with no cards left."
              : `True count: ${running} ÷ ${(unseen / 52).toFixed(4)} = ${exact.toFixed(1)}.`}
          </p>
          <p>
            {rcCorrect ? "Running count ✓" : "Running count needs correction."}{" "}
            {exact !== null &&
              (tcCorrect
                ? "True count ✓"
                : "Check the sign and divide by decks, not cards.")}
          </p>
          <small>Continue dealing to try a new checkpoint.</small>
        </div>
      )}
    </div>
  );
}
