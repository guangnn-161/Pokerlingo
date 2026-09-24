import { assertFinite } from "./types";

export type Suit = "c" | "d" | "h" | "s";
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
export type Card = { rank: Rank; suit: Suit };

const rankValues: Record<string, Rank> = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
  T: 10, "10": 10, J: 11, Q: 12, K: 13, A: 14
};
const suitValues: Record<string, Suit> = {
  c: "c", "♣": "c", d: "d", "♦": "d", h: "h", "♥": "h", s: "s", "♠": "s"
};
const rankSymbols: Record<number, string> = { 10: "T", 11: "J", 12: "Q", 13: "K", 14: "A" };

export function parseCard(input: string): Card {
  const token = input.trim();
  const match = /^(10|[2-9TJQKA])([cdhs♣♦♥♠])$/i.exec(token);
  if (!match) throw new Error(`Invalid card "${input}". Use rank+suit, e.g. As or A♠.`);
  const rank = rankValues[match[1]!.toUpperCase()];
  const suit = suitValues[match[2]!.toLowerCase()] ?? suitValues[match[2]!];
  if (rank === undefined || suit === undefined) throw new Error(`Invalid card "${input}".`);
  return { rank, suit };
}

export function formatCard(card: Card) {
  return `${rankSymbols[card.rank] ?? String(card.rank)}${card.suit}`;
}

export function cardKey(card: Card) {
  return `${card.rank}${card.suit}`;
}

export function parseCards(input: string | readonly string[]): Card[] {
  const tokens = Array.isArray(input)
    ? [...input]
    : (input as string).trim().split(/[\s,]+/).filter(Boolean);
  if (tokens.length === 0) throw new Error("At least one card is required.");
  const cards = tokens.map(parseCard);
  assertDistinctCards(cards);
  return cards;
}

export function assertDistinctCards(cards: readonly Card[]) {
  const seen = new Set<string>();
  for (const card of cards) {
    const key = cardKey(card);
    if (seen.has(key)) throw new Error(`Duplicate card ${formatCard(card)}.`);
    seen.add(key);
  }
}

export function assertDistinctCardGroups(...groups: readonly Card[][]) {
  assertDistinctCards(groups.flat());
}

export function fullDeck(): Card[] {
  const cards: Card[] = [];
  for (const suit of ["c", "d", "h", "s"] as const) {
    for (let rank = 2; rank <= 14; rank += 1) cards.push({ rank: rank as Rank, suit });
  }
  return cards;
}

export function choose<T>(items: readonly T[], count: number): T[][] {
  assertFinite(count, "count");
  if (!Number.isInteger(count) || count < 0 || count > items.length) throw new Error("Invalid combination size.");
  const result: T[][] = [];
  const selected: T[] = [];
  function visit(start: number) {
    if (selected.length === count) {
      result.push([...selected]);
      return;
    }
    for (let index = start; index <= items.length - (count - selected.length); index += 1) {
      selected.push(items[index]!);
      visit(index + 1);
      selected.pop();
    }
  }
  visit(0);
  return result;
}
