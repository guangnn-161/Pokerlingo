import { describe, it, expect } from "vitest";
import {
  hiLo,
  runningCount,
  trueCount,
  exposedCards,
  advanceCountingShoe,
  emptyCountingShoe,
  shoeCount,
  countingDeck,
} from "./card-counting";
import { createRound, playAction, defaultRules } from "./blackjack-game";
describe("Hi-Lo learning engine", () => {
  it("tags every rank and balances each full shoe", () => {
    expect([..."23456789TJQKA"].map((r) => hiLo(r + "s"))).toEqual([
      1, 1, 1, 1, 1, 0, 0, 0, -1, -1, -1, -1, -1,
    ]);
    for (const n of [1, 2, 6]) {
      const deck = countingDeck(n);
      expect(deck).toHaveLength(52 * n);
      expect(runningCount(deck)).toBe(0);
      expect(deck.filter((c) => c === "As")).toHaveLength(n);
    }
    expect(() => hiLo("1x")).toThrow();
  });
  it("normalizes positive and negative counts without integer-rounding ambiguity", () => {
    expect(trueCount(6, 156)).toBe(2);
    expect(trueCount(-5, 104)).toBe(-2.5);
    expect(trueCount(0, 0)).toBeNull();
  });
  it("does not peek at the dealer hole card or count split cards twice", () => {
    const r = createRound(defaultRules, [
      "8s",
      "6h",
      "8d",
      "Tc",
      "3s",
      "2d",
      "9h",
      "4c",
      "Ts",
    ]);
    expect(exposedCards(r)).toEqual(["8s", "8d", "6h"]);
    const split = playAction(r, "split");
    expect(exposedCards(split)).toHaveLength(5);
    expect(exposedCards(split)).not.toContain("Tc");
    const settled = playAction(playAction(split, "stand"), "stand");
    expect(exposedCards(settled)).toHaveLength(7);
    expect(runningCount(exposedCards(settled))).toBe(2);
  });
  it("retains the remaining shoe and running count across hands", () => {
    const fresh = () => [
      "Ts",
      "Th",
      "8s",
      "8h",
      ...countingDeck(6).slice(0, 308),
    ];
    let state = advanceCountingShoe(emptyCountingShoe(), defaultRules, fresh);
    expect(() => advanceCountingShoe(state, defaultRules, fresh)).toThrow();
    state = { ...state, round: playAction(state.round!, "stand") };
    const before = shoeCount(state);
    const next = advanceCountingShoe(state, defaultRules, fresh);
    expect(next.number).toBe(1);
    expect(next.previous).toEqual(exposedCards(state.round!));
    expect(next.round!.deck).toHaveLength(304);
    expect(before.running).toBe(-2);
    expect(shoeCount(next).unseen).toBe(
      312 - next.previous.length - exposedCards(next.round!).length,
    );
  });
  it("resets counts only when reaching the cut card between rounds", () => {
    const r = playAction(
      createRound(defaultRules, [
        "Ts",
        "Th",
        "8s",
        "8h",
        ...countingDeck(2).slice(0, 78),
      ]),
      "stand",
    );
    const next = advanceCountingShoe(
      { round: r, previous: ["2s"], number: 4 },
      defaultRules,
    );
    expect(next.previous).toEqual([]);
    expect(next.number).toBe(5);
    expect(next.round!.deck).toHaveLength(308);
  });
});
