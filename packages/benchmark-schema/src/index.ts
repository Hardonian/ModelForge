import { z } from "zod";
import * as crypto from "crypto";

export const VerificationStatusSchema = z.enum([
  "unverified",
  "community",
  "reproduced",
  "verified",
]);
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

export const ModelSpecSchema = z.object({
  provider: z.string().min(1),
  repository: z.string().min(1),
  revision: z.string().default("main"),
  architecture: z.string().min(1),
  parameters_billions: z.number().positive(),
  context_window: z.number().int().positive().optional(),
  vocab_size: z.number().int().positive().optional(),
});
export type ModelSpec = z.infer<typeof ModelSpecSchema>;

export const RuntimeSpecSchema = z.object({
  name: z.enum([
    "vllm",
    "tensorrt-llm",
    "llama.cpp",
    "tgi",
    "sglang",
    "transformers",
    "simulation",
  ]),
  version: z.string().min(1),
  engine_args: z
    .record(z.union([z.string(), z.number(), z.boolean()]))
    .default({}),
});
export type RuntimeSpec = z.infer<typeof RuntimeSpecSchema>;

export const PrecisionSpecSchema = z.object({
  type: z.enum([
    "fp32",
    "tf32",
    "fp16",
    "bf16",
    "fp8",
    "int8",
    "int4",
    "awq",
    "gptq",
  ]),
  quantization_method: z.string().optional(),
});
export type PrecisionSpec = z.infer<typeof PrecisionSpecSchema>;

export const HardwareSpecSchema = z.object({
  vendor: z.enum(["nvidia", "amd", "intel", "apple", "cpu", "other"]),
  device: z.string().min(1),
  count: z.number().int().positive().default(1),
  vram_bytes_per_device: z.number().int().positive(),
  total_vram_bytes: z.number().int().positive(),
  interconnect: z.string().default("pcie"),
});
export type HardwareSpec = z.infer<typeof HardwareSpecSchema>;

export const SoftwareSpecSchema = z.object({
  os: z.string().min(1),
  driver_version: z.string().optional(),
  cuda_version: z.string().optional(),
  rocm_version: z.string().optional(),
  python_version: z.string().min(1),
});
export type SoftwareSpec = z.infer<typeof SoftwareSpecSchema>;

export const WorkloadSpecSchema = z.object({
  prompt_tokens: z.number().int().positive(),
  generated_tokens: z.number().int().positive(),
  context_length: z.number().int().positive(),
  batch_size: z.number().int().positive().default(1),
  concurrency: z.number().int().positive().default(1),
});
export type WorkloadSpec = z.infer<typeof WorkloadSpecSchema>;

export const LatencyPercentilesSchema = z.object({
  p50_ms: z.number().nonnegative(),
  p90_ms: z.number().nonnegative(),
  p95_ms: z.number().nonnegative(),
  p99_ms: z.number().nonnegative(),
  mean_ms: z.number().nonnegative(),
  std_dev_ms: z.number().nonnegative().optional(),
});
export type LatencyPercentiles = z.infer<typeof LatencyPercentilesSchema>;

export const MetricsSpecSchema = z.object({
  ttft_ms: LatencyPercentilesSchema,
  tpot_ms: LatencyPercentilesSchema,
  tokens_per_second: z.number().positive(),
  requests_per_second: z.number().positive(),
  peak_vram_bytes: z.number().int().nonnegative(),
  peak_ram_bytes: z.number().int().nonnegative().optional(),
  power_watts_avg: z.number().nonnegative().optional(),
  sample_count: z.number().int().positive().default(1),
});
export type MetricsSpec = z.infer<typeof MetricsSpecSchema>;

export const QualitySpecSchema = z
  .object({
    benchmark: z.string().optional(),
    score: z.number().optional(),
    baseline_score: z.number().optional(),
    retention: z.number().min(0).max(1).optional(),
  })
  .optional();
export type QualitySpec = z.infer<typeof QualitySpecSchema>;

export const ProvenanceSpecSchema = z.object({
  submitted_by: z.string().min(1),
  runner_version: z.string().min(1),
  started_at: z.string().datetime(),
  completed_at: z.string().datetime(),
  environment_hash: z.string().length(64),
  result_hash: z.string().length(64),
});
export type ProvenanceSpec = z.infer<typeof ProvenanceSpecSchema>;

export const VerificationSpecSchema = z.object({
  status: VerificationStatusSchema,
  reproduction_count: z.number().int().nonnegative().default(0),
  verified_by: z.string().optional(),
  notes: z.string().optional(),
});
export type VerificationSpec = z.infer<typeof VerificationSpecSchema>;

