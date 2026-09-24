import { NextResponse } from "next/server";
import { ENGINE_VERSION, requiredEquity } from "@pokerlingo/math";

const scenario = {
  id: "demo-btn-aqs-vs-3bet",
  title: "BTN holds AQs facing a BB 3-bet",
  game: "nlhe" as const,
  topic: "preflop",
  difficulty: 2,
  heroHand: "A♠ Q♠",
  board: [],
  prompt: "BTN opens 2.5bb, SB posts 0.5bb and BB 3-bets to 10bb total. Effective stack: 100bb. What is your action?",
  actions: ["fold", "call", "raise"] as const,
  assumptions: [
    "The pot before Hero acts is 13bb; calling costs Hero another 7.5bb.",
    "BB's range, rake and 4-bet sizing are fixed for this training drill.",
    "EV is expressed in big blinds and does not model the full postflop game tree.",
    "This educational simulation is not real-time poker advice."
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
