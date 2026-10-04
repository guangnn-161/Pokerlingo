import { describe, expect, it } from "vitest";
import vectors from "./test-vectors/v1.json";
import {
  analyzePayoutTable,
  blackjackBasicStrategy,
  blackjackLegalActions,
  calculateHoldemEquity,
  callEvBb,
  compareHandRanks,
  evaluateBlackjack,
  evaluateFiveCardHand,
  expandRange,
  parseCards,
  pokerRake,
  removeBlockers,
  requiredEquity,
  rouletteEvenMoneyAnalysis,
  rouletteHouseEdge,
  sportsbookOverround
} from "./index";
import { calculateMath } from "./api";

describe("versioned math test vectors", () => {
  it("keeps the vectors tied to the active engine version", async () => {
    const { ENGINE_VERSION } = await import("./index");
    expect(vectors.engineVersion).toBe(ENGINE_VERSION);
  });

  it("calculates poker pot odds and call EV", () => {
    for (const vector of vectors.potOdds) {
      if ("potBeforeCallBb" in vector) {
        expect(requiredEquity(vector.potBeforeCallBb!, vector.callBb!)).toBe(vector.expected);
      } else {
        expect(callEvBb(vector.equity!, vector.finalPotBb!, vector.callBb!)).toBe(vector.expected);
      }
    }
  });

  it("expands common range classes into the documented combo counts", () => {
    for (const vector of vectors.rangeComboCounts) {
      expect(expandRange(vector.notation)).toHaveLength(vector.expected);
    }
  });

  it("evaluates five-card hand categories and kickers", () => {
    for (const vector of vectors.fiveCardHands) {
      const rank = evaluateFiveCardHand(parseCards(vector.cards));
      expect(rank).toEqual({ category: vector.category, categoryValue: vector.categoryValue, kickers: vector.kickers });
    }
    expect(compareHandRanks(evaluateFiveCardHand(parseCards(["As", "2d", "3h", "4c", "5s"])), evaluateFiveCardHand(parseCards(["2s", "3d", "4h", "5c", "6s"])))).toBe(-1);
  });

  it("calculates exact river equity including ties", () => {
    for (const vector of vectors.holdemEquity) {
      const result = calculateHoldemEquity(vector).result;
      expect(result.equity).toBe(vector.expectedEquity);
      expect(result.seed).toBeNull();
    }
  });

  it("rejects duplicate poker cards across known hands and board", () => {
    expect(() => calculateHoldemEquity({ heroCards: ["As", "Kd"], villainCards: ["As", "Qc"], board: ["2h", "3h", "4h"] })).toThrow(/Duplicate card/);
    expect(() => parseCards(["As", "A♠"])).toThrow(/Duplicate card/);
  });

  it("removes blockers and renormalizes surviving range weights", () => {
    const adjusted = removeBlockers(expandRange("AA:0.5"), parseCards(["As"]));
    expect(adjusted.combos).toHaveLength(3);
    expect(adjusted.combos.reduce((sum, combo) => sum + combo.weight, 0)).toBeCloseTo(1);
  });

  it("is reproducible for a fixed Monte Carlo seed", () => {
    const vector = vectors.monteCarlo;
    const input = { ...vector, method: "monte-carlo" as const };
    const first = calculateHoldemEquity(input);
    const second = calculateHoldemEquity(input);
    expect(first.result).toEqual(second.result);
    expect(first.result).toMatchObject({ ...vector.expected, samples: vector.samples, seed: vector.seed });
  });

  it("returns provenance metadata from the math calculator dispatcher", () => {
    const result = calculateMath({ game: "poker", calculation: "required-equity", potBb: 15, callBb: 5 });
    expect(result).toMatchObject({
      result: { requiredEquity: 0.25 },
      ruleset: { id: "poker-pot-odds", version: "1" },
      calculationMethod: "exact-formula",
      assumptions: expect.any(Array),
      engineVersion: vectors.engineVersion
    });
    expect(calculateMath({ game: "casino", calculation: "sportsbook-market", decimalOdds: [2, 2] }).result)
      .toMatchObject({ overround: 0, normalizedProbabilities: [0.5, 0.5] });
  });
});

describe("blackjack rules and casino math", () => {
  it("returns the natural-blackjack test vector", () => {
    const result = evaluateBlackjack(vectors.blackjackNatural);
    expect(result.result.bestEvUnits).toBe(vectors.blackjackNatural.expectedBestEvUnits);
    expect(result.result.dealerNaturalProbability).toBe(vectors.blackjackNatural.expectedDealerNaturalProbability);
    expect(result.ruleset.id).toBe("blackjack-6d-s17-das-ls-3to2");
  });

  it("shows different dealer policy under S17 and H17", () => {
    const state = { playerCards: ["9c", "7d"], dealerUpcard: "As" };
    const s17 = evaluateBlackjack({ ...state, ruleset: { id: "s17", version: "1", dealerHitsSoft17: false } });
    const h17 = evaluateBlackjack({ ...state, ruleset: { id: "h17", version: "1", dealerHitsSoft17: true } });
    expect(s17.result.actionValues).not.toEqual(h17.result.actionValues);
  });

  it("evaluates legal split decisions and handles repeated aces", () => {
    const playerCards = ["8c", "8d"];
    expect(blackjackLegalActions(playerCards)).toContain("split");
    const split = evaluateBlackjack({ playerCards, dealerUpcard: "Ts" });
    expect(split.result.actionValues.find((action) => action.action === "split")?.evUnits).toEqual(expect.any(Number));
    const aces = evaluateBlackjack({ playerCards: ["Ac", "Ad"], dealerUpcard: "6s" });
    expect(aces.result.actionValues.find((action) => action.action === "split")?.evUnits).toEqual(expect.any(Number));
  });

  it("keeps the legacy demo recommendation available", () => {
    expect(blackjackBasicStrategy(16, 10).action).toBe("hit");
  });

  it("matches the roulette and payout-table vectors", () => {
    for (const vector of vectors.roulette) {
      const wheel = vector.wheel as "european" | "american";
      const result = rouletteEvenMoneyAnalysis(wheel);
      expect(result.result.houseEdge).toBeCloseTo(vector.expectedHouseEdge, 12);
      expect(rouletteHouseEdge(wheel)).toBeCloseTo(vector.expectedHouseEdge, 12);
    }
    expect(analyzePayoutTable([
      { name: "win", probability: 0.5, netUnits: 1 },
      { name: "lose", probability: 0.5, netUnits: -1 }
    ]).result).toMatchObject({ expectedNetUnits: 0, houseEdge: 0, rtp: 1, varianceUnitsSquared: 1 });
    expect(sportsbookOverround([2, 2])).toBe(0);
  });

  it("applies rake caps and no-flop-no-drop", () => {
    expect(pokerRake(100, 0.05, 3, true)).toEqual({ rakeBb: 3, potAfterRakeBb: 97 });
    expect(pokerRake(100, 0.05, 3, false)).toEqual({ rakeBb: 0, potAfterRakeBb: 100 });
  });
});