export const OpenComputeBenchSchema = z.object({
  benchmark_id: z.string().uuid(),
  schema_version: z.literal("1.0.0"),
  synthetic_fixture: z.boolean().default(false),
  golden: z.boolean().default(false).optional(),
  model: ModelSpecSchema,
  runtime: RuntimeSpecSchema,
  precision: PrecisionSpecSchema,
  hardware: HardwareSpecSchema,
  software: SoftwareSpecSchema,
  workload: WorkloadSpecSchema,
  metrics: MetricsSpecSchema,
  quality: QualitySpecSchema,
  provenance: ProvenanceSpecSchema,
  verification: VerificationSpecSchema,
});
export type OpenComputeBenchRecord = z.infer<typeof OpenComputeBenchSchema>;

/**
 * Deterministic JSON stringify helper for stable cryptographic hashing
 */
export function canonicalJsonStringify(obj: unknown): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalJsonStringify).join(",") + "]";
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const entries = keys.map((key) => {
    const val = (obj as Record<string, unknown>)[key];
    return JSON.stringify(key) + ":" + canonicalJsonStringify(val);
  });
  return "{" + entries.join(",") + "}";
}

/**
 * Computes SHA-256 hex digest of canonical JSON
 */
export function computeSha256(data: unknown): string {
  const canonical = canonicalJsonStringify(data);
  return crypto.createHash("sha256").update(canonical, "utf8").digest("hex");
}

/**
 * Computes deterministic environment hash
 */
export function computeEnvironmentHash(
  hardware: HardwareSpec,
  software: SoftwareSpec,
  runtime: RuntimeSpec,
): string {
  return computeSha256({
    hardware: {
      vendor: hardware.vendor,
      device: hardware.device,
      count: hardware.count,
      vram_bytes_per_device: hardware.vram_bytes_per_device,
      interconnect: hardware.interconnect,
    },
    software: {
      os: software.os,
      driver_version: software.driver_version,
      cuda_version: software.cuda_version,
      rocm_version: software.rocm_version,
      python_version: software.python_version,
    },
    runtime: {
      name: runtime.name,
      version: runtime.version,
    },
  });
}

/**
 * Computes deterministic result hash
 */
export function computeResultHash(
  model: ModelSpec,
  precision: PrecisionSpec,
  workload: WorkloadSpec,
  metrics: MetricsSpec,
): string {
  return computeSha256({
    model: {
      provider: model.provider,
      repository: model.repository,
      revision: model.revision,
      architecture: model.architecture,
    },
    precision: {
      type: precision.type,
      quantization_method: precision.quantization_method,
    },
    workload: {
      prompt_tokens: workload.prompt_tokens,
      generated_tokens: workload.generated_tokens,
      context_length: workload.context_length,
      batch_size: workload.batch_size,
      concurrency: workload.concurrency,
    },
    metrics: {
      ttft_p50_ms: metrics.ttft_ms.p50_ms,
      tpot_p50_ms: metrics.tpot_ms.p50_ms,
      tokens_per_second: metrics.tokens_per_second,
      peak_vram_bytes: metrics.peak_vram_bytes,
    },
  });
}

/**
 * Validates a benchmark record and verifies hash integrity
 */
