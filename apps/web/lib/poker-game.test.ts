import { describe, it, expect } from "vitest";
import {
  actPoker,
  newPokerGame,
  pokerLegal,
  pokerPot,
  observeBot,
  chooseBotAction,
  type PokerGame,
} from "./poker-game";
import { seededRandom } from "@pokerlingo/math";
describe("six-max Holdem table", () => {
  it("deals six distinct hands, posts blinds and starts UTG", () => {
    const g = newPokerGame(12);
    expect(g.players).toHaveLength(6);
    expect(g.actor).toBe(0);
    expect(pokerPot(g)).toBe(3);
    expect(new Set(g.players.flatMap((p) => p.hole)).size).toBe(12);
    expect(pokerLegal(g).call).toBe(2);
    expect(() => actPoker(g, { type: "check" })).toThrow();
    expect(() => actPoker(g, { type: "raise", to: 3 })).toThrow();
  });
  it("gives BB an option after everyone limps and starts flop left of dealer", () => {
    let g = newPokerGame(1);
    for (let i = 0; i < 5; i++) g = actPoker(g, { type: "call" });
    expect(g.actor).toBe(5);
    expect(g.street).toBe("Preflop");
    g = actPoker(g, { type: "check" });
    expect(g.street).toBe("Flop");
    expect(g.actor).toBe(4);
    expect(g.board).toHaveLength(3);
    expect(pokerPot(g)).toBe(12);
  });
  it("awards an uncontested pot without exposing folded cards", () => {
    let g = newPokerGame(1);
    for (let i = 0; i < 5; i++) g = actPoker(g, { type: "fold" });
    expect(g.street).toBe("Complete");
    expect(g.reveal).toBe(false);
    expect(g.awards[0]!.winners).toEqual([5]);
    expect(g.players.reduce((s, p) => s + p.stack, 0)).toBe(1200);
    const next = newPokerGame(2, g);
    expect(next.dealer).toBe(4);
    expect(next.hand).toBe(2);
  });
  it("does not reopen action after a short all-in; cumulative full raises do", () => {
    let g = newPokerGame(4);
    g = actPoker(g, { type: "raise", to: 10 });
    g.players[1]!.stack = 13;
    g = actPoker(g, { type: "raise", to: 13 });
    for (let n = 0; n < 4; n++) g = actPoker(g, { type: "call" });
    expect(g.actor).toBe(0);
    expect(pokerLegal(g).call).toBe(3);
    expect(pokerLegal(g).canRaise).toBe(false);
    expect(() => actPoker(g, { type: "raise", to: 30 })).toThrow();
  });
  it("runs out multiway all-ins and conserves chips", () => {
    let g = newPokerGame(21);
    g = actPoker(g, { type: "raise", to: 200 });
    while (g.street !== "Complete") g = actPoker(g, { type: "call" });
    expect(g.board).toHaveLength(5);
    expect(g.awards.reduce((s, a) => s + a.amount, 0)).toBe(1200);
    expect(g.players.reduce((s, p) => s + p.stack, 0)).toBe(1200);
    expect(g.reveal).toBe(true);
  });
  it("reopens after cumulative short raises reach the last full raise", () => {
    let g = actPoker(newPokerGame(4), { type: "raise", to: 10 });
    g.players[1]!.stack = 13;
    g = actPoker(g, { type: "raise", to: 13 });
    g.players[2]!.stack = 18;
    g = actPoker(g, { type: "raise", to: 18 });
    for (let n = 0; n < 3; n++) g = actPoker(g, { type: "call" });
    expect(g.actor).toBe(0);
    expect(pokerLegal(g).canRaise).toBe(true);
    expect(pokerLegal(g).minTo).toBe(26);
  });
  it("a short opening all-in cannot be completed or reopen a prior check", () => {
    const g = newPokerGame(1);
    g.street = "Flop";
    g.board = ["2h", "7c", "Jd"];
    g.currentBet = 1;
    g.minRaise = 2;
    g.actor = 0;
    g.players[0]!.bet = 0;
    g.players[0]!.actedAt = null;
    expect(pokerLegal(g).minTo).toBe(3);
    expect(() => actPoker(g, { type: "raise", to: 2 })).toThrow();
    g.players[0]!.actedAt = 0;
    expect(pokerLegal(g).canRaise).toBe(false);
  });
  it("distinct bot profiles make measurably different decisions for the same information", () => {
    const g = newPokerGame(4);
    g.actor = 1;
    const o = observeBot(g);
    o.hole = ["Jh", "Tc"];
    o.legal.call = 20;
    o.pot = 30;
    const rates = Array.from({ length: 5 }, (_, style) => {
      const random = seededRandom(12),
        counts = { raise: 0, call: 0, fold: 0, check: 0 };
      for (let n = 0; n < 1000; n++)
        counts[chooseBotAction({ ...o, style }, random).type]++;
      return counts;
    });
    expect(rates[0]!.fold).toBeGreaterThan(rates[1]!.fold);
    expect(rates[2]!.call).toBeGreaterThan(rates[4]!.call);
    expect(rates[4]!.raise).toBeGreaterThan(rates[3]!.raise);
  });
  it("splits main/side pots by eligibility, refunds unmatched chips", () => {
    const g = newPokerGame(1);
    g.street = "River";
    g.board = ["2s", "3h", "7c", "9d", "Jc"];
    const hands = [
      ["As", "Ah"],
      ["Ks", "Kh"],
      ["Qs", "Qh"],
      ["4c", "5c"],
      ["6s", "8s"],
      ["Td", "4d"],
    ];
    g.players.forEach((p, i) => {
      p.hole = hands[i]!;
      p.folded = i > 2;
      p.invested = [20, 50, 80, 0, 0, 0][i]!;
      p.bet = 0;
      p.stack = 0;
      p.actedAt = 0;
    });
    g.players[2]!.stack = 1;
    g.actor = 2;
    g.currentBet = 0;
    const out = actPoker(g, { type: "check" });
    expect(out.players[0]!.stack).toBe(60);
    expect(out.players[1]!.stack).toBe(60);
    expect(out.players[2]!.stack).toBe(31);
    expect(out.awards.map((a) => a.label)).toEqual([
      "Main pot",
      "Side pot",
      "Uncalled chips returned",
    ]);
  });
  it("splits tied board pots and assigns odd chips clockwise from button", () => {
    const g = newPokerGame(1);
    g.street = "River";
    g.board = ["As", "Ks", "Qs", "Js", "Ts"];
    g.currentBet = 0;
    g.actor = 0;
    g.players.forEach((p, i) => {
      p.hole = [`${i + 2}h`, `${i + 2}d`];
      p.invested = i < 3 ? 1 : 0;
      p.bet = 0;
      p.folded = i > 1;
      p.actedAt = 0;
      p.stack = 0;
    });
    g.players[0]!.stack = 1;
    const out = actPoker(g, { type: "check" });
    expect(out.players[0]!.stack).toBe(3);
    expect(out.players[1]!.stack).toBe(1);
  });
  it("keeps dead blind money in the main pot when live players have equal stakes", () => {
    const g = newPokerGame(1);
    g.street = "River";
    g.board = ["2s", "3h", "7c", "9d", "Jc"];
    g.currentBet = 0;
    g.actor = 0;
    g.players.forEach((p, i) => {
      p.invested = i < 2 ? 200 : i === 2 ? 1 : 0;
      p.bet = 0;
      p.stack = 0;
      p.folded = i > 1;
      p.actedAt = 0;
    });
    g.players[0]!.hole = ["As", "Ah"];
    g.players[1]!.hole = ["Ks", "Kh"];
    g.players[0]!.stack = 1;
    const out = actPoker(g, { type: "check" });
    expect(out.awards).toEqual([
      { amount: 401, winners: [0], label: "Main pot" },
    ]);
    expect(out.players[0]!.stack).toBe(402);
  });
  it("bot observation never includes deck or opponent hole cards", () => {
    const g = newPokerGame(1);
    g.actor = 1;
    const o = observeBot(g);
    const before = JSON.stringify(o);
    g.players[0]!.hole = ["As", "Ah"];
    g.deck.reverse();
    expect(JSON.stringify(observeBot(g))).toBe(before);
    expect(Object.keys(o).sort()).toEqual([
      "bet",
      "board",
      "hole",
      "legal",
      "opponents",
      "pot",
      "style",
    ]);
  });
  it("all five styles finish repeated hands with legal actions and chip conservation", () => {
    const random = seededRandom(77);
    let last: PokerGame | undefined;
    for (let hand = 0; hand < 50; hand++) {
      let g = newPokerGame(hand + 200, last),
        total = g.players.reduce((s, p) => s + p.stack + p.invested, 0),
        steps = 0;
      while (g.street !== "Complete") {
        const legal = pokerLegal(g);
        const a =
          g.actor === 0
            ? legal.canCheck
              ? { type: "check" as const }
              : { type: "call" as const }
            : chooseBotAction(observeBot(g), random);
        g = actPoker(g, a);
        expect(++steps).toBeLessThan(300);
        expect(g.players.every((p) => p.stack >= 0)).toBe(true);
      }
      expect(g.players.reduce((s, p) => s + p.stack, 0)).toBe(total);
      last = g;
    }
  });
});
