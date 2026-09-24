import { assertDistinctCardGroups, Card, cardKey, choose, fullDeck, parseCards } from "./cards";
import { assertFinite, assertProbability, calculationResult, CalculationResult } from "./types";

export type HandCategory =
  | "high-card" | "one-pair" | "two-pair" | "three-of-a-kind" | "straight"
  | "flush" | "full-house" | "four-of-a-kind" | "straight-flush";
export type HandRank = { category: HandCategory; categoryValue: number; kickers: number[] };

const categoryNames: HandCategory[] = [
  "high-card", "one-pair", "two-pair", "three-of-a-kind", "straight",
  "flush", "full-house", "four-of-a-kind", "straight-flush"
];

function straightHigh(ranks: number[]) {
  const unique = [...new Set(ranks)].sort((a, b) => b - a);
  if (unique[0] === 14) unique.push(1);
  for (let index = 0; index <= unique.length - 5; index += 1) {
    if (unique[index]! - unique[index + 4]! === 4) return unique[index]!;
  }
  return 0;
}

export function evaluateFiveCardHand(cards: readonly Card[]): HandRank {
  if (cards.length !== 5) throw new Error("A five-card hand is required.");
  assertDistinctCardGroups([...cards]);
  const ranks = cards.map((card) => card.rank).sort((a, b) => b - a);
  const groups = new Map<number, number>();
  for (const rank of ranks) groups.set(rank, (groups.get(rank) ?? 0) + 1);
  const counts = [...groups.entries()].sort((left, right) => right[1] - left[1] || right[0] - left[0]);
  const flush = cards.every((card) => card.suit === cards[0]!.suit);
  const straight = straightHigh(ranks);
  let categoryValue: number;
  let kickers: number[];

  if (flush && straight) { categoryValue = 8; kickers = [straight]; }
  else if (counts[0]![1] === 4) {
    categoryValue = 7;
    kickers = [counts[0]![0], counts[1]![0]];
  } else if (counts[0]![1] === 3 && counts[1]![1] === 2) {
    categoryValue = 6;
    kickers = [counts[0]![0], counts[1]![0]];
  } else if (flush) { categoryValue = 5; kickers = ranks; }
  else if (straight) { categoryValue = 4; kickers = [straight]; }
  else if (counts[0]![1] === 3) {
    categoryValue = 3;
    kickers = [counts[0]![0], ...counts.slice(1).map(([rank]) => rank).sort((a, b) => b - a)];
  } else if (counts[0]![1] === 2 && counts[1]![1] === 2) {
    categoryValue = 2;
    kickers = [Math.max(counts[0]![0], counts[1]![0]), Math.min(counts[0]![0], counts[1]![0]), counts[2]![0]];
  } else if (counts[0]![1] === 2) {
    categoryValue = 1;
    kickers = [counts[0]![0], ...counts.slice(1).map(([rank]) => rank).sort((a, b) => b - a)];
  } else { categoryValue = 0; kickers = ranks; }
  return { category: categoryNames[categoryValue]!, categoryValue, kickers };
}

export function compareHandRanks(left: HandRank, right: HandRank) {
  if (left.categoryValue !== right.categoryValue) return Math.sign(left.categoryValue - right.categoryValue);
  for (let index = 0; index < Math.max(left.kickers.length, right.kickers.length); index += 1) {
    const difference = (left.kickers[index] ?? 0) - (right.kickers[index] ?? 0);
    if (difference !== 0) return Math.sign(difference);
  }
  return 0;
}

export function evaluateHoldemHand(holeCards: readonly Card[], board: readonly Card[]): HandRank {
  if (holeCards.length !== 2) throw new Error("Texas Hold'em requires two hole cards.");
  if (board.length < 3 || board.length > 5) throw new Error("The board must contain three to five cards.");
  assertDistinctCardGroups([...holeCards], [...board]);
  return choose([...holeCards, ...board], 5)
    .map(evaluateFiveCardHand)
    .reduce((best, candidate) => compareHandRanks(candidate, best) > 0 ? candidate : best);
}

export type RangeCombo = { cards: [Card, Card]; notation: string; weight: number };
type HandClass = { high: number; low: number; suitedness: "pair" | "suited" | "offsuit" | "any" };
const rankLetters = "23456789TJQKA";
const rankFromLetter = (letter: string) => rankLetters.indexOf(letter.toUpperCase()) + 2;
const letterFromRank = (rank: number) => rankLetters[rank - 2]!;