export function validateBenchmarkIntegrity(record: OpenComputeBenchRecord): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const expectedEnvHash = computeEnvironmentHash(
    record.hardware,
    record.software,
    record.runtime,
  );
  if (record.provenance.environment_hash !== expectedEnvHash) {
    errors.push(
      `Environment hash mismatch: got ${record.provenance.environment_hash}, expected ${expectedEnvHash}`,
    );
  }

  const expectedResultHash = computeResultHash(
    record.model,
    record.precision,
    record.workload,
    record.metrics,
  );
  if (record.provenance.result_hash !== expectedResultHash) {
    errors.push(
      `Result hash mismatch: got ${record.provenance.result_hash}, expected ${expectedResultHash}`,
    );
  }

  // Enforce invariant: synthetic fixtures can NEVER be verified
  if (record.synthetic_fixture && record.verification.status === "verified") {
    errors.push(
      "CRITICAL INVARIANT VIOLATION: Synthetic fixtures cannot be marked as verified.",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export const FreshnessStatusSchema = z.enum([
  "CURRENT",
  "AGING",
  "STALE",
  "INVALIDATED",
]);
export type FreshnessStatus = z.infer<typeof FreshnessStatusSchema>;

export const CompatibilityProvenanceSchema = z.enum([
  "DOCUMENTED",
  "MEASURED",
  "DERIVED",
  "PREDICTED",
  "UNKNOWN",
]);
export type CompatibilityProvenance = z.infer<
  typeof CompatibilityProvenanceSchema
>;

export const CompatibilityClaimSchema = z.object({
  status: z.enum(["supported", "unsupported", "unknown", "experimental"]),
  provenance: CompatibilityProvenanceSchema,
  notes: z.string().optional(),
});
export type CompatibilityClaim = z.infer<typeof CompatibilityClaimSchema>;

export const ComputePassportSchema = z.object({
  passport_id: z.string().uuid(),
  schema_version: z.literal("2.0.0"),
  model_id: z.string().min(1),
  revision: z.string().default("main"),
  hf_url: z.string().url(),
  architecture: z.string().min(1),
  parameters_billions: z.number().positive(),
  context_window: z.number().int().positive(),
  license: z.string(),
  gated: z.boolean().default(false),
  compatibility: z.record(CompatibilityClaimSchema),
  memory_profile: z.object({
    weights_fp16_gb: z.number().positive(),
    weights_fp8_gb: z.number().positive(),
    weights_int4_gb: z.number().positive(),
    min_vram_gb: z.number().positive(),
    recommended_vram_gb: z.number().positive(),
  }),
  coverage: z.object({
    accelerators_tested: z.array(z.string()),
    runtimes_tested: z.array(z.string()),
    total_benchmarks: z.number().int().nonnegative(),
    total_reproductions: z.number().int().nonnegative(),
    freshness_status: FreshnessStatusSchema,
  }),
  deployment_profiles: z.object({
    local_inference: z.string().optional(),
    lowest_cost: z.string().optional(),
    lowest_latency: z.string().optional(),
    highest_throughput: z.string().optional(),
    nvidia_optimized: z.string().optional(),
  }),
  confidence: z.object({
    score: z.number().min(0).max(100),
    explanation: z.string(),
  }),
});
export type ComputePassport = z.infer<typeof ComputePassportSchema>;

export const SoftwareLiftMetricSchema = z.object({
  accelerator: z.string(),
  model_id: z.string(),
  model_revision: z.string(),
  precision: z.string(),
  context_length: z.number().int().positive(),
  baseline_runtime: z.literal("transformers"),
  baseline_tps: z.number().positive(),
  comparisons: z.array(
    z.object({
      runtime: z.string(),
      tps: z.number().positive(),
      throughput_lift: z.number().positive(),
      ttft_reduction_percent: z.number(),
      provenance: CompatibilityProvenanceSchema,
    }),
  ),
});
export type SoftwareLiftMetric = z.infer<typeof SoftwareLiftMetricSchema>;

// --- PHASE 4 SCHEMAS: DISTRIBUTED NETWORK & PREDICTIVE INTELLIGENCE ---

export const WorkerTrustTierSchema = z.enum([
  "untrusted",
  "community",
  "trusted",
  "organization",
  "managed",
  "attested",
]);
export type WorkerTrustTier = z.infer<typeof WorkerTrustTierSchema>;

export const WorkerStatusSchema = z.enum([
  "ready",
  "busy",
  "offline",
  "draining",
]);
export type WorkerStatus = z.infer<typeof WorkerStatusSchema>;

export const WorkerCapabilitiesSchema = z.object({
  hardware_device: z.string(),
  device_count: z.number().int().positive().default(1),
  vram_bytes: z.number().int().positive(),
  cpu_cores: z.number().int().positive(),
  ram_bytes: z.number().int().positive(),
  os: z.string(),
  driver_version: z.string().optional(),
  cuda_version: z.string().optional(),
  rocm_version: z.string().optional(),
  supported_runtimes: z.array(z.string()),
  container_runtime: z.enum(["docker", "podman", "none"]).default("docker"),
  max_job_duration_s: z.number().int().positive().default(1800),
  privacy_mode: z.enum(["public", "private"]).default("public"),
  region: z.string().optional(),
});
export type WorkerCapabilities = z.infer<typeof WorkerCapabilitiesSchema>;

export const WorkerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  trust_tier: WorkerTrustTierSchema.default("community"),
  status: WorkerStatusSchema.default("ready"),
  capabilities: WorkerCapabilitiesSchema,
  organization_id: z.string().optional(),
  token_hash: z.string(),
  last_heartbeat_at: z.string().datetime(),
  created_at: z.string().datetime(),
  total_jobs_completed: z.number().int().nonnegative().default(0),
});
export type Worker = z.infer<typeof WorkerSchema>;

export const JobStatusSchema = z.enum([
  "queued",
  "assigned",
  "running",
  "uploading",
  "validating",
  "completed",
  "failed",
  "canceled",
  "timed_out",
  "retryable",
]);
export type JobStatus = z.infer<typeof JobStatusSchema>;

export const BenchmarkJobSchema = z.object({
  id: z.string().uuid(),
  model_repository: z.string(),
  model_revision: z.string().default("main"),
  runtime: z.string(),
  runtime_version: z.string().default("latest"),
  precision: z.string(),
  workload: WorkloadSpecSchema,
  required_trust_tier: WorkerTrustTierSchema.default("community"),
  target_device: z.string().optional(),
  resource_limits: z
    .object({
      timeout_s: z.number().int().positive().default(900),
      max_vram_gb: z.number().positive().optional(),
      max_gpus: z.number().int().positive().default(1),
    })
    .default({ timeout_s: 900, max_gpus: 1 }),
  status: JobStatusSchema.default("queued"),
  assigned_worker_id: z.string().uuid().optional(),
  assigned_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
  organization_id: z.string().optional(),
  result_benchmark_id: z.string().uuid().optional(),
  error_message: z.string().optional(),
  priority_score: z.number().default(100),
  created_at: z.string().datetime(),
});
export type BenchmarkJob = z.infer<typeof BenchmarkJobSchema>;

