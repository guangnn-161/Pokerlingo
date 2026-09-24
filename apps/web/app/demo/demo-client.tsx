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
  fold: "Giữ lại 7.5bb còn lại, nhưng bỏ qua value/blocker của AQs.",
  call: "Bỏ thêm 7.5bb để chơi pot 20.5bb ngoài vị trí sau flop.",
  raise: "Đưa sizing lên khoảng 23bb để tạo fold equity và dùng blocker A♠ Q♠."
};
const reviewQuestions = [
  { id: "price", prompt: "Trong spot này Hero phải bỏ thêm bao nhiêu để call?", choices: ["5bb", "7.5bb", "10bb"], answer: "7.5bb", explanation: "Hero đã đầu tư 2.5bb khi open; BB raise lên tổng 10bb nên Hero chỉ bổ sung 7.5bb." },
  { id: "blocker", prompt: "A♠ Q♠ tạo blocker quan trọng nhất với phần range nào của BB?", choices: ["AA, AQ và AK", "Các đôi nhỏ 22–66", "Chỉ các hand suited connector"], answer: "AA, AQ và AK", explanation: "Lá A và Q làm giảm số combo value mạnh mà BB có thể giữ; đó là một phần lý do AQs phù hợp để 4-bet hơn các hand không có blocker." }
];

function PlayingCard({ value, faceDown = false, compact = false }: PlayingCardProps) {
  const red = Boolean(value && /[♥♦]/.test(value));
  const size = compact ? { width: 34, height: 48, fontSize: 16 } : { width: 53, height: 75, fontSize: 25 };
  if (faceDown) return <span aria-label="Lá bài úp" style={{ ...size, display: "inline-grid", placeItems: "center", borderRadius: 7, border: "2px solid #f7e6b7", background: "repeating-linear-gradient(45deg, #8f2430, #8f2430 4px, #c64c59 4px, #c64c59 8px)", boxShadow: "0 2px 4px #0005" }}>♠</span>;
  return <span aria-label={`Lá bài ${value}`} style={{ ...size, display: "inline-flex", alignItems: "flex-start", justifyContent: "center", paddingTop: compact ? 3 : 5, borderRadius: 7, border: "1px solid #d0d0d0", background: "#fffdf8", color: red ? "#c32631" : "#152238", boxShadow: "0 2px 4px #0004", fontWeight: 800 }}>{value}</span>;
}

function Seat({ name, position, stack, style, active, folded }: SeatProps) {
  return <div style={{ ...style, position: "absolute", transform: "translate(-50%, -50%)", minWidth: 100, textAlign: "center", opacity: folded ? 0.58 : 1 }}>
    <div aria-hidden="true" style={{ width: 32, height: 32, borderRadius: "50%", margin: "0 auto 3px", border: active ? "3px solid #f8c84a" : "2px solid #d8e8e0", background: active ? "#944e1e" : "#496a72", boxShadow: active ? "0 0 0 4px #f8c84a55" : "0 2px 4px #0005" }} />
    <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 7px", borderRadius: 99, color: "#f7faf8", background: "#0d2825e8", fontSize: 12, whiteSpace: "nowrap" }}><strong>{name}</strong><span style={{ color: "#bcd5cb" }}>{stack}</span></div>
    <div style={{ marginTop: 3, color: active ? "#f8d46a" : "#eaf3ee", fontSize: 11, fontWeight: 700 }}>{position}{folded ? " · Fold" : ""}</div>
  </div>;
}

