import {
  CanaryRun,
  CanaryPolicy,
  OptimizationAction,
} from "@modelforge/benchmark-schema";
import * as crypto from "crypto";

export interface StageTelemetry {
  request_count: number;
  duration_minutes: number;
  p95_ttft_ms: number;
  mean_tpot_ms: number;
  error_rate_pct: number;
  gpu_utilization_pct: number;
}

export interface CanaryEvaluationResult {
  should_promote_stage: boolean;
  should_promote_to_full_production: boolean;
  should_rollback: boolean;
  failure_reason?: string;
  latency_regression_pct: number;
  error_rate_delta_pct: number;
}

export class CanaryEngine {
  static createCanaryRun(
    action: OptimizationAction,
    policy?: CanaryPolicy
  ): CanaryRun {
    const stages = policy?.stages ?? [
      { traffic_percent: 1, min_requests: 500, min_duration_minutes: 5, max_duration_minutes: 60 },
      { traffic_percent: 10, min_requests: 2000, min_duration_minutes: 15, max_duration_minutes: 120 },
      { traffic_percent: 50, min_requests: 10000, min_duration_minutes: 30, max_duration_minutes: 180 },
      { traffic_percent: 100, min_requests: 25000, min_duration_minutes: 60, max_duration_minutes: 240 },
    ];

    return {
      canary_id: crypto.randomUUID(),
      action_id: action.action_id,
      deployment_id: action.deployment_id,
      organization_id: action.organization_id,
      current_stage_index: 0,
      total_stages: stages.length,
      active_traffic_percent: stages[0]?.traffic_percent ?? 1,
      status: "warming",
      stage_metrics: [],
      started_at: new Date().toISOString(),
    };
  }

  static evaluateStage(
    run: CanaryRun,
    telemetry: StageTelemetry,
    baseline: { p95_ttft_ms: number; error_rate_pct: number },
    policy: CanaryPolicy
  ): CanaryEvaluationResult {
    const currentStage = policy.stages[run.current_stage_index];
    if (!currentStage) {
      return {
        should_promote_stage: false,
        should_promote_to_full_production: true,
        should_rollback: false,
        latency_regression_pct: 0,
        error_rate_delta_pct: 0,
      };
    }

    const latencyRegressionPct =
      ((telemetry.p95_ttft_ms - baseline.p95_ttft_ms) / baseline.p95_ttft_ms) * 100;
    const errorRateDeltaPct = telemetry.error_rate_pct - baseline.error_rate_pct;

    // Check Rollback Criteria (P0 Safety Invariant)
    if (latencyRegressionPct >= policy.rollback.p95_latency_regression_percent) {
      return {
        should_promote_stage: false,
        should_promote_to_full_production: false,
        should_rollback: true,
        failure_reason: `P95 latency regression (+${latencyRegressionPct.toFixed(1)}%) breached rollback threshold (+${policy.rollback.p95_latency_regression_percent}%)`,
        latency_regression_pct: latencyRegressionPct,
        error_rate_delta_pct: errorRateDeltaPct,
      };
    }

    if (telemetry.error_rate_pct >= policy.rollback.error_rate_percent) {
      return {
        should_promote_stage: false,
        should_promote_to_full_production: false,
        should_rollback: true,
        failure_reason: `Error rate (${telemetry.error_rate_pct.toFixed(2)}%) breached rollback threshold (${policy.rollback.error_rate_percent}%)`,
        latency_regression_pct: latencyRegressionPct,
        error_rate_delta_pct: errorRateDeltaPct,
      };
    }

    // Check Minimum Sample Requirements
    if (telemetry.request_count < currentStage.min_requests) {
      return {
        should_promote_stage: false,
        should_promote_to_full_production: false,
        should_rollback: false,
        failure_reason: `Insufficient sample size: ${telemetry.request_count} / ${currentStage.min_requests} requests`,
        latency_regression_pct: latencyRegressionPct,
        error_rate_delta_pct: errorRateDeltaPct,
      };
    }

    if (telemetry.duration_minutes < currentStage.min_duration_minutes) {
      return {
        should_promote_stage: false,
        should_promote_to_full_production: false,
        should_rollback: false,
        failure_reason: `Insufficient stage duration: ${telemetry.duration_minutes} / ${currentStage.min_duration_minutes} minutes`,
        latency_regression_pct: latencyRegressionPct,
        error_rate_delta_pct: errorRateDeltaPct,
      };
    }

    // Check Promotion Criteria
    const latencyPassed = latencyRegressionPct <= policy.promotion.max_p95_latency_regression_percent;
    const errorPassed = errorRateDeltaPct <= policy.promotion.max_error_rate_delta_percent;

    if (!latencyPassed || !errorPassed) {
      return {
        should_promote_stage: false,
        should_promote_to_full_production: false,
        should_rollback: false,
        failure_reason: "Stage metrics do not satisfy promotion gate criteria yet",
        latency_regression_pct: latencyRegressionPct,
        error_rate_delta_pct: errorRateDeltaPct,
      };
    }

    const isLastStage = run.current_stage_index >= policy.stages.length - 1;

    return {
      should_promote_stage: !isLastStage,
      should_promote_to_full_production: isLastStage,
      should_rollback: false,
      latency_regression_pct: latencyRegressionPct,
      error_rate_delta_pct: errorRateDeltaPct,
    };
  }

  static advanceStage(run: CanaryRun, policy: CanaryPolicy): CanaryRun {
    const nextIndex = run.current_stage_index + 1;
    if (nextIndex >= policy.stages.length) {
      return {
        ...run,
        status: "promoting",
        active_traffic_percent: 100,
      };
    }

    const nextStage = policy.stages[nextIndex];
    if (!nextStage) {
      return {
        ...run,
        status: "promoting",
        active_traffic_percent: 100,
      };
    }
    return {
      ...run,
      current_stage_index: nextIndex,
      active_traffic_percent: nextStage.traffic_percent,
      status: "progressing",
    };
  }
}
