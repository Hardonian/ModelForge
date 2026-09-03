export * from "./analytical";
export * from "./interpolator";
export * from "./evaluator";

import { PredictionTarget, predictWithNeighbors } from "./interpolator";
import {
  OpenComputeBenchRecord,
  PredictionResult,
} from "@modelforge/benchmark-schema";

export const PREDICTOR_VERSION = "predictor_v1.0.0";

export class PerformancePredictor {
  private readonly version: string;

  constructor(version = PREDICTOR_VERSION) {
    this.version = version;
  }

  predict(
    target: PredictionTarget,
    corpus: OpenComputeBenchRecord[],
  ): PredictionResult {
    return predictWithNeighbors(target, corpus, this.version);
  }
}
