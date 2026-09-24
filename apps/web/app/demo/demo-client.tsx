"use client";

import { useEffect, useState, type CSSProperties } from "react";

type Action = "fold" | "call" | "raise";
type ScenarioResponse = { data: { scenario: { id: string; title: string; heroHand: string; prompt: string; actions: Action[]; assumptions: string[] }; math: { requiredEquity: number; engineVersion: string } } };
type AttemptResult = { data: { selectedAction: Action; recommendedAction: Action; selectedEvBb: number; evLossBb: number; score: number; explanation: string; assumptions: string[]; demo: true } };
type DashboardResponse = { data: { xp: number; level: number; mastery: number; quests: { id: string; title: string; progress: number; target: number }[]; leaderboard: { rank: number; handle: string; score: number }[]; friends: { handle: string; status: string }[] } };

type PlayingCardProps = { value?: string; faceDown?: boolean; compact?: boolean };
type SeatProps = { name: string; position: string; stack: string; style: CSSProperties; active?: boolean; folded?: boolean };

const actionLabel: Record<Action, string> = { fold: "Fold", call: "Call 7.5bb", raise: "4-bet" };
const card = { border: "1px solid #dedede", borderRadius: 14, padding: "1.25rem", background: "#fff" };
const button = { border: 0, borderRadius: 9, padding: ".7rem 1rem", background: "#171717", color: "#fff", cursor: "pointer", fontWeight: 700 } as const;

function PlayingCard({ value, faceDown = false, compact = false }: PlayingCardProps) {
  const red = Boolean(value && /[♥♦]/.test(value));
  const size = compact ? { width: 34, height: 48, fontSize: 16 } : { width: 53, height: 75, fontSize: 25 };

  if (faceDown) {
    return <span aria-label="Lá bài úp" style={{ ...size, display: "inline-grid", placeItems: "center", borderRadius: 7, border: "2px solid #f7e6b7", background: "repeating-linear-gradient(45deg, #8f2430, #8f2430 4px, #c64c59 4px, #c64c59 8px)", boxShadow: "0 2px 4px #0005" }}>♠</span>;
  }

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

  return <section aria-label="Bàn poker luyện tập" style={{ position: "relative", minHeight: 490, overflow: "hidden", borderRadius: 32, padding: "1rem", color: "#fff", background: "linear-gradient(145deg, #3d271c, #8c5a37 48%, #362016)", boxShadow: "inset 0 0 0 3px #c79761, 0 16px 36px #24150b33" }}>
    <div style={{ position: "absolute", inset: "9% 7% 13%", borderRadius: "48%", border: "10px solid #e4c18b", background: "radial-gradient(circle at 50% 40%, #2d836e, #0b4238 70%)", boxShadow: "inset 0 0 0 3px #062d27, inset 0 16px 35px #5fb29d33" }} />
    <span style={{ position: "absolute", top: "18%", left: "50%", transform: "translateX(-50%)", borderRadius: 999, padding: "5px 12px", background: "#082f28de", color: "#f8d46a", fontSize: 13, fontWeight: 800 }}>Pot 12.5bb</span>
    <span style={{ position: "absolute", top: "31%", left: "50%", transform: "translateX(-50%)", fontSize: 12, color: "#d0e6de" }}>Preflop · BB 3-bet 10bb</span>

    <Seat name="Linh" position="UTG" stack="100bb" folded style={{ top: "22%", left: "18%" }} />
    <Seat name="Minh" position="HJ" stack="96bb" folded style={{ top: "14%", left: "50%" }} />
    <Seat name="Nam" position="CO" stack="108bb" folded style={{ top: "22%", left: "82%" }} />
    <Seat name="Bạn" position="BTN" stack="100bb" active style={{ top: "57%", left: "87%" }} />
    <Seat name="Hà" position="SB" stack="100bb" folded style={{ top: "82%", left: "72%" }} />
    <Seat name="BB" position="BB" stack="100bb" style={{ top: "82%", left: "28%" }} />

    <div aria-label="Bài úp của đối thủ BB" style={{ position: "absolute", top: "68%", left: "36%", display: "flex", gap: 3, transform: "rotate(-5deg)" }}><PlayingCard faceDown compact /><PlayingCard faceDown compact /></div>
    <div style={{ position: "absolute", bottom: 15, left: "50%", display: "flex", gap: 7, transform: "translateX(-50%)" }}>{heroCards.map((value) => <PlayingCard key={value} value={value} />)}</div>
    <p style={{ position: "absolute", bottom: 92, left: "50%", transform: "translateX(-50%)", margin: 0, fontSize: 12, fontWeight: 700, color: "#f8d46a", whiteSpace: "nowrap" }}>Hero · Button · {heroHand}</p>
  </section>;
}

