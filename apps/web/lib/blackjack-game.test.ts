import { describe, it, expect } from "vitest";
import {
  createRound,
  playAction,
  legalActions,
  handTotal,
  strategy,
  shuffledShoe,
  defaultRules,
  type TableRules,
} from "./blackjack-game";
import { pokerDrills, drillCallEv } from "./poker-drills";
const rules = { ...defaultRules };
function round(
  player: string[],
  up = "6h",
  overrides: Partial<TableRules> = {},
) {
  return createRound({ ...rules, ...overrides }, [
    player[0]!,
    up,
    player[1]!,
    "9c",
    "2d",
    "3d",
    "4d",
    "5d",
    "6d",
    "7d",
    "8d",
  ]);
}
describe("playable blackjack", () => {
  it("creates a full six-deck shoe", () => {
    const d = shuffledShoe(() => 0.5);
    expect(d).toHaveLength(312);
    expect(d.filter((c) => c === "As")).toHaveLength(6);
  });
  it("converts aces without busting", () => {
    expect(handTotal(["As", "Ad", "9c"])).toEqual({ total: 21, soft: true });
    expect(handTotal(["As", "6d", "9c"])).toEqual({ total: 16, soft: false });
  });
  it("pays 3:2 or 6:5 on an unsplit natural", () => {
    expect(round(["As", "Kh"]).net).toBe(15);
    expect(round(["As", "Kh"], "6h", { payout: 1.2 }).net).toBe(12);
  });
  it("pushes two naturals and checks the dealer before actions", () => {
    const r = createRound(rules, ["As", "Ah", "Ks", "Kh"]);
    expect(r.net).toBe(0);
    expect(legalActions(r)).toEqual([]);
    const loss = createRound(rules, ["9s", "Ah", "Ts", "Kh"]);
    expect(loss.net).toBe(-10);
    expect(loss.phase).toBe("settled");
  });
  it("settles a push at equal totals", () => {
    const r = createRound(rules, ["Ts", "Th", "8d", "8c"]);
    expect(playAction(r, "stand").net).toBe(0);
  });
  it("distinguishes S17 from H17 dealer behavior", () => {
    const deck = ["Ts", "Ah", "8d", "6c", "4d"];
    const s = playAction(createRound(rules, deck), "stand");
    const h = playAction(
      createRound({ ...rules, dealerHitsSoft17: true }, deck),
      "stand",
    );
    expect(s.net).toBe(10);
    expect(h.net).toBe(-10);
    expect(h.dealer).toHaveLength(3);
  });
  it("double draws exactly once and settles two stakes", () => {
    const r = createRound(rules, ["5s", "6h", "6d", "Tc", "Td", "8c"]);
    const next = playAction(r, "double");
    expect(next.hands[0]!.cards).toHaveLength(3);
    expect(next.hands[0]!.bet).toBe(20);
    expect(next.net).toBe(20);
    expect(r.hands[0]!.cards).toHaveLength(2);
    expect(() => playAction(next, "double")).toThrow();
  });
  it("late surrender loses half and does not draw dealer cards", () => {
    const r = round(["Ts", "6d"], "Th");
    const next = playAction(r, "surrender");
    expect(next.net).toBe(-5);
    expect(next.dealer).toHaveLength(2);
    expect(
      legalActions(round(["Ts", "6d"], "Th", { surrender: false })),
    ).not.toContain("surrender");
  });
  it("split aces draw once and pay even money on 21", () => {
    const r = createRound(rules, ["As", "6h", "Ad", "Tc", "Ts", "Kd", "8c"]);
    const n = playAction(r, "split");
    expect(n.phase).toBe("settled");
    expect(n.net).toBe(20);
    expect(n.hands.every((h) => h.cards.length === 2 && h.net === 10)).toBe(
      true,
    );
  });
  it("split hands act in order and cannot resplit or surrender", () => {
    const r = createRound({ ...rules, doubleAfterSplit: false }, [
      "8s",
      "6h",
      "8d",
      "Tc",
      "3s",
      "2d",
      "8c",
    ]);
    let n = playAction(r, "split");
    expect(legalActions(n)).toEqual(["hit", "stand"]);
    n = playAction(n, "stand");
    expect(n.active).toBe(1);
    n = playAction(n, "stand");
    expect(n.phase).toBe("settled");
    expect(n.net).toBe(20);
  });
  it("busting ends the hand without drawing for dealer", () => {
    const r = createRound(rules, ["Ts", "6h", "9d", "Tc", "Ks"]);
    const n = playAction(r, "hit");
    expect(n.net).toBe(-10);
    expect(n.dealer).toHaveLength(2);
    expect(n.phase).toBe("settled");
  });
  it.each([
    [["Ts", "2d"], "3h", "hit"],
    [["Ts", "2d"], "4h", "stand"],
    [["As", "7d"], "6h", "double"],
    [["As", "7d"], "9h", "hit"],
    [["As", "7d"], "8h", "stand"],
    [["8s", "8d"], "Th", "split"],
    [["Ts", "6d"], "Th", "surrender"],
    [["5s", "6d"], "Ah", "hit"],
    [["5s", "5d"], "9h", "double"],
    [["Ts", "Kd"], "6h", "stand"],
  ] as const)("uses the multi-deck reference for %j against %s", (p, u, a) => {
    expect(strategy(round([...p], u)).action).toBe(a);
  });
  it("adapts to H17, no surrender and no DAS", () => {
    expect(
      strategy(round(["8s", "8d"], "Ah", { dealerHitsSoft17: true })).action,
    ).toBe("surrender");
    expect(
      strategy(round(["As", "7d"], "2h", { dealerHitsSoft17: true })).action,
    ).toBe("double");
    expect(
      strategy(round(["5s", "6d"], "Ah", { dealerHitsSoft17: true })).action,
    ).toBe("double");
    expect(
      strategy(round(["Ts", "6d"], "Th", { surrender: false })).action,
    ).toBe("hit");
    expect(
      strategy(round(["2s", "2d"], "2h", { doubleAfterSplit: false })).action,
    ).toBe("hit");
  });
});
describe("poker curriculum invariants", () => {
  it("uses unique cards and valid street lengths", () => {
    for (const d of pokerDrills) {
      expect(new Set([...d.hero, ...d.board]).size).toBe(
        d.hero.length + d.board.length,
      );
      expect(d.board.length).toBe(
        { Preflop: 0, Flop: 3, Turn: 4, River: 5 }[d.street as "Preflop"],
      );
      expect(d.options.some((o) => o.action === d.best)).toBe(true);
    }
  });
  it("grades calls from the supplied EV, not hand strength", () => {
    for (const d of pokerDrills.filter((d) => d.equity !== undefined)) {
      expect(d.best).toBe(drillCallEv(d)! > 0 ? "call" : "fold");
    }
    expect(drillCallEv(pokerDrills.find((d) => d.id === "river-catch")!)).toBe(
      5,
    );
  });
});
