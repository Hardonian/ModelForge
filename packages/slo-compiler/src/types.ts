import { z } from "zod";

export const ProvenanceTypeSchema = z.enum([
  "MEASURED",
  "INTERPOLATED",
  "PREDICTED",
  "ESTIMATED",
  "DOCUMENTED",
]);
export type ProvenanceType = z.infer<typeof ProvenanceTypeSchema>;

export const WorkloadFingerprintSchema = z.object({
  fingerprint_id: z.string(),
  model_repo: z.string(),
  model_revision: z.string().default("main"),
  task_type: z.enum([
    "conversational",
    "rag",
    "code_completion",
    "reasoning",
    "summarization",
    "embedding",
    "custom",
  ]),
  prompt_token_mean: z.number().positive(),
  output_token_mean: z.number().positive(),
  context_length_target: z.number().int().positive(),
  target_concurrency: z.number().int().positive().default(1),
  requests_per_day: z.number().int().positive().default(50000),
  streaming_required: z.boolean().default(true),
  arrival_pattern: z
    .enum(["steady", "bursty", "poisson", "diurnal"])
    .default("bursty"),
});
export type WorkloadFingerprint = z.infer<typeof WorkloadFingerprintSchema>;

export const SLOSpecSchema = z.object({
  p50_ttft_ms: z.number().positive().optional(),
  p95_ttft_ms: z.number().positive().optional(),
  p99_ttft_ms: z.number().positive().optional(),
  min_tokens_per_second: z.number().positive().optional(),
  target_tpot_ms: z.number().positive().optional(),
  availability_target: z.number().min(90).max(100).default(99.9),
  max_cost_per_million_tokens_usd: z.number().positive().optional(),
  max_hourly_cost_usd: z.number().positive().optional(),
  quality_floor: z.number().min(0).max(1).default(0.95),
  preferred_region: z.string().optional(),
  energy_optimization_preference: z
    .enum(["neutral", "low_energy", "high_efficiency"])
    .default("neutral"),
  optimize_for: z
    .enum(["cost", "latency", "throughput", "balanced", "energy"])
    .default("balanced"),
});
export type SLOSpec = z.infer<typeof SLOSpecSchema>;

export const DisaggregatedTopologySchema = z.object({
  enabled: z.boolean(),
  prefill_workers: z.number().int().nonnegative().default(0),
  prefill_gpu_type: z.string().optional(),
  decode_workers: z.number().int().nonnegative().default(0),
  decode_gpu_type: z.string().optional(),
  kv_routing_policy: z
    .enum(["round_robin", "kv_cache_affinity", "least_loaded"])
    .default("kv_cache_affinity"),
  cross_node_interconnect: z.string().default("infiniband_ndr"),
});
export type DisaggregatedTopology = z.infer<typeof DisaggregatedTopologySchema>;

export const CandidateDeploymentSchema = z.object({
  candidate_id: z.string(),
  model_id: z.string(),
  model_revision: z.string(),
  runtime: z.enum([
    "dynamo",
    "nim",
    "vllm",
    "tensorrt-llm",
    "sglang",
    "llama.cpp",
  ]),
  runtime_version: z.string(),
  target_engine: z.string(),
  precision: z.enum(["fp16", "bf16", "fp8", "nvfp4", "int8", "int4", "awq"]),
  accelerator: z.string(),
  accelerator_vendor: z.string(),
  accelerator_count: z.number().int().positive(),
  tensor_parallel_size: z.number().int().positive(),
  pipeline_parallel_size: z.number().int().positive(),
  replicas: z.number().int().positive(),
  disaggregated_topology: DisaggregatedTopologySchema.optional(),
  memory_estimate_gb: z.number().positive(),
  expected_p50_ttft_ms: z.number().positive(),
  expected_p95_ttft_ms: z.number().positive(),
  expected_p50_tpot_ms: z.number().positive(),
  expected_throughput_tps: z.number().positive(),
  max_concurrency: z.number().int().positive(),
  cost_per_hour_usd: z.number().nonnegative(),
  cost_per_million_tokens_usd: z.number().nonnegative(),
  estimated_energy_joules_per_token: z.number().positive().optional(),
  slo_compliance_score: z.number().min(0).max(100),
  model_fit_score: z.number().min(0).max(100),
  evidence_count: z.number().int().nonnegative(),
  confidence_score: z.number().min(0).max(100),
  provenance: ProvenanceTypeSchema,
  reasons: z.array(z.string()),
  warnings: z.array(z.string()),
});
export type CandidateDeployment = z.infer<typeof CandidateDeploymentSchema>;

export const DeploymentPlanSchema = z.object({
  plan_id: z.string().uuid(),
  schema_version: z.literal("2.0.0"),
  created_at: z.string().datetime(),
  model: z.object({
    repository: z.string(),
    revision: z.string(),
    parameters_billions: z.number().positive(),
    architecture: z.string(),
  }),
  workload: WorkloadFingerprintSchema,
  slo: SLOSpecSchema,
  recommended_candidate: CandidateDeploymentSchema,
  alternative_candidates: z.array(CandidateDeploymentSchema),
  generated_manifests: z.object({
    dynamo_config_yaml: z.string().optional(),
    nim_compose_yaml: z.string().optional(),
    vllm_docker_run: z.string().optional(),
    kubernetes_pod_yaml: z.string().optional(),
    env_example: z.string().optional(),
    deployment_notes_md: z.string(),
  }),
  is_immutable: z.boolean().default(true),
});
export type DeploymentPlan = z.infer<typeof DeploymentPlanSchema>;
