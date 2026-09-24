export const ENGINE_VERSION = "demo-math-v0.1";

function finite(value: number, field: string) {
  if (!Number.isFinite(value)) throw new Error(`${field} must be a finite number.`);
}

export function requiredEquity(potBeforeCallBb: number, callBb: number) {
  finite(potBeforeCallBb, "potBeforeCallBb");
  finite(callBb, "callBb");
  if (potBeforeCallBb < 0 || callBb <= 0) throw new Error("Pot must be non-negative and call must be positive.");
  return callBb / (potBeforeCallBb + callBb);
}

export function callEvBb(equity: number, finalPotBb: number, callBb: number) {
  finite(equity, "equity");
  finite(finalPotBb, "finalPotBb");
  finite(callBb, "callBb");
  if (equity < 0 || equity > 1 || finalPotBb < 0 || callBb < 0) throw new Error("Invalid poker EV inputs.");
  return equity * finalPotBb - callBb;
}

export function rouletteHouseEdge(wheel: "european" | "american") {
  return wheel === "european" ? 1 / 37 : 2 / 38;
}

export function sportsbookOverround(decimalOdds: number[]) {
  if (decimalOdds.length < 2 || decimalOdds.some((odd) => !Number.isFinite(odd) || odd <= 1)) {
    throw new Error("Provide at least two decimal odds above 1.");
  }
  return decimalOdds.reduce((total, odd) => total + 1 / odd, 0) - 1;
}

export type BlackjackRecommendation = {
  action: "hit" | "stand" | "double" | "split";
  explanation: string;
};

export function blackjackBasicStrategy(total: number, dealerUpcard: number, soft = false): BlackjackRecommendation {
  if (total < 4 || total > 21 || dealerUpcard < 2 || dealerUpcard > 11) throw new Error("Invalid blackjack state.");
  if (soft && total >= 18) {
    return total === 18 && dealerUpcard >= 9
      ? { action: "hit", explanation: "Soft 18 đánh thêm trước 9, 10 hoặc Á theo ruleset demo." }
      : { action: "stand", explanation: "Soft total cao ưu tiên đứng trong ruleset demo." };
  }
  if (total >= 17) return { action: "stand", explanation: "Hard 17+ đứng trong ruleset demo." };
  if (total <= 8) return { action: "hit", explanation: "Hard 8 hoặc thấp hơn luôn hit trong ruleset demo." };
  if (total === 11) return { action: "double", explanation: "Hard 11 double để tận dụng EV khi chỉ rút một lá." };
  if (total >= 12 && total <= 16 && dealerUpcard >= 2 && dealerUpcard <= 6) {
    return { action: "stand", explanation: "Dealer có khả năng bust; giữ hard total hiện tại." };
  }
  return { action: "hit", explanation: "Cần cải thiện total trước dealer upcard mạnh." };
}
