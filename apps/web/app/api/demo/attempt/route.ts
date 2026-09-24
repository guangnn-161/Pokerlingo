import { NextResponse } from "next/server";
import { demoAttemptRequestSchema } from "@pokerlingo/contracts/demo";

const values = { fold: 0, call: -0.15, raise: 0.12 } as const;
const explanations = {
  fold: "Fold không mất thêm chip nhưng bỏ lỡ một spot 4-bet có EV dương theo range giả định.",
  call: "Call để chơi postflop có EV thấp hơn do bất lợi vị trí/range trong giả định demo.",
  raise: "4-bet là lựa chọn tham chiếu trong demo vì blocker A và equity của AQs trước range BB."
} as const;

export async function POST(request: Request) {
  const parsed = demoAttemptRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.scenarioId !== "demo-btn-aqs-vs-3bet") {
    return NextResponse.json({ code: "INVALID_REQUEST", message: "Dữ liệu attempt demo không hợp lệ.", requestId: crypto.randomUUID() }, { status: 400 });
  }
  const selectedEvBb = values[parsed.data.action];
  const evLossBb = Math.max(0, values.raise - selectedEvBb);
  return NextResponse.json({
    data: {
      selectedAction: parsed.data.action,
      recommendedAction: "raise",
      selectedEvBb,
      evLossBb,
      score: Math.max(0, Math.round(100 - evLossBb * 100)),
      explanation: explanations[parsed.data.action],
      assumptions: ["Kết quả là fixture demo, chưa được lưu vào database.", "Bản production sẽ gọi engine B và scoring service C."],
      demo: true
    },
    requestId: crypto.randomUUID()
  });
}
