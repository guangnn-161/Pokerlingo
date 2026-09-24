import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: {
      xp: 320,
      level: 2,
      mastery: 68,
      quests: [
        { id: "pot-odds", title: "Làm 3 spot pot odds", progress: 2, target: 3 },
        { id: "daily", title: "Hoàn thành câu đố hôm nay", progress: 0, target: 1 }
      ],
      leaderboard: [
        { rank: 1, handle: "river_reader", score: 97 },
        { rank: 2, handle: "rangebuilder", score: 92 },
        { rank: 3, handle: "demo_learner", score: 86 }
      ],
      friends: [
        { handle: "chip_math", status: "Đã là bạn" },
        { handle: "equity_lab", status: "Đang chờ phản hồi" }
      ]
    },
    requestId: crypto.randomUUID()
  }, { headers: { "Cache-Control": "no-store" } });
}