function parseHandClass(text: string): HandClass {
  const match = /^([2-9TJQKA])([2-9TJQKA])([so])?$/i.exec(text);
  if (!match) throw new Error(`Invalid range hand "${text}".`);
  const first = rankFromLetter(match[1]!);
  const second = rankFromLetter(match[2]!);
  const high = Math.max(first, second);
  const low = Math.min(first, second);
  const suffix = match[3]?.toLowerCase();
  if (high === low && suffix) throw new Error(`Pairs do not take a suitedness suffix: "${text}".`);
  if (high !== low && !suffix) return { high, low, suitedness: "any" };
  return { high, low, suitedness: high === low ? "pair" : suffix === "s" ? "suited" : "offsuit" };
}

function className(hand: HandClass) {
  if (hand.suitedness === "pair") return `${letterFromRank(hand.high)}${letterFromRank(hand.low)}`;
  return `${letterFromRank(hand.high)}${letterFromRank(hand.low)}${hand.suitedness === "any" ? "" : hand.suitedness === "suited" ? "s" : "o"}`;
}

function expandNotationToken(token: string): HandClass[] {
  if (token.includes("-")) {
    if (token.includes("+") || token.split("-").length !== 2) throw new Error(`Invalid range interval "${token}".`);
    const [startText, endText] = token.split("-");
    const start = parseHandClass(startText!);
    const end = parseHandClass(endText!);
    if (start.high !== end.high || start.suitedness !== end.suitedness || start.low > end.low) {
      throw new Error(`Range interval "${token}" must keep the same high card and suitedness, with ascending kickers.`);
    }
    return Array.from({ length: end.low - start.low + 1 }, (_, index) => ({ ...start, low: start.low + index }));
  }
  if (token.endsWith("+")) {
    const start = parseHandClass(token.slice(0, -1));
    if (start.suitedness === "pair") {
      return Array.from({ length: 15 - start.high }, (_, index) => {
        const rank = start.high + index;
        return { high: rank, low: rank, suitedness: "pair" };
      });
    }
    if (start.low >= start.high - 1) return [start];
    return Array.from({ length: start.high - start.low }, (_, index) => ({ ...start, low: start.low + index }));
  }
  return [parseHandClass(token)];
}

function combosForHandClass(hand: HandClass, weight: number): RangeCombo[] {
  const combos: RangeCombo[] = [];
  if (hand.suitedness === "pair") {
    for (let first = 0; first < 4; first += 1) {
      for (let second = first + 1; second < 4; second += 1) {
        const suits = ["c", "d", "h", "s"] as const;
        combos.push({ cards: [
          { rank: hand.high as Card["rank"], suit: suits[first]! },
          { rank: hand.low as Card["rank"], suit: suits[second]! }
        ], notation: className(hand), weight });
      }
    }
    return combos;
  }
  const suits = ["c", "d", "h", "s"] as const;
  for (const highSuit of suits) {
    for (const lowSuit of suits) {
      if (hand.suitedness === "suited" && highSuit !== lowSuit) continue;
      if (hand.suitedness === "offsuit" && highSuit === lowSuit) continue;
      combos.push({ cards: [
        { rank: hand.high as Card["rank"], suit: highSuit },
        { rank: hand.low as Card["rank"], suit: lowSuit }
      ], notation: className(hand), weight });
    }
  }
  return combos;
}

/** Expand common 169-cell notation, plus/range intervals, and optional `:weight` values. */
export function expandRange(notation: string): RangeCombo[] {
  if (!notation.trim()) throw new Error("Range notation cannot be empty.");
  const classes = new Map<string, number>();
  for (const sourceToken of notation.split(",")) {
    const trimmed = sourceToken.trim();
    const [token, weightText, ...extra] = trimmed.split(":");
    if (!token || extra.length > 0) throw new Error(`Invalid weighted range token "${trimmed}".`);
    const weight = weightText === undefined ? 1 : Number(weightText);
    assertFinite(weight, "range weight");
    if (weight <= 0 || weight > 1) throw new Error("Range weights must be greater than 0 and at most 1.");
    for (const hand of expandNotationToken(token.trim())) {
      const key = className(hand);
      if (classes.has(key)) throw new Error(`Range contains duplicate hand class "${key}".`);
      classes.set(key, weight);
    }
  }
  return [...classes.entries()].flatMap(([key, weight]) => combosForHandClass(parseHandClass(key), weight));
}

export function removeBlockers(combos: readonly RangeCombo[], blockers: readonly Card[]) {
  const blocked = new Set(blockers.map(cardKey));
  const available = combos.filter(({ cards }) => cards.every((card) => !blocked.has(cardKey(card))));
  const totalWeight = available.reduce((sum, combo) => sum + combo.weight, 0);
  return {
    totalWeight,
    combos: totalWeight === 0 ? [] : available.map((combo) => ({ ...combo, weight: combo.weight / totalWeight }))
  };
}

