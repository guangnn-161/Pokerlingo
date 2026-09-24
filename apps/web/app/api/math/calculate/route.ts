import { calculateMath, MathCalculationRequest } from "@pokerlingo/math/api";
import { z } from "zod";
import { fail, ok } from "../../../../lib/api";

const positive = z.number().finite().positive();
const nonNegative = z.number().finite().nonnegative();
const probability = z.number().finite().min(0).max(1);
const cards = z.array(z.string().min(2).max(3));
const outcome = z.object({
  name: z.string().min(1).max(80),
  probability,
  netUnits: z.number().finite()
}).strict();
const ruleset = z.object({
  id: z.string().min(1).max(80).optional(),
  version: z.string().min(1).max(40).optional(),
  decks: z.number().int().min(1).max(12).optional(),
  dealerHitsSoft17: z.boolean().optional(),
  blackjackPayout: z.number().finite().min(0).max(3).optional(),
  doubleAfterSplit: z.boolean().optional(),
  surrender: z.enum(["none", "late"]).optional(),
  holeCard: z.enum(["peek", "no-hole-card"]).optional(),
  noHoleCardDoubleLiability: z.enum(["original-only", "all-bets"]).optional(),
  maxSplitHands: z.number().int().min(1).max(2).optional()
}).strict();

const schemas = z.union([
  z.object({ game: z.literal("poker"), calculation: z.literal("required-equity"), potBb: nonNegative, callBb: positive }).strict(),
  z.object({ game: z.literal("poker"), calculation: z.literal("call-ev"), equity: probability, finalPotBb: nonNegative, callBb: nonNegative }).strict(),
  z.object({ game: z.literal("poker"), calculation: z.literal("bet-ev"), foldProbability: probability, equityWhenCalled: probability, potBb: nonNegative, riskBb: nonNegative, villainCallBb: nonNegative }).strict(),
  z.object({
    game: z.literal("poker"), calculation: z.literal("equity"), heroCards: cards.length(2), board: cards.max(5).optional(),
    villainCards: cards.length(2).optional(), villainRange: z.string().min(1).max(500).optional(),
    method: z.enum(["auto", "exact", "monte-carlo"]).optional(), samples: z.number().int().min(1).max(25_000).optional(),
    seed: z.number().int().optional()
  }).strict().refine((input) => Boolean(input.villainCards) !== Boolean(input.villainRange), "Provide exactly one villainCards or villainRange."),
  z.object({ game: z.literal("poker"), calculation: z.literal("range-parse"), notation: z.string().min(1).max(500), blockers: cards.max(7).optional() }).strict(),
  z.object({ game: z.literal("poker"), calculation: z.literal("rake"), potBb: nonNegative, percent: z.number().finite().min(0).max(1), capBb: nonNegative, flopSeen: z.boolean().optional() }).strict(),
  z.object({ game: z.literal("blackjack"), calculation: z.literal("hand-ev"), playerCards: cards.min(2).max(11), dealerUpcard: z.string().min(2).max(3), ruleset: ruleset.optional() }).strict(),
  z.object({ game: z.literal("casino"), calculation: z.literal("roulette-even-money"), wheel: z.enum(["european", "american"]) }).strict(),
  z.object({ game: z.literal("casino"), calculation: z.literal("sportsbook-market"), decimalOdds: z.array(z.number().finite().gt(1)).min(2).max(100) }).strict(),
  z.object({ game: z.literal("casino"), calculation: z.literal("payout-table"), outcomes: z.array(outcome).min(2).max(100) }).strict(),
  z.object({
    game: z.literal("casino"), calculation: z.literal("risk-simulation"), outcomes: z.array(outcome).min(2).max(100),
    stake: positive, rounds: z.number().int().min(1).max(100_000), simulations: z.number().int().min(1).max(25_000).optional(),
    seed: z.number().int().optional(), lossLimit: positive.optional()
  }).strict()
]);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schemas.safeParse(body);
  if (!parsed.success) {
    return fail(request, 400, "INVALID_MATH_REQUEST", "Yêu cầu tính toán không hợp lệ.", {
      issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), code: issue.code }))
    });
  }
  try {
    const result = calculateMath(parsed.data as MathCalculationRequest);
    return ok(request, result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Math calculation failed.";
    return fail(request, 422, "CALCULATION_REJECTED", message);
  }
}
