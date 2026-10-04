import { parseCard } from "./cards";
import { assertFinite, calculationResult } from "./types";

export type BlackjackRules = {
  id: string;
  version: string;
  decks: number;
  dealerHitsSoft17: boolean;
  blackjackPayout: number;
  doubleAfterSplit: boolean;
  surrender: "none" | "late";
  holeCard: "peek" | "no-hole-card";
  noHoleCardDoubleLiability: "original-only" | "all-bets";
  maxSplitHands: number;
};

export const BLACKJACK_6D_S17_DAS_LS: BlackjackRules = {
  id: "blackjack-6d-s17-das-ls-3to2",
  version: "1",
  decks: 6,
  dealerHitsSoft17: false,
  blackjackPayout: 1.5,
  doubleAfterSplit: true,
  surrender: "late",
  holeCard: "peek",
  noHoleCardDoubleLiability: "original-only",
  maxSplitHands: 2
};

export type BlackjackAction = "hit" | "stand" | "double" | "split" | "surrender";
export type BlackjackActionValue = { action: BlackjackAction; evUnits: number };
export type BlackjackInput = {
  playerCards: readonly string[];
  dealerUpcard: string;
  ruleset?: Partial<BlackjackRules>;
};
export type BlackjackOutput = {
  playerTotal: number;
  soft: boolean;
  dealerNaturalProbability: number;
  legalActions: BlackjackAction[];
  actionValues: BlackjackActionValue[];
  bestAction: BlackjackAction;
  bestEvUnits: number;
};

type Total = { value: number; soft: boolean };
type DealerOutcome = { total: number; bust: boolean; natural: boolean; probability: number };
type ProbabilityCard = { value: number; probability: number };
const infiniteDeckValues: ProbabilityCard[] = [
  ...Array.from({ length: 8 }, (_, index) => ({ value: index + 2, probability: 1 / 13 })),
  { value: 10, probability: 4 / 13 },
  { value: 11, probability: 1 / 13 }
];

function cardValue(cardText: string) {
  const rank = parseCard(cardText).rank;
  return rank === 14 ? 11 : Math.min(rank, 10);
}

function cardRank(cardText: string) {
  return parseCard(cardText).rank;
}

function totalOf(values: readonly number[]): Total {
  let value = values.reduce((sum, card) => sum + card, 0);
  let aces = values.filter((card) => card === 11).length;
  while (value > 21 && aces > 0) {
    value -= 10;
    aces -= 1;
  }
  return { value, soft: aces > 0 };
}

function drawTotal(total: Total, value: number): Total {
  if (value === 11) {
    if (total.value + 11 <= 21) return { value: total.value + 11, soft: true };
    let nextValue = total.value + 1;
    let soft = total.soft;
    if (nextValue > 21 && soft) {
      nextValue -= 10;
      soft = false;
    }
    return { value: nextValue, soft };
  }
  let nextValue = total.value + value;
  let soft = total.soft;
  if (nextValue > 21 && soft) {
    nextValue -= 10;
    soft = false;
  }
  return { value: nextValue, soft };
}

function dealerDistribution(upcard: number, rules: BlackjackRules) {
  const raw: DealerOutcome[] = [];
  const memo = new Map<string, DealerOutcome[]>();
  function resolve(total: Total): DealerOutcome[] {
    const key = `${total.value}:${total.soft ? 1 : 0}`;
    const cached = memo.get(key);
    if (cached) return cached;
    if (total.value > 21) return [{ total: total.value, bust: true, natural: false, probability: 1 }];
    const hitSoft17 = total.value === 17 && total.soft && rules.dealerHitsSoft17;
    if (total.value > 17 || (total.value === 17 && !hitSoft17)) {
      return [{ total: total.value, bust: false, natural: false, probability: 1 }];
    }
    const outcomes = infiniteDeckValues.flatMap((draw) => resolve(drawTotal(total, draw.value)).map((outcome) => ({
      ...outcome,
      probability: outcome.probability * draw.probability
    })));
    memo.set(key, outcomes);
    return outcomes;
  }

  for (const hole of infiniteDeckValues) {
    const total = drawTotal({ value: upcard, soft: upcard === 11 }, hole.value);
    const natural = total.value === 21 && (upcard === 11 || upcard === 10) && (hole.value === 11 || hole.value === 10);
    if (natural) raw.push({ total: 21, bust: false, natural: true, probability: hole.probability });
    else raw.push(...resolve(total).map((outcome) => ({ ...outcome, probability: outcome.probability * hole.probability })));
  }
  const naturalProbability = raw.filter((outcome) => outcome.natural).reduce((sum, outcome) => sum + outcome.probability, 0);
  const normalTotal = 1 - naturalProbability;
  const normal = raw.filter((outcome) => !outcome.natural).map((outcome) => ({
    ...outcome,
    probability: outcome.probability / normalTotal
  }));
  return { naturalProbability, normal };
}