function PokerTable({ heroHand }: { heroHand: string }) {
  const heroCards = heroHand.split(/\s+/).filter(Boolean).slice(0, 2);
  return <section aria-label="Bàn poker luyện tập" className={styles.table}>
    <div className={styles.felt} />
    <span className={styles.pot}>Pot 13bb</span><span className={styles.street}>Preflop · BB 3-bet 10bb</span>
    <Seat name="Linh" position="UTG" stack="100bb" folded style={{ top: "22%", left: "18%" }} /><Seat name="Minh" position="HJ" stack="96bb" folded style={{ top: "14%", left: "50%" }} /><Seat name="Nam" position="CO" stack="108bb" folded style={{ top: "22%", left: "82%" }} /><Seat name="Bạn" position="BTN" stack="100bb" active style={{ top: "57%", left: "87%" }} /><Seat name="Hà" position="SB" stack="100bb" folded style={{ top: "82%", left: "72%" }} /><Seat name="BB" position="BB" stack="100bb" style={{ top: "82%", left: "28%" }} />
    <div aria-label="Bài úp của đối thủ BB" className={styles.villainCards}><PlayingCard faceDown compact /><PlayingCard faceDown compact /></div>
    <div className={styles.heroCards}>{heroCards.map((value) => <PlayingCard key={value} value={value} />)}</div><p className={styles.heroLabel}>Hero · Button · {heroHand}</p>
  </section>;
}

function ChoiceQuiz({ prompt, choices, selected, onSelect, correct, explanation }: { prompt: string; choices: string[]; selected?: string; onSelect: (choice: string) => void; correct: string; explanation: string }) {
  const resolved = Boolean(selected);
  return <section className={styles.quizBox}><p className={styles.kicker}>Dừng & kiểm tra</p><h3>{prompt}</h3><div className={styles.choiceGrid}>{choices.map((choice) => <button key={choice} onClick={() => onSelect(choice)} className={`${styles.choice} ${selected === choice ? (choice === correct ? styles.correct : styles.wrong) : ""}`}>{choice}</button>)}</div>{resolved && <p className={styles.feedback}>{selected === correct ? "Đúng rồi. " : "Chưa đúng. "}{explanation}</p>}</section>;
}

