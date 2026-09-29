import { describe, it, expect } from "vitest";
import { parseCards } from "./cards";
import { compareHandRanks } from "./poker";
import {
  evaluateVariant,
  variantDeck,
  calculateVariantEquity,
  generatePokerSpot,
  gradePokerDecision,
  type PokerVariant,
} from "./variants";
describe("variant rules and computed decision grading", () => {
  it("Omaha must use exactly two hole cards, even with a royal-flush board", () => {
    const board = parseCards("As Ks Qs Js Ts");
    expect(evaluateVariant("holdem", parseCards("2d 3h"), board).category).toBe(
      "straight-flush",
    );
    expect(
      evaluateVariant("omaha", parseCards("2d 3h 4c 5d"), board).category,
    ).toBe("high-card");
    expect(
      evaluateVariant("omaha", parseCards("9s 8s 2h 2c"), board).category,
    ).toBe("straight-flush");
  });
  it("Short Deck has 36 cards, flush over full house, A6789 and straight over trips", () => {
    expect(variantDeck("shortdeck")).toHaveLength(36);
    const straight = evaluateVariant(
      "shortdeck",
      parseCards("As 6d"),
      parseCards("7h 8c 9s"),
    );
    expect(straight.category).toBe("straight");
    expect(straight.kickers).toEqual([9]);
    const flush = evaluateVariant(
      "shortdeck",
      parseCards("As Js"),
      parseCards("9s 7s 6s"),
    );
    const boat = evaluateVariant(
      "shortdeck",
      parseCards("Ah Ad"),
      parseCards("Ac Kh Kd"),
    );
    expect(compareHandRanks(flush, boat)).toBe(1);
    const trips = evaluateVariant(
      "shortdeck",
      parseCards("Ah Ad"),
      parseCards("Ac Kh Qd"),
    );
    expect(compareHandRanks(straight, trips)).toBe(1);
    expect(() =>
      evaluateVariant("shortdeck", parseCards("2h 6s"), parseCards("7c 8s 9d")),
    ).toThrow();
  });
  it("Stud selects best five of seven without a community board", () => {
    expect(
      evaluateVariant("stud", parseCards("2h As Ks Qs Js Ts 3d")).category,
    ).toBe("straight-flush");
    expect(() =>
      evaluateVariant("stud", parseCards("As Ks Qs Js Ts"), parseCards("2h")),
    ).toThrow();
  });
  it("exact river equity includes split pots and grades a call from EV", () => {
    const e = calculateVariantEquity({
      variant: "holdem",
      hero: ["2h", "3d"],
      board: ["As", "Ks", "Qs", "Js", "Ts"],
      opponents: [
        ["4c", "5c"],
        ["Ad", "Ah"],
      ],
    });
    expect(e.equity).toBe(0.5);
    expect(e.tie).toBe(1);
    expect(e.standardError).toBe(0);
    expect(gradePokerDecision(e, 30, 10)).toMatchObject({
      callEv: 10,
      best: "call",
    });
    expect(gradePokerDecision(e, 10, 10).best).toBe("close");
  });
  it("a dominated hand folds when exact computed call EV is negative", () => {
    const e = calculateVariantEquity({
      variant: "holdem",
      hero: ["2c", "3c"],
      board: ["Ah", "Kd", "Qc", "Js", "9h"],
      opponents: [["Ts", "Th"]],
    });
    expect(e.equity).toBe(0);
    expect(gradePokerDecision(e, 30, 10)).toMatchObject({
      callEv: -10,
      best: "fold",
    });
  });
  it("validates blockers for every opponent combination", () => {
    expect(() =>
      calculateVariantEquity({
        variant: "holdem",
        hero: ["As", "Kh"],
        board: [],
        opponents: [["As", "Qd"]],
      }),
    ).toThrow();
  });
  it.each(["holdem", "omaha", "shortdeck", "stud"] as PokerVariant[])(
    "generates reproducible but varied %s scenarios without storing an answer",
    (variant) => {
      const a = generatePokerSpot(variant, 123, "late"),
        b = generatePokerSpot(variant, 456, "late");
      expect(generatePokerSpot(variant, 123, "late")).toEqual(a);
      expect(a.hero).not.toEqual(b.hero);
      expect(a).not.toHaveProperty("best");
      for (const opp of a.opponents) {
        expect(new Set([...a.hero, ...a.board, ...opp]).size).toBe(
          a.hero.length + a.board.length + opp.length,
        );
      }
      const e = calculateVariantEquity(a);
      expect(e.method).toBe("exact-range");
      expect(e.equity).toBeGreaterThanOrEqual(0);
      expect(e.equity).toBeLessThanOrEqual(1);
    },
  );
  it("samples both independent Stud runouts without reusing cards", () => {
    const s = generatePokerSpot("stud", 711, "early");
    const e = calculateVariantEquity({ ...s, samples: 200, seed: 91 });
    expect(e).toEqual(calculateVariantEquity({ ...s, samples: 200, seed: 91 }));
    expect(e.method).toBe("monte-carlo");
    expect(e.standardError).toBeGreaterThan(0);
  });
  it("marks uncertain near-threshold estimates as ungraded", () => {
    expect(
      gradePokerDecision(
        {
          equity: 0.25,
          standardError: 0.03,
          samples: 200,
          method: "monte-carlo",
          win: 0.25,
          tie: 0,
        },
        30,
        10,
      ).best,
    ).toBe("close");
  });
});
