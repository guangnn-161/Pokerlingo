import { fullDeck, formatCard, choose } from "./cards";
export type EquityTable = { n: number; order: string[]; p: number[][] };
export type PushFoldModel = {
  hands: string[];
  joint: Float64Array;
  equity: Float64Array;
  prior: Float64Array;
  samples: number;
};
export type PushFoldSolution = {
  stack: number;
  iterations: number;
  shove: number[];
  call: number[];
  shoveEv: number[];
  callEv: number[];
  value: number;
  nashConv: number;
  sbGain: number;
  bbGain: number;
  converged: boolean;
};
const ranks = "23456789TJQKA";
function handClass(a: string, b: string) {
  const ar = ranks.indexOf(a[0]!),
    br = ranks.indexOf(b[0]!);
  const hi = ar >= br ? a : b,
    lo = ar >= br ? b : a;
  return hi[0]! + lo[0]! + (ar === br ? "" : hi[1] === lo[1] ? "s" : "o");
}
export function buildPushFoldModel(table: EquityTable): PushFoldModel {
  const n = 169;
  if (
    table.order.length !== n ||
    new Set(table.order).size !== n ||
    table.p.length !== (n * (n + 1)) / 2 ||
    table.n < 1000
  )
    throw new Error("Invalid preflop dataset.");
  const grouped = new Map<string, string[][]>();
  for (const pair of choose(fullDeck().map(formatCard), 2)) {
    const name = handClass(pair[0]!, pair[1]!);
    grouped.set(name, [...(grouped.get(name) || []), pair]);
  }
  const combos = table.order.map((h) => {
    const c = grouped.get(h);
    if (!c) throw new Error("Unknown hand class.");
    return c;
  });
  const joint = new Float64Array(n * n),
    equity = new Float64Array(n * n).fill(NaN),
    prior = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const hero = combos[i]![0]!;
    prior[i] = combos[i]!.length / 1326;
    for (let j = 0; j < n; j++) {
      const legal = combos[j]!.filter(
        (v) => !v.some((c) => hero.includes(c)),
      ).length;
      joint[i * n + j] = (combos[i]!.length * legal) / (1326 * 1225);
    }
  }
  for (const row of table.p) {
    if (row.length !== 5) throw new Error("Malformed matchup.");
    const [i, j, w, t, l] = row as [number, number, number, number, number];
    if (
      !Number.isInteger(i) ||
      !Number.isInteger(j) ||
      i < 0 ||
      j < i ||
      j >= n ||
      [w, t, l].some((v) => !Number.isFinite(v) || v < 0) ||
      Math.abs(w + t + l - 1000) > 2 ||
      !Number.isNaN(equity[i * n + j]!)
    )
      throw new Error("Invalid matchup probabilities.");
    // Upstream integer permille rounding can sum to 999/1001. Normalize and enforce zero-sum symmetry.
    const e = i === j ? 0.5 : (w + t / 2) / (w + t + l);
    equity[i * n + j] = e;
    equity[j * n + i] = 1 - e;
  }
  if (equity.some((v) => !Number.isFinite(v)))
    throw new Error("Incomplete equity table.");
  return { hands: table.order, joint, equity, prior, samples: table.n };
}
function matrix(model: PushFoldModel, stack: number) {
  return Float64Array.from(
    model.joint,
    (w, k) => w * (stack * (2 * model.equity[k]! - 1) - 1),
  );
}
export function auditPushFold(
  model: PushFoldModel,
  stack: number,
  p: ArrayLike<number>,
  q: ArrayLike<number>,
) {
  const n = model.hands.length,
    m = matrix(model, stack),
    a = Float64Array.from(model.prior, (v) => 1.5 * v),
    b = new Float64Array(n);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const v = m[i * n + j]!;
      a[i] = a[i]! + v * q[j]!;
      b[j] = b[j]! + v * p[i]!;
    }
  let value = -0.5,
    upper = -0.5,
    lower = -0.5;
  for (let i = 0; i < n; i++) {
    value += p[i]! * a[i]!;
    upper += Math.max(0, a[i]!);
    lower += 1.5 * model.prior[i]! * p[i]! + Math.min(0, b[i]!);
  }
  const shoveEv = Array.from(a, (v, i) => v / model.prior[i]!);
  const callEv = Array.from(b, (v, j) => {
    let reach = 0;
    for (let i = 0; i < n; i++) reach += model.joint[i * n + j]! * p[i]!;
    return reach > 0 ? -v / reach : 0;
  });
  return {
    value,
    nashConv: Math.max(0, upper - lower),
    sbGain: Math.max(0, upper - value),
    bbGain: Math.max(0, value - lower),
    shoveEv,
    callEv,
  };
}
/** Regret matching+ in the two-player zero-sum push/fold game; measured best-response gap on the average profile. */
export function solvePushFold(
  model: PushFoldModel,
  stack: number,
  options: {
    iterations?: number;
    tolerance?: number;
    progress?: (iteration: number, gap: number) => void;
  } = {},
): PushFoldSolution {
  if (!Number.isFinite(stack) || stack < 1 || stack > 25)
    throw new Error("Effective stack must be 1–25 BB including blinds.");
  const n = model.hands.length,
    max = options.iterations ?? 12000,
    tolerance = options.tolerance ?? 0.002;
  if (
    !Number.isInteger(max) ||
    max < 1 ||
    max > 100000 ||
    !Number.isFinite(tolerance) ||
    tolerance < 0
  )
    throw new Error("Invalid solver controls.");
  const m = matrix(model, stack),
    rp = new Float64Array(n * 2),
    rq = new Float64Array(n * 2),
    p = new Float64Array(n).fill(0.5),
    q = new Float64Array(n).fill(0.5),
    sp = new Float64Array(n),
    sq = new Float64Array(n);
  let totalWeight = 0,
    iteration = 0,
    audit: ReturnType<typeof auditPushFold> | undefined,
    avgP: number[] = [],
    avgQ: number[] = [];
  for (iteration = 1; iteration <= max; iteration++) {
    const dp = Float64Array.from(model.prior, (v) => 1.5 * v),
      dq = new Float64Array(n);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const k = i * n + j,
          v = m[k]!;
        dp[i] = dp[i]! + v * q[j]!;
        dq[j] = dq[j]! - v * p[i]!;
      }
    totalWeight += iteration;
    for (let i = 0; i < n; i++) {
      sp[i] = sp[i]! + iteration * p[i]!;
      sq[i] = sq[i]! + iteration * q[i]!;
      rp[i * 2] = Math.max(0, rp[i * 2]! + (1 - p[i]!) * dp[i]!);
      rp[i * 2 + 1] = Math.max(0, rp[i * 2 + 1]! - p[i]! * dp[i]!);
      rq[i * 2] = Math.max(0, rq[i * 2]! + (1 - q[i]!) * dq[i]!);
      rq[i * 2 + 1] = Math.max(0, rq[i * 2 + 1]! - q[i]! * dq[i]!);
      const ps = rp[i * 2]! + rp[i * 2 + 1]!,
        qs = rq[i * 2]! + rq[i * 2 + 1]!;
      p[i] = ps ? rp[i * 2]! / ps : 0.5;
      q[i] = qs ? rq[i * 2]! / qs : 0.5;
    }
    if (iteration % 500 === 0 || iteration === max) {
      avgP = Array.from(sp, (x) => x / totalWeight);
      avgQ = Array.from(sq, (x) => x / totalWeight);
      audit = auditPushFold(model, stack, avgP, avgQ);
      options.progress?.(iteration, audit.nashConv);
      if (audit.nashConv <= tolerance) break;
    }
  }
  return {
    stack,
    iterations: Math.min(iteration, max),
    shove: avgP,
    call: avgQ,
    ...audit!,
    converged: audit!.nashConv <= tolerance,
  };
}