export const CoverageStatusSchema = z.enum([
  "covered",
  "partially_covered",
  "stale",
  "failed",
  "untested",
  "incompatible",
]);
export type CoverageStatus = z.infer<typeof CoverageStatusSchema>;

export const CoverageCellSchema = z.object({
  model_repository: z.string(),
  model_revision: z.string(),
  accelerator: z.string(),
  runtime: z.string(),
  precision: z.string(),
  status: CoverageStatusSchema,
  benchmark_ids: z.array(z.string().uuid()).default([]),
  last_tested_at: z.string().datetime().optional(),
  measured_throughput_tok_s: z.number().positive().optional(),
  gap_priority: z.number().min(0).max(100).default(0),
});
export type CoverageCell = z.infer<typeof CoverageCellSchema>;

export const UncertaintyTypeSchema = z.enum([
  "interpolation",
  "extrapolation",
  "out_of_distribution",
]);
export type UncertaintyType = z.infer<typeof UncertaintyTypeSchema>;

export const PredictionConfidenceSchema = z.enum(["high", "medium", "low"]);
export type PredictionConfidence = z.infer<typeof PredictionConfidenceSchema>;

export const PredictionResultSchema = z.object({
  prediction_id: z.string().uuid(),
  is_predicted: z.literal(true).default(true),
  model_repository: z.string(),
  model_revision: z.string().default("main"),
  accelerator: z.string(),
  device_count: z.number().int().positive().default(1),
  runtime: z.string(),
  precision: z.string(),
  workload: WorkloadSpecSchema,
  predicted_ttft_ms: z.number().positive(),
  predicted_tpot_ms: z.number().positive(),
  predicted_throughput_tok_s: z.number().positive(),
  predicted_peak_vram_gb: z.number().positive(),
  prediction_interval: z.object({
    p10_throughput: z.number().positive(),
    p90_throughput: z.number().positive(),
    p10_ttft: z.number().positive(),
    p90_ttft: z.number().positive(),
  }),
  uncertainty_type: UncertaintyTypeSchema,
  confidence: PredictionConfidenceSchema,
  nearest_evidence_benchmark_ids: z.array(z.string()).default([]),
  predictor_version: z.string().default("predictor_v1.0.0"),
  created_at: z.string().datetime(),
});
export type PredictionResult = z.infer<typeof PredictionResultSchema>;

export const PredictionFeedbackSchema = z.object({
  id: z.string().uuid(),
  prediction_id: z.string().uuid(),
  actual_benchmark_id: z.string().uuid(),
  predicted_throughput: z.number().positive(),
  actual_throughput: z.number().positive(),
  absolute_error: z.number().nonnegative(),
  percentage_error: z.number().nonnegative(),
  predictor_version: z.string(),
  created_at: z.string().datetime(),
});
export type PredictionFeedback = z.infer<typeof PredictionFeedbackSchema>;

export const FleetResourceSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string(),
  node_id: z.string(),
  device: z.string(),
  device_count: z.number().int().positive(),
  vram_bytes_per_device: z.number().int().positive(),
  interconnect: z.string().default("pcie"),
  region: z.string().default("us-east-1"),
  hourly_cost_usd: z.number().nonnegative(),
  is_reserved: z.boolean().default(true),
  status: z
    .enum(["available", "allocated", "maintenance"])
    .default("available"),
  allocated_workload_ids: z.array(z.string()).default([]),
});
export type FleetResource = z.infer<typeof FleetResourceSchema>;

export const ProductionDeploymentSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string(),
  workload_name: z.string(),
  model_repository: z.string(),
  model_revision: z.string(),
  accelerator: z.string(),
  device_count: z.number().int().positive(),
  runtime: z.string(),
  precision: z.string(),
  replica_count: z.number().int().positive().default(1),
  expected_metrics: z.object({
    ttft_ms: z.number().positive(),
    tpot_ms: z.number().positive(),
    throughput_tok_s: z.number().positive(),
    cost_per_hour_usd: z.number().positive(),
  }),
  created_at: z.string().datetime(),
});
export type ProductionDeployment = z.infer<typeof ProductionDeploymentSchema>;