export type EquityInput = {
  heroCards: readonly string[];
  board?: readonly string[];
  villainCards?: readonly string[];
  villainRange?: string;
  method?: "auto" | "exact" | "monte-carlo";
  samples?: number;
  seed?: number;
  exactWorkLimit?: number;
};
export type EquityOutput = {
  equity: number;
  winRate: number;
  tieRate: number;
  lossRate: number;
  samples: number;
  seed: number | null;
  standardError: number | null;
};

function seededRandom(seed: number) {
  let state = seed >>> 0 || 0x9e3779b9;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x1_0000_0000;
  };
}

function randomWeightedCombo(combos: readonly RangeCombo[], random: () => number) {
  let needle = random();
  for (const combo of combos) {
    needle -= combo.weight;
    if (needle < 0) return combo;
  }
  return combos[combos.length - 1]!;
}

function combinationCount(n: number, k: number) {
  let result = 1;
  const count = Math.min(k, n - k);
  for (let index = 1; index <= count; index += 1) result = result * (n - count + index) / index;
  return Math.round(result);
}

export function calculateHoldemEquity(input: EquityInput): CalculationResult<EquityOutput> {
  const hero = parseCards(input.heroCards);
  const board = input.board?.length ? parseCards(input.board) : [];
  const villain = input.villainCards ? parseCards(input.villainCards) : undefined;
  if (hero.length !== 2) throw new Error("Hero must have two hole cards.");
  if (board.length > 5) throw new Error("The board cannot contain more than five cards.");
  if (Boolean(villain) === Boolean(input.villainRange)) throw new Error("Provide exactly one of villainCards or villainRange.");
  if (villain && villain.length !== 2) throw new Error("Villain must have two hole cards.");
  assertDistinctCardGroups(hero, board, ...(villain ? [villain] : []));
  const rawCombos: RangeCombo[] = villain
    ? [{ cards: [villain[0]!, villain[1]!], notation: "fixed-hand", weight: 1 }]
    : expandRange(input.villainRange!);
  const filtered = removeBlockers(rawCombos, [...hero, ...board]).combos;
  if (filtered.length === 0) throw new Error("No villain combos remain after removing known cards.");
  const unknownBoardCards = 5 - board.length;
  const availableCards = 52 - hero.length - board.length - 2;
  const boardRunoutsPerCombo = combinationCount(availableCards, unknownBoardCards);
  const estimatedWork = filtered.length * boardRunoutsPerCombo;
  const workLimit = input.exactWorkLimit ?? 250_000;
  const requestedMethod = input.method ?? "auto";
  if (requestedMethod === "exact" && estimatedWork > workLimit) {
    throw new Error(`Exact equity work (${estimatedWork}) exceeds the configured limit (${workLimit}).`);
  }
  const useExact = requestedMethod === "exact" || (requestedMethod === "auto" && estimatedWork <= workLimit);
  const seed = input.seed ?? 13_371_337;
  assertFinite(seed, "seed");
  if (!Number.isInteger(seed)) throw new Error("seed must be an integer.");

  let wins = 0;
  let ties = 0;
  let losses = 0;
  let payoffSquares = 0;
  let sampleCount = 0;
  if (useExact) {
    for (const combo of filtered) {
      const deck = fullDeck().filter((card) => !new Set([...hero, ...board, ...combo.cards].map(cardKey)).has(cardKey(card)));
      const runouts = choose(deck, unknownBoardCards);
      const heroRank = evaluateHoldemHand(hero, [...board, ...runouts[0]!]);
      for (const runout of runouts) {
        const hRank = runout.length === 0 ? heroRank : evaluateHoldemHand(hero, [...board, ...runout]);
        const vRank = evaluateHoldemHand(combo.cards, [...board, ...runout]);
        const comparison = hRank.categoryValue === vRank.categoryValue
          ? compareHandRanks(hRank, vRank)
          : Math.sign(hRank.categoryValue - vRank.categoryValue);
        payoffSquares += combo.weight * (comparison > 0 ? 1 : comparison === 0 ? 0.25 : 0);
        wins += comparison > 0 ? combo.weight : 0;
        ties += comparison === 0 ? combo.weight : 0;
        losses += comparison < 0 ? combo.weight : 0;
        sampleCount += 1;
      }
    }
  } else {
    const sampleTarget = input.samples ?? 20_000;
    assertFinite(sampleTarget, "samples");
    if (!Number.isInteger(sampleTarget) || sampleTarget < 1 || sampleTarget > 100_000) {
      throw new Error("Monte Carlo samples must be an integer between 1 and 100000.");
    }
    const random = seededRandom(seed);
    const deckWithoutKnown = fullDeck().filter((card) => !new Set([...hero, ...board].map(cardKey)).has(cardKey(card)));
    for (let sample = 0; sample < sampleTarget; sample += 1) {
      const combo = randomWeightedCombo(filtered, random);
      const blocked = new Set(combo.cards.map(cardKey));
      const drawPool = deckWithoutKnown.filter((card) => !blocked.has(cardKey(card)));
      for (let index = drawPool.length - 1; index > drawPool.length - 1 - unknownBoardCards; index -= 1) {
        const swapWith = Math.floor(random() * (index + 1));
        [drawPool[index], drawPool[swapWith]] = [drawPool[swapWith]!, drawPool[index]!];
      }
      const runout = drawPool.slice(drawPool.length - unknownBoardCards);
      const heroRank = evaluateHoldemHand(hero, [...board, ...runout]);
      const villainRank = evaluateHoldemHand(combo.cards, [...board, ...runout]);
      const comparison = compareHandRanks(heroRank, villainRank);
      payoffSquares += comparison > 0 ? 1 : comparison === 0 ? 0.25 : 0;
      wins += comparison > 0 ? 1 : 0;
      ties += comparison === 0 ? 1 : 0;
      losses += comparison < 0 ? 1 : 0;
      sampleCount += 1;
    }
  }
  const total = wins + ties + losses;
  const equity = (wins + ties / 2) / total;
  const output: EquityOutput = {
    equity,
    winRate: wins / total,
    tieRate: ties / total,
    lossRate: losses / total,
    samples: sampleCount,
    seed: useExact ? null : seed,
    standardError: useExact ? null : Math.sqrt(
      Math.max(0, (payoffSquares - sampleCount * equity * equity) / (sampleCount - 1 || 1)) / sampleCount
    )
  };
  return calculationResult(
    output,
    { id: "nlhe-holdem", version: "1" },
    useExact ? "exact-enumeration" : "monte-carlo",
    ["Two-player Texas Hold'em.", "Equity is win plus half of tie outcomes.", "Range combo weights are normalized after hero and board blockers."],
    useExact ? [] : ["Monte Carlo equity is an estimate; use the returned seed and sample count to reproduce it."]
  );
}

