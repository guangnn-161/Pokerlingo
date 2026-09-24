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
  prompt: "BTN mở 2.5bb, SB 0.5bb, BB 3-bet lên tổng 10bb. Stack hiệu dụng 100bb. Bạn chọn hành động nào?",
  actions: ["fold", "call", "raise"] as const,
  assumptions: [
    "Pot trước quyết định là 13bb; Hero cần bổ sung 7.5bb để call.",
    "Range BB, rake và sizing 4-bet được cố định cho demo.",
    "EV tính theo big blind, chưa mô phỏng toàn bộ game tree sau flop.",
    "Không dùng dữ liệu để tư vấn chơi theo thời gian thực."
  ]
};

export async function GET() {
  return NextResponse.json({
    data: {
      scenario,
      math: {
        requiredEquity: requiredEquity(13, 7.5),
        engineVersion: ENGINE_VERSION
      }
    },
    requestId: crypto.randomUUID()
  }, { headers: { "Cache-Control": "no-store" } });
}
