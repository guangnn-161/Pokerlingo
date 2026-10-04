import { formatCard, parseCards } from "./cards";
import { analyzePayoutTable, PayoffOutcome, rouletteEvenMoneyAnalysis, simulateFixedStakeRisk, sportsbookMarket } from "./casino";
import { BlackjackRules, evaluateBlackjack } from "./blackjack";
import {
  betEvBb,
  calculateHoldemEquity,
  callEvBb,
  expandRange,
  pokerRake,
  requiredEquity
} from "./poker";
import { calculationResult, CalculationResult } from "./types";

export type MathCalculationRequest =
  | { game: "poker"; calculation: "required-equity"; potBb: number; callBb: number }
  | { game: "poker"; calculation: "call-ev"; equity: number; finalPotBb: number; callBb: number }
  | { game: "poker"; calculation: "bet-ev"; foldProbability: number; equityWhenCalled: number; potBb: number; riskBb: number; villainCallBb: number }
  | { game: "poker"; calculation: "equity"; heroCards: string[]; board?: string[]; villainCards?: string[]; villainRange?: string; method?: "auto" | "exact" | "monte-carlo"; samples?: number; seed?: number }
  | { game: "poker"; calculation: "range-parse"; notation: string; blockers?: string[] }
  | { game: "poker"; calculation: "rake"; potBb: number; percent: number; capBb: number; flopSeen?: boolean }
  | { game: "blackjack"; calculation: "hand-ev"; playerCards: string[]; dealerUpcard: string; ruleset?: Partial<BlackjackRules> }
  | { game: "casino"; calculation: "roulette-even-money"; wheel: "european" | "american" }
  | { game: "casino"; calculation: "sportsbook-market"; decimalOdds: number[] }
  | { game: "casino"; calculation: "payout-table"; outcomes: PayoffOutcome[] }
  | { game: "casino"; calculation: "risk-simulation"; outcomes: PayoffOutcome[]; stake: number; rounds: number; simulations?: number; seed?: number; lossLimit?: number };

export function calculateMath(input: MathCalculationRequest): CalculationResult<unknown> {
  if (input.game === "poker") {
    if (input.calculation === "required-equity") {
      return calculationResult(
        { requiredEquity: requiredEquity(input.potBb, input.callBb) },
        { id: "poker-pot-odds", version: "1" },
        "exact-formula",
        ["Pot is the amount available before hero calls; callBb is additional money required to call."]
      );
    }
    if (input.calculation === "call-ev") {
      return calculationResult(
        { evBb: callEvBb(input.equity, input.finalPotBb, input.callBb) },
        { id: "poker-call-ev", version: "1" },
        "exact-formula",
        ["finalPotBb is the pot awarded to the winner after hero calls; EV is relative to the decision point."]
      );
    }
    if (input.calculation === "bet-ev") {
      return calculationResult(
        { evBb: betEvBb(input) },
        { id: "poker-bet-ev", version: "1" },
        "exact-formula",
        ["Fold probability and equity when called are supplied assumptions.", "The formula treats riskBb as the additional bet and excludes rake."]
      );
    }
    if (input.calculation === "equity") return calculateHoldemEquity(input);
    if (input.calculation === "range-parse") {
      const combos = expandRange(input.notation);
      const blockers = input.blockers?.length ? parseCards(input.blockers) : [];
      const blockerSet = new Set(blockers.map((card) => `${card.rank}${card.suit}`));
      const available = combos.filter(({ cards }) => cards.every((card) => !blockerSet.has(`${card.rank}${card.suit}`)));
      const totalWeight = available.reduce((sum, combo) => sum + combo.weight, 0);
      return calculationResult(
        {
          comboCount: available.length,
          handClasses: [...new Set(combos.map((combo) => combo.notation))].length,
          totalWeight,
          combos: available.map((combo) => ({
            cards: combo.cards.map(formatCard),
            notation: combo.notation,
            normalizedWeight: totalWeight ? combo.weight / totalWeight : 0
          }))
        },
        { id: "nlhe-range-notation", version: "1" },
        "exact-enumeration",
        ["Supported notation includes pair/suited/offsuit classes, `+`, same-high-card intervals, and per-class `:weight`.", "Weights are normalized after blockers."]
      );
    }
    const result = pokerRake(input.potBb, input.percent, input.capBb, input.flopSeen);
    return calculationResult(
      result,
      { id: "poker-rake", version: "1" },
      "exact-formula",
      ["Rake is taken only when flopSeen is true, using the supplied percentage and cap."]
    );
  }

  if (input.game === "blackjack") return evaluateBlackjack(input);
  if (input.calculation === "roulette-even-money") return rouletteEvenMoneyAnalysis(input.wheel);
  if (input.calculation === "sportsbook-market") {
    return calculationResult(
      sportsbookMarket(input.decimalOdds),
      { id: "sportsbook-market-overround", version: "1" },
      "exact-formula",
      ["Raw implied probability is 1 / decimal odds; normalized probabilities divide by the sum of raw implied probabilities.", "Normalized probabilities remove overround proportionally and are not objective event probabilities."]
    );
  }
  if (input.calculation === "payout-table") return analyzePayoutTable(input.outcomes);
  return simulateFixedStakeRisk(input);
}
