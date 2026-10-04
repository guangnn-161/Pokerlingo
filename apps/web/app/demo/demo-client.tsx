"use client";

import { useEffect, useState, type CSSProperties } from "react";
import styles from "./demo.module.css";

type Action = "fold" | "call" | "raise";
type ScenarioResponse = { data: { scenario: { id: string; title: string; heroHand: string; prompt: string; actions: Action[]; assumptions: string[] }; math: { requiredEquity: number; engineVersion: string } } };
type AttemptResult = { data: { selectedAction: Action; recommendedAction: Action; selectedEvBb: number; evLossBb: number; score: number; explanation: string; assumptions: string[]; demo: true } };
type DashboardResponse = { data: { xp: number; level: number; mastery: number; quests: { id: string; title: string; progress: number; target: number }[]; leaderboard: { rank: number; handle: string; score: number }[]; friends: { handle: string; status: string }[] } };
type PlayingCardProps = { value?: string; faceDown?: boolean; compact?: boolean };
type SeatProps = { name: string; position: string; stack: string; style: CSSProperties; active?: boolean; folded?: boolean };

const actionLabel: Record<Action, string> = { fold: "Fold", call: "Call 7.5bb", raise: "4-bet 23bb" };
const actionDetail: Record<Action, string> = {
  fold: "Protect the remaining 7.5bb, but give up a hand with useful blockers.",
  call: "Invest 7.5bb to play a 20.5bb pot against BB's stronger range.",
  raise: "Use A♠ Q♠ blockers and fold equity with a practical 4-bet size."
};
const reviewQuestions = [
  { id: "price", prompt: "How much more does Hero need to invest to call?", choices: ["5bb", "7.5bb", "10bb"], answer: "7.5bb", explanation: "Hero already invested 2.5bb. BB raised to a total of 10bb, so the remaining price is 7.5bb." },
  { id: "blocker", prompt: "Which value hands are partly blocked by A♠ Q♠?", choices: ["AA, AQ and AK", "22–66 only", "Suited connectors only"], answer: "AA, AQ and AK", explanation: "Holding an ace and a queen reduces some of BB's strongest value combinations. That matters when choosing a 4-bet candidate." }
];

function PlayingCard({ value, faceDown = false, compact = false }: PlayingCardProps) {
  const red = Boolean(value && /[♥♦]/.test(value));
  const size = compact ? { width: 34, height: 48, fontSize: 16 } : { width: 53, height: 75, fontSize: 25 };
  if (faceDown) return <span aria-label="Villain face-down card" style={{ ...size, display: "inline-grid", placeItems: "center", borderRadius: 7, border: "2px solid #f7e6b7", background: "repeating-linear-gradient(45deg, #8f2430, #8f2430 4px, #c64c59 4px, #c64c59 8px)", boxShadow: "0 2px 4px #0005" }}>♠</span>;
  return <span aria-label={`Card ${value}`} style={{ ...size, display: "inline-flex", alignItems: "flex-start", justifyContent: "center", paddingTop: compact ? 3 : 5, borderRadius: 7, border: "1px solid #d0d0d0", background: "#fffdf8", color: red ? "#c32631" : "#152238", boxShadow: "0 2px 4px #0004", fontWeight: 800 }}>{value}</span>;
}

function Seat({ name, position, stack, style, active, folded }: SeatProps) {
  return <div style={{ ...style, position: "absolute", transform: "translate(-50%, -50%)", minWidth: 100, textAlign: "center", opacity: folded ? 0.58 : 1 }}>
    <div aria-hidden="true" style={{ width: 32, height: 32, borderRadius: "50%", margin: "0 auto 3px", border: active ? "3px solid #57a5ff" : "2px solid #d8e8e0", background: active ? "#176bca" : "#496a72", boxShadow: active ? "0 0 0 4px #57a5ff55" : "0 2px 4px #0005" }} />
    <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 7px", borderRadius: 99, color: "#f7faf8", background: "#0d2825e8", fontSize: 12, whiteSpace: "nowrap" }}><strong>{name}</strong><span style={{ color: "#bcd5cb" }}>{stack}</span></div>
    <div style={{ marginTop: 3, color: active ? "#8ec4ff" : "#eaf3ee", fontSize: 11, fontWeight: 700 }}>{position}{folded ? " · Fold" : ""}</div>
  </div>;
}