export const TelemetryWindowSchema = z.object({
  id: z.string().uuid(),
  deployment_id: z.string().uuid(),
  organization_id: z.string(),
  window_start: z.string().datetime(),
  window_end: z.string().datetime(),
  request_count: z.number().int().nonnegative(),
  p95_ttft_ms: z.number().positive(),
  mean_tpot_ms: z.number().positive(),
  actual_throughput_tok_s: z.number().positive(),
  mean_concurrency: z.number().positive(),
  error_rate_pct: z.number().min(0).max(100).default(0),
  gpu_utilization_pct: z.number().min(0).max(100),
  total_cost_usd: z.number().nonnegative(),
  // Strict rule: No raw prompt or output content
});
export type TelemetryWindow = z.infer<typeof TelemetryWindowSchema>;

export const DriftStatusSchema = z.enum([
  "normal",
  "watch",
  "action_recommended",
  "critical",
]);
export type DriftStatus = z.infer<typeof DriftStatusSchema>;

export const DriftEventSchema = z.object({
  id: z.string().uuid(),
  deployment_id: z.string().uuid(),
  status: DriftStatusSchema,
  ttft_delta_pct: z.number(),
  tpot_delta_pct: z.number(),
  throughput_delta_pct: z.number(),
  cost_delta_pct: z.number(),
  slo_attainment_pct: z.number().min(0).max(100),
  detected_at: z.string().datetime(),
  suggested_action: z.string(),
});
export type DriftEvent = z.infer<typeof DriftEventSchema>;

export const RecommendationStatusSchema = z.enum([
  "draft",
  "ready_for_review",
  "approved",
  "rejected",
  "superseded",
]);
export type RecommendationStatus = z.infer<typeof RecommendationStatusSchema>;

export const OptimizationRecommendationSchema = z.object({
  id: z.string().uuid(),
  deployment_id: z.string().uuid(),
  organization_id: z.string(),
  current_config: z.object({
    accelerator: z.string(),
    device_count: z.number().int().positive(),
    runtime: z.string(),
    precision: z.string(),
    cost_per_hour_usd: z.number().positive(),
    p95_ttft_ms: z.number().positive(),
  }),
  recommended_config: z.object({
    accelerator: z.string(),
    device_count: z.number().int().positive(),
    runtime: z.string(),
    precision: z.string(),
    cost_per_hour_usd: z.number().positive(),
    projected_p95_ttft_ms: z.number().positive(),
  }),
  projected_monthly_savings_usd: z.number().positive(),
  projected_p95_latency_improvement_pct: z.number(),
  confidence_score: z.number().min(0).max(100),
  evidence_summary: z.string(),
  status: RecommendationStatusSchema.default("ready_for_review"),
  created_at: z.string().datetime(),
  approved_by: z.string().optional(),
  approved_at: z.string().datetime().optional(),
});
export type OptimizationRecommendation = z.infer<
  typeof OptimizationRecommendationSchema
>;

export const VerifiedSavingsSchema = z.object({
  id: z.string().uuid(),
  recommendation_id: z.string().uuid(),
  organization_id: z.string(),
  baseline_monthly_cost_usd: z.number().positive(),
  observed_monthly_cost_usd: z.number().positive(),
  verified_monthly_savings_usd: z.number(),
  verified_at: z.string().datetime(),
  observation_days: z.number().int().positive().default(30),
});
export type VerifiedSavings = z.infer<typeof VerifiedSavingsSchema>;

// ==========================================
// Phase 5: Autonomous Inference Control Plane Schemas
// ==========================================

export const ExecutionModeSchema = z.enum([
  "advisory",
  "approval_required",
  "guarded_automation",
  "full_policy_automation",
]);
export type ExecutionMode = z.infer<typeof ExecutionModeSchema>;

export const ActionTypeSchema = z.enum([
  "change_runtime",
  "change_model_revision",
  "change_precision",
  "change_gpu_count",
  "change_replica_count",
  "change_tensor_parallelism",
  "change_pipeline_parallelism",
  "change_dynamo_topology",
  "change_prefill_decode_ratio",
  "change_instance_type",
  "move_workload",
  "update_autoscaling",
  "rollback",
  "noop",
]);
export type ActionType = z.infer<typeof ActionTypeSchema>;

export const ActionStatusSchema = z.enum([
  "planned",
  "policy_checked",
  "awaiting_approval",
  "approved",
  "provisioning",
  "warming",
  "shadowing",
  "canarying",
  "promoting",
  "verifying",
  "completed",
  "rolling_back",
  "rolled_back",
  "failed",
  "canceled",
]);
export type ActionStatus = z.infer<typeof ActionStatusSchema>;

export const RiskScoreSchema = z.enum(["low", "medium", "high", "critical"]);
export type RiskScore = z.infer<typeof RiskScoreSchema>;

