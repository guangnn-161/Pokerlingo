export type PokerAction = "fold" | "call" | "raise" | "check" | "bet";
export type PokerDrill = {
  id: string;
  group: "Preflop" | "Pot odds" | "River";
  title: string;
  street: string;
  hero: string[];
  board: string[];
  position: string;
  pot: number;
  call: number;
  prompt: string;
  context: string;
  options: { action: PokerAction; label: string }[];
  best: PokerAction;
  why: string;
  assumption: string;
  lesson: string;
  equity?: number;
  bet?: number;
  foldProbability?: number;
};
export const pokerDrills: PokerDrill[] = [
  {
    id: "open-aces",
    group: "Preflop",
    title: "Build the pot with a premium",
    street: "Preflop",
    hero: ["As", "Ad"],
    board: [],
    position: "UTG",
    pot: 1.5,
    call: 1,
    prompt: "First to act. What is your opening action?",
    context: "6-max · 100 BB effective · No ante · Unopened pot",
    options: [
      { action: "fold", label: "Fold" },
      { action: "call", label: "Limp 1 BB" },
      { action: "raise", label: "Raise to 2.5 BB" },
    ],
    best: "raise",
    why: "Aces lead every other starting hand. An open-raise builds value and charges the players behind to continue. Open-limping gives the big blind a cheap route into the pot.",
    assumption:
      "A standard raise-or-fold opening strategy for a 100 BB cash game. This is a teaching policy, not a solver output or a promise to win.",
    lesson: "ranges-blockers",
  },
  {
    id: "fold-72",
    group: "Preflop",
    title: "Discipline before the flop",
    street: "Preflop",
    hero: ["7d", "2c"],
    board: [],
    position: "UTG",
    pot: 1.5,
    call: 1,
    prompt: "Five players still to act. Enter this pot?",
    context: "6-max · 100 BB effective · No ante · Unopened pot",
    options: [
      { action: "fold", label: "Fold" },
      { action: "call", label: "Limp 1 BB" },
      { action: "raise", label: "Raise to 2.5 BB" },
    ],
    best: "fold",
    why: "Seven-deuce offsuit has weak high-card value and poor draw potential. From early position, too many stronger ranges remain behind you. Folding preserves chips for better opportunities.",
    assumption:
      "Standard tight early-position opening policy. No special exploitative read is supplied.",
    lesson: "ranges-blockers",
  },
  {
    id: "button-aq",
    group: "Preflop",
    title: "Use your position",
    street: "Preflop",
    hero: ["As", "Qs"],
    board: [],
    position: "BTN",
    pot: 1.5,
    call: 1,
    prompt: "It folds to your button. What do you do?",
    context: "6-max · 100 BB effective · No ante · Folded to BTN",
    options: [
      { action: "fold", label: "Fold" },
      { action: "call", label: "Limp 1 BB" },
      { action: "raise", label: "Raise to 2.5 BB" },
    ],
    best: "raise",
    why: "Ace-queen suited is a strong opening hand. You can win the blinds immediately, get calls from weaker hands and act last after the flop against either blind.",
    assumption:
      "Raise-or-fold button opening policy. Opponent-specific adjustments and mixed solver frequencies are not modeled.",
    lesson: "ranges-blockers",
  },
  {
    id: "flop-flush",
    group: "Pot odds",
    title: "Nine outs, two cards to come",
    street: "Flop",
    hero: ["As", "Qs"],
    board: ["Js", "7s", "2d"],
    position: "BTN",
    pot: 15,
    call: 5,
    equity: 1 - (38 / 47) * (37 / 46),
    prompt: "Villain is all-in. Is the flush draw worth a call?",
    context: "Pot is 15 BB including villain’s shove · Call 5 BB",
    options: [
      { action: "fold", label: "Fold" },
      { action: "call", label: "Call 5 BB" },
    ],
    best: "call",
    why: "With nine clean outs and both remaining cards guaranteed, the chance to hit is about 35.0%. You need only 25% to break even: 5 ÷ (15 + 5). Under this exercise’s model, calling has positive expected value.",
    assumption:
      "Clean-outs exercise: only a flush wins, every spade is a winner, and the opponent never redraws. Real hand equity can differ. No rake; no further betting.",
    lesson: "equity-outs",
  },
  {
    id: "turn-flush",
    group: "Pot odds",
    title: "The price changed",
    street: "Turn",
    hero: ["Ks", "Qs"],
    board: ["Js", "7s", "2d", "4c"],
    position: "BTN",
    pot: 30,
    call: 10,
    equity: 9 / 46,
    prompt: "One card to come. Call the all-in bet?",
    context: "Pot is 30 BB including villain’s shove · Call 10 BB",
    options: [
      { action: "fold", label: "Fold" },
      { action: "call", label: "Call 10 BB" },
    ],
    best: "fold",
    why: "Nine outs with one card to come give 9 ÷ 46 = 19.6%. The call needs 10 ÷ 40 = 25%. You cannot recover the shortfall through later betting because the opponent is all-in.",
    assumption:
      "Nine clean outs, no other winning cards or redraws. Pot includes villain’s bet; no rake or future betting.",
    lesson: "pot-odds",
  },
  {
    id: "turn-straight",
    group: "Pot odds",
    title: "A small price for a draw",
    street: "Turn",
    hero: ["8s", "7h"],
    board: ["6d", "9c", "As", "2h"],
    position: "BTN",
    pot: 50,
    call: 5,
    equity: 8 / 46,
    prompt: "You have eight clean outs. Take this price?",
    context: "Pot is 50 BB including villain’s shove · Call 5 BB",
    options: [
      { action: "fold", label: "Fold" },
      { action: "call", label: "Call 5 BB" },
    ],
    best: "call",
    why: "A five or ten completes your straight: eight outs out of 46 unseen cards, or 17.4%. Calling needs only 5 ÷ 55 = 9.1%. A draw can be profitable even when it usually misses.",
    assumption:
      "All eight outs win; all other rivers lose. No rake, redraws or further betting.",
    lesson: "pot-odds",
  },
  {
    id: "river-catch",
    group: "River",
    title: "Catch enough bluffs",
    street: "River",
    hero: ["Ah", "Qc"],
    board: ["As", "Td", "7h", "4c", "2s"],
    position: "BTN",
    pot: 75,
    call: 25,
    equity: 0.3,
    prompt: "Your read gives this hand 30% equity. Call?",
    context: "Villain bets 25 BB into 50 BB · Pot now 75 BB",
    options: [
      { action: "fold", label: "Fold" },
      { action: "call", label: "Call 25 BB" },
    ],
    best: "call",
    why: "The call requires 25% equity. At the assumed 30%, call EV = 0.30 × 100 − 25 = +5 BB. Judge the decision using the range and price, not the opponent’s one revealed hand.",
    assumption:
      "30% equity is a supplied range assumption, not an engine estimate. River decision; no rake or further action.",
    lesson: "expected-value",
  },
  {
    id: "river-fold",
    group: "River",
    title: "A strong-looking hand can fold",
    street: "River",
    hero: ["Kh", "Qd"],
    board: ["Ks", "Ts", "7s", "4c", "2s"],
    position: "BTN",
    pot: 100,
    call: 50,
    equity: 0.2,
    prompt: "Against this range, assume 20% equity. Continue?",
    context: "Villain bets 50 BB into 50 BB · Pot now 100 BB",
    options: [
      { action: "fold", label: "Fold" },
      { action: "call", label: "Call 50 BB" },
    ],
    best: "fold",
    why: "You need 50 ÷ 150 = 33.3%, but the assumed equity is only 20%. Calling is worth 0.20 × 150 − 50 = −20 BB. Already-invested chips are sunk costs.",
    assumption:
      "20% equity is a teaching assumption about the opponent’s range. No rake and no further action.",
    lesson: "expected-value",
  },
  {
    id: "river-bluff",
    group: "River",
    title: "Find the break-even bluff",
    street: "River",
    hero: ["8h", "7h"],
    board: ["As", "Kd", "6c", "3s", "2c"],
    position: "BTN",
    pot: 20,
    call: 0,
    bet: 10,
    foldProbability: 0.4,
    prompt: "Villain checks and folds 40% of the time. Bluff 10 BB?",
    context: "River · Pot 20 BB · Zero showdown equity",
    options: [
      { action: "check", label: "Check" },
      { action: "bet", label: "Bet 10 BB" },
    ],
    best: "bet",
    why: "A pure bluff needs folds more than 10 ÷ (20 + 10) = 33.3% of the time. At the assumed 40%, EV = 0.40 × 20 − 0.60 × 10 = +2 BB. Checking has zero EV in this model.",
    assumption:
      "A pure bluff: always loses when called, no raises, no rake. The 40% fold frequency is supplied, not predicted.",
    lesson: "bluff-math",
  },
];
export function drillCallEv(d: PokerDrill) {
  return d.equity === undefined
    ? undefined
    : d.equity * (d.pot + d.call) - d.call;
}