export function requiredEquity(potBeforeCallBb: number, callBb: number) {
  assertFinite(potBeforeCallBb, "potBeforeCallBb");
  assertFinite(callBb, "callBb");
  if (potBeforeCallBb < 0 || callBb <= 0) throw new Error("Pot must be non-negative and call must be positive.");
  return callBb / (potBeforeCallBb + callBb);
}

export function callEvBb(equity: number, finalPotBb: number, callBb: number) {
  assertProbability(equity, "equity");
  assertFinite(finalPotBb, "finalPotBb");
  assertFinite(callBb, "callBb");
  if (finalPotBb < 0 || callBb < 0) throw new Error("Pot and call must be non-negative.");
  return equity * finalPotBb - callBb;
}

export function betEvBb(input: {
  foldProbability: number;
  equityWhenCalled: number;
  potBb: number;
  riskBb: number;
  villainCallBb: number;
}) {
  assertProbability(input.foldProbability, "foldProbability");
  assertProbability(input.equityWhenCalled, "equityWhenCalled");
  for (const [field, value] of Object.entries(input)) {
    if (field.endsWith("Bb")) {
      assertFinite(value, field);
      if (value < 0) throw new Error(`${field} must be non-negative.`);
    }
  }
  return input.foldProbability * input.potBb
    + (1 - input.foldProbability)
      * (input.equityWhenCalled * (input.potBb + input.riskBb + input.villainCallBb) - input.riskBb);
}

export function pokerRake(potBb: number, percent: number, capBb: number, flopSeen = true) {
  for (const [name, value] of [["potBb", potBb], ["percent", percent], ["capBb", capBb]] as const) {
    assertFinite(value, name);
    if (value < 0) throw new Error(`${name} must be non-negative.`);
  }
  if (percent > 1) throw new Error("percent must be a fraction between 0 and 1.");
  const rakeBb = flopSeen ? Math.min(potBb * percent, capBb) : 0;
  return { rakeBb, potAfterRakeBb: potBb - rakeBb };
}

export function netWinRateAfterRake(grossBbPer100: number, rakeBbPer100: number) {
  assertFinite(grossBbPer100, "grossBbPer100");
  assertFinite(rakeBbPer100, "rakeBbPer100");
  if (rakeBbPer100 < 0) throw new Error("rakeBbPer100 must be non-negative.");
  return grossBbPer100 - rakeBbPer100;
}

export type PokerEquityEnvelope = CalculationResult<EquityOutput>;