export const ChangeRiskSchema = z.object({
  level: RiskScoreSchema,
  score: z.number().min(0).max(100),
  reasons: z.array(z.string()),
  dimensions: z.object({
    model_change: z.boolean().default(false),
    runtime_change: z.boolean().default(false),
    hardware_change: z.boolean().default(false),
    topology_change: z.boolean().default(false),
    blast_radius_pct: z.number().min(0).max(100),
    rollback_difficulty: z.enum(["easy", "moderate", "complex"]),
  }),
});
export type ChangeRisk = z.infer<typeof ChangeRiskSchema>;

export const InferenceDeploymentSpecSchema = z.object({
  model: z.string().min(1),
  revision: z.string().default("main"),
  runtime: z.string().min(1),
  runtime_version: z.string().min(1),
  deployment_target: z.enum(["kubernetes", "dynamo", "nim", "docker", "simulation"]),
  precision: z.string().default("fp16"),
  quantization: z.string().optional(),
  accelerator: z.string().min(1),
  accelerator_count: z.number().int().positive().default(1),
  replicas: z.number().int().positive().default(1),
  tensor_parallelism: z.number().int().positive().default(1),
  pipeline_parallelism: z.number().int().positive().default(1),
  prefill_workers: z.number().int().nonnegative().optional(),
  decode_workers: z.number().int().nonnegative().optional(),
  autoscaling: z
    .object({
      min_replicas: z.number().int().positive(),
      max_replicas: z.number().int().positive(),
      target_gpu_utilization_pct: z.number().min(10).max(95).default(80),
      cooldown_seconds: z.number().int().positive().default(300),
    })
    .optional(),
  resource_limits: z
    .object({
      vram_bytes: z.number().positive().optional(),
      max_cost_per_hour_usd: z.number().positive().optional(),
    })
    .optional(),
  regions: z.array(z.string()).default(["us-east-1"]),
  routing: z
    .object({
      strategy: z.enum(["blue_green", "canary", "shadow", "rolling"]).default("canary"),
      canary_traffic_pct: z.number().min(0).max(100).default(0),
    })
    .default({ strategy: "canary", canary_traffic_pct: 0 }),
  health_checks: z
    .object({
      readiness_path: z.string().default("/health/ready"),
      liveness_path: z.string().default("/health/live"),
      initial_delay_seconds: z.number().int().positive().default(30),
      timeout_seconds: z.number().int().positive().default(5),
    })
    .default({
      readiness_path: "/health/ready",
      liveness_path: "/health/live",
      initial_delay_seconds: 30,
      timeout_seconds: 5,
    }),
  slo: z.object({
    max_p95_ttft_ms: z.number().positive(),
    max_mean_tpot_ms: z.number().positive(),
    min_throughput_tok_s: z.number().positive(),
    max_cost_per_hour_usd: z.number().positive(),
  }),
  deployment_policy: z.string().optional(),
  version: z.number().int().positive().default(1),
});
export type InferenceDeploymentSpec = z.infer<typeof InferenceDeploymentSpecSchema>;

export const InferenceDeploymentStateSchema = z.object({
  deployment_id: z.string().uuid(),
  organization_id: z.string(),
  name: z.string(),
  model: z.string(),
  revision: z.string(),
  runtime: z.string(),
  runtime_version: z.string(),
  accelerator: z.string(),
  accelerator_count: z.number().int().positive(),
  replicas: z.number().int().positive(),
  tensor_parallelism: z.number().int().positive().default(1),
  pipeline_parallelism: z.number().int().positive().default(1),
  prefill_workers: z.number().int().nonnegative().optional(),
  decode_workers: z.number().int().nonnegative().optional(),
  health: z.enum(["healthy", "degraded", "unhealthy", "warming"]).default("healthy"),
  deployment_version: z.number().int().positive().default(1),
  traffic_split: z.object({
    active_pct: z.number().min(0).max(100).default(100),
    candidate_pct: z.number().min(0).max(100).default(0),
    shadow_enabled: z.boolean().default(false),
  }),
  last_known_good_spec: InferenceDeploymentSpecSchema.optional(),
  last_inspected_at: z.string().datetime(),
});
export type InferenceDeploymentState = z.infer<typeof InferenceDeploymentStateSchema>;

export const CanaryStageSchema = z.object({
  traffic_percent: z.number().min(1).max(100),
  min_requests: z.number().int().positive(),
  min_duration_minutes: z.number().positive(),
  max_duration_minutes: z.number().positive().default(120),
});
export type CanaryStage = z.infer<typeof CanaryStageSchema>;

export const CanaryPolicySchema = z.object({
  version: z.number().int().positive().default(1),
  stages: z.array(CanaryStageSchema).min(1),
  promotion: z.object({
    max_p95_latency_regression_percent: z.number().default(5),
    max_error_rate_delta_percent: z.number().default(0.2),
    min_cost_improvement_percent: z.number().default(0),
  }),
  rollback: z.object({
    p95_latency_regression_percent: z.number().default(15),
    error_rate_percent: z.number().default(2),
    oom_threshold_count: z.number().int().positive().default(1),
  }),
});
export type CanaryPolicy = z.infer<typeof CanaryPolicySchema>;