function settleAgainstDealer(playerTotal: number, dealer: readonly DealerOutcome[], stakeUnits: number) {
  if (playerTotal > 21) return -stakeUnits;
  return dealer.reduce((sum, outcome) => {
    if (outcome.bust || playerTotal > outcome.total) return sum + outcome.probability * stakeUnits;
    if (playerTotal < outcome.total) return sum - outcome.probability * stakeUnits;
    return sum;
  }, 0);
}

const continuationCache = new WeakMap<readonly DealerOutcome[], Map<string, number>>();

function bestFromTotal(
  total: Total,
  cardCount: number,
  dealer: readonly DealerOutcome[],
  rules: BlackjackRules,
  canDouble: boolean,
  splitAceHand: boolean
): number {
  if (total.value > 21) return -1;
  const stand = settleAgainstDealer(total.value, dealer, 1);
  if (total.value >= 21 || (splitAceHand && cardCount >= 2)) return stand;
  let cache = continuationCache.get(dealer);
  if (!cache) {
    cache = new Map();
    continuationCache.set(dealer, cache);
  }
  const cacheKey = `${total.value}:${total.soft ? 1 : 0}:${cardCount === 2 && canDouble ? 1 : 0}:${splitAceHand ? 1 : 0}`;
  const cached = cache.get(cacheKey);
  if (cached !== undefined) return cached;
  let hit = 0;
  for (const draw of infiniteDeckValues) {
    hit += draw.probability * bestFromTotal(drawTotal(total, draw.value), cardCount + 1, dealer, rules, false, splitAceHand);
  }
  let best = Math.max(stand, hit);
  if (canDouble && cardCount === 2) {
    let double = 0;
    for (const draw of infiniteDeckValues) {
      double += draw.probability * settleAgainstDealer(drawTotal(total, draw.value).value, dealer, 2);
    }
    best = Math.max(best, double);
  }
  cache.set(cacheKey, best);
  return best;
}

function splitExpectedValue(
  rank: number,
  dealer: readonly DealerOutcome[],
  rules: BlackjackRules,
  splitAces: boolean
) {
  let oneHand = 0;
  for (const draw of infiniteDeckValues) {
    const start = { value: rank === 14 ? 11 : Math.min(rank, 10), soft: rank === 14 };
    oneHand += draw.probability * bestFromTotal(drawTotal(start, draw.value), 2, dealer, rules, rules.doubleAfterSplit, splitAces);
  }
  return oneHand * 2;
}

export function blackjackLegalActions(playerCards: readonly string[], rules = BLACKJACK_6D_S17_DAS_LS): BlackjackAction[] {
  if (playerCards.length < 2) throw new Error("Blackjack player hand must have at least two cards.");
  const values = playerCards.map(cardValue);
  const total = totalOf(values);
  const initial = playerCards.length === 2;
  const actions: BlackjackAction[] = ["stand"];
  if (total.value < 21) actions.unshift("hit");
  if (initial && total.value < 21) actions.push("double");
  if (initial && rules.maxSplitHands >= 2 && cardRank(playerCards[0]!) === cardRank(playerCards[1]!)) actions.push("split");
  if (initial && rules.surrender === "late" && rules.holeCard === "peek") actions.push("surrender");
  return actions;
}

