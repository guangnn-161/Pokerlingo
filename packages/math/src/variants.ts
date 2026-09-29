import {
  assertDistinctCardGroups,
  choose,
  fullDeck,
  parseCards,
  formatCard,
  type Card,
} from "./cards";
import { compareHandRanks, evaluateFiveCardHand, type HandRank } from "./poker";
export type PokerVariant = "holdem" | "omaha" | "shortdeck" | "stud";
export const variantNames: Record<PokerVariant, string> = {
  holdem: "Texas Hold’em",
  omaha: "Omaha",
  shortdeck: "Short Deck (6+)",
  stud: "Seven-card Stud",
};
export function variantDeck(variant: PokerVariant) {
  return fullDeck().filter((c) => variant !== "shortdeck" || c.rank >= 6);
}
function five(cards: Card[], variant: PokerVariant): HandRank {
  const base = evaluateFiveCardHand(cards);
  if (variant !== "shortdeck") return base;
  // PokerStars 6+ convention: flush > full house; straight > trips; A6789 is a straight.
  const low =
    cards
      .map((c) => c.rank)
      .sort((a, b) => a - b)
      .join(",") === "6,7,8,9,14";
  if (low) {
    const flush = cards.every((c) => c.suit === cards[0]!.suit);
    return {
      category: flush ? "straight-flush" : "straight",
      categoryValue: flush ? 8 : 4,
      kickers: [9],
    };
  }
  if (base.category === "flush") return { ...base, categoryValue: 6 };
  if (base.category === "full-house") return { ...base, categoryValue: 5 };
  return base;
}
export function evaluateVariant(
  variant: PokerVariant,
  hole: readonly Card[],
  board: readonly Card[] = [],
): HandRank {
  assertDistinctCardGroups([...hole], [...board]);
  if (variant === "shortdeck" && [...hole, ...board].some((c) => c.rank < 6))
    throw new Error("Short Deck removes ranks 2 through 5.");
  if (
    variant === "stud" &&
    (hole.length < 5 || hole.length > 7 || board.length)
  )
    throw new Error(
      "Stud uses five to seven individual cards and no community board.",
    );
  if (
    variant !== "stud" &&
    (hole.length !== (variant === "omaha" ? 4 : 2) ||
      board.length < 3 ||
      board.length > 5)
  )
    throw new Error("Invalid hole-card or board count.");
  const candidates =
    variant === "omaha"
      ? choose(hole, 2).flatMap((h) =>
          choose(board, 3).map((b) => [...h, ...b]),
        )
      : choose([...hole, ...board], 5);
  let best: HandRank | undefined;
  for (const hand of candidates) {
    const rank = five(hand, variant);
    if (!best || compareHandRanks(rank, best) > 0) best = rank;
  }
  return best!;
}
export function seededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
export function shuffleCards<T>(cards: readonly T[], random: () => number) {
  const out = [...cards];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
export type VariantEquityInput = {
  variant: PokerVariant;
  hero: string[];
  board: string[];
  opponents: string[][];
  samples?: number;
  seed?: number;
};
export type VariantEquityResult = {
  equity: number;
  standardError: number;
  samples: number;
  method: "exact-range" | "monte-carlo";
  win: number;
  tie: number;
};
export function calculateVariantEquity(
  input: VariantEquityInput,
): VariantEquityResult {
  const { variant } = input,
    hero = parseCards(input.hero),
    board = input.board.length ? parseCards(input.board) : [];
  if (!Object.hasOwn(variantNames, variant))
    throw new Error("Unknown poker variant.");
  if (input.opponents.length < 1 || input.opponents.length > 100)
    throw new Error("Use 1–100 equally weighted opponent combinations.");
  const opponents = input.opponents.map(parseCards);
  if (variant === "stud") {
    if (
      ![5, 6, 7].includes(hero.length) ||
      board.length ||
      opponents.some((o) => o.length !== hero.length)
    )
      throw new Error(
        "Stud equity needs matching fifth, sixth or seventh street hands.",
      );
  } else if (
    hero.length !== (variant === "omaha" ? 4 : 2) ||
    ![0, 3, 4, 5].includes(board.length) ||
    opponents.some((o) => o.length !== hero.length)
  )
    throw new Error("Invalid cards for this variant.");
  for (const o of opponents) assertDistinctCardGroups(hero, board, o);
  if (
    variant === "shortdeck" &&
    [...hero, ...board, ...opponents.flat()].some((c) => c.rank < 6)
  )
    throw new Error("Short Deck removes ranks 2 through 5.");
  const complete = variant === "stud" ? hero.length === 7 : board.length === 5;
  const n = complete ? opponents.length : (input.samples ?? 1200);
  if (!Number.isInteger(n) || n < 1 || n > 10000)
    throw new Error("Sample count out of bounds.");
  const random = seededRandom(input.seed ?? 42),
    base = variantDeck(variant);
  let sum = 0,
    sum2 = 0,
    wins = 0,
    ties = 0;
  for (let i = 0; i < n; i++) {
    const opp =
      opponents[complete ? i : Math.floor(random() * opponents.length)]!;
    const used = new Set([...hero, ...board, ...opp].map(formatCard));
    const pool = complete
      ? []
      : shuffleCards(
          base.filter((c) => !used.has(formatCard(c))),
          random,
        );
    const missing = variant === "stud" ? 7 - hero.length : 5 - board.length;
    const finalBoard =
      variant === "stud" ? [] : [...board, ...pool.slice(0, missing)];
    const h = variant === "stud" ? [...hero, ...pool.slice(0, missing)] : hero;
    const v =
      variant === "stud" ? [...opp, ...pool.slice(missing, missing * 2)] : opp;
    const cmp = compareHandRanks(
      evaluateVariant(variant, h, finalBoard),
      evaluateVariant(variant, v, finalBoard),
    );
    const payoff = cmp > 0 ? 1 : cmp === 0 ? 0.5 : 0;
    wins += Number(cmp > 0);
    ties += Number(cmp === 0);
    sum += payoff;
    sum2 += payoff * payoff;
  }
  const equity = sum / n;
  // Sample variance of split-pot payoff X in {0, .5, 1}; zero for exact enumeration.
  const standardError = complete
    ? 0
    : Math.sqrt(
        Math.max(0, (sum2 - n * equity * equity) / Math.max(1, n - 1)) / n,
      );
  return {
    equity,
    standardError,
    samples: n,
    method: complete ? "exact-range" : "monte-carlo",
    win: wins / n,
    tie: ties / n,
  };
}
export type RandomPokerSpot = {
  id: string;
  seed: number;
  variant: PokerVariant;
  hero: string[];
  board: string[];
  opponents: string[][];
  visibleOpponent: string[];
  pot: number;
  call: number;
  street: string;
  rangeStyle: string;
};
export function generatePokerSpot(
  variant: PokerVariant,
  seed: number,
  street: "mixed" | "early" | "middle" | "late" = "mixed",
): RandomPokerSpot {
  const random = seededRandom(seed),
    deck = shuffleCards(variantDeck(variant).map(formatCard), random);
  const stage =
    street === "mixed"
      ? Math.floor(random() * 3)
      : ["early", "middle", "late"].indexOf(street);
  const heroCount =
    variant === "stud" ? 5 + stage : variant === "omaha" ? 4 : 2;
  const boardCount =
    variant === "stud" ? 0 : stage === 0 ? 3 : stage === 1 ? 4 : 5;
  const hero = deck.slice(0, heroCount),
    board = deck.slice(heroCount, heroCount + boardCount),
    remaining = deck.slice(heroCount + boardCount);
  const visibleOpponent =
    variant === "stud" ? remaining.slice(0, stage === 0 ? 3 : 4) : [];
  const pool = remaining.filter((c) => !visibleOpponent.includes(c));
  const unique = new Map<string, string[]>();
  const tight = random() < 0.5;
  while (unique.size < 48) {
    const o = [
      ...visibleOpponent,
      ...shuffleCards(pool, random).slice(
        0,
        heroCount - visibleOpponent.length,
      ),
    ];
    unique.set([...o].sort().join(""), o);
  }
  const candidates = [...unique.values()];
  if (tight)
    candidates.sort((a, b) =>
      compareHandRanks(
        evaluateVariant(
          variant,
          parseCards(b),
          board.map((c) => parseCards([c])[0]!),
        ),
        evaluateVariant(
          variant,
          parseCards(a),
          board.map((c) => parseCards([c])[0]!),
        ),
      ),
    );
  const opponents = candidates.slice(0, 12);
  // Opponent's final bet is already part of P. Random prices are independent of computed equity.
  const call = variant === "stud" ? 2 : 2 + Math.floor(random() * 39);
  const before =
    variant === "stud"
      ? 2 + Math.floor(random() * 10)
      : 2 + Math.floor(random() * 61);
  return {
    id: `${variant}-${seed >>> 0}`,
    seed: seed >>> 0,
    variant,
    hero,
    board,
    opponents,
    visibleOpponent,
    pot: before + call,
    call,
    street:
      variant === "stud"
        ? ["Fifth street", "Sixth street", "Seventh street"][stage]!
        : ["Flop", "Turn", "River"][stage]!,
    rangeStyle: tight ? "Made-hand-heavy sample" : "Wide sample",
  };
}
export function gradePokerDecision(
  equity: VariantEquityResult,
  pot: number,
  call: number,
) {
  if (!Number.isFinite(pot) || !Number.isFinite(call) || pot < 0 || call <= 0)
    throw new Error("Invalid price.");
  const callEv = equity.equity * (pot + call) - call;
  // Conservative floor avoids pretending a zero-event Monte Carlo sample has no uncertainty.
  const error =
    equity.method === "exact-range"
      ? 0
      : Math.max(1.96 * equity.standardError, 3 / equity.samples) *
        (pot + call);
  const best =
    Math.abs(callEv) <= Math.max(error, 1e-9)
      ? "close"
      : callEv > 0
        ? "call"
        : "fold";
  return {
    callEv,
    foldEv: 0,
    required: call / (pot + call),
    evError: error,
    best,
  };
}
