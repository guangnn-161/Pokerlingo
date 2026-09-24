"use client";

import { useEffect, useState } from "react";

type Action = "fold" | "call" | "raise";
type ScenarioResponse = { data: { scenario: { id: string; title: string; heroHand: string; prompt: string; actions: Action[]; assumptions: string[] }; math: { requiredEquity: number; engineVersion: string } } };
type AttemptResult = { data: { selectedAction: Action; recommendedAction: Action; selectedEvBb: number; evLossBb: number; score: number; explanation: string; assumptions: string[]; demo: true } };
type DashboardResponse = { data: { xp: number; level: number; mastery: number; quests: { id: string; title: string; progress: number; target: number }[]; leaderboard: { rank: number; handle: string; score: number }[]; friends: { handle: string; status: string }[] } };

const actionLabel: Record<Action, string> = { fold: "Fold", call: "Call", raise: "4-bet" };
const card = { border: "1px solid #dedede", borderRadius: 14, padding: "1.25rem", background: "#fff" };
const button = { border: 0, borderRadius: 9, padding: ".7rem 1rem", background: "#171717", color: "#fff", cursor: "pointer", fontWeight: 700 } as const;

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

  return <main style={{ maxWidth: 1050, margin: "3rem auto", padding: "0 1rem", fontFamily: "system-ui", color: "#171717", lineHeight: 1.5 }}>
    <p style={{ color: "#a16207", fontWeight: 800, letterSpacing: ".06em", marginBottom: ".25rem" }}>DEMO V0.1 · B + C + D</p>
    <h1 style={{ marginTop: 0 }}>Vertical slice để đội phát triển tiếp</h1>
    <p style={{ maxWidth: 760 }}>Bản này dùng dữ liệu giả có version: thử một spot → chấm EV → hiển thị XP, quest và social UI. Chưa lưu attempt, XP hay quan hệ bạn bè vào database.</p>
    {error && <p role="alert" style={{ color: "#b42318" }}>{error}</p>}
    <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) minmax(260px, 1fr)", gap: "1rem", alignItems: "start" }}>
      <article style={card}>
        <h2 style={{ marginTop: 0 }}>B · Math + C · Scenario</h2>
        {!scenario ? <p>Đang tải tình huống…</p> : <>
          <p><strong>{scenario.scenario.title}</strong></p>
          <p>Hero: <strong>{scenario.scenario.heroHand}</strong></p>
          <p>{scenario.scenario.prompt}</p>
          <p style={{ color: "#475467" }}>Required equity: {(scenario.math.requiredEquity * 100).toFixed(0)}% · Engine: {scenario.math.engineVersion}</p>
          <div style={{ display: "flex", gap: ".65rem", flexWrap: "wrap" }}>
            {scenario.scenario.actions.map((action) => <button key={action} style={button} onClick={() => submit(action)}>{actionLabel[action]}</button>)}
          </div>
          <details style={{ marginTop: "1rem" }}><summary>Giả định demo</summary><ul>{scenario.scenario.assumptions.map((item) => <li key={item}>{item}</li>)}</ul></details>
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
      <p><strong>B:</strong> thay hàm demo trong <code>@pokerlingo/math</code> bằng engine/card evaluator có test vector. <strong>C:</strong> thay API fixture bằng scenario + scoring service có persistence. <strong>D:</strong> giữ DTO hiện tại, thay style inline bằng design system và thêm loading/error/empty state đầy đủ.</p>
    </section>
  </main>;
}
