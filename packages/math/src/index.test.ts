import { describe, expect, it } from "vitest";
import { blackjackBasicStrategy, requiredEquity, rouletteHouseEdge, sportsbookOverround } from "./index";

describe("demo math engine", () => {
  it("calculates pot odds", () => expect(requiredEquity(15, 5)).toBe(0.25));
  it("uses expected roulette edges", () => expect(rouletteHouseEdge("european")).toBeCloseTo(1 / 37));
  it("calculates overround", () => expect(sportsbookOverround([2, 2])).toBe(0));
  it("returns a basic blackjack recommendation", () => expect(blackjackBasicStrategy(16, 10).action).toBe("hit"));
});
