export interface ShadowReplayConfig {
  traffic_sample_pct: number;
  suppress_external_mutations: boolean;
  suppress_email_and_notifications: boolean;
  suppress_database_writes: boolean;
  suppress_payments: boolean;
  max_shadow_duration_minutes: number;
}

export interface ShadowEvaluationResult {
  passed: boolean;
  shadow_requests_sent: number;
  error_count: number;
  mean_latency_ms: number;
  p95_latency_ms: number;
  side_effects_suppressed_count: number;
  warnings: string[];
}

export class ShadowTrafficEngine {
  static evaluateShadowSafety(config: ShadowReplayConfig): { safe: boolean; reason?: string } {
    if (!config.suppress_external_mutations) {
      return {
        safe: false,
        reason: "Shadow traffic MUST suppress external API mutations to prevent duplicate side-effects",
      };
    }
    if (!config.suppress_database_writes) {
      return {
        safe: false,
        reason: "Shadow traffic MUST suppress persistent database writes",
      };
    }
    if (!config.suppress_payments) {
      return {
        safe: false,
        reason: "Shadow traffic MUST suppress payments and financial transactions",
      };
    }
    return { safe: true };
  }

  static simulateShadowEvaluation(
    candidateHealthy: boolean,
    targetP95LatencyMs: number
  ): ShadowEvaluationResult {
    if (!candidateHealthy) {
      return {
        passed: false,
        shadow_requests_sent: 50,
        error_count: 50,
        mean_latency_ms: 0,
        p95_latency_ms: 0,
        side_effects_suppressed_count: 50,
        warnings: ["Candidate failed initial shadow connectivity test"],
      };
    }

    return {
      passed: true,
      shadow_requests_sent: 500,
      error_count: 0,
      mean_latency_ms: Math.round(targetP95LatencyMs * 0.7),
      p95_latency_ms: targetP95LatencyMs,
      side_effects_suppressed_count: 142,
      warnings: [],
    };
  }
}