export default function DemoClient() {
  const [scenario, setScenario] = useState<ScenarioResponse["data"]>();
  const [dashboard, setDashboard] = useState<DashboardResponse["data"]>();
  const [result, setResult] = useState<AttemptResult["data"]>();
  const [error, setError] = useState("");
  const [positionAnswer, setPositionAnswer] = useState<string>();
  const [reviewAnswers, setReviewAnswers] = useState<Record<string, string>>({});
  useEffect(() => { Promise.all([fetch("/api/demo/scenario").then((r) => r.json()), fetch("/api/demo/dashboard").then((r) => r.json())]).then(([scenarioData, dashboardData]) => { setScenario(scenarioData.data); setDashboard(dashboardData.data); }).catch(() => setError("Không tải được dữ liệu demo.")); }, []);
  async function submit(action: Action) { if (!scenario) return; setError(""); const response = await fetch("/api/demo/attempt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scenarioId: scenario.scenario.id, action }) }); if (!response.ok) return setError("Không thể chấm attempt demo."); const payload: AttemptResult = await response.json(); setResult(payload.data); }
  const requiredEquity = scenario ? (scenario.math.requiredEquity * 100).toFixed(1) : "36.6";
  return <main className={styles.page}>
    <header className={styles.lessonHeader}><div><p className={styles.eyebrow}>POKERLINGO · LỘ TRÌNH PREFLOP</p><h1>BTN vs BB 3-bet: học cách biến lá bài thành quyết định</h1><p className={styles.lead}>Một bài học 12 phút: đọc vị trí, định giá chip phải bỏ vào pot, nhận diện blocker rồi mới chọn action. Đây là mô phỏng học tập, không phải chỉ dẫn chơi theo thời gian thực.</p></div><aside className={styles.lessonMeta}><span>Bài 01 / 08</span><strong>Preflop foundations</strong><div className={styles.progressTrack}><i /></div><small>Hôm nay: đọc pot odds & 4-bet range</small></aside></header>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <section className={styles.learningGrid}>
      <article className={styles.primaryColumn}>
        <section className={styles.panel}><div className={styles.sectionHeading}><span>01</span><div><p className={styles.kicker}>Vì sao spot này quan trọng</p><h2>Đừng nhìn AQs như “bài đẹp”; hãy nhìn nó như một tập hợp thông tin.</h2></div></div><p>Ở Button, Hero mở rộng range hơn vì chỉ còn hai người phía sau. Khi Big Blind 3-bet, quyết định không còn là “AQ có mạnh không?” mà là: Hero trả giá bao nhiêu, range nào đang đối mặt, và A/Q chặn được combo nào.</p><div className={styles.conceptGrid}><div><b>Vị trí</b><span>BTN mở rộng; BB có range defend và 3-bet riêng.</span></div><div><b>Giá call</b><span>Hero đã có 2.5bb trong pot nên chỉ call thêm 7.5bb.</span></div><div><b>Blocker</b><span>A♠ Q♠ làm giảm một phần combo AA, AQ, AK của BB.</span></div></div></section>
        <section className={styles.panel}><div className={styles.sectionHeading}><span>02</span><div><p className={styles.kicker}>Đọc tình huống</p><h2>Bàn chơi trước khi quyết định</h2></div></div>{!scenario ? <p>Đang dựng bàn chơi…</p> : <><PokerTable heroHand={scenario.scenario.heroHand} /><div className={styles.captionRow}><span>Hero đã open 2.5bb từ Button</span><span>BB 3-bet lên 10bb</span><span>Effective stack 100bb</span></div></>}<ChoiceQuiz prompt="Hero đang có vị trí nào trong hand này?" choices={["Button", "Small Blind", "Big Blind"]} selected={positionAnswer} onSelect={setPositionAnswer} correct="Button" explanation="Hero ở Button: đây là vị trí cuối cùng sau flop, nhưng hiện tại BB vẫn có initiative vì đã 3-bet." /></section>
        <section className={styles.panel}><div className={styles.sectionHeading}><span>03</span><div><p className={styles.kicker}>Tính trước, chọn sau</p><h2>Pot odds nói cho ta mức equity tối thiểu, không tự trả lời toàn bộ hand.</h2></div></div><div className={styles.mathStrip}><div><small>Pot hiện tại</small><strong>13bb</strong></div><div><small>Hero call thêm</small><strong>7.5bb</strong></div><div><small>Pot sau khi call</small><strong>20.5bb</strong></div><div className={styles.formula}><small>Equity cần tối thiểu</small><strong>7.5 ÷ 20.5 = {requiredEquity}%</strong></div></div><p className={styles.note}>Con số {requiredEquity}% chỉ là “giá vào cửa” nếu toàn bộ equity được hiện thực hóa. Trong thực tế, rake, range mạnh của BB và khả năng chơi sau flop khiến call không tự động tốt.</p><details className={styles.details}><summary>Đọc công thức từng bước</summary><ol><li>Pot trước khi Hero hành động: BTN 2.5bb + SB 0.5bb + BB tổng 10bb = 13bb.</li><li>Hero đã có 2.5bb nên chỉ cần thêm 7.5bb để call.</li><li>Sau call, pot là 20.5bb; required equity = 7.5 / 20.5.</li></ol></details></section>
        <section className={styles.panel}><div className={styles.sectionHeading}><span>04</span><div><p className={styles.kicker}>Ra quyết định</p><h2>{scenario?.scenario.title ?? "Chọn action cho Hero"}</h2></div></div><p>{scenario?.scenario.prompt}</p><div className={styles.actionGrid}>{scenario?.scenario.actions.map((action) => <button key={action} className={`${styles.action} ${action === "raise" ? styles.primaryAction : ""}`} onClick={() => submit(action)}><strong>{actionLabel[action]}</strong><span>{actionDetail[action]}</span></button>)}</div><p className={styles.disclaimer}>Spot được cố định để luyện tư duy. Không có action nào nên được sao chép sang bàn chơi thật nếu chưa xét stack, rake, đối thủ và range riêng.</p>{result && <section aria-live="polite" className={styles.result}><p className={styles.kicker}>Kết quả attempt · {result.score}/100</p><h3>Bạn chọn {actionLabel[result.selectedAction]}; đáp án tham chiếu là {actionLabel[result.recommendedAction]}.</h3><div className={styles.resultStats}><span>EV action <b>{result.selectedEvBb.toFixed(2)}bb</b></span><span>EV loss <b>{result.evLossBb.toFixed(2)}bb</b></span><span>Required equity <b>{requiredEquity}%</b></span></div><p>{result.explanation}</p><div className={styles.rangeReading}><div><b>Range value BB (minh họa)</b><span>QQ+, AK</span></div><div><b>Range bluff BB (minh họa)</b><span>A5s, K5s, một số suited connector</span></div><div><b>Vì sao 4-bet phù hợp</b><span>AQs có blocker, equity ổn khi bị call và không muốn call một range mạnh vô điều kiện.</span></div></div><p className={styles.assumption}>{result.assumptions.join(" ")}</p></section>}</section>
        <section className={styles.panel}><div className={styles.sectionHeading}><span>05</span><div><p className={styles.kicker}>Ghi nhớ & áp dụng</p><h2>Nếu chỉ nhớ ba điều, hãy nhớ ba điều này.</h2></div></div><ol className={styles.takeaways}><li><b>Position trước, hand sau:</b> tên lá bài không đủ để quyết định; range theo vị trí mới là điểm xuất phát.</li><li><b>Price trước, cảm giác sau:</b> luôn tính số chip phải bổ sung và pot cuối cùng.</li><li><b>Blocker không phải phép màu:</b> nó làm range đối thủ thay đổi về tổ hợp, nhưng vẫn cần sizing, stack và kế hoạch sau flop.</li></ol><div className={styles.reviewGrid}>{reviewQuestions.map((question) => <ChoiceQuiz key={question.id} prompt={question.prompt} choices={question.choices} selected={reviewAnswers[question.id]} onSelect={(choice) => setReviewAnswers((answers) => ({ ...answers, [question.id]: choice }))} correct={question.answer} explanation={question.explanation} />)}</div></section>
      </article>
      <aside className={styles.sidebar}>
        <section className={styles.sidebarPanel}><p className={styles.kicker}>Bản đồ bài học</p><ol className={styles.lessonMap}><li className={styles.complete}>Bối cảnh & vị trí</li><li className={styles.complete}>Pot odds</li><li className={styles.activeStep}>Range & blocker</li><li>4-bet sizing</li><li>Review</li></ol></section>
        <section className={styles.sidebarPanel}><p className={styles.kicker}>Ghi chú nhanh</p><h3>Checklist trước khi bấm chip</h3><ul className={styles.checklist}><li>Ai mở từ vị trí nào?</li><li>Ai là người 3-bet?</li><li>Hero call thêm bao nhiêu?</li><li>Range value/bluff đối thủ?</li><li>Plan nếu bị call 4-bet?</li></ul></section>
        <section className={styles.sidebarPanel}>{!dashboard ? <p>Đang tải tiến độ…</p> : <><p className={styles.kicker}>Tiến độ demo</p><h3>Cấp {dashboard.level} · {dashboard.xp} XP</h3><div className={styles.mastery}><span>Mastery preflop</span><b>{dashboard.mastery}%</b><i><em style={{ width: `${dashboard.mastery}%` }} /></i></div><h4>Nhiệm vụ</h4><ul>{dashboard.quests.map((quest) => <li key={quest.id}>{quest.title}: {quest.progress}/{quest.target}</li>)}</ul><h4>Leaderboard</h4><ol>{dashboard.leaderboard.slice(0, 3).map((entry) => <li key={entry.handle}>{entry.handle} — {entry.score}</li>)}</ol></>}</section>
        <section className={styles.nextLesson}><p>Bài tiếp theo · 10 phút</p><h3>Flop c-bet: khi nào equity trở thành EV?</h3><button type="button">Chưa mở trong demo</button></section>
      </aside>
    </section>
    <footer className={styles.handoff}><p><strong>Nền cho B/C/D:</strong> B thay range minh họa bằng engine equity; C lưu attempt/XP và lịch ôn; D tách lesson blocks, table và review thành design system responsive.</p></footer>
  </main>;
}