export const RollbackPlanSchema = z.object({
  rollback_id: z.string().uuid(),
  source_deployment_id: z.string().uuid(),
  target_stable_spec: InferenceDeploymentSpecSchema,
  required_resources: z.object({
    accelerator: z.string(),
    device_count: z.number().int().positive(),
    replicas: z.number().int().positive(),
  }),
  estimated_rollback_duration_s: z.number().positive().default(60),
  known_risks: z.array(z.string()).default([]),
  rollback_actions: z.array(z.string()),
  validation_checks: z.array(z.string()),
  verified_at: z.string().datetime().optional(),
});
export type RollbackPlan = z.infer<typeof RollbackPlanSchema>;

export const AutomationPolicySchema = z.object({
  policy_id: z.string().uuid(),
  organization_id: z.string(),
  name: z.string().default("default-policy"),
  mode: ExecutionModeSchema.default("advisory"),
  requirements: z.object({
    minimum_confidence: z.number().min(0).max(100).default(85),
    minimum_reproductions: z.number().int().nonnegative().default(1),
    predictions_allowed: z.boolean().default(true),
    prediction_max_uncertainty_percent: z.number().positive().default(20),
  }),
  changes: z.object({
    allow: z.array(ActionTypeSchema).default(["change_replica_count", "update_autoscaling"]),
    approval_required: z
      .array(ActionTypeSchema)
      .default([
        "change_runtime",
        "change_model_revision",
        "change_gpu_count",
        "change_precision",
        "change_dynamo_topology",
      ]),
    deny: z.array(ActionTypeSchema).default([]),
  }),
  blast_radius: z.object({
    max_canary_percent: z.number().min(1).max(100).default(50),
    max_gpu_change: z.number().int().positive().default(8),
    max_spend_usd_hour: z.number().positive().default(100),
    max_simultaneous_actions: z.number().int().positive().default(2),
  }),
  economics: z.object({
    minimum_projected_savings_percent: z.number().min(0).default(5),
  }),
  slo: z.object({
    max_p95_regression_percent: z.number().default(3),
  }),
  maintenance_windows: z
    .array(
      z.object({
        days: z.array(z.number().int().min(0).max(6)),
        start_hour_utc: z.number().int().min(0).max(23),
        end_hour_utc: z.number().int().min(0).max(23),
      })
    )
    .default([]),
  freeze_windows: z
    .array(
      z.object({
        name: z.string(),
        start_time: z.string().datetime(),
        end_time: z.string().datetime(),
        reason: z.string(),
      })
    )
    .default([]),
  allowed_regions: z.array(z.string()).default(["us-east-1", "us-west-2", "eu-west-1"]),
});
export type AutomationPolicy = z.infer<typeof AutomationPolicySchema>;

export const OptimizationActionSchema = z.object({
  action_id: z.string().uuid(),
  organization_id: z.string(),
  project_id: z.string().default("default"),
  deployment_id: z.string().uuid(),
  recommendation_id: z.string().uuid().optional(),
  action_type: ActionTypeSchema,
  execution_mode: ExecutionModeSchema.default("advisory"),
  current_spec: InferenceDeploymentSpecSchema,
  target_spec: InferenceDeploymentSpecSchema,
  reason: z.string(),
  evidence: z.object({
    source_benchmark_ids: z.array(z.string()).default([]),
    confidence_score: z.number().min(0).max(100),
    is_predicted: z.boolean().default(false),
  }),
  policy_evaluation: z.object({
    passed: z.boolean(),
    mode_applied: ExecutionModeSchema,
    checks: z.array(
      z.object({
        name: z.string(),
        passed: z.boolean(),
        detail: z.string(),
      })
    ),
  }),
  estimated_cost_delta_usd_month: z.number(),
  estimated_p95_latency_delta_pct: z.number(),
  estimated_capacity_delta_pct: z.number(),
  risk: ChangeRiskSchema,
  blast_radius: z.object({
    max_traffic_pct: z.number(),
    affected_gpus: z.number().int(),
    affected_workload: z.string(),
  }),
  rollback_plan: RollbackPlanSchema,
  status: ActionStatusSchema.default("planned"),
  action_hash: z.string(),
  created_at: z.string().datetime(),
  approved_by: z.string().optional(),
  approved_at: z.string().datetime().optional(),
  started_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
  result: z
    .object({
      success: z.boolean(),
      error_message: z.string().optional(),
      canary_run_id: z.string().uuid().optional(),
      restored_last_known_good: z.boolean().optional(),
    })
    .optional(),
  audit_reference: z.string().optional(),
  version: z.number().int().positive().default(1),
});
export type OptimizationAction = z.infer<typeof OptimizationActionSchema>;

