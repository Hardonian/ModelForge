import {
  PredictionResult,
  OpenComputeBenchRecord,
  PredictionFeedback,
} from "@modelforge/benchmark-schema";
import * as crypto from "crypto";

export interface PredictionEvaluationMetrics {
  mae: number;
  mape_percent: number;
  rmse: number;
  p90_ape_percent: number;
  sample_count: number;
}

export function evaluatePredictionError(
  prediction: PredictionResult,
  actual: OpenComputeBenchRecord,
): PredictionFeedback {
  const predicted = prediction.predicted_throughput_tok_s;
  const actualTps = actual.metrics.tokens_per_second;
  const absoluteError = Math.abs(predicted - actualTps);
  const percentageError = (absoluteError / actualTps) * 100;

  return {
    id: crypto.randomUUID(),
    prediction_id: prediction.prediction_id,
    actual_benchmark_id: actual.benchmark_id,
    predicted_throughput: Number(predicted.toFixed(2)),
    actual_throughput: Number(actualTps.toFixed(2)),
    absolute_error: Number(absoluteError.toFixed(2)),
    percentage_error: Number(percentageError.toFixed(2)),
    predictor_version: prediction.predictor_version,
    created_at: new Date().toISOString(),
  };
}

export function computeOfflineMetrics(
  pairs: Array<{ predicted: number; actual: number }>,
): PredictionEvaluationMetrics {
  if (pairs.length === 0) {
    return {
      mae: 0,
      mape_percent: 0,
      rmse: 0,
      p90_ape_percent: 0,
      sample_count: 0,
    };
  }

  let totalAbsError = 0;
  let totalPercentError = 0;
  let totalSqError = 0;
  const apeList: number[] = [];

  for (const pair of pairs) {
    const absErr = Math.abs(pair.predicted - pair.actual);
    const ape = (absErr / Math.max(0.001, pair.actual)) * 100;
    totalAbsError += absErr;
    totalPercentError += ape;
    totalSqError += Math.pow(absErr, 2);
    apeList.push(ape);
  }

  apeList.sort((a, b) => a - b);
  const p90Index = Math.min(
    apeList.length - 1,
    Math.floor(apeList.length * 0.9),
  );

  return {
    mae: Number((totalAbsError / pairs.length).toFixed(2)),
    mape_percent: Number((totalPercentError / pairs.length).toFixed(2)),
    rmse: Number(Math.sqrt(totalSqError / pairs.length).toFixed(2)),
    p90_ape_percent: Number((apeList[p90Index] ?? 0).toFixed(2)),
    sample_count: pairs.length,
  };
}
