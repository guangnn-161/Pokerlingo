import {
  compareHandRanks,
  evaluateHoldemHand,
  fullDeck,
  formatCard,
  parseCards,
  seededRandom,
  shuffleCards,
} from "@pokerlingo/math";

export const BOT_STYLES = [
  {
    name: "Atlas",
    style: "Tight aggressive",
    detail: "Selective starting hands; bets and raises strong holdings.",
    looseness: -0.1,
    aggression: 0.72,
    bluff: 0.05,
  },
  {
    name: "Nova",
    style: "Loose aggressive",
    detail: "Enters more pots and applies pressure with frequent raises.",
    looseness: 0.08,
    aggression: 0.85,
    bluff: 0.2,
  },
  {
    name: "Moss",
    style: "Calling station",
    detail: "Calls a wide range; rarely turns a hand into a bluff.",
    looseness: 0.2,
    aggression: 0.1,
    bluff: 0.01,
  },
  {
    name: "Iris",
    style: "Tight passive",
    detail: "Waits for strong hands and often chooses a call over a raise.",
    looseness: -0.14,
    aggression: 0.18,
    bluff: 0.01,
  },
  {
    name: "Blaze",
    style: "Maniac",
    detail: "Very wide range, big bets and frequent bluffs.",
    looseness: 0.24,
    aggression: 0.95,
    bluff: 0.38,
  },
] as const;
export type PokerSeat = {
  name: string;
  stack: number;
  startStack: number;
  hole: string[];
  bet: number;
  invested: number;
  folded: boolean;
  actedAt: number | null;
  lastAction: string;
};
export type PokerAction =
  | { type: "fold" }
  | { type: "check" }
  | { type: "call" }
  | { type: "raise"; to: number };
export type PokerGame = {
  players: PokerSeat[];
  board: string[];
  deck: string[];
  dealer: number;
  actor: number;
  street: "Preflop" | "Flop" | "Turn" | "River" | "Complete";
  currentBet: number;
  minRaise: number;
  hand: number;
  log: string[];
  awards: { amount: number; winners: number[]; label: string }[];
  reveal: boolean;
};
export const BIG_BLIND = 2;
const nextSeat = (seat: number) => (seat + 1) % 6;
const live = (g: PokerGame) =>
  g.players.map((p, i) => ({ p, i })).filter(({ p }) => !p.folded);
export const pokerPot = (g: PokerGame) =>
  g.players.reduce((sum, p) => sum + p.invested, 0);
