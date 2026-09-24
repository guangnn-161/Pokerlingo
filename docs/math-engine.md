# Math engine v1

`@pokerlingo/math` is a pure TypeScript package. It contains no React, database, or auth dependencies. The demo functions remain exported for the existing `/api/demo/*` consumers.

## Calculator API

`POST /api/math/calculate` accepts one calculation request and returns:

```json
{
  "data": {
    "result": { "requiredEquity": 0.25 },
    "engineVersion": "math-v1.0.0",
    "ruleset": { "id": "poker-pot-odds", "version": "1" },
    "calculationMethod": "exact-formula",
    "assumptions": ["Pot is the amount available before hero calls; callBb is additional money required to call."],
    "warnings": []
  },
  "requestId": "..."
}
```

Supported calculation names:

| Game | `calculation` | Inputs |
|---|---|---|
| `poker` | `required-equity` | `potBb`, `callBb` |
| `poker` | `call-ev` | `equity`, `finalPotBb`, `callBb` |
| `poker` | `bet-ev` | `foldProbability`, `equityWhenCalled`, `potBb`, `riskBb`, `villainCallBb` |
| `poker` | `equity` | `heroCards`, `board`, one of `villainCards` or `villainRange`; optional method, sample count, and seed |
| `poker` | `range-parse` | `notation`, optional visible `blockers` |
| `poker` | `rake` | `potBb`, `percent`, `capBb`, optional `flopSeen` |
| `blackjack` | `hand-ev` | `playerCards`, `dealerUpcard`, optional versioned ruleset overrides |
| `casino` | `roulette-even-money` | `wheel: european \| american` |
| `casino` | `sportsbook-market` | `decimalOdds` |
| `casino` | `payout-table` | mutually exclusive outcomes with probability and net profit/loss in stake units |
| `casino` | `risk-simulation` | payout table, fixed `stake`, `rounds`, optional `simulations`, `seed`, and `lossLimit` |

Invalid shapes return HTTP 400 with `INVALID_MATH_REQUEST`. Valid shapes rejected by a calculator (duplicate cards, impossible rules, or invalid probability totals) return HTTP 422 with `CALCULATION_REJECTED`.

## Engine behavior and current limits

- Cards accept `As`, `10h`, or suit symbols such as `A♠`. Texas Hold'em evaluator accepts two hole cards and a 3–5 card board, and rejects duplicate cards.
- Range notation supports pairs (`TT`), suited/offsuit (`AKs`, `KQo`), unqualified hands (`AK`), plus (`TT+`, `AJs+`), same-high-card intervals (`A2s-A5s`), and per-class weights (`AKs:0.5`). The parser expands to 1,326 combos; blockers are removed before combo weights are normalized.
- Heads-up Hold'em equity uses exact enumeration up to 250,000 combo/runout evaluations by default, then deterministic Monte Carlo (20,000 samples by default). Monte Carlo returns the seed, sample count, and standard error. Requests can explicitly select a method; exact requests over the work limit are rejected.
- Poker EV includes required equity, call EV, a single-street bet EV formula, and capped percentage rake. These calculators do not solve a betting tree or infer opponent ranges.
- Blackjack computes hit/stand/double/split/surrender EV in original stake units under the supplied rules. It uses an infinite-deck dynamic program, supports S17/H17 and one split, and marks its card-removal and resplit limits in warnings. It is not a finite-shoe/card-counting engine.
- Casino math includes configurable mutually-exclusive payoff tables, standard European/American even-money roulette, sportsbook overround and normalized implied probabilities, and fixed-stake seeded session simulation. A simulation describes sampled sessions and does not promise a future result.

## Golden vectors

`packages/math/src/test-vectors/v1.json` is the versioned input/output set used by `packages/math/src/index.test.ts`. It covers pot odds, range combo counts, key evaluator ranks, exact river equity and ties, a fixed-seed Monte Carlo result, roulette house edge, and Blackjack natural payout. Update the vector version along with a future engine rules/behavior change.

Run locally:

```sh
pnpm --filter @pokerlingo/math typecheck
pnpm --filter @pokerlingo/math test
pnpm --filter @pokerlingo/web typecheck
```
