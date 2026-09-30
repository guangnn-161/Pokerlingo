import {
  calculateVariantEquity,
  generatePokerSpot,
  gradePokerDecision,
  type PokerVariant,
} from "@pokerlingo/math";
type Request = {
  id: number;
  variant: PokerVariant;
  seed: number;
  street: "mixed" | "early" | "middle" | "late";
};
self.onmessage = ({ data }: MessageEvent<Request>) => {
  try {
    const spot = generatePokerSpot(data.variant, data.seed, data.street);
    const equity = calculateVariantEquity({
      ...spot,
      samples: 2400,
      seed: data.seed ^ 0x7f4a7c15,
    });
    self.postMessage({
      id: data.id,
      spot,
      equity,
      grade: gradePokerDecision(equity, spot.pot, spot.call),
    });
  } catch (e) {
    self.postMessage({
      id: data.id,
      error: e instanceof Error ? e.message : "Unable to calculate this spot.",
    });
  }
};
