import { assertFinite, assertProbability, calculationResult } from "./types";

export type PayoffOutcome = { name: string; probability: number; netUnits: number };
export type PayoutAnalysis = {
  expectedNetUnits: number;
  houseEdge: number;
  rtp: number;
  varianceUnitsSquared: number;
  standardDeviationUnits: number;
};

/** `netUnits` is the player's net profit/loss per one unit staked. */
export function analyzePayoutTable(outcomes: readonly PayoffOutcome[]) {
  if (outcomes.length < 2) throw new Error("A payout table must contain at least two outcomes.");
  for (const outcome of outcomes) {
    if (!outcome.name.trim()) throw new Error("Every payout outcome needs a name.");
    assertProbability(outcome.probability, `${outcome.name}.probability`);
    assertFinite(outcome.netUnits, `${outcome.name}.netUnits`);
  }
  const probabilityTotal = outcomes.reduce((sum, outcome) => sum + outcome.probability, 0);
  if (Math.abs(probabilityTotal - 1) > 1e-9) throw new Error("Outcome probabilities must sum to 1.");
  const expectedNetUnits = outcomes.reduce((sum, outcome) => sum + outcome.probability * outcome.netUnits, 0);
  const varianceUnitsSquared = outcomes.reduce(
    (sum, outcome) => sum + outcome.probability * (outcome.netUnits - expectedNetUnits) ** 2,
    0
  );
  const analysis: PayoutAnalysis = {
    expectedNetUnits,
    houseEdge: expectedNetUnits === 0 ? 0 : -expectedNetUnits,
    rtp: 1 + expectedNetUnits,
    varianceUnitsSquared,
    standardDeviationUnits: Math.sqrt(varianceUnitsSquared)
  };
  return calculationResult(
    analysis,
    { id: "user-supplied-payout-table", version: "1" },
    "payoff-enumeration",
    ["Outcomes are mutually exclusive, probabilities sum to one, and netUnits includes profit or loss after stake."],
    expectedNetUnits > 0 ? ["The player expectation is positive only under the supplied payout assumptions; verify the rules and fees."] : []
  );
}

export type RouletteWheel = "european" | "american";
export function rouletteHouseEdge(wheel: RouletteWheel) {
  return wheel === "european" ? 1 / 37 : 2 / 38;
}

export function rouletteEvenMoneyAnalysis(wheel: RouletteWheel) {
  const pockets = wheel === "european" ? 37 : 38;
  const wins = 18;
  const result = analyzePayoutTable([
    { name: "win", probability: wins / pockets, netUnits: 1 },
    { name: "lose", probability: 1 / pockets * (pockets - wins), netUnits: -1 }
  ]);
  return calculationResult(
    result.result,
    { id: `roulette-${wheel}-even-money`, version: "standard-payout-v1" },
    "exact-formula",
    ["Even-money bet with standard roulette payout.", "No La Partage, En Prison, or other special-zero rule."],
    []
  );
}

export function sportsbookOverround(decimalOdds: readonly number[]) {
  if (decimalOdds.length < 2 || decimalOdds.some((odd) => !Number.isFinite(odd) || odd <= 1)) {
    throw new Error("Provide at least two decimal odds above 1.");
  }
  return decimalOdds.reduce((total, odd) => total + 1 / odd, 0) - 1;
}

export function sportsbookMarket(decimalOdds: readonly number[]) {
  const rawImpliedProbabilities = decimalOdds.map((odd) => {
    assertFinite(odd, "decimalOdds");
    if (odd <= 1) throw new Error("Decimal odds must be greater than 1.");
    return 1 / odd;
  });
  if (rawImpliedProbabilities.length < 2) throw new Error("At least two outcomes are required.");
  const overround = rawImpliedProbabilities.reduce((sum, probability) => sum + probability, 0) - 1;
  return {
    rawImpliedProbabilities,
    normalizedProbabilities: rawImpliedProbabilities.map((probability) => probability / (overround + 1)),
    overround
  };
}

export type RiskSimulationInput = {
  outcomes: readonly PayoffOutcome[];
  stake: number;
  rounds: number;
  simulations?: number;
  seed?: number;
  lossLimit?: number;
};
export type RiskSimulationOutput = {
  simulations: number;
  seed: number;
  rounds: number;
  medianNet: number;
  percentile05Net: number;
  percentile95Net: number;
  chanceOfEndingDown: number;
  chanceOfReachingLossLimit: number | null;
  expectedTurnover: number;
  theoreticalExpectedLoss: number;
};

function makeRandom(seed: number) {
  let state = seed >>> 0 || 0x9e3779b9;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x1_0000_0000;
  };
}

function quantile(sorted: readonly number[], quantileValue: number) {
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * quantileValue))]!;
}

export function simulateFixedStakeRisk(input: RiskSimulationInput) {
  const analysis = analyzePayoutTable(input.outcomes).result;
  assertFinite(input.stake, "stake");
  if (input.stake <= 0) throw new Error("stake must be positive.");
  if (!Number.isInteger(input.rounds) || input.rounds < 1 || input.rounds > 100_000) {
    throw new Error("rounds must be an integer between 1 and 100000.");
  }
  const simulations = input.simulations ?? 10_000;
  const seed = input.seed ?? 20_260_924;
  if (!Number.isInteger(simulations) || simulations < 1 || simulations > 100_000) {
    throw new Error("simulations must be an integer between 1 and 100000.");
  }
  if (!Number.isInteger(seed)) throw new Error("seed must be an integer.");
  if (input.lossLimit !== undefined) {
    assertFinite(input.lossLimit, "lossLimit");
    if (input.lossLimit <= 0) throw new Error("lossLimit must be positive.");
  }
  const random = makeRandom(seed);
  const results: number[] = [];
  let hitLossLimit = 0;
  let totalRoundsPlayed = 0;
  for (let run = 0; run < simulations; run += 1) {
    let net = 0;
    let played = 0;
    for (; played < input.rounds; played += 1) {
      const roll = random();
      let cumulative = 0;
      const outcome = input.outcomes.find((item) => {
        cumulative += item.probability;
        return roll < cumulative;
      }) ?? input.outcomes[input.outcomes.length - 1]!;
      net += input.stake * outcome.netUnits;
      totalRoundsPlayed += 1;
      if (input.lossLimit !== undefined && net <= -input.lossLimit) {
        hitLossLimit += 1;
        played += 1;
        break;
      }
    }
    results.push(net);
  }
  results.sort((left, right) => left - right);
  const output: RiskSimulationOutput = {
    simulations,
    seed,
    rounds: input.rounds,
    medianNet: quantile(results, 0.5),
    percentile05Net: quantile(results, 0.05),
    percentile95Net: quantile(results, 0.95),
    chanceOfEndingDown: results.filter((result) => result < 0).length / simulations,
    chanceOfReachingLossLimit: input.lossLimit === undefined ? null : hitLossLimit / simulations,
    expectedTurnover: input.stake * totalRoundsPlayed / simulations,
    theoreticalExpectedLoss: input.stake * totalRoundsPlayed / simulations * analysis.houseEdge
  };
  return calculationResult(
    output,
    { id: "fixed-stake-risk-simulation", version: "1" },
    "monte-carlo",
    ["Fixed stake per round; session stops after the stated round count or the supplied loss limit.", "Expected turnover and loss use the simulated mean rounds played when a loss limit is configured."],
    ["Simulation percentiles describe sampled sessions and do not predict an individual session."]
  );
}
