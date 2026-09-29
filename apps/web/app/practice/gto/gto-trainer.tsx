"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import type { PushFoldSolution } from "@pokerlingo/math/push-fold";
type Solved = {
  solution: PushFoldSolution;
  hands: string[];
  prior: number[];
  samples: number;
};
const ranks = [..."AKQJT98765432"];
export function GtoTrainer() {
  const [stack, setStack] = useState(10),
    [seat, setSeat] = useState<"sb" | "bb">("sb"),
    [selected, setSelected] = useState("AA"),
    [solved, setSolved] = useState<Solved | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [status, setStatus] = useState(""),
    [ready, setReady] = useState(false);
  const worker = useRef<Worker | null>(null),
    id = useRef(0);
  useEffect(() => {
    const w = new Worker(new URL("./solver.worker.ts", import.meta.url));
    worker.current = w;
    setReady(true);
    w.onmessage = ({ data }) => {
      if (data.id !== id.current) return;
      if (data.error) {
        setError(data.error);
        setBusy(false);
      } else if (data.progress)
        setStatus(
          `${data.progress.iteration.toLocaleString()} iterations · gap ${data.progress.gap.toFixed(5)} BB`,
        );
      else {
        setSolved(data);
        setBusy(false);
      }
    };
    w.onerror = () => {
      setError("Unable to run the solver. Reload the page to retry.");
      setBusy(false);
      setReady(false);
    };
    return () => w.terminate();
  }, []);
  function solve() {
    if (!worker.current) return;
    setBusy(true);
    setError("");
    setSolved(null);
    setStatus("Building the equilibrium…");
    worker.current.postMessage({ id: ++id.current, stack });
  }
  const s = solved?.solution,
    freq = seat === "sb" ? s?.shove : s?.call,
    ev = seat === "sb" ? s?.shoveEv : s?.callEv,
    index = solved?.hands.indexOf(selected) ?? -1;
  const coverage =
    solved && freq
      ? freq.reduce((sum, f, i) => sum + f * solved.prior[i]!, 0)
      : 0;
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">GTO LAB / HEADS-UP HOLD’EM</p>
          <h1>
            Study a strategy.
            <br />
            <span>See its assumptions.</span>
          </h1>
          <p>
            A 169-hand push/fold equilibrium, calculated for your chosen
            effective stack.
          </p>
        </div>
        <Link className="button secondary" href="/learn/push-fold-gto">
          How to read this table ↗
        </Link>
      </div>
      <section className="content-panel">
        <div className="form-grid">
          <label className="field">
            Effective stack (including blinds)
            <select
              disabled={busy}
              value={stack}
              onChange={(e) => {
                setStack(Number(e.target.value));
                setSolved(null);
              }}
            >
              {[2, 3, 5, 8, 10, 12, 15, 20].map((n) => (
                <option key={n} value={n}>
                  {n} BB
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Player
            <select
              value={seat}
              onChange={(e) => setSeat(e.target.value as "sb" | "bb")}
            >
              <option value="sb">Small blind: shove or fold</option>
              <option value="bb">Big blind: call shove or fold</option>
            </select>
          </label>
        </div>
        <p>
          Heads-up · blinds 0.5 / 1 BB · no ante · no rake · chip EV. Small
          blind can only shove or fold; big blind can call or fold. Stack is the
          amount each player had before posting blinds.
        </p>
        <button
          className="button primary"
          disabled={!ready || busy}
          onClick={solve}
        >
          {busy ? "Solving…" : "Calculate equilibrium →"}
        </button>
        {busy && <p role="status">{status}</p>}
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
      </section>
      {solved && s && freq && ev && (
        <>
          <div className="solver-metrics">
            <div>
              <small>STACK</small>
              <strong>{s.stack} BB</strong>
            </div>
            <div>
              <small>{seat === "sb" ? "SHOVE" : "CALL"} COMBO COVERAGE</small>
              <strong>{(coverage * 100).toFixed(1)}%</strong>
            </div>
            <div>
              <small>BEST-RESPONSE GAP</small>
              <strong>{s.nashConv.toFixed(5)} BB</strong>
            </div>
            <div>
              <small>ITERATIONS</small>
              <strong>{s.iterations.toLocaleString()}</strong>
            </div>
          </div>
          <div className="gto-layout">
            <section className="content-panel">
              <h2>
                {seat === "sb"
                  ? "Small blind shove frequencies"
                  : "Big blind call frequencies"}
              </h2>
              <p>
                Click any hand. Color shows the frequency of{" "}
                {seat === "sb" ? "shoving" : "calling"}; the remainder is
                folding. Suited hands sit above the diagonal, offsuit below it.
              </p>
              <div className="gto-scroll">
                <div
                  className="gto-grid"
                  role="group"
                  aria-label="169 starting-hand strategy table"
                >
                  {ranks.flatMap((r, row) =>
                    ranks.map((c, col) => {
                      const hand =
                          row === col
                            ? r + c
                            : row < col
                              ? r + c + "s"
                              : c + r + "o",
                        i = solved.hands.indexOf(hand),
                        f = freq[i] ?? 0;
                      return (
                        <button
                          key={hand}
                          className={`gto-cell ${selected === hand ? "chosen" : ""}`}
                          aria-pressed={selected === hand}
                          aria-label={`${hand}, ${seat === "sb" ? "shove" : "call"} ${(100 * f).toFixed(1)} percent`}
                          style={
                            { "--frequency": `${100 * f}%` } as CSSProperties
                          }
                          onClick={() => setSelected(hand)}
                        >
                          <strong>{hand}</strong>
                          <small>{(100 * f).toFixed(0)}%</small>
                        </button>
                      );
                    }),
                  )}
                </div>
              </div>
              <p className="quiet">
                Coverage weights the 1,326 physical combinations: 6 per pair, 4
                per suited class and 12 per offsuit class. It is not a
                percentage of the 169 squares.
              </p>
            </section>
            <aside className="coach-panel">
              <section className="coach-card">
                <p className="eyebrow">SELECTED HAND</p>
                <h2>{selected}</h2>
                <dl className="fact-list">
                  <dt>{seat === "sb" ? "Shove" : "Call"} frequency</dt>
                  <dd>{((freq[index] ?? 0) * 100).toFixed(2)}%</dd>
                  <dt>Fold frequency</dt>
                  <dd>{((1 - (freq[index] ?? 0)) * 100).toFixed(2)}%</dd>
                  <dt>{seat === "sb" ? "Shove" : "Call"} EV vs fold</dt>
                  <dd>{(ev[index] ?? 0).toFixed(4)} BB</dd>
                  <dt>Fold (decision baseline)</dt>
                  <dd>0 BB</dd>
                </dl>
                <p>
                  {Math.abs(ev[index] ?? 0) < 0.01
                    ? "The actions are close in value under this model. A mixed frequency is not a promise of precision beyond the equity inputs."
                    : (ev[index] ?? 0) > 0
                      ? "Continuing has higher EV than folding against the calculated opposing strategy."
                      : "Folding has higher EV against the calculated opposing strategy."}
                </p>
                <p>
                  A frequency of 30% means use that action about three times in
                  ten over many instances of this hand; it is not a 30% chance
                  of winning.
                </p>
              </section>
              <section className="coach-card">
                <p className="eyebrow">CONVERGENCE CHECK</p>
                <h3>
                  {s.converged
                    ? "Numerical target reached."
                    : "Approximation: target not reached."}
                </h3>
                <p>
                  Small blind best-response gain: {s.sbGain.toFixed(5)} BB. Big
                  blind gain: {s.bbGain.toFixed(5)} BB. Their sum is the
                  displayed gap, averaged over dealt hands.
                </p>
                <p>
                  This measures how much either player can improve by deviating
                  while the opponent stays fixed, within this payoff model. It
                  does not bound each individual hand’s EV error.
                </p>
              </section>
            </aside>
          </div>
        </>
      )}
      <section className="content-panel" style={{ marginTop: 24 }}>
        <p className="eyebrow">WHAT THIS SOLVES</p>
        <h2>GTO for the stated push/fold game.</h2>
        <p>
          The solver uses exact card-removal probabilities between starting-hand
          classes, regret matching and an explicit best-response audit. It does
          not include limps, smaller raises, postflop betting or tournament
          payout effects. At deeper stacks those missing actions matter, so this
          is not a complete no-limit Hold’em strategy.
        </p>
        <p>
          All-in equities come from{" "}
          <a
            className="text-link"
            href="https://holdemmath.com/"
            target="_blank"
            rel="noreferrer"
          >
            HoldemMath
          </a>{" "}
          (20,000 Monte Carlo runouts per matchup,{" "}
          <a
            className="text-link"
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noreferrer"
          >
            CC BY 4.0
          </a>
          ). We normalize rounded probabilities and enforce symmetry. Typical
          individual-matchup sampling uncertainty can be about ±0.7 percentage
          points; the solver’s small numerical gap does not remove that
          uncertainty.
        </p>
        <p>
          <a
            className="text-link"
            href="https://github.com/Julian-cloud-max/holdemmath-data"
            target="_blank"
            rel="noreferrer"
          >
            Dataset and attribution ↗
          </a>{" "}
          ·{" "}
          <a
            className="text-link"
            href="https://www.holdemresources.net/hune"
            target="_blank"
            rel="noreferrer"
          >
            Independent push/fold reference ↗
          </a>
        </p>
      </section>
    </>
  );
}