function PokerTable({ heroHand }: { heroHand: string }) {
  const heroCards = heroHand.split(/\s+/).filter(Boolean).slice(0, 2);
  return <section aria-label="Six-max poker training table" className={styles.table}>
    <div className={styles.felt} />
    <span className={styles.pot}>Pot 13bb</span><span className={styles.street}>Preflop · BB 3-bet to 10bb</span>
    <Seat name="Linh" position="UTG" stack="100bb" folded style={{ top: "22%", left: "18%" }} /><Seat name="Minh" position="HJ" stack="96bb" folded style={{ top: "14%", left: "50%" }} /><Seat name="Nam" position="CO" stack="108bb" folded style={{ top: "22%", left: "82%" }} /><Seat name="Hero" position="BTN" stack="100bb" active style={{ top: "57%", left: "87%" }} /><Seat name="Hà" position="SB" stack="100bb" folded style={{ top: "82%", left: "72%" }} /><Seat name="Villain" position="BB" stack="100bb" style={{ top: "82%", left: "28%" }} />
    <div aria-label="Big blind face-down cards" className={styles.villainCards}><PlayingCard faceDown compact /><PlayingCard faceDown compact /></div>
    <div className={styles.heroCards}>{heroCards.map((value) => <PlayingCard key={value} value={value} />)}</div><p className={styles.heroLabel}>Hero · Button · {heroHand}</p>
  </section>;
}

function ChoiceQuiz({ prompt, choices, selected, onSelect, correct, explanation }: { prompt: string; choices: string[]; selected?: string; onSelect: (choice: string) => void; correct: string; explanation: string }) {
  const resolved = Boolean(selected);
  return <section className={styles.quizBox}><p className={styles.kicker}>Quick check</p><h3>{prompt}</h3><div className={styles.choiceGrid}>{choices.map((choice) => <button key={choice} onClick={() => onSelect(choice)} className={`${styles.choice} ${selected === choice ? (choice === correct ? styles.correct : styles.wrong) : ""}`}>{choice}</button>)}</div>{resolved && <p className={styles.feedback}>{selected === correct ? "Correct. " : "Not quite. "}{explanation}</p>}</section>;
}

