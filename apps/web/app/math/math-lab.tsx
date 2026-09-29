"use client";
import { useState } from "react";
import Link from "next/link";
type EqResult = {
  equity: number;
  winProbability: number;
  tieProbability: number;
  samples: number;
  standardError: number | null;
};
type BjResult = {
  playerTotal: number;
  soft: boolean;
  bestAction: string;
  bestEvUnits: number;
  actionValues: { action: string; evUnits: number }[];
};
async function calculate<T>(payload: unknown): Promise<T> {
  const response = await fetch("/api/math/calculate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000),
  });
  const body = await response.json();
  if (!response.ok)
    throw new Error(
      body.message || "Calculation failed. Check the inputs and try again.",
    );
  return body.data.result as T;
}
const splitCards = (s: string) =>
  s
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean);
const percent = (n: number) => (n * 100).toFixed(1) + "%";
function NumericField({
  label,
  value,
  set,
  min = 0,
  max = 100000,
  step = 1,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="field">
      {label}
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => set(e.target.value)}
      />
    </label>
  );
}
export function MathLab() {
  const [tab, setTab] = useState("Poker"),
    [pot, setPot] = useState("75"),
    [call, setCall] = useState("25"),
    [equity, setEquity] = useState("30"),
    [outs, setOuts] = useState("9"),
    [bet, setBet] = useState("10"),
    [bluffPot, setBluffPot] = useState("20"),
    [folds, setFolds] = useState("40");
  const [hero, setHero] = useState("As Qs"),
    [villain, setVillain] = useState("Kh Kd"),
    [board, setBoard] = useState("Js 7s 2d"),
    [eqResult, setEqResult] = useState<EqResult | null>(null),
    [eqBusy, setEqBusy] = useState(false),
    [eqError, setEqError] = useState("");
  const [player, setPlayer] = useState("Ts 6d"),
    [upcard, setUpcard] = useState("Th"),
    [h17, setH17] = useState(false),
    [surrender, setSurrender] = useState(true),
    [bjResult, setBjResult] = useState<BjResult | null>(null),
    [bjBusy, setBjBusy] = useState(false),
    [bjError, setBjError] = useState("");
  const [stake, setStake] = useState("10"),
    [rounds, setRounds] = useState("200"),
    [edge, setEdge] = useState("0.5");
  const valid = (values: string[], max = 100000) =>
    values.every(
      (v) =>
        v.trim() !== "" &&
        Number.isFinite(Number(v)) &&
        Number(v) >= 0 &&
        Number(v) <= max,
    );
  const oddsValid =
      valid([pot, call]) && Number(call) > 0 && valid([equity], 100),
    q = Number(equity) / 100,
    P = Number(pot),
    C = Number(call),
    callEv = q * (P + C) - C;
  const outsValid = valid([outs], 20) && Number.isInteger(Number(outs)),
    o = Number(outs),
    bluffValid =
      valid([bet, bluffPot]) && Number(bet) > 0 && valid([folds], 100);
  async function runEquity() {
    setEqBusy(true);
    setEqError("");
    setEqResult(null);
    try {
      const b = splitCards(board);
      if (![0, 3, 4, 5].includes(b.length))
        throw new Error(
          "Use an empty board, 3 flop cards, 4 turn cards or 5 river cards.",
        );
      if (splitCards(hero).length !== 2 || splitCards(villain).length !== 2)
        throw new Error("Each player needs exactly two cards.");
      const r = await calculate<EqResult>({
        game: "poker",
        calculation: "equity",
        heroCards: splitCards(hero),
        villainCards: splitCards(villain),
        board: b,
        method: b.length === 5 ? "exact" : "monte-carlo",
        samples: 3000,
        seed: 42,
      });
      setEqResult(r);
    } catch (e) {
      setEqError(
        e instanceof Error ? e.message : "Unable to calculate equity.",
      );
    } finally {
      setEqBusy(false);
    }
  }
  async function runBlackjack() {
    setBjBusy(true);
    setBjError("");
    setBjResult(null);
    try {
      if (splitCards(player).length !== 2)
        throw new Error("Enter exactly two initial player cards.");
      setBjResult(
        await calculate<BjResult>({
          game: "blackjack",
          calculation: "hand-ev",
          playerCards: splitCards(player),
          dealerUpcard: upcard.trim(),
          ruleset: {
            dealerHitsSoft17: h17,
            surrender: surrender ? "late" : "none",
            id: h17 ? "lab-h17" : "lab-s17",
            version: "1",
          },
        }),
      );
    } catch (e) {
      setBjError(
        e instanceof Error ? e.message : "Unable to calculate this hand.",
      );
    } finally {
      setBjBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE MATH LAB</p>
          <h1>
            Change an input.
            <br />
            <span>Understand the difference.</span>
          </h1>
          <p>
            Work through the numbers behind poker decisions and blackjack
            expectations.
          </p>
        </div>
        <Link href="/learn" className="button secondary">
          Read the theory ↗
        </Link>
      </div>
      <div className="tabs" aria-label="Math calculator category">
        {["Poker", "Blackjack", "Risk & expectation"].map((t) => (
          <button
            key={t}
            className={tab === t ? "selected" : ""}
            aria-pressed={tab === t}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Poker" && (
        <div className="math-grid">
          <section className="content-panel">
            <p className="eyebrow">01 / POT ODDS & CALL EV</p>
            <h2>Is the price right?</h2>
            <div className="form-grid">
              <NumericField
                label="Pot before your call (BB)"
                value={pot}
                set={setPot}
                step={0.5}
              />
              <NumericField
                label="Additional call (BB)"
                value={call}
                set={setCall}
                min={0.5}
                step={0.5}
              />
            </div>
            <NumericField
              label="Assumed equity (%)"
              value={equity}
              set={setEquity}
              max={100}
              step={0.1}
            />
            {oddsValid ? (
              <div aria-live="polite">
                <div className="result-number">{percent(C / (P + C))}</div>
                <span className="result-label">
                  Equity required to break even
                </span>
                <div className="formula">
                  Call EV = {q.toFixed(3)} × {P + C} − {C} ={" "}
                  {callEv >= 0 ? "+" : ""}
                  {callEv.toFixed(2)} BB
                </div>
                <p>
                  {callEv > 0
                    ? "Calling is profitable under these assumptions."
                    : callEv < 0
                      ? "Folding has higher EV under these assumptions."
                      : "Calling and folding have the same EV in this model."}
                </p>
              </div>
            ) : (
              <p className="error-message">
                Enter a nonnegative pot, a positive call and equity from 0 to
                100%.
              </p>
            )}
            <p className="quiet">
              Pot includes the opponent’s bet. No further betting or rake.
              Equity is your assumption, not inferred from cards.
            </p>
            <Link className="text-link" href="/learn/pot-odds">
              Learn pot odds ↗
            </Link>
          </section>
          <section className="content-panel">
            <p className="eyebrow">02 / HEADS-UP EQUITY</p>
            <h2>Put two hands to the test.</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void runEquity();
              }}
            >
              <fieldset
                disabled={eqBusy}
                style={{ border: 0, padding: 0, margin: 0 }}
              >
                <div className="form-grid">
                  <label className="field">
                    Your cards
                    <input
                      value={hero}
                      onChange={(e) => {
                        setHero(e.target.value);
                        setEqResult(null);
                      }}
                      placeholder="As Qs"
                      required
                      maxLength={12}
                    />
                  </label>
                  <label className="field">
                    Opponent’s cards
                    <input
                      value={villain}
                      onChange={(e) => {
                        setVillain(e.target.value);
                        setEqResult(null);
                      }}
                      placeholder="Kh Kd"
                      required
                      maxLength={12}
                    />
                  </label>
                </div>
                <label className="field">
                  Board cards
                  <input
                    value={board}
                    onChange={(e) => {
                      setBoard(e.target.value);
                      setEqResult(null);
                    }}
                    placeholder="Js 7s 2d"
                    maxLength={25}
                  />
                  <small>
                    A K Q J T 9…2 · s = spades, h = hearts, d = diamonds, c =
                    clubs
                  </small>
                </label>
                <button
                  className="button primary"
                  style={{ marginTop: 20 }}
                  type="submit"
                >
                  {eqBusy ? "Calculating…" : "Calculate equity →"}
                </button>
              </fieldset>
            </form>
            {eqError && (
              <p className="error-message" role="alert">
                {eqError}
              </p>
            )}
            {eqResult && (
              <div aria-live="polite">
                <div className="result-number">{percent(eqResult.equity)}</div>
                <p>Hero’s equity, including half of tied pots.</p>
                <p className="quiet">
                  {eqResult.standardError === null
                    ? "Exact enumeration"
                    : `Monte Carlo · ${eqResult.samples.toLocaleString()} samples · standard error ${(100 * (eqResult.standardError ?? 0)).toFixed(2)} percentage points · fixed seed 42`}
                </p>
              </div>
            )}
            <p className="quiet">
              A showdown calculation against one specified hand. No betting
              strategy, range inference or rake is included.
            </p>
          </section>
          <section className="content-panel">
            <p className="eyebrow">03 / CLEAN OUTS</p>
            <h2>One card or two?</h2>
            <div className="form-grid">
              <NumericField
                label="Number of clean outs"
                value={outs}
                set={setOuts}
                max={20}
              />
            </div>
            {outsValid ? (
              <>
                <dl className="fact-list">
                  <dt>Turn → river</dt>
                  <dd>{percent(o / 46)}</dd>
                  <dt>Flop → river</dt>
                  <dd>{percent(1 - (((47 - o) / 47) * (46 - o)) / 46)}</dd>
                </dl>
                <div className="formula">
                  1 − ({47 - o}/47 × {46 - o}/46)
                </div>
              </>
            ) : (
              <p className="error-message">Use a whole number from 0 to 20.</p>
            )}
            <p>
              Assumes only your cards and board are known. These are hit
              probabilities, not full showdown equity. Two-card odds require
              seeing both cards.
            </p>
            <Link className="text-link" href="/learn/equity-outs">
              Understand outs ↗
            </Link>
          </section>
          <section className="content-panel">
            <p className="eyebrow">04 / PURE BLUFF</p>
            <h2>How often must they fold?</h2>
            <div className="form-grid">
              <NumericField
                label="Pot before bet (BB)"
                value={bluffPot}
                set={setBluffPot}
              />
              <NumericField
                label="Your bet (BB)"
                value={bet}
                set={setBet}
                min={1}
              />
            </div>
            <NumericField
              label="Assumed fold frequency (%)"
              value={folds}
              set={setFolds}
              max={100}
            />
            {bluffValid ? (
              <>
                <div className="result-number">
                  {percent(Number(bet) / (Number(bluffPot) + Number(bet)))}
                </div>
                <span className="result-label">Break-even fold frequency</span>
                <div className="formula">
                  Bluff EV ={" "}
                  {(
                    (Number(folds) / 100) * Number(bluffPot) -
                    (1 - Number(folds) / 100) * Number(bet)
                  ).toFixed(2)}{" "}
                  BB
                </div>
              </>
            ) : (
              <p className="error-message">
                Enter a positive bet and a fold frequency from 0 to 100%.
              </p>
            )}
            <p>
              Zero equity when called; no raises or rake. The fold rate is an
              assumption you provide.
            </p>
          </section>
        </div>
      )}
      {tab === "Blackjack" && (
        <div className="math-grid">
          <section className="content-panel">
            <p className="eyebrow">BLACKJACK / ACTION COMPARISON</p>
            <h2>Compare the expected returns.</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void runBlackjack();
              }}
            >
              <fieldset
                disabled={bjBusy}
                style={{ border: 0, padding: 0, margin: 0 }}
              >
                <div className="form-grid">
                  <label className="field">
                    Player cards
                    <input
                      value={player}
                      onChange={(e) => {
                        setPlayer(e.target.value);
                        setBjResult(null);
                      }}
                      placeholder="Ts 6d"
                      required
                      maxLength={12}
                    />
                  </label>
                  <label className="field">
                    Dealer upcard
                    <input
                      value={upcard}
                      onChange={(e) => {
                        setUpcard(e.target.value);
                        setBjResult(null);
                      }}
                      placeholder="Th"
                      required
                      maxLength={3}
                    />
                  </label>
                </div>
                <p className="quiet">
                  Use card notation such as As, 8d, Th. Use distinct visible
                  cards for this calculator.
                </p>
                <div className="inline-options">
                  <label>
                    <input
                      type="checkbox"
                      checked={h17}
                      onChange={(e) => {
                        setH17(e.target.checked);
                        setBjResult(null);
                      }}
                    />{" "}
                    Dealer hits soft 17
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={surrender}
                      onChange={(e) => {
                        setSurrender(e.target.checked);
                        setBjResult(null);
                      }}
                    />{" "}
                    Late surrender
                  </label>
                </div>
                <button type="submit" className="button primary">
                  {bjBusy ? "Calculating…" : "Compare actions →"}
                </button>
              </fieldset>
            </form>
            {bjError && (
              <p className="error-message" role="alert">
                {bjError}
              </p>
            )}
            {bjResult && (
              <div aria-live="polite">
                <p style={{ marginTop: 20 }}>
                  Your hand: {bjResult.soft ? "soft" : "hard"}{" "}
                  {bjResult.playerTotal}
                </p>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ACTION</th>
                      <th>EV / ORIGINAL STAKE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bjResult.actionValues.map((a) => (
                      <tr
                        className={
                          a.action === bjResult.bestAction ? "best" : ""
                        }
                        key={a.action}
                      >
                        <td>
                          {a.action}
                          {a.action === bjResult.bestAction ? " ✓" : ""}
                        </td>
                        <td>
                          {a.evUnits >= 0 ? "+" : ""}
                          {a.evUnits.toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p>
                  {bjResult.actionValues.length
                    ? `Highest modeled return: ${bjResult.bestAction}.`
                    : "Natural blackjack: no player decision is required."}
                </p>
              </div>
            )}
          </section>
          <section className="content-panel">
            <p className="eyebrow">READ THE MODEL</p>
            <h2>The assumptions are part of the answer.</h2>
            <p>
              This uses the existing Pokerlingo infinite-deck
              dynamic-programming engine. Card removal and deck composition are
              ignored, so this is not a finite six-deck solver.
            </p>
            <p>
              Values include the possibility of dealer blackjack before the
              peek. The playing table’s coach makes its decision after a
              negative peek. Compare values using the same timing convention.
            </p>
            <p>
              Blackjack pays 3:2. Doubling after split is allowed; at most two
              hands, no resplits, one card to split aces. The engine assumes
              optimal hit/stand continuation. EV is net profit per original
              stake.
            </p>
            <p>
              All actions can have negative EV. The highest return can simply be
              the smallest expected loss.
            </p>
            <Link
              className="text-link"
              href="https://wizardofodds.com/games/blackjack/expected-return-infinite-deck/"
              target="_blank"
              rel="noreferrer"
            >
              Read an independent infinite-deck reference ↗
            </Link>
            <p className="quiet">
              Its splitting rules differ; do not compare split EV figures as if
              the models were identical.
            </p>
          </section>
        </div>
      )}
      {tab === "Risk & expectation" && (
        <div className="math-grid">
          <section className="content-panel">
            <p className="eyebrow">EXPECTED LOSS / ILLUSTRATIVE MODEL</p>
            <h2>Small edges accumulate.</h2>
            <div className="form-grid">
              <NumericField
                label="Original stake per round"
                value={stake}
                set={setStake}
                min={1}
              />
              <NumericField
                label="Number of rounds"
                value={rounds}
                set={setRounds}
                min={1}
              />
            </div>
            <NumericField
              label="Assumed house edge (%)"
              value={edge}
              set={setEdge}
              max={100}
              step={0.1}
            />
            {valid([stake, rounds]) &&
            Number(stake) > 0 &&
            Number(rounds) > 0 &&
            Number.isInteger(Number(rounds)) &&
            valid([edge], 100) ? (
              <>
                <div className="result-number">
                  {(
                    (Number(stake) * Number(rounds) * Number(edge)) /
                    100
                  ).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <span className="result-label">Units of expected loss</span>
                <div className="formula">
                  {stake} × {rounds} × {Number(edge) / 100}
                </div>
              </>
            ) : (
              <p className="error-message">
                Use a positive stake, a positive whole number of rounds and an
                edge from 0 to 100%.
              </p>
            )}
            <p>
              The edge is supplied by you. This does not calculate the house
              edge of the training table, predict a session outcome or estimate
              ruin probability.
            </p>
          </section>
          <section className="content-panel">
            <p className="eyebrow">PAYOUT / SAME HAND, DIFFERENT RULE</p>
            <h2>3:2 versus 6:5.</h2>
            <div className="formula">10-unit natural: +15 vs +12</div>
            <p>
              A 6:5 table pays 3 fewer units for each paying natural on a
              10-unit original bet. A returned stake is separate from profit.
            </p>
            <h3 style={{ marginTop: 25 }}>Expectation is not certainty.</h3>
            <p>
              Variance describes the spread of outcomes around the mean. Even a
              correctly calculated expectation cannot tell you what will happen
              in one session.
            </p>
            <Link className="text-link" href="/learn/variance-rake">
              Read about variance and rake ↗
            </Link>
          </section>
        </div>
      )}
    </>
  );
}
