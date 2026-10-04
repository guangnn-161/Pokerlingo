import { NextResponse } from "next/server";
import { demoAttemptRequestSchema } from "@pokerlingo/contracts/demo";

const values = { fold: 0, call: -0.15, raise: 0.12 } as const;
const explanations = {
  fold: "Folding avoids investing another 7.5bb, but gives up a positive-EV 4-bet opportunity in this fixed range model.",
  call: "Calling takes a lower-EV postflop route against BB's stronger range under this drill's assumptions.",
  raise: "4-betting is the reference action because AQs has useful ace blockers and retains equity when BB continues."
} as const;

export async function POST(request: Request) {
  const parsed = demoAttemptRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.scenarioId !== "demo-btn-aqs-vs-3bet") {
    return NextResponse.json({ code: "INVALID_REQUEST", message: "The drill attempt is invalid.", requestId: crypto.randomUUID() }, { status: 400 });
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
      assumptions: ["This result is a demo fixture and is not stored in the database.", "Production will use B's range/equity engine and C's scoring service."],
      demo: true
    },
    requestId: crypto.randomUUID()
  });
}
