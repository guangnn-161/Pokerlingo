import { describe, expect, it } from "vitest";
import { actionLabel, dailyFeedback, dailyViewState, gameLabel, questLabel, questProgress, scenarioFeedback, scenarioViewState } from "./training-state";

describe("training state", () => {
  it("makes supported game and action labels readable", () => {
    expect(gameLabel("nlhe")).toBe("NL Hold'em");
    expect(actionLabel({ type: "raise", size: "2.5x" })).toBe("Raise to 2.5x");
  });

  it("keeps scenario solution feedback absent before a result exists", () => {
    expect(scenarioFeedback(null)).toBeNull();
  });

  it("marks a repeat Daily answer as practice instead of a new XP award", () => {
    expect(dailyFeedback({
      attemptId: "00000000-0000-4000-8000-000000000001",
      puzzleId: "00000000-0000-4000-8000-000000000002",
      isFirstAttempt: false,
      selectedAction: { type: "fold" },
      bestAction: { type: "call" },
      evLossBb: 0.35,
      score: 82,
      mistakeTag: null,
      explanationMd: "Calling protects the range.",
      assumptions: ["100bb effective"],
      engineVersion: "v1",
      calculationMethod: "enumerated"
    })?.headline).toBe("Practice attempt — XP unchanged");
  });

  it("caps quest progress and gives recovery quests a clear label", () => {
    expect(questProgress({ progress: 7, target: 5 })).toBe(100);
    expect(questLabel("recovery", "Fix one recurring spot")).toBe("Recovery · Fix one recurring spot");
  });

  it("derives safe scenario submission states", () => {
    expect(scenarioViewState({ pending: false, result: null })).toMatchObject({ actionsDisabled: false, feedback: null });
    expect(scenarioViewState({ pending: true, result: null })).toMatchObject({ actionsDisabled: true, feedback: null });
    expect(scenarioViewState({ pending: false, result: {
      attemptId: "00000000-0000-4000-8000-000000000003", revisionId: "00000000-0000-4000-8000-000000000004",
      selectedAction: { type: "call" }, bestAction: { type: "call" }, evLossBb: 0, score: 100, mistakeTag: null,
      explanationMd: "Best action.", assumptions: [], engineVersion: "v1", calculationMethod: "enumerated"
    } })).toMatchObject({ actionsDisabled: true, feedback: { score: 100 } });
  });

  it("maps a missing Daily puzzle to an empty state and preserves first-result scoring", () => {
    expect(dailyViewState({ errorCode: "DAILY_NOT_FOUND", result: null })).toMatchObject({ mode: "empty", feedback: null });
    expect(dailyViewState({ errorCode: null, result: {
      attemptId: "00000000-0000-4000-8000-000000000005", puzzleId: "00000000-0000-4000-8000-000000000006", isFirstAttempt: true,
      selectedAction: { type: "stand" }, bestAction: { type: "stand" }, evLossBb: 0, score: 100, mistakeTag: null,
      explanationMd: "Stand.", assumptions: [], engineVersion: "v1", calculationMethod: "enumerated"
    } })).toMatchObject({ mode: "result", feedback: { headline: "Daily result recorded" } });
  });
});
