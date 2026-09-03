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

export * from "./confidence";
