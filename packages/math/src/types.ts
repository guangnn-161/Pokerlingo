export const ENGINE_VERSION = "math-v1.0.0";

export type CalculationMethod =
  | "exact-enumeration"
  | "monte-carlo"
  | "exact-infinite-deck-dp"
  | "exact-formula"
  | "payoff-enumeration";

export type CalculationResult<T> = {
  result: T;
  engineVersion: typeof ENGINE_VERSION;
  ruleset: { id: string; version: string };
  calculationMethod: CalculationMethod;
  assumptions: string[];
  warnings: string[];
};

export function calculationResult<T>(
  result: T,
  ruleset: { id: string; version?: string } = { id: "generic", version: "1" },
  calculationMethod: CalculationMethod = "exact-formula",
  assumptions: string[] = [],
  warnings: string[] = []
): CalculationResult<T> {
  return {
    result,
    engineVersion: ENGINE_VERSION,
    ruleset: { id: ruleset.id, version: ruleset.version ?? "1" },
    calculationMethod,
    assumptions,
    warnings
  };
}

export function assertFinite(value: number, field: string) {
  if (!Number.isFinite(value)) throw new Error(`${field} must be a finite number.`);
}

export function assertProbability(value: number, field: string) {
  assertFinite(value, field);
  if (value < 0 || value > 1) throw new Error(`${field} must be between 0 and 1.`);
}
