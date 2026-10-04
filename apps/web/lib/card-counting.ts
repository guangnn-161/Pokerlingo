import {
  createRound,
  shuffledShoe,
  type Round,
  type TableRules,
} from "./blackjack-game";

export function hiLo(card: string): number {
  if (!/^(?:[2-9TJQKA]|10)[shdc]$/.test(card))
    throw new Error("Invalid counting card.");
  const rank = card.slice(0, -1);
  return "23456".includes(rank) ? 1 : "789".includes(rank) ? 0 : -1;
}
export const runningCount = (cards: readonly string[]) =>
  cards.reduce((n, card) => n + hiLo(card), 0);
export function trueCount(count: number, unseenCards: number) {
  if (
    !Number.isFinite(count) ||
    !Number.isInteger(unseenCards) ||
    unseenCards < 0
  )
    throw new Error("Invalid count input.");
  return unseenCards === 0 ? null : count / (unseenCards / 52);
}
/** Each physical card occurs once here even after a split. Dealer hole card is unknown until settlement. */
export function exposedCards(round: Round): string[] {
  return [
    ...round.hands.flatMap((h) => h.cards),
    ...round.dealer.filter((_, i) => round.phase === "settled" || i !== 1),
  ];
}
export type CountingShoe = {
  round: Round | null;
  previous: string[];
  number: number;
};
export const emptyCountingShoe = (): CountingShoe => ({
  round: null,
  previous: [],
  number: 0,
});
export function advanceCountingShoe(
  state: CountingShoe,
  rules: TableRules,
  freshDeck: () => string[] = shuffledShoe,
): CountingShoe {
  if (state.round?.phase === "playing")
    throw new Error("Finish this hand before dealing again.");
  // Six decks, cut card at 75% penetration. Never start a hand beyond the cut.
  const shuffle = !state.round || state.round.deck.length <= 78;
  return {
    round: createRound(rules, shuffle ? freshDeck() : state.round!.deck),
    previous: shuffle ? [] : [...state.previous, ...exposedCards(state.round!)],
    number: state.number + Number(shuffle),
  };
}
export function shoeCount(state: CountingShoe) {
  const seen = [
    ...state.previous,
    ...(state.round ? exposedCards(state.round) : []),
  ];
  const unseen = 312 - seen.length;
  return {
    running: runningCount(seen),
    true: trueCount(runningCount(seen), unseen),
    seen: seen.length,
    unseen,
    decks: unseen / 52,
  };
}
export function countingDeck(
  decks: number,
  random: () => number = Math.random,
) {
  if (![1, 2, 6].includes(decks)) throw new Error("Choose 1, 2 or 6 decks.");
  const cards = Array.from({ length: decks }, () =>
    [..."shdc"].flatMap((s) => [..."23456789TJQKA"].map((r) => r + s)),
  ).flat();
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [cards[i], cards[j]] = [cards[j]!, cards[i]!];
  }
  return cards;
}