export function pokerLegal(g: PokerGame) {
  const p = g.players[g.actor];
  if (g.street === "Complete" || !p || p.folded || !p.stack)
    return { call: 0, canCheck: false, canRaise: false, minTo: 0, maxTo: 0 };
  const owed = Math.max(0, g.currentBet - p.bet),
    maxTo = p.bet + p.stack;
  const reopened = p.actedAt === null || g.currentBet - p.actedAt >= g.minRaise;
  const canRaise =
    reopened &&
    maxTo > g.currentBet &&
    live(g).some(({ p: q, i }) => i !== g.actor && q.stack > 0);
  return {
    call: Math.min(p.stack, owed),
    canCheck: owed === 0,
    canRaise,
    minTo: g.currentBet + g.minRaise,
    maxTo,
  };
}
function pay(p: PokerSeat, amount: number) {
  p.stack -= amount;
  p.bet += amount;
  p.invested += amount;
}
function award(g: PokerGame, amount: number, winners: number[], label: string) {
  const ordered = [...winners].sort(
    (a, b) => ((a - g.dealer + 5) % 6) - ((b - g.dealer + 5) % 6),
  );
  const share = Math.floor(amount / winners.length),
    odd = amount % winners.length;
  ordered.forEach((i, k) => (g.players[i]!.stack += share + Number(k < odd)));
  g.awards.push({ amount, winners: ordered, label });
}
function finish(g: PokerGame) {
  const remaining = live(g);
  g.reveal = remaining.length > 1;
  if (remaining.length === 1)
    award(g, pokerPot(g), [remaining[0]!.i], "Uncontested pot");
  else {
    const levels = [
      ...new Set(
        [
          ...remaining.map(({ p }) => p.invested),
          Math.max(...g.players.map((p) => p.invested)),
        ].filter(Boolean),
      ),
    ].sort((a, b) => a - b);
    let previous = 0;
    for (const level of levels) {
      const contributors = g.players
        .map((p, i) => ({ p, i }))
        .filter(({ p }) => p.invested > previous);
      const amount = contributors.reduce(
        (sum, { p }) => sum + Math.min(p.invested, level) - previous,
        0,
      );
      previous = level;
      if (contributors.length === 1) {
        award(g, amount, [contributors[0]!.i], "Uncalled chips returned");
        continue;
      }
      const eligible = contributors.filter(
        ({ p }) => !p.folded && p.invested >= level,
      );
      if (!eligible.length) throw new Error("Pot has no eligible player.");
      let winners = [eligible[0]!.i],
        best = evaluateHoldemHand(
          parseCards(eligible[0]!.p.hole),
          parseCards(g.board),
        );
      for (const { p, i } of eligible.slice(1)) {
        const rank = evaluateHoldemHand(
          parseCards(p.hole),
          parseCards(g.board),
        );
        const cmp = compareHandRanks(rank, best);
        if (cmp > 0) {
          best = rank;
          winners = [i];
        } else if (cmp === 0) winners.push(i);
      }
      award(g, amount, winners, g.awards.length ? "Side pot" : "Main pot");
    }
  }
  g.street = "Complete";
  g.actor = -1;
  for (const a of g.awards)
    g.log.push(
      `${a.label}: ${a.amount} chips → ${a.winners.map((i) => g.players[i]!.name).join(" + ")}`,
    );
}
function advance(g: PokerGame, after: number) {
  if (live(g).length === 1) {
    finish(g);
    return;
  }
  const canAct = live(g).filter(({ p }) => p.stack > 0);
  const needs = canAct.filter(
    ({ p }) =>
      p.bet < g.currentBet || (p.actedAt === null && canAct.length > 1),
  );
  if (needs.length) {
    for (let n = 1; n <= 6; n++) {
      const i = (after + n) % 6;
      if (needs.some((x) => x.i === i)) {
        g.actor = i;
        return;
      }
    }
  }
  if (g.street === "River") {
    finish(g);
    return;
  }
  const count = g.street === "Preflop" ? 3 : 1;
  g.deck.shift(); // Burn one card before each community street.
  g.board.push(...g.deck.splice(0, count));
  g.street =
    g.street === "Preflop" ? "Flop" : g.street === "Flop" ? "Turn" : "River";
  g.currentBet = 0;
  g.minRaise = BIG_BLIND;
  g.players.forEach((p) => {
    p.bet = 0;
    p.actedAt = null;
  });
  g.log.push(`${g.street}: ${g.board.join(" ")}`);
  advance(g, g.dealer);
}
export function newPokerGame(seed: number, previous?: PokerGame): PokerGame {
  if (previous && previous.street !== "Complete")
    throw new Error("Finish the hand first.");
  const dealer = previous ? nextSeat(previous.dealer) : 3;
  const players = ["You", ...BOT_STYLES.map((b) => b.name)].map((name, i) => {
    const stack = previous?.players[i]?.stack || 200;
    return {
      name,
      stack,
      startStack: stack,
      hole: [] as string[],
      bet: 0,
      invested: 0,
      folded: false,
      actedAt: null,
      lastAction: "",
    } as PokerSeat;
  });
  const deck = shuffleCards(fullDeck().map(formatCard), seededRandom(seed));
  for (let n = 0; n < 2; n++)
    for (let offset = 1; offset <= 6; offset++)
      players[(dealer + offset) % 6]!.hole.push(deck.shift()!);
  const g: PokerGame = {
    players,
    board: [],
    deck,
    dealer,
    actor: -1,
    street: "Preflop",
    currentBet: 2,
    minRaise: 2,
    hand: (previous?.hand ?? 0) + 1,
    log: [],
    awards: [],
    reveal: false,
  };
  if (previous)
    previous.players.forEach((p, i) => {
      if (!p.stack)
        g.log.push(`${players[i]!.name} reloads 200 practice chips.`);
    });
  const sb = nextSeat(dealer),
    bb = nextSeat(sb);
  pay(players[sb]!, Math.min(1, players[sb]!.stack));
  pay(players[bb]!, Math.min(2, players[bb]!.stack));
  players[sb]!.lastAction = "Small blind";
  players[bb]!.lastAction = "Big blind";
  g.log.push(
    `Hand ${g.hand}. ${players[sb]!.name} posts SB; ${players[bb]!.name} posts BB.`,
  );
  advance(g, bb);
  return g;
}
export function actPoker(game: PokerGame, action: PokerAction): PokerGame {
  if (game.street === "Complete") throw new Error("This hand is complete.");
  const g: PokerGame = {
    ...game,
    players: game.players.map((p) => ({ ...p, hole: [...p.hole] })),
    deck: [...game.deck],
    board: [...game.board],
    log: [...game.log],
    awards: [...game.awards],
  };
  const i = g.actor,
    p = g.players[i]!,
    legal = pokerLegal(g);
  if (action.type === "fold") {
    p.folded = true;
    p.lastAction = "Fold";
  } else if (action.type === "check") {
    if (!legal.canCheck) throw new Error("Cannot check facing a bet.");
    p.lastAction = "Check";
  } else if (action.type === "call") {
    if (!legal.call) throw new Error("Nothing to call.");
    pay(p, legal.call);
    p.lastAction = `Call ${legal.call}${p.stack === 0 ? " · all-in" : ""}`;
  } else {
    const to = action.to;
    if (
      !legal.canRaise ||
      !Number.isInteger(to) ||
      to > legal.maxTo ||
      to <= g.currentBet ||
      (to < legal.minTo && to !== legal.maxTo)
    )
      throw new Error("Illegal raise size or betting not reopened.");
    const increment = to - g.currentBet;
    pay(p, to - p.bet);
    if (increment >= g.minRaise) g.minRaise = increment;
    g.currentBet = to;
    p.lastAction = `${game.currentBet ? "Raise" : "Bet"} to ${to}${p.stack === 0 ? " · all-in" : ""}`;
  }
  p.actedAt = g.currentBet;
  g.log.push(`${p.name}: ${p.lastAction}`);
  advance(g, i);
  return g;
}

