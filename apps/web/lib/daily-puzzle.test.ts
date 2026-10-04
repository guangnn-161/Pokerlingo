import { describe, expect, it } from "vitest";
import { dailyAttemptKind } from "./daily-puzzle";

describe("daily attempts", () => {
  it("records a distinct retry as practice instead of replacing the first score", () => {
    expect(dailyAttemptKind(false)).toBe(1);
    expect(dailyAttemptKind(true)).toBe(0);
  });
});