export default function DemoClient() {
  const [scenario, setScenario] = useState<ScenarioResponse["data"]>();
  const [dashboard, setDashboard] = useState<DashboardResponse["data"]>();
  const [result, setResult] = useState<AttemptResult["data"]>();
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetch("/api/demo/scenario").then((r) => r.json()), fetch("/api/demo/dashboard").then((r) => r.json())])
      .then(([scenarioData, dashboardData]) => { setScenario(scenarioData.data); setDashboard(dashboardData.data); })
      .catch(() => setError("Không tải được dữ liệu demo."));
  }, []);

  async function submit(action: Action) {
    if (!scenario) return;
    setError("");
    const response = await fetch("/api/demo/attempt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scenarioId: scenario.scenario.id, action }) });
    if (!response.ok) return setError("Không thể chấm attempt demo.");
    const payload: AttemptResult = await response.json();
    setResult(payload.data);
  }

  return <main style={{ maxWidth: 1120, margin: "3rem auto", padding: "0 1rem", fontFamily: "system-ui", color: "#171717", lineHeight: 1.5 }}>
    <p style={{ color: "#a16207", fontWeight: 800, letterSpacing: ".06em", marginBottom: ".25rem" }}>DEMO V0.2 · B + C + D</p>
    <h1 style={{ marginTop: 0 }}>Luyện một quyết định thật trên bàn poker</h1>
    <p style={{ maxWidth: 760 }}>Bàn bên dưới là mô phỏng một spot preflop 6-max: xem vị trí, stack, pot và bài Hero trước khi chọn action. Dữ liệu vẫn là fixture demo, chưa ghi attempt hay XP vào database.</p>
    {error && <p role="alert" style={{ color: "#b42318" }}>{error}</p>}
    <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.65fr) minmax(260px, 1fr)", gap: "1rem", alignItems: "start" }}>
      <article style={card}>
        <h2 style={{ marginTop: 0 }}>Poker practice · preflop</h2>
        {!scenario ? <p>Đang dựng bàn chơi…</p> : <>
          <PokerTable heroHand={scenario.scenario.heroHand} />
          <div style={{ marginTop: "1rem" }}>
            <p style={{ marginBottom: ".35rem" }}><strong>{scenario.scenario.title}</strong></p>
            <p style={{ marginTop: 0 }}>{scenario.scenario.prompt}</p>
            <p style={{ color: "#475467" }}>Required equity: {(scenario.math.requiredEquity * 100).toFixed(0)}% · Engine: {scenario.math.engineVersion}</p>
            <div aria-label="Các action khả dụng" style={{ display: "flex", gap: ".65rem", flexWrap: "wrap" }}>
              {scenario.scenario.actions.map((action) => <button key={action} style={{ ...button, background: action === "fold" ? "#475467" : action === "raise" ? "#9c4214" : "#176b57" }} onClick={() => submit(action)}>{actionLabel[action]}</button>)}
            </div>
            <details style={{ marginTop: "1rem" }}><summary>Giả định demo</summary><ul>{scenario.scenario.assumptions.map((item) => <li key={item}>{item}</li>)}</ul></details>
          </div>
        </>}
        {result && <section aria-live="polite" style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid #e5e5e5" }}>
          <h3>Kết quả attempt</h3>
          <p>Chọn <strong>{actionLabel[result.selectedAction]}</strong> · đáp án tham chiếu <strong>{actionLabel[result.recommendedAction]}</strong> · điểm {result.score}/100.</p>
          <p>EV action: {result.selectedEvBb.toFixed(2)}bb · EV loss: {result.evLossBb.toFixed(2)}bb.</p>
          <p>{result.explanation}</p>
          <p style={{ color: "#475467" }}>{result.assumptions.join(" ")}</p>
        </section>}
      </article>
      <aside style={card}>
        <h2 style={{ marginTop: 0 }}>D · Progress & social</h2>
        {!dashboard ? <p>Đang tải dashboard…</p> : <>
          <p><strong>Cấp {dashboard.level}</strong> · {dashboard.xp} XP</p>
          <p>Mastery: {dashboard.mastery}%</p>
          <h3>Nhiệm vụ</h3><ul>{dashboard.quests.map((quest) => <li key={quest.id}>{quest.title}: {quest.progress}/{quest.target}</li>)}</ul>
          <h3>Daily leaderboard</h3><ol>{dashboard.leaderboard.map((entry) => <li key={entry.handle}>{entry.handle} — {entry.score}</li>)}</ol>
          <h3>Bạn bè</h3><ul>{dashboard.friends.map((friend) => <li key={friend.handle}>{friend.handle}: {friend.status}</li>)}</ul>
        </>}
      </aside>
    </section>
    <section style={{ ...card, marginTop: "1rem" }}>
      <h2 style={{ marginTop: 0 }}>Handoff cho B/C/D</h2>
      <p><strong>B:</strong> nối equity/range engine vào spot. <strong>C:</strong> thay fixture bằng scenario + scoring có persistence. <strong>D:</strong> tách bàn poker này thành design system responsive, sau đó thêm board, bet sizing và các street tiếp theo.</p>
    </section>
  </main>;
}
