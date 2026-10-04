import type { GameKey } from "@pokerlingo/contracts/game";
import type { AttemptResult, DailyAttemptResult, LearningAction } from "@pokerlingo/contracts/learning";

const gameLabels: Record<GameKey, string> = {
  nlhe: "NL Hold'em",
  blackjack: "Blackjack",
  roulette: "Roulette",
  baccarat: "Baccarat",
  sportsbook: "Sportsbook"
};

export function gameLabel(game: GameKey) {
  return gameLabels[game];
}

export function actionLabel(action: LearningAction) {
  const verb = action.type.slice(0, 1).toUpperCase() + action.type.slice(1);
  return action.size ? `${verb} to ${action.size}` : verb;
}

export type Feedback = {
  headline: string;
  score: number;
  evLossBb: number;
  bestAction: string;
  explanation: string;
  assumptions: string[];
  calculationMethod: string;
};

function feedback(result: AttemptResult | DailyAttemptResult, headline: string): Feedback {
  return {
    headline,
    score: result.score,
    evLossBb: result.evLossBb,
    bestAction: actionLabel(result.bestAction),
    explanation: result.explanationMd,
    assumptions: result.assumptions,
    calculationMethod: result.calculationMethod
  };
}

export function scenarioFeedback(result: AttemptResult | null) {
  return result ? feedback(result, result.evLossBb === 0 ? "Best action found" : "Review the EV gap") : null;
}

export function scenarioViewState({ pending, result }: { pending: boolean; result: AttemptResult | null }) {
  return { actionsDisabled: pending || result !== null, feedback: scenarioFeedback(result) };
}

export function dailyFeedback(result: DailyAttemptResult | null) {
  if (!result) return null;
  return feedback(result, result.isFirstAttempt ? "Daily result recorded" : "Practice attempt — XP unchanged");
}

export function dailyViewState({ errorCode, result }: { errorCode: string | null; result: DailyAttemptResult | null }) {
  if (errorCode === "DAILY_NOT_FOUND") return { mode: "empty" as const, feedback: null };
  return result ? { mode: "result" as const, feedback: dailyFeedback(result) } : { mode: "ready" as const, feedback: null };
}

export function questProgress(quest: { progress: number; target: number }) {
  if (quest.target <= 0) return 0;
  return Math.min(100, Math.round((quest.progress / quest.target) * 100));
}

export function questLabel(cadence: "daily" | "weekly" | "recovery", label: string) {
  const prefix = cadence === "recovery" ? "Recovery" : cadence === "weekly" ? "Weekly" : "Daily";
  return `${prefix} · ${label}`;
}