// Only public information and this bot's own cards cross this boundary.
export type BotObservation = {
  hole: string[];
  board: string[];
  opponents: number;
  pot: number;
  legal: ReturnType<typeof pokerLegal>;
  bet: number;
  style: number;
};
export function observeBot(g: PokerGame): BotObservation {
  const p = g.players[g.actor]!;
  return {
    hole: [...p.hole],
    board: [...g.board],
    opponents: live(g).length - 1,
    pot: pokerPot(g),
    legal: pokerLegal(g),
    bet: p.bet,
    style: g.actor - 1,
  };
}
export function chooseBotAction(
  o: BotObservation,
  random: () => number,
): PokerAction {
  const style = BOT_STYLES[o.style];
  if (!style) throw new Error("Unknown bot profile.");
  const hole = parseCards(o.hole),
    ranks = hole.map((c) => c.rank).sort((a, b) => b - a);
  let strength: number;
  if (!o.board.length) {
    strength =
      ranks[0] === ranks[1]
        ? 0.5 + ranks[0]! / 28
        : 0.12 +
          (ranks[0]! + ranks[1]!) / 48 +
          Number(hole[0]!.suit === hole[1]!.suit) * 0.06 -
          Math.max(0, ranks[0]! - ranks[1]! - 1) * 0.015;
    strength = Math.min(0.95, strength);
  } else {
    const rank = evaluateHoldemHand(hole, parseCards(o.board));
    strength = [0.15, 0.42, 0.63, 0.75, 0.85, 0.9, 0.95, 0.98, 1][
      rank.categoryValue
    ]!;
    const boardHigh = Math.max(...parseCards(o.board).map((c) => c.rank));
    if (rank.categoryValue === 1 && rank.kickers[0]! >= boardHigh)
      strength += 0.08;
  }
  // Deliberately simple style heuristics, not a GTO solver. Bigger prices and more opponents tighten decisions.
  const price = o.legal.call / Math.max(1, o.pot + o.legal.call);
  const adjusted =
    strength + style.looseness - 0.035 * Math.max(0, o.opponents - 1);
  const pressure = random() < style.bluff;
  if (
    o.legal.canRaise &&
    ((adjusted > 0.6 && random() < style.aggression) || pressure)
  ) {
    const target = Math.min(
      o.legal.maxTo,
      Math.max(
        o.legal.minTo,
        o.bet +
          o.legal.call +
          Math.round((o.pot + o.legal.call) * (o.style === 4 ? 1 : 0.6)),
      ),
    );
    return { type: "raise", to: target };
  }
  if (o.legal.canCheck) return { type: "check" };
  return adjusted > price + 0.2 ? { type: "call" } : { type: "fold" };
}