export function evaluateBlackjack(input: BlackjackInput) {
  if (input.playerCards.length < 2 || input.playerCards.length > 11) throw new Error("Player hand must contain two to eleven cards.");
  const parsedPlayerCards = input.playerCards.map(parseCard);
  const parsedUpcard = parseCard(input.dealerUpcard);
  if (new Set([...parsedPlayerCards, parsedUpcard].map((card) => `${card.rank}${card.suit}`)).size !== parsedPlayerCards.length + 1) {
    throw new Error("A card cannot appear twice in the visible blackjack hand.");
  }
  const rules: BlackjackRules = { ...BLACKJACK_6D_S17_DAS_LS, ...input.ruleset };
  if (!rules.id || !rules.version) throw new Error("Blackjack ruleset id and version are required.");
  if (!Number.isInteger(rules.decks) || rules.decks < 1 || rules.decks > 12) throw new Error("Blackjack decks must be an integer from 1 to 12.");
  assertFinite(rules.blackjackPayout, "blackjackPayout");
  if (rules.blackjackPayout < 0 || rules.blackjackPayout > 3) throw new Error("blackjackPayout must be from 0 to 3.");
  if (!Number.isInteger(rules.maxSplitHands) || rules.maxSplitHands < 1 || rules.maxSplitHands > 2) {
    throw new Error("This engine supports one split (up to two hands). maxSplitHands must be 1 or 2.");
  }
  const playerValues = input.playerCards.map(cardValue);
  const playerTotal = totalOf(playerValues);
  if (playerTotal.value > 21) throw new Error("Player hand is already bust; start from the decision before drawing.");
  const upcard = cardValue(input.dealerUpcard);
  const distribution = dealerDistribution(upcard, rules);
  const isPlayerNatural = input.playerCards.length === 2 && playerTotal.value === 21;
  const legalActions = isPlayerNatural || playerTotal.value > 21 ? [] : blackjackLegalActions(input.playerCards, rules);
  const actionValues: BlackjackActionValue[] = [];
  if (isPlayerNatural) {
    const evUnits = (1 - distribution.naturalProbability) * rules.blackjackPayout;
    return calculationResult<BlackjackOutput>(
      {
        playerTotal: playerTotal.value,
        soft: playerTotal.soft,
        dealerNaturalProbability: distribution.naturalProbability,
        legalActions,
        actionValues,
        bestAction: "stand",
        bestEvUnits: evUnits
      },
      { id: rules.id, version: rules.version },
      "exact-infinite-deck-dp",
      ["Natural blackjack pays the configured net payout; a dealer natural pushes."],
      ["Infinite-deck approximation ignores card removal and count composition."]
    );
  }

  const naturalLoss = (action: BlackjackAction) => {
    if ((action === "double" || action === "split") && rules.holeCard === "no-hole-card" && rules.noHoleCardDoubleLiability === "all-bets") return -2;
    return -1;
  };
  for (const action of legalActions) {
    let normalEv: number;
    if (action === "stand") normalEv = settleAgainstDealer(playerTotal.value, distribution.normal, 1);
    else if (action === "hit") {
      normalEv = 0;
      for (const draw of infiniteDeckValues) {
        normalEv += draw.probability * bestFromTotal(drawTotal(playerTotal, draw.value), playerValues.length + 1, distribution.normal, rules, false, false);
      }
    } else if (action === "double") {
      normalEv = 0;
      for (const draw of infiniteDeckValues) {
        normalEv += draw.probability * settleAgainstDealer(drawTotal(playerTotal, draw.value).value, distribution.normal, 2);
      }
    } else if (action === "split") {
      const rank = cardRank(input.playerCards[0]!);
      normalEv = splitExpectedValue(rank, distribution.normal, rules, rank === 14);
    } else {
      normalEv = -0.5;
    }
    const evUnits = distribution.naturalProbability * naturalLoss(action) + (1 - distribution.naturalProbability) * normalEv;
    actionValues.push({ action, evUnits });
  }
  const best = actionValues.reduce((current, item) => item.evUnits > current.evUnits ? item : current);
  const warnings = ["Infinite-deck approximation ignores card removal and count composition."];
  if (rules.holeCard === "no-hole-card") warnings.push("No-hole-card dealer blackjack liability follows the configured rule; regional rules may differ.");
  if (rules.maxSplitHands === 2) warnings.push("The split calculation models one split only and does not resplit pairs.");
  return calculationResult<BlackjackOutput>(
    {
      playerTotal: playerTotal.value,
      soft: playerTotal.soft,
      dealerNaturalProbability: distribution.naturalProbability,
      legalActions,
      actionValues,
      bestAction: best.action,
      bestEvUnits: best.evUnits
    },
    { id: rules.id, version: rules.version },
    "exact-infinite-deck-dp",
    ["Expected value is measured in the original stake unit.", "The action chooser assumes optimal hit/stand continuation after a hit and when playing split hands."],
    warnings
  );
}

export type BlackjackRecommendation = {
  action: "hit" | "stand" | "double" | "split";
  explanation: string;
};

/** Compatibility helper retained for the existing demo consumer. */
export function blackjackBasicStrategy(total: number, dealerUpcard: number, soft = false): BlackjackRecommendation {
  if (total < 4 || total > 21 || dealerUpcard < 2 || dealerUpcard > 11) throw new Error("Invalid blackjack state.");
  if (soft && total >= 18) {
    return total === 18 && dealerUpcard >= 9
      ? { action: "hit", explanation: "Soft 18: hit against 9, 10, or Ace in this simplified reference." }
      : { action: "stand", explanation: "Stand on this soft total in the simplified reference." };
  }
  if (total >= 17) return { action: "stand", explanation: "Stand on hard 17 or higher." };
  if (total <= 8) return { action: "hit", explanation: "Hit hard 8 or lower." };
  if (total === 11) return { action: "double", explanation: "Double hard 11 when doubling is legal." };
  if (total >= 12 && total <= 16 && dealerUpcard <= 6) {
    return { action: "stand", explanation: "Stand against a dealer 2 through 6 in this simplified reference." };
  }
  return { action: "hit", explanation: "Hit against this dealer upcard in the simplified reference." };
}
