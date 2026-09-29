import { it, expect, describe } from "vitest";
import data from "../data/preflop-equity.json";
import {
  auditPushFold,
  buildPushFoldModel,
  solvePushFold,
  type PushFoldModel,
} from "./push-fold";
const model = buildPushFoldModel(data);
describe("push/fold game and convergence", () => {
  it("has exact card-removal weights, normalized mass and zero-sum equities", () => {
    const n = 169;
    expect(model.joint.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    for (let i = 0; i < n; i++) {
      let row = 0;
      for (let j = 0; j < n; j++) {
        row += model.joint[i * n + j]!;
        expect(model.joint[i * n + j]).toBeCloseTo(model.joint[j * n + i]!, 14);
        expect(model.equity[i * n + j]! + model.equity[j * n + i]!).toBeCloseTo(
          1,
          14,
        );
      }
      expect(row).toBeCloseTo(model.prior[i]!, 12);
    }
    const aa = model.hands.indexOf("AA"),
      kk = model.hands.indexOf("KK");
    expect(model.joint[aa * n + aa]).toBeCloseTo(6 / (1326 * 1225), 14);
    expect(model.equity[aa * n + kk]).toBeGreaterThan(0.8);
    expect(model.equity[aa * n + kk]).toBeLessThan(0.84);
  });
  it("matches an analytically solved one-class 50/50 game", () => {
    const one: PushFoldModel = {
      hands: ["same"],
      joint: new Float64Array([1]),
      equity: new Float64Array([0.5]),
      prior: new Float64Array([1]),
      samples: 0,
    };
    const s = solvePushFold(one, 10, { iterations: 1000, tolerance: 0.00001 });
    expect(s.shove[0]).toBeGreaterThan(0.999);
    expect(s.call[0]).toBeGreaterThan(0.999);
    expect(s.value).toBeCloseTo(0, 4);
    expect(s.nashConv).toBeLessThan(0.00001);
    expect(auditPushFold(one, 10, [0], [0])).toMatchObject({
      value: -0.5,
      sbGain: 1.5,
      bbGain: 0,
    });
  });
  it("computes best-response bounds independently by enumerating pure two-type profiles", () => {
    const m: PushFoldModel = {
      hands: ["weak", "strong"],
      joint: new Float64Array([0.25, 0.25, 0.25, 0.25]),
      equity: new Float64Array([0.5, 0.2, 0.8, 0.5]),
      prior: new Float64Array([0.5, 0.5]),
      samples: 0,
    };
    const p = [0.2, 0.8],
      q = [0.3, 0.9],
      S = 6;
    function value(x: number[], y: number[]) {
      let u = 0;
      for (let i = 0; i < 2; i++)
        for (let j = 0; j < 2; j++)
          u +=
            0.25 *
            ((1 - x[i]!) * -0.5 +
              x[i]! * (1 - y[j]! + y[j]! * S * (2 * m.equity[i * 2 + j]! - 1)));
      return u;
    }
    const profiles = [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ],
      upper = Math.max(...profiles.map((x) => value(x, q))),
      lower = Math.min(...profiles.map((y) => value(p, y)));
    const a = auditPushFold(m, S, p, q);
    expect(a.value).toBeCloseTo(value(p, q), 12);
    expect(a.nashConv).toBeCloseTo(upper - lower, 12);
  });
  it.each([2, 5, 10, 20])(
    "solves the sampled 169-class game at %s BB with measured small deviation gains",
    (stack) => {
      const s = solvePushFold(model, stack);
      expect(s.nashConv).toBeLessThan(0.006);
      expect(s.shove).toHaveLength(169);
      expect(s.call).toHaveLength(169);
      expect(s.shove.every((x) => x >= 0 && x <= 1)).toBe(true);
      expect(s.shove[model.hands.indexOf("AA")]).toBeGreaterThan(0.99);
      expect(s.call[model.hands.indexOf("AA")]).toBeGreaterThan(0.99);
      expect(s.nashConv).toBeCloseTo(
        auditPushFold(model, stack, s.shove, s.call).nashConv,
        12,
      );
    },
    20000,
  );
});
