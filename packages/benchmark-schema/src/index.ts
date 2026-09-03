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

export * from "./confidence";
