import data from "@pokerlingo/math/preflop-data";
import { buildPushFoldModel, solvePushFold } from "@pokerlingo/math/push-fold";
const model = buildPushFoldModel(data);
self.onmessage = ({
  data: request,
}: MessageEvent<{ id: number; stack: number }>) => {
  try {
    const solution = solvePushFold(model, request.stack, {
      progress: (iteration, gap) =>
        self.postMessage({ id: request.id, progress: { iteration, gap } }),
    });
    self.postMessage({
      id: request.id,
      solution,
      hands: model.hands,
      prior: Array.from(model.prior),
      samples: model.samples,
    });
  } catch (e) {
    self.postMessage({
      id: request.id,
      error: e instanceof Error ? e.message : "Solver failed.",
    });
  }
};
