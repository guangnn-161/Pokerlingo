export type Action = "hit" | "stand" | "double" | "split" | "surrender";
export type TableRules = {
  dealerHitsSoft17: boolean;
  doubleAfterSplit: boolean;
  surrender: boolean;
  payout: 1.5 | 1.2;
};
export const defaultRules: TableRules = {
  dealerHitsSoft17: false,
  doubleAfterSplit: true,
  surrender: true,
  payout: 1.5,
};
export type Hand = {
  cards: string[];
  bet: number;
  done: boolean;
  split: boolean;
  splitAces: boolean;
  surrendered: boolean;
  outcome?: string;
  net?: number;
};
export type Round = {
  deck: string[];
  dealer: string[];
  hands: Hand[];
  active: number;
  phase: "playing" | "settled";
  net: number;
  rules: TableRules;
};
export function value(card: string) {
  const r = card.slice(0, -1);
  return r === "A" ? 11 : "TJQK".includes(r) ? 10 : Number(r);
}
export function handTotal(cards: readonly string[]) {
  let total = cards.reduce((s, c) => s + value(c), 0),
    aces = cards.filter((c) => value(c) === 11).length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return { total, soft: aces > 0 };
}
export function shuffledShoe(random: () => number = Math.random) {
  const cards: string[] = [];
  for (let d = 0; d < 6; d++)
    for (const s of "shdc") for (const r of "23456789TJQKA") cards.push(r + s);
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [cards[i], cards[j]] = [cards[j]!, cards[i]!];
  }
  return cards;
}
function draw(r: Round) {
  const c = r.deck.shift();
  if (!c) throw new Error("The practice shoe is empty. Deal a new round.");
  return c;
}
function newHand(cards: string[], split = false): Hand {
  return {
    cards,
    bet: 10,
    done: false,
    split,
    splitAces: false,
    surrendered: false,
  };
}
function natural(cards: string[]) {
  return cards.length === 2 && handTotal(cards).total === 21;
}
export function createRound(
  rules: TableRules = defaultRules,
  deck = shuffledShoe(),
): Round {
  const r: Round = {
    deck: [...deck],
    dealer: [],
    hands: [],
    active: 0,
    phase: "playing",
    net: 0,
    rules: { ...rules },
  };
  const p1 = draw(r),
    d1 = draw(r),
    p2 = draw(r),
    d2 = draw(r);
  r.dealer = [d1, d2];
  r.hands = [newHand([p1, p2])];
  if (natural(r.dealer) || natural(r.hands[0]!.cards)) {
    const h = r.hands[0]!;
    h.done = true;
    h.net = natural(h.cards)
      ? natural(r.dealer)
        ? 0
        : 10 * rules.payout
      : -10;
    h.outcome = natural(h.cards)
      ? h.net === 0
        ? "Blackjack push"
        : "Blackjack!"
      : "Dealer blackjack";
    r.net = h.net;
    r.phase = "settled";
  }
  return r;
}
export function legalActions(r: Round): Action[] {
  if (r.phase !== "playing") return [];
  const h = r.hands[r.active]!;
  if (h.done) return [];
  const t = handTotal(h.cards).total;
  if (t >= 21) return ["stand"];
  const actions: Action[] = ["hit", "stand"];
  if (h.cards.length === 2) {
    if (!h.split || r.rules.doubleAfterSplit) actions.push("double");
    if (
      !h.split &&
      r.hands.length === 1 &&
      value(h.cards[0]!) === value(h.cards[1]!)
    )
      actions.push("split");
    if (!h.split && r.rules.surrender) actions.push("surrender");
  }
  return actions;
}
/** Total-dependent multi-deck reference; no count or finite-shoe deviations. */
export function strategy(r: Round): { action: Action; reason: string } {
  const h = r.hands[r.active]!,
    { total: t, soft } = handTotal(h.cards),
    u = value(r.dealer[0]!),
    legal = legalActions(r),
    pair = h.cards.length === 2 && value(h.cards[0]!) === value(h.cards[1]!);
  let desired: Action = "hit";
  if (
    pair &&
    value(h.cards[0]!) === 8 &&
    u === 11 &&
    r.rules.dealerHitsSoft17 &&
    legal.includes("surrender")
  )
    return {
      action: "surrender",
      reason:
        "Against an ace in a multi-deck H17 game, late surrender takes priority over splitting eights. The dealer has already checked for blackjack.",
    };
  if (pair && legal.includes("split")) {
    const p = value(h.cards[0]!);
    const split =
      p === 11 ||
      p === 8 ||
      (p === 9 && ((u >= 2 && u <= 6) || u === 8 || u === 9)) ||
      (p === 7 && u <= 7) ||
      (p === 6 && u <= 6 && u >= (r.rules.doubleAfterSplit ? 2 : 3)) ||
      (p === 4 && r.rules.doubleAfterSplit && u >= 5 && u <= 6) ||
      ((p === 2 || p === 3) &&
        u <= 7 &&
        u >= (r.rules.doubleAfterSplit ? 2 : 4));
    if (split)
      return {
        action: "split",
        reason: `Treat the pair as two starting hands. Against ${u === 11 ? "an ace" : u}, the multi-deck reference prefers splitting${r.rules.doubleAfterSplit ? " with doubling after split available" : " under these rules"}. Only one split is allowed at this table.`,
      };
  }
  if (
    !soft &&
    legal.includes("surrender") &&
    ((t === 16 && u >= 9) ||
      (t === 15 && u === 10) ||
      (r.rules.dealerHitsSoft17 && u === 11 && (t === 15 || t === 17)))
  )
    return {
      action: "surrender",
      reason:
        "This difficult matchup loses more in the long run by continuing under the reference policy. Late surrender gives up half the original bet after the dealer checks for blackjack.",
    };
  if (soft) {
    if (t >= 19)
      desired =
        t === 19 && u === 6 && r.rules.dealerHitsSoft17 ? "double" : "stand";
    else if (t === 18)
      desired =
        u >= (r.rules.dealerHitsSoft17 ? 2 : 3) && u <= 6
          ? "double"
          : u <= 8
            ? "stand"
            : "hit";
    else if (t === 17) desired = u >= 3 && u <= 6 ? "double" : "hit";
    else if (t === 15 || t === 16)
      desired = u >= 4 && u <= 6 ? "double" : "hit";
    else desired = u >= 5 && u <= 6 ? "double" : "hit";
  } else if (t >= 17) desired = "stand";
  else if (t >= 13) desired = u <= 6 ? "stand" : "hit";
  else if (t === 12) desired = u >= 4 && u <= 6 ? "stand" : "hit";
  else if (t === 11)
    desired = u === 11 && !r.rules.dealerHitsSoft17 ? "hit" : "double";
  else if (t === 10) desired = u <= 9 ? "double" : "hit";
  else if (t === 9) desired = u >= 3 && u <= 6 ? "double" : "hit";
  if (desired === "double" && !legal.includes("double"))
    desired = soft && t >= 18 ? "stand" : "hit";
  return {
    action: desired,
    reason: `${soft ? "Soft" : "Hard"} ${t} against ${u === 11 ? "an ace" : u}: ${desired}. ${soft ? "A usable ace can count as 1 if the next card would otherwise bust the hand." : t >= 12 && u <= 6 ? "Avoid taking extra bust risk against a weak dealer upcard." : desired === "double" ? "Use the favorable starting total to put one additional practice bet behind a single draw." : desired === "hit" ? "Standing gives up too much value against this upcard; improve the total despite the risk." : "The reference policy prefers keeping this total."} This is a basic-strategy recommendation, not a guarantee for this hand.`,
  };
}
function settle(r: Round) {
  if (r.hands.some((h) => !h.surrendered && handTotal(h.cards).total <= 21)) {
    let d = handTotal(r.dealer);
    while (
      d.total < 17 ||
      (d.total === 17 && d.soft && r.rules.dealerHitsSoft17)
    ) {
      r.dealer.push(draw(r));
      d = handTotal(r.dealer);
    }
  }
  const dt = handTotal(r.dealer).total;
  for (const h of r.hands) {
    const t = handTotal(h.cards).total;
    if (h.surrendered) {
      h.net = -h.bet / 2;
      h.outcome = "Surrender";
    } else if (t > 21) {
      h.net = -h.bet;
      h.outcome = "Bust";
    } else if (dt > 21 || t > dt) {
      h.net = h.bet;
      h.outcome = dt > 21 ? "Dealer busts · Win" : "Win";
    } else if (t === dt) {
      h.net = 0;
      h.outcome = "Push";
    } else {
      h.net = -h.bet;
      h.outcome = "Dealer wins";
    }
    h.done = true;
  }
  r.net = r.hands.reduce((s, h) => s + (h.net ?? 0), 0);
  r.phase = "settled";
}
export function playAction(state: Round, action: Action): Round {
  if (!legalActions(state).includes(action))
    throw new Error("That action is not available for this hand.");
  const r: Round = {
    ...state,
    deck: [...state.deck],
    dealer: [...state.dealer],
    hands: state.hands.map((h) => ({ ...h, cards: [...h.cards] })),
    rules: { ...state.rules },
  };
  const h = r.hands[r.active]!;
  if (action === "hit") {
    h.cards.push(draw(r));
    h.done = handTotal(h.cards).total >= 21;
  }
  if (action === "stand") h.done = true;
  if (action === "double") {
    h.bet *= 2;
    h.cards.push(draw(r));
    h.done = true;
  }
  if (action === "surrender") {
    h.surrendered = true;
    h.done = true;
  }
  if (action === "split") {
    const a = newHand([h.cards[0]!, draw(r)], true),
      b = newHand([h.cards[1]!, draw(r)], true);
    a.splitAces = b.splitAces = value(h.cards[0]!) === 11;
    a.done = a.splitAces || handTotal(a.cards).total === 21;
    b.done = b.splitAces || handTotal(b.cards).total === 21;
    r.hands = [a, b];
    r.active = 0;
  }
  if (r.hands[r.active]!.done) {
    const next = r.hands.findIndex((hand) => !hand.done);
    if (next === -1) settle(r);
    else r.active = next;
  }
  return r;
}
