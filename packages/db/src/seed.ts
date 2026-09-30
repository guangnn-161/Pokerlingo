import { eq } from "drizzle-orm";
import { db } from "./index";
import { questTemplates, scenarios, users } from "./schema";

const scenarioRows = [
  {
    id: "pot-odds-flop-flush-draw", title: "Flop flush draw: pot odds", game: "nlhe", topic: "pot_odds",
    difficulty: 2, rulesVersion: "nlhe-v1", version: 1, status: "published" as const, source: "C learning seed",
    stateJson: JSON.stringify({ referenceActionType: "call", referenceEvBb: 2, selectedEvs: { fold: 0, call: 2, raise: 1 }, assumptions: ["Heads-up", "No rake"], engineVersion: "reference-v1", calculationMethod: "seed-reference" }),
    explanationMd: "Compare the call EV with the immediate price offered by the pot. Preserve the draw's equity assumptions when evaluating the decision.",
    tagsJson: JSON.stringify(["pot_odds", "flop", "draw"]),
  },
  {
    id: "pot-odds-turn-flush-draw", title: "Turn flush draw: price decision", game: "nlhe", topic: "pot_odds",
    difficulty: 3, rulesVersion: "nlhe-v1", version: 1, status: "published" as const, source: "C learning seed",
    stateJson: JSON.stringify({ referenceActionType: "call", referenceEvBb: 1.5, selectedEvs: { fold: 0, call: 1.5, raise: 0.8 }, assumptions: ["Heads-up", "No rake"], engineVersion: "reference-v1", calculationMethod: "seed-reference" }),
    explanationMd: "On the turn, the reduced number of cards to come changes the draw's price. Recalculate the pot odds instead of reusing the flop threshold.",
    tagsJson: JSON.stringify(["pot_odds", "turn", "draw"]),
  },
  {
    id: "river-break-even-bluff", title: "River: break-even bluff", game: "nlhe", topic: "bluff",
    difficulty: 4, rulesVersion: "nlhe-v1", version: 1, status: "published" as const, source: "C learning seed",
    stateJson: JSON.stringify({ referenceActionType: "raise", referenceActionSize: "2.5x", referenceEvBb: 2, selectedEvs: { fold: 0, call: 0.5, raise: 2 }, assumptions: ["Heads-up", "No rake"], engineVersion: "reference-v1", calculationMethod: "seed-reference" }),
    explanationMd: "A river bluff should be checked against the break-even fold frequency implied by the sizing and value/bluff composition.",
    tagsJson: JSON.stringify(["bluff", "river", "break_even"]),
  },
];

const questRows = [
  { id: "daily-pot-odds-3", cadence: "daily" as const, key: "Solve 3 pot-odds spots", rulesJson: JSON.stringify({ target: 3 }), xpReward: 15, version: 1, active: 1 },
  { id: "weekly-ev-loss", cadence: "weekly" as const, key: "Keep average EV loss below 0.50bb", rulesJson: JSON.stringify({ target: 5, maxEvLossBb: 0.5 }), xpReward: 50, version: 1, active: 1 },
  { id: "recovery-pot-odds", cadence: "recovery" as const, key: "Review 3 pot-odds mistakes", rulesJson: JSON.stringify({ target: 3 }), xpReward: 25, version: 1, active: 1 },
];

async function main() {
  const [admin] = await db.select().from(users).where(eq(users.email, "admin@pokerlingo.local"));
  if (!admin) await db.insert(users).values({ id: "dev-admin", email: "admin@pokerlingo.local", name: "Development Admin", role: "admin" });
  for (const row of scenarioRows) {
    await db.insert(scenarios).values(row).onConflictDoNothing({ target: scenarios.id });
  }
  for (const row of questRows) {
    await db.insert(questTemplates).values(row).onConflictDoNothing({ target: questTemplates.id });
  }
}
main().then(() => process.exit(0)).catch((error) => { console.error(error); process.exit(1); });