export const CanaryRunSchema = z.object({
  canary_id: z.string().uuid(),
  action_id: z.string().uuid(),
  deployment_id: z.string().uuid(),
  organization_id: z.string(),
  current_stage_index: z.number().int().nonnegative().default(0),
  total_stages: z.number().int().positive(),
  active_traffic_percent: z.number().min(0).max(100),
  status: z
    .enum(["warming", "shadowing", "progressing", "promoting", "completed", "aborting", "rolled_back", "failed"])
    .default("warming"),
  stage_metrics: z
    .array(
      z.object({
        stage_index: z.number().int(),
        traffic_percent: z.number(),
        request_count: z.number().int().nonnegative(),
        duration_minutes: z.number().nonnegative(),
        p95_ttft_ms: z.number().positive(),
        mean_tpot_ms: z.number().positive(),
        error_rate_pct: z.number().min(0).max(100),
        gpu_utilization_pct: z.number().min(0).max(100),
        passed: z.boolean(),
        evaluated_at: z.string().datetime(),
      })
    )
    .default([]),
  failure_reason: z.string().optional(),
  started_at: z.string().datetime(),
  completed_at: z.string().datetime().optional(),
});
export type CanaryRun = z.infer<typeof CanaryRunSchema>;

export const ProductionOutcomeSchema = z.object({
  outcome_id: z.string().uuid(),
  action_id: z.string().uuid(),
  deployment_id: z.string().uuid(),
  organization_id: z.string(),
  action_type: ActionTypeSchema,
  before_metrics: z.object({
    p95_ttft_ms: z.number().positive(),
    mean_tpot_ms: z.number().positive(),
    throughput_tok_s: z.number().positive(),
    cost_per_hour_usd: z.number().positive(),
    error_rate_pct: z.number().min(0).max(100),
  }),
  after_metrics: z.object({
    p95_ttft_ms: z.number().positive(),
    mean_tpot_ms: z.number().positive(),
    throughput_tok_s: z.number().positive(),
    cost_per_hour_usd: z.number().positive(),
    error_rate_pct: z.number().min(0).max(100),
  }),
  observation_window_hours: z.number().positive().default(24),
  slo_delta_pct: z.number(),
  cost_delta_usd_month: z.number(),
  quality_delta_pct: z.number().default(0),
  capacity_delta_pct: z.number().default(0),
  rollback_occurred: z.boolean().default(false),
  verified_at: z.string().datetime(),
});
export type ProductionOutcome = z.infer<typeof ProductionOutcomeSchema>;

export const AutomationFreezeSchema = z.object({
  freeze_id: z.string().uuid(),
  organization_id: z.string(),
  scope: z.enum(["global", "project", "deployment"]).default("global"),
  target_id: z.string().optional(),
  reason: z.string(),
  frozen_by: z.string(),
  frozen_at: z.string().datetime(),
  expires_at: z.string().datetime().optional(),
  status: z.enum(["active", "lifted"]).default("active"),
});
export type AutomationFreeze = z.infer<typeof AutomationFreezeSchema>;

export const ControlAuditLogSchema = z.object({
  log_id: z.string().uuid(),
  organization_id: z.string(),
  action_id: z.string().uuid().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
    service_account: z.boolean().default(false),
  }),
  event_type: z.enum([
    "action_created",
    "policy_evaluated",
    "action_approved",
    "execution_started",
    "canary_stage_promoted",
    "canary_aborted",
    "rollback_triggered",
    "rollback_completed",
    "action_completed",
    "freeze_activated",
    "freeze_lifted",
  ]),
  action_hash: z.string().optional(),
  details: z.record(z.any()).default({}),
  timestamp: z.string().datetime(),
});
export type ControlAuditLog = z.infer<typeof ControlAuditLogSchema>;

// Normalized Security and Operational Error Taxonomy
export const ModelForgeErrorCodeSchema = z.enum([
  "VALIDATION_ERROR",
  "AUTHORIZATION_ERROR",
  "NOT_FOUND",
  "POLICY_DENIED",
  "EMERGENCY_FREEZE",
  "INTEGRITY_VIOLATION",
  "ROLLBACK_TRIGGERED",
  "STATE_CONFLICT",
  "RATE_LIMITED",
  "PROVIDER_UNAVAILABLE",
  "PROVIDER_REJECTED",
  "INTERNAL_ERROR",
]);
export type ModelForgeErrorCode = z.infer<typeof ModelForgeErrorCodeSchema>;

export const ModelForgeErrorResponseSchema = z.object({
  error_code: ModelForgeErrorCodeSchema,
  message: z.string(),
  details: z.record(z.any()).optional(),
  timestamp: z.string().datetime(),
  request_id: z.string().optional(),
});
export type ModelForgeErrorResponse = z.infer<typeof ModelForgeErrorResponseSchema>;

export * from "./confidence";
