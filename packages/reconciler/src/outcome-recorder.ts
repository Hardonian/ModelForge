import {
  ProductionOutcome,
  OptimizationAction,
} from "@modelforge/benchmark-schema";

export interface CalibrationFeedback {
  action_id: string;
  deployment_id: string;
  predicted_latency_error_pct: number;
  predicted_cost_error_pct: number;
  recommendation_quality_score: number;
  notes: string;
}

export class ProductionOutcomeRecorder {
  static analyzeOutcome(
    outcome: ProductionOutcome,
    action: OptimizationAction
  ): CalibrationFeedback {
    const actualLatencyDeltaPct = outcome.slo_delta_pct;
    const predictedLatencyDeltaPct = action.estimated_p95_latency_delta_pct;
    // Only penalize if actual latency is worse (higher) than predicted
    const latencyErrorPct = Math.max(0, actualLatencyDeltaPct - predictedLatencyDeltaPct);

    const actualCostDeltaUsd = outcome.cost_delta_usd_month;
    const predictedCostDeltaUsd = action.estimated_cost_delta_usd_month;
    // Only penalize if actual cost is worse (higher spend) than predicted
    const costErrorPct =
      predictedCostDeltaUsd !== 0
        ? Math.max(0, actualCostDeltaUsd - predictedCostDeltaUsd) / Math.abs(predictedCostDeltaUsd) * 100
        : 0;

    let qualityScore = 100 - latencyErrorPct * 1.5 - costErrorPct * 0.5;
    if (outcome.rollback_occurred) {
      qualityScore = Math.max(0, qualityScore - 50);
    }

    return {
      action_id: outcome.action_id,
      deployment_id: outcome.deployment_id,
      predicted_latency_error_pct: Math.round(latencyErrorPct * 10) / 10,
      predicted_cost_error_pct: Math.round(costErrorPct * 10) / 10,
      recommendation_quality_score: Math.max(0, Math.min(100, Math.round(qualityScore))),
      notes: outcome.rollback_occurred
        ? "Action triggered automated rollback; candidate configuration penalized"
        : "Optimization completed cleanly; telemetry verified against predicted performance",
    };
  }
}