export default function DemoClient() {
  const [scenario, setScenario] = useState<ScenarioResponse["data"]>();
  const [dashboard, setDashboard] = useState<DashboardResponse["data"]>();
  const [result, setResult] = useState<AttemptResult["data"]>();
  const [error, setError] = useState("");
  const [positionAnswer, setPositionAnswer] = useState<string>();
  const [reviewAnswers, setReviewAnswers] = useState<Record<string, string>>({});
  const [correctStreak, setCorrectStreak] = useState(0);
  useEffect(() => { Promise.all([fetch("/api/demo/scenario").then((r) => r.json()), fetch("/api/demo/dashboard").then((r) => r.json())]).then(([scenarioData, dashboardData]) => { setScenario(scenarioData.data); setDashboard(dashboardData.data); }).catch(() => setError("The training scenario could not be loaded.")); }, []);

  async function submit(action: Action) {
    if (!scenario) return;
    setError("");
    const response = await fetch("/api/demo/attempt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scenarioId: scenario.scenario.id, action }) });
    if (!response.ok) return setError("The drill could not be scored. Please try again.");
    const payload: AttemptResult = await response.json();
    setResult(payload.data);
    setCorrectStreak((streak) => payload.data.selectedAction === payload.data.recommendedAction ? streak + 1 : 0);
  }

  function replay() { setResult(undefined); setPositionAnswer(undefined); setReviewAnswers({}); }

  const requiredEquity = scenario ? (scenario.math.requiredEquity * 100).toFixed(1) : "36.6";
  return <main className={styles.trainerPage}>
    <header className={styles.trainerHeader}><a href="/" className={styles.brand}>POKERLINGO<span>TRAINER</span></a><div className={styles.headerStats}><span>Practice mode</span><span>Instant feedback</span><strong>{correctStreak} correct streak</strong></div></header>
    <section className={styles.drillHero}><div><p className={styles.drillEyebrow}>PREFLOP DRILL · 01 OF 05</p><h1>BTN vs BB 3-bet</h1><p>Make the decision first. Then inspect the price, the ranges, and the reason behind the answer.</p></div><div className={styles.drillMeter}><span>Skill progress</span><b>Preflop foundations</b><i><em /></i><small>Table reading → pot odds → 4-bet strategy</small></div></section>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <section className={styles.trainerGrid}>
      <article className={styles.drillColumn}>
        <section className={styles.drillCard}><div className={styles.cardTopline}><span>HAND 01</span><span>6-max cash · 100bb effective</span><span>Preflop</span></div>{!scenario ? <p>Loading the table…</p> : <><PokerTable heroHand={scenario.scenario.heroHand} /><div className={styles.spotSummary}><div><small>Hero</small><b>BTN opens 2.5bb</b></div><div><small>Villain</small><b>BB 3-bets to 10bb</b></div><div><small>Your hand</small><b>{scenario.scenario.heroHand}</b></div></div></>}</section>
        <section className={styles.decisionCard}><p className={styles.kicker}>Your decision</p><h2>{scenario?.scenario.prompt ?? "Loading scenario…"}</h2><p className={styles.decisionHint}>Choose the action you would take. You will receive the model answer and the “why” immediately.</p><div className={styles.actionGrid}>{scenario?.scenario.actions.map((action) => <button key={action} className={`${styles.action} ${action === "raise" ? styles.primaryAction : ""}`} onClick={() => submit(action)}><strong>{actionLabel[action]}</strong><span>{actionDetail[action]}</span></button>)}</div></section>
        {result && <section aria-live="polite" className={styles.trainerResult}><p className={styles.kicker}>{result.selectedAction === result.recommendedAction ? "Correct decision" : "Review this decision"} · {result.score}/100</p><h2>{result.selectedAction === result.recommendedAction ? "4-bet is the reference action for this drill." : `The reference action is ${actionLabel[result.recommendedAction]}.`}</h2><div className={styles.resultStats}><span>Your EV <b>{result.selectedEvBb.toFixed(2)}bb</b></span><span>EV loss <b>{result.evLossBb.toFixed(2)}bb</b></span><span>Required equity <b>{requiredEquity}%</b></span></div><p>{result.explanation}</p><div className={styles.reasonGrid}><div><b>Why it works</b><span>AQs blocks part of BB’s premium value range and retains equity when called.</span></div><div><b>What you avoid</b><span>Calling a strong range without a clear postflop plan or enough equity realization.</span></div><div><b>Practical size</b><span>23bb is a simple training size; real sizing changes with rake, stacks and pool tendencies.</span></div></div><button type="button" onClick={replay} className={styles.replayButton}>Replay this drill</button><p className={styles.assumption}>{result.assumptions.join(" ")}</p></section>}
        <section className={styles.studyCard}><p className={styles.kicker}>Study the spot</p><h2>Three checks before you put more chips in.</h2><div className={styles.conceptGrid}><div><b>Position</b><span>BTN opens wider, but BB has the aggressive initiative after the 3-bet.</span></div><div><b>Price</b><span>Hero has 2.5bb invested and needs 7.5bb more to call.</span></div><div><b>Blockers</b><span>A♠ Q♠ reduce some AA, AQ and AK combinations.</span></div></div><div className={styles.mathStrip}><div><small>Pot now</small><strong>13bb</strong></div><div><small>Call amount</small><strong>7.5bb</strong></div><div><small>Final pot</small><strong>20.5bb</strong></div><div className={styles.formula}><small>Break-even equity</small><strong>{requiredEquity}%</strong></div></div><details className={styles.details}><summary>Show the pot-odds calculation</summary><ol><li>Before Hero acts, the pot is BTN 2.5bb + SB 0.5bb + BB 10bb = 13bb.</li><li>Hero has already put in 2.5bb, so calling costs another 7.5bb.</li><li>After calling, the pot is 20.5bb. Required equity is 7.5 ÷ 20.5 = {requiredEquity}%.</li></ol></details><p className={styles.note}>Pot odds are a threshold, not a complete strategy. Rake, BB’s range, position and equity realization still decide whether calling is profitable.</p></section>
        <section className={styles.studyCard}><p className={styles.kicker}>Knowledge check</p><h2>Can you explain the decision?</h2><ChoiceQuiz prompt="What is Hero’s position in this hand?" choices={["Button", "Small Blind", "Big Blind"]} selected={positionAnswer} onSelect={setPositionAnswer} correct="Button" explanation="Hero is on the Button. That gives position after the flop, while BB currently holds the preflop initiative." /><div className={styles.reviewGrid}>{reviewQuestions.map((question) => <ChoiceQuiz key={question.id} prompt={question.prompt} choices={question.choices} selected={reviewAnswers[question.id]} onSelect={(choice) => setReviewAnswers((answers) => ({ ...answers, [question.id]: choice }))} correct={question.answer} explanation={question.explanation} />)}</div></section>
      </article>
      <aside className={styles.trainerSidebar}>
        <section className={styles.sidebarPanel}><p className={styles.kicker}>Training path</p><ol className={styles.lessonMap}><li className={styles.complete}>Hand ranking</li><li className={styles.complete}>Best hand</li><li className={styles.activeStep}>Preflop decisions</li><li>Postflop hand reading</li><li>Odds & equity</li></ol></section>
        <section className={styles.sidebarPanel}><p className={styles.kicker}>Range snapshot</p><h3>BB vs BTN open</h3><div className={styles.rangeReading}><div><b>Value 3-bets</b><span>QQ+, AK</span></div><div><b>Bluff candidates</b><span>A5s, K5s, selected suited connectors</span></div><div><b>Hero’s lesson</b><span>Do not decide from hand strength alone; compare your hand to a range.</span></div></div></section>
        <section className={styles.sidebarPanel}>{!dashboard ? <p>Loading progress…</p> : <><p className={styles.kicker}>Your training</p><h3>Level {dashboard.level} · {dashboard.xp} XP</h3><div className={styles.mastery}><span>Preflop mastery</span><b>{dashboard.mastery}%</b><i><em style={{ width: `${dashboard.mastery}%` }} /></i></div><h4>Today’s practice</h4><ul>{dashboard.quests.map((quest) => <li key={quest.id}>{quest.title}: {quest.progress}/{quest.target}</li>)}</ul><h4>Weekly leaders</h4><ol>{dashboard.leaderboard.slice(0, 3).map((entry) => <li key={entry.handle}>{entry.handle} — {entry.score}</li>)}</ol></>}</section>
        <section className={styles.nextLesson}><p>Next drill · planned</p><h3>Flop c-bet: when does equity become EV?</h3><span>Scenario service needed to unlock this drill.</span></section>
      </aside>
    </section>
    <footer className={styles.handoff}><p><strong>Demo boundary:</strong> this is a fixed educational simulation. B can connect the range/equity engine, C can persist attempts and schedules, and D can turn the drill blocks into a shared product system.</p></footer>
  </main>;
}
