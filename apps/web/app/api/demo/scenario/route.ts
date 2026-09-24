import { NextResponse } from "next/server";
import { ENGINE_VERSION, requiredEquity } from "@pokerlingo/math";

const scenario = {
  id: "demo-btn-aqs-vs-3bet",
  title: "BTN cầm AQs trước BB 3-bet",
  game: "nlhe" as const,
  topic: "preflop",
  difficulty: 2,
  heroHand: "A♠ Q♠",
  board: [],
  prompt: "BTN mở 2.5bb, BB 3-bet lên 10bb. Stack hiệu dụng 100bb. Bạn chọn hành động nào?",
  actions: ["fold", "call", "raise"] as const,
  assumptions: [
    "Range BB và sizing được cố định cho demo.",
    "EV tính theo big blind, chưa mô phỏng toàn bộ game tree.",
    "Không dùng dữ liệu để tư vấn chơi theo thời gian thực."
  ]
};

export async function GET() {
  return NextResponse.json({
    data: {
      scenario,
      math: {
        requiredEquity: requiredEquity(15, 5),
        engineVersion: ENGINE_VERSION
      }
    },
    requestId: crypto.randomUUID()
  }, { headers: { "Cache-Control": "no-store" } });
}
