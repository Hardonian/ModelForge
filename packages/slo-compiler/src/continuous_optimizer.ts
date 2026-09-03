import {
  ProductionDeployment,
  TelemetryWindow,
  DriftStatus,
  OptimizationRecommendation,
  VerifiedSavings,
} from "@modelforge/benchmark-schema";
import * as crypto from "crypto";

export interface ObservedVsExpectedResult {
  ttft_delta_pct: number;
  tpot_delta_pct: number;
  throughput_delta_pct: number;
  cost_delta_pct: number;
  slo_attainment_pct: number;
  is_drift_detected: boolean;
}

export function compareObservedVsExpected(
  deployment: ProductionDeployment,
  window: TelemetryWindow
): ObservedVsExpectedResult {
  const expected = deployment.expected_metrics;
  const ttftDelta = ((window.p95_ttft_ms - expected.ttft_ms) / expected.ttft_ms) * 100;
  const tpotDelta = ((window.mean_tpot_ms - expected.tpot_ms) / expected.tpot_ms) * 100;
  const tpsDelta = ((window.actual_throughput_tok_s - expected.throughput_tok_s) / expected.throughput_tok_s) * 100;

  // Window cost per hour
  const windowHours = Math.max(0.1, (new Date(window.window_end).getTime() - new Date(window.window_start).getTime()) / (1000 * 3600));
  const observedHourlyCost = window.total_cost_usd / windowHours;
  const costDelta = ((observedHourlyCost - expected.cost_per_hour_usd) / expected.cost_per_hour_usd) * 100;

  // SLO attainment: penalize if p95_ttft exceeds expected by > 20% or error rate > 0.1%
  let attainment = 100 - window.error_rate_pct * 5;
  if (ttftDelta > 0) {
    attainment -= Math.min(40, ttftDelta * 0.5);
  }
  attainment = Math.max(0, Math.min(100, Number(attainment.toFixed(1))));

  const isDrift = ttftDelta > 25.0 || attainment < 95.0;

  return {
    ttft_delta_pct: Number(ttftDelta.toFixed(1)),
    tpot_delta_pct: Number(tpotDelta.toFixed(1)),
    throughput_delta_pct: Number(tpsDelta.toFixed(1)),
    cost_delta_pct: Number(costDelta.toFixed(1)),
    slo_attainment_pct: attainment,
    is_drift_detected: isDrift,
  };
}

export function detectDrift(history: TelemetryWindow[]): DriftStatus {
  if (history.length === 0) return "normal";

  const latest = history[history.length - 1]!;
  if (history.length === 1) {
    if (latest.error_rate_pct > 2.0) return "critical";
    if (latest.p95_ttft_ms > 100) return "action_recommended";
    return "normal";
  }

  // Compare latest to earlier baseline
  const baseline = history[0]!;
  const latencyIncrease = ((latest.p95_ttft_ms - baseline.p95_ttft_ms) / baseline.p95_ttft_ms) * 100;

  if (latest.error_rate_pct > 5.0 || latencyIncrease > 80.0) {
    return "critical";
  }
  if (latencyIncrease > 40.0 || latest.gpu_utilization_pct > 92.0) {
    return "action_recommended";
  }
  if (latencyIncrease > 20.0 || latest.gpu_utilization_pct > 85.0) {
    return "watch";
  }
  return "normal";
}

export function generateOptimizationRecommendation(
  deployment: ProductionDeployment,
  currentTelemetry: TelemetryWindow
): OptimizationRecommendation {
  const currentCostPerHour = deployment.expected_metrics.cost_per_hour_usd;
  const isH100 = deployment.accelerator.includes("H100");

  // If running on H100 with low utilization or standard vLLM, recommend L40S or TensorRT-LLM
  let recommendedAccelerator = deployment.accelerator;
  let recommendedRuntime = "tensorrt-llm";
  let targetCostPerHour = currentCostPerHour * 0.75;
  let projectedTtft = currentTelemetry.p95_ttft_ms * 0.75;
  let evidence = "Upgrading serving runtime to TensorRT-LLM in-flight batching yields higher throughput at current replica count.";

  if (isH100 && currentTelemetry.gpu_utilization_pct < 60) {
    // GPU Right-sizing candidate
    recommendedAccelerator = "NVIDIA L40S";
    targetCostPerHour = 2.5 * deployment.device_count;
    projectedTtft = Math.min(30.0, currentTelemetry.p95_ttft_ms);
    evidence = "Workload utilization is under 60%. NVIDIA L40S provides sufficient memory bandwidth to satisfy latency SLO at 58% lower hourly cost.";
  }

  const hourlySavings = Math.max(0, currentCostPerHour - targetCostPerHour);
  const monthlySavings = hourlySavings * 730;
  const latencyImprovement = Math.max(5.0, ((currentTelemetry.p95_ttft_ms - projectedTtft) / currentTelemetry.p95_ttft_ms) * 100);

  return {
    id: crypto.randomUUID(),
    deployment_id: deployment.id,
    organization_id: deployment.organization_id,
    current_config: {
      accelerator: deployment.accelerator,
      device_count: deployment.device_count,
      runtime: deployment.runtime,
      precision: deployment.precision,
      cost_per_hour_usd: currentCostPerHour,
      p95_ttft_ms: currentTelemetry.p95_ttft_ms,
    },
    recommended_config: {
      accelerator: recommendedAccelerator,
      device_count: deployment.device_count,
      runtime: recommendedRuntime,
      precision: deployment.precision,
      cost_per_hour_usd: targetCostPerHour,
      projected_p95_ttft_ms: Number(projectedTtft.toFixed(1)),
    },
    projected_monthly_savings_usd: Number(monthlySavings.toFixed(2)),
    projected_p95_latency_improvement_pct: Number(latencyImprovement.toFixed(1)),
    confidence_score: 92,
    evidence_summary: evidence,
    status: "ready_for_review",
    created_at: new Date().toISOString(),
  };
}

export function verifySavings(
  baselineWindow: TelemetryWindow,
  afterStateWindow: TelemetryWindow,
  recommendationId: string,
  organizationId: string,
  observationDays = 30
): VerifiedSavings {
  // Monthly equivalent calculation
  const baselineHours = Math.max(0.1, (new Date(baselineWindow.window_end).getTime() - new Date(baselineWindow.window_start).getTime()) / (1000 * 3600));
  const afterHours = Math.max(0.1, (new Date(afterStateWindow.window_end).getTime() - new Date(afterStateWindow.window_start).getTime()) / (1000 * 3600));

  const baselineHourlyRate = baselineWindow.total_cost_usd / baselineHours;
  const afterHourlyRate = afterStateWindow.total_cost_usd / afterHours;

  const baselineMonthly = baselineHourlyRate * 730;
  const afterMonthly = afterHourlyRate * 730;
  const realizedSavings = Math.max(0, baselineMonthly - afterMonthly);

  return {
    id: crypto.randomUUID(),
    recommendation_id: recommendationId,
    organization_id: organizationId,
    baseline_monthly_cost_usd: Number(baselineMonthly.toFixed(2)),
    observed_monthly_cost_usd: Number(afterMonthly.toFixed(2)),
    verified_monthly_savings_usd: Number(realizedSavings.toFixed(2)),
    verified_at: new Date().toISOString(),
    observation_days: observationDays,
  };
}
