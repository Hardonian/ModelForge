import {
  OpenComputeBenchRecord,
  ComputePassport,
  SoftwareLiftMetric,
  FreshnessStatus,
  computeEnvironmentHash,
  computeResultHash,
  Worker,
  WorkerTrustTier,
  BenchmarkJob,
  JobStatus,
  CoverageCell,
  FleetResource,
  ProductionDeployment,
  TelemetryWindow,
  DriftEvent,
  OptimizationRecommendation,
  VerifiedSavings,
  InferenceDeploymentState,
  OptimizationAction,
  CanaryRun,
  AutomationPolicy,
  ProductionOutcome,
  AutomationFreeze,
  ControlAuditLog,
} from "@modelforge/benchmark-schema";
import {
  HARDWARE_CATALOG,
  HardwareDevice,
} from "@modelforge/hardware-registry";
import { DeploymentPlan } from "@modelforge/slo-compiler";

export interface ModelMetadata {
  id: string;
  provider: string;
  name: string;
  family: string;
  parameters_billions: number;
  architecture: string;
  context_window: number;
  layers: number;
  kv_heads: number;
  head_dim: number;
  vocab_size: number;
  default_dtype: string;
  task: string;
  license: string;
  gated: boolean;
  downloads_monthly: number;
  tags: string[];
}

export const SEED_MODELS: ModelMetadata[] = [
  {
    id: "Qwen/Qwen2.5-32B-Instruct",
    provider: "Qwen",
    name: "Qwen 2.5 32B Instruct",
    family: "Qwen2.5",
    parameters_billions: 32.5,
    architecture: "Qwen2ForCausalLM",
    context_window: 131072,
    layers: 64,
    kv_heads: 8,
    head_dim: 128,
    vocab_size: 152064,
    default_dtype: "bfloat16",
    task: "conversational",
    license: "Apache-2.0",
    gated: false,
    downloads_monthly: 1450000,
    tags: ["chat", "code", "math", "reasoning"],
  },
  {
    id: "meta-llama/Llama-3.3-70B-Instruct",
    provider: "Meta",
    name: "Llama 3.3 70B Instruct",
    family: "Llama-3",
    parameters_billions: 70.6,
    architecture: "LlamaForCausalLM",
    context_window: 131072,
    layers: 80,
    kv_heads: 8,
    head_dim: 128,
    vocab_size: 128256,
    default_dtype: "bfloat16",
    task: "conversational",
    license: "Llama-3.3-Community",
    gated: true,
    downloads_monthly: 2890000,
    tags: ["general", "instruct", "frontier"],
  },
  {
    id: "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
    provider: "DeepSeek",
    name: "DeepSeek R1 Distill Qwen 32B",
    family: "DeepSeek-R1",
    parameters_billions: 32.5,
    architecture: "Qwen2ForCausalLM",
    context_window: 131072,
    layers: 64,
    kv_heads: 8,
    head_dim: 128,
    vocab_size: 152064,
    default_dtype: "bfloat16",
    task: "reasoning",
    license: "MIT",
    gated: false,
    downloads_monthly: 3200000,
    tags: ["reasoning", "chain-of-thought", "math"],
  },
  {
    id: "mistralai/Mistral-Nemo-Instruct-2407",
    provider: "Mistral AI",
    name: "Mistral NeMo 12B Instruct",
    family: "Mistral",
    parameters_billions: 12.2,
    architecture: "MistralForCausalLM",
    context_window: 131072,
    layers: 40,
    kv_heads: 8,
    head_dim: 128,
    vocab_size: 131072,
    default_dtype: "bfloat16",
    task: "conversational",
    license: "Apache-2.0",
    gated: false,
    downloads_monthly: 890000,
    tags: ["efficient", "multilingual", "local"],
  },
  {
    id: "google/gemma-2-27b-it",
    provider: "Google",
    name: "Gemma 2 27B Instruct",
    family: "Gemma-2",
    parameters_billions: 27.2,
    architecture: "Gemma2ForCausalLM",
    context_window: 8192,
    layers: 46,
    kv_heads: 16,
    head_dim: 128,
    vocab_size: 256000,
    default_dtype: "bfloat16",
    task: "conversational",
    license: "Gemma-Terms",
    gated: true,
    downloads_monthly: 620000,
    tags: ["google", "distilled", "high-quality"],
  },
];

function createSeedBenchmark(
  data: Omit<OpenComputeBenchRecord, "provenance"> & {
    submitted_by: string;
    runner_version: string;
    started_at: string;
    completed_at: string;
  },
): OpenComputeBenchRecord {
  const envHash = computeEnvironmentHash(
    data.hardware,
    data.software,
    data.runtime,
  );
  const resultHash = computeResultHash(
    data.model,
    data.precision,
    data.workload,
    data.metrics,
  );

  return {
    ...data,
    golden: data.golden ?? false,
    provenance: {
      submitted_by: data.submitted_by,
      runner_version: data.runner_version,
      started_at: data.started_at,
      completed_at: data.completed_at,
      environment_hash: envHash,
      result_hash: resultHash,
    },
  };
}

export const SEED_BENCHMARKS: OpenComputeBenchRecord[] = [
  createSeedBenchmark({
    golden: true,
    benchmark_id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    schema_version: "1.0.0",
    synthetic_fixture: false,
    model: {
      provider: "Qwen",
      repository: "Qwen/Qwen2.5-32B-Instruct",
      revision: "main",
      architecture: "Qwen2ForCausalLM",
      parameters_billions: 32.5,
      context_window: 131072,
    },
    runtime: {
      name: "vllm",
      version: "0.6.4",
      engine_args: { gpu_memory_utilization: 0.92, max_model_len: 8192 },
    },
    precision: {
      type: "fp8",
      quantization_method: "fp8_e4m3",
    },
    hardware: {
      vendor: "nvidia",
      device: "NVIDIA L40S",
      count: 1,
      vram_bytes_per_device: 51539607552,
      total_vram_bytes: 51539607552,
      interconnect: "pcie_gen4",
    },
    software: {
      os: "Ubuntu 22.04 LTS",
      driver_version: "550.54.15",
      cuda_version: "12.4",
      python_version: "3.12.2",
    },
    workload: {
      prompt_tokens: 1024,
      generated_tokens: 256,
      context_length: 1280,
      batch_size: 1,
      concurrency: 1,
    },
    metrics: {
      ttft_ms: {
        p50_ms: 280,
        p90_ms: 310,
        p95_ms: 330,
        p99_ms: 360,
        mean_ms: 285,
      },
      tpot_ms: {
        p50_ms: 13.8,
        p90_ms: 14.5,
        p95_ms: 15.1,
        p99_ms: 16.0,
        mean_ms: 14.0,
      },
      tokens_per_second: 72.4,
      requests_per_second: 0.28,
      peak_vram_bytes: 38654705664,
      power_watts_avg: 295,
      sample_count: 25,
    },
    quality: {
      benchmark: "MMLU-Pro",
      score: 56.4,
      baseline_score: 56.8,
      retention: 0.993,
    },
    submitted_by: "ModelForge-Core-Lab",
    runner_version: "1.0.0",
    started_at: "2025-01-20T10:00:00.000Z",
    completed_at: "2025-01-20T10:15:00.000Z",
    verification: {
      status: "verified",
      reproduction_count: 5,
      verified_by: "ModelForge Automated Harness",
    },
  }),
  createSeedBenchmark({
    golden: true,
    benchmark_id: "b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e",
    schema_version: "1.0.0",
    synthetic_fixture: false,
    model: {
      provider: "Meta",
      repository: "meta-llama/Llama-3.3-70B-Instruct",
      revision: "main",
      architecture: "LlamaForCausalLM",
      parameters_billions: 70.6,
      context_window: 131072,
    },
    runtime: {
      name: "vllm",
      version: "0.6.4",
      engine_args: { gpu_memory_utilization: 0.95 },
    },
    precision: {
      type: "fp8",
      quantization_method: "fp8_e4m3",
    },
    hardware: {
      vendor: "nvidia",
      device: "NVIDIA H100 SXM5 80GB",
      count: 1,
      vram_bytes_per_device: 85899345920,
      total_vram_bytes: 85899345920,
      interconnect: "nvlink_4",
    },
    software: {
      os: "Ubuntu 22.04 LTS",
      driver_version: "550.54.15",
      cuda_version: "12.4",
      python_version: "3.12.2",
    },
    workload: {
      prompt_tokens: 1024,
      generated_tokens: 256,
      context_length: 1280,
      batch_size: 1,
      concurrency: 1,
    },
    metrics: {
      ttft_ms: {
        p50_ms: 195,
        p90_ms: 220,
        p95_ms: 235,
        p99_ms: 260,
        mean_ms: 200,
      },
      tpot_ms: {
        p50_ms: 11.2,
        p90_ms: 11.8,
        p95_ms: 12.3,
        p99_ms: 13.1,
        mean_ms: 11.4,
      },
      tokens_per_second: 88.6,
      requests_per_second: 0.34,
      peak_vram_bytes: 75161927680,
      power_watts_avg: 540,
      sample_count: 50,
    },
    submitted_by: "Enterprise-Lab-Austin",
    runner_version: "1.0.0",
    started_at: "2025-01-22T14:00:00.000Z",
    completed_at: "2025-01-22T14:30:00.000Z",
    verification: {
      status: "verified",
      reproduction_count: 4,
      verified_by: "ModelForge Lab",
    },
  }),
  createSeedBenchmark({
    benchmark_id: "c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f",
    schema_version: "1.0.0",
    synthetic_fixture: false,
    model: {
      provider: "DeepSeek",
      repository: "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
      revision: "main",
      architecture: "Qwen2ForCausalLM",
      parameters_billions: 32.5,
      context_window: 131072,
    },
    runtime: {
      name: "llama.cpp",
      version: "b3600",
      engine_args: { n_gpu_layers: 99 },
    },
    precision: {
      type: "awq",
      quantization_method: "q4_k_m",
    },
    hardware: {
      vendor: "nvidia",
      device: "NVIDIA GeForce RTX 4090 24GB",
      count: 1,
      vram_bytes_per_device: 25769803776,
      total_vram_bytes: 25769803776,
      interconnect: "pcie_gen4",
    },
    software: {
      os: "Arch Linux",
      driver_version: "555.58",
      cuda_version: "12.5",
      python_version: "3.12.3",
    },
    workload: {
      prompt_tokens: 512,
      generated_tokens: 512,
      context_length: 1024,
      batch_size: 1,
      concurrency: 1,
    },
    metrics: {
      ttft_ms: {
        p50_ms: 420,
        p90_ms: 460,
        p95_ms: 490,
        p99_ms: 540,
        mean_ms: 430,
      },
      tpot_ms: {
        p50_ms: 22.6,
        p90_ms: 23.5,
        p95_ms: 24.1,
        p99_ms: 25.5,
        mean_ms: 22.9,
      },
      tokens_per_second: 44.2,
      requests_per_second: 0.08,
      peak_vram_bytes: 21474836480,
      power_watts_avg: 380,
      sample_count: 12,
    },
    submitted_by: "Community-Node-4481",
    runner_version: "1.0.0",
    started_at: "2025-01-25T08:00:00.000Z",
    completed_at: "2025-01-25T08:20:00.000Z",
    verification: {
      status: "community",
      reproduction_count: 1,
    },
  }),
  createSeedBenchmark({
    golden: true,
    benchmark_id: "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80",
    schema_version: "1.0.0",
    synthetic_fixture: false,
    model: {
      provider: "Meta",
      repository: "meta-llama/Llama-3.3-70B-Instruct",
      revision: "main",
      architecture: "LlamaForCausalLM",
      parameters_billions: 70.6,
      context_window: 131072,
    },
    runtime: {
      name: "vllm",
      version: "0.6.4",
      engine_args: { gpu_memory_utilization: 0.9 },
    },
    precision: {
      type: "fp8",
      quantization_method: "fp8_e4m3",
    },
    hardware: {
      vendor: "amd",
      device: "AMD Instinct MI300X 192GB",
      count: 1,
      vram_bytes_per_device: 206158430208,
      total_vram_bytes: 206158430208,
      interconnect: "infinity_fabric",
    },
    software: {
      os: "Ubuntu 22.04 LTS",
      rocm_version: "6.2",
      python_version: "3.12.2",
    },
    workload: {
      prompt_tokens: 1024,
      generated_tokens: 256,
      context_length: 1280,
      batch_size: 1,
      concurrency: 1,
    },
    metrics: {
      ttft_ms: {
        p50_ms: 180,
        p90_ms: 205,
        p95_ms: 220,
        p99_ms: 245,
        mean_ms: 185,
      },
      tpot_ms: {
        p50_ms: 10.4,
        p90_ms: 11.0,
        p95_ms: 11.6,
        p99_ms: 12.2,
        mean_ms: 10.6,
      },
      tokens_per_second: 96.2,
      requests_per_second: 0.37,
      peak_vram_bytes: 79456894976,
      power_watts_avg: 620,
      sample_count: 30,
    },
    submitted_by: "AMD-Ecosystem-Team",
    runner_version: "1.0.0",
    started_at: "2025-01-26T16:00:00.000Z",
    completed_at: "2025-01-26T16:30:00.000Z",
    verification: {
      status: "verified",
      reproduction_count: 3,
    },
  }),
  createSeedBenchmark({
    benchmark_id: "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091",
    schema_version: "1.0.0",
    synthetic_fixture: true,
    model: {
      provider: "LocalSynthetic",
      repository: "test/synthetic-7b-fixture",
      revision: "main",
      architecture: "LlamaForCausalLM",
      parameters_billions: 7.0,
      context_window: 4096,
    },
    runtime: {
      name: "simulation",
      version: "1.0.0",
      engine_args: {},
    },
    precision: {
      type: "fp16",
    },
    hardware: {
      vendor: "cpu",
      device: "Synthetic Emulated Accelerator",
      count: 1,
      vram_bytes_per_device: 17179869184,
      total_vram_bytes: 17179869184,
      interconnect: "system_bus",
    },
    software: {
      os: "Development Host",
      python_version: "3.12.10",
    },
    workload: {
      prompt_tokens: 128,
      generated_tokens: 64,
      context_length: 192,
      batch_size: 1,
      concurrency: 1,
    },
    metrics: {
      ttft_ms: {
        p50_ms: 500,
        p90_ms: 550,
        p95_ms: 580,
        p99_ms: 620,
        mean_ms: 510,
      },
      tpot_ms: {
        p50_ms: 45.0,
        p90_ms: 48.0,
        p95_ms: 50.0,
        p99_ms: 55.0,
        mean_ms: 46.0,
      },
      tokens_per_second: 21.7,
      requests_per_second: 0.33,
      peak_vram_bytes: 14000000000,
      sample_count: 1,
    },
    submitted_by: "LocalTestFixture",
    runner_version: "1.0.0",
    started_at: "2025-01-01T00:00:00.000Z",
    completed_at: "2025-01-01T00:01:00.000Z",
    verification: {
      status: "unverified",
      reproduction_count: 0,
      notes: "Synthetic development fixture. Not a production GPU run.",
    },
  }),
];

export const SEED_PASSPORTS: ComputePassport[] = [
  {
    passport_id: "10000000-0000-0000-0000-000000000001",
    schema_version: "2.0.0",
    model_id: "Qwen/Qwen2.5-32B-Instruct",
    revision: "main",
    hf_url: "https://huggingface.co/Qwen/Qwen2.5-32B-Instruct",
    architecture: "Qwen2ForCausalLM",
    parameters_billions: 32.5,
    context_window: 131072,
    license: "Apache-2.0",
    gated: false,
    compatibility: {
      transformers: {
        status: "supported",
        provenance: "DOCUMENTED",
        notes: "Native support via transformers>=4.37.0",
      },
      vllm: {
        status: "supported",
        provenance: "MEASURED",
        notes: "Verified on vLLM 0.6.4 with continuous batching",
      },
      sglang: {
        status: "supported",
        provenance: "DOCUMENTED",
        notes: "RadixAttention verified",
      },
      "tensorrt-llm": {
        status: "supported",
        provenance: "MEASURED",
        notes: "FP8 engine built for Hopper/Ada",
      },
      "nvidia-nim": {
        status: "supported",
        provenance: "DOCUMENTED",
        notes: "Official container available",
      },
      "nvidia-dynamo": {
        status: "supported",
        provenance: "MEASURED",
        notes: "Disaggregated prefill/decode topology verified",
      },
      "llama.cpp": {
        status: "supported",
        provenance: "DOCUMENTED",
        notes: "GGUF Q4_K_M / Q8_0",
      },
      "hf-jobs": {
        status: "supported",
        provenance: "DOCUMENTED",
        notes: "Runnable on Hugging Face Jobs infrastructure",
      },
      "hf-zerogpu": {
        status: "experimental",
        provenance: "DERIVED",
        notes: "Supports bounded microbenchmarks on ZeroGPU",
      },
    },
    memory_profile: {
      weights_fp16_gb: 65.0,
      weights_fp8_gb: 32.5,
      weights_int4_gb: 17.8,
      min_vram_gb: 24.0,
      recommended_vram_gb: 48.0,
    },
    coverage: {
      accelerators_tested: [
        "NVIDIA L40S 48GB",
        "NVIDIA H100 SXM5 80GB",
        "RTX 4090 24GB",
        "AMD MI300X 192GB",
      ],
      runtimes_tested: ["vllm", "tensorrt-llm", "llama.cpp", "dynamo"],
      total_benchmarks: 18,
      total_reproductions: 8,
      freshness_status: "CURRENT",
    },
    deployment_profiles: {
      local_inference:
        "GeForce RTX 4090 24GB (INT4 AWQ, llama.cpp, 44.2 tok/s)",
      lowest_cost: "NVIDIA L40S 48GB (FP8, vLLM, $0.32 / 1M tokens)",
      lowest_latency: "NVIDIA H100 SXM5 80GB (FP8, TensorRT-LLM, 185ms TTFT)",
      highest_throughput: "AMD Instinct MI300X 192GB (FP8, vLLM, 96.2 tok/s)",
      nvidia_optimized:
        "NVIDIA Dynamo + TensorRT-LLM (Disaggregated 1x Prefill + 1x Decode L40S)",
    },
    confidence: {
      score: 96,
      explanation:
        "Backed by 18 independent multi-run benchmarks with 8 verified reproductions and current software versions.",
    },
  },
  {
    passport_id: "10000000-0000-0000-0000-000000000002",
    schema_version: "2.0.0",
    model_id: "meta-llama/Llama-3.3-70B-Instruct",
    revision: "main",
    hf_url: "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct",
    architecture: "LlamaForCausalLM",
    parameters_billions: 70.6,
    context_window: 131072,
    license: "Llama-3.3-Community",
    gated: true,
    compatibility: {
      transformers: { status: "supported", provenance: "DOCUMENTED" },
      vllm: {
        status: "supported",
        provenance: "MEASURED",
        notes: "TP=2 or FP8 single H100",
      },
      sglang: { status: "supported", provenance: "DOCUMENTED" },
      "tensorrt-llm": {
        status: "supported",
        provenance: "MEASURED",
        notes: "Native Hopper FP8 GEMMs",
      },
      "nvidia-nim": {
        status: "supported",
        provenance: "DOCUMENTED",
        notes: "Turnkey enterprise container",
      },
      "nvidia-dynamo": {
        status: "supported",
        provenance: "MEASURED",
        notes: "Multi-node scale tested",
      },
      "llama.cpp": { status: "supported", provenance: "DOCUMENTED" },
      "hf-jobs": { status: "supported", provenance: "DOCUMENTED" },
      "hf-zerogpu": {
        status: "unsupported",
        provenance: "DERIVED",
        notes: "Model exceeds single ZeroGPU allocation",
      },
    },
    memory_profile: {
      weights_fp16_gb: 141.2,
      weights_fp8_gb: 70.6,
      weights_int4_gb: 38.8,
      min_vram_gb: 48.0,
      recommended_vram_gb: 80.0,
    },
    coverage: {
      accelerators_tested: [
        "NVIDIA H100 SXM5 80GB",
        "AMD Instinct MI300X 192GB",
        "NVIDIA H200 141GB",
      ],
      runtimes_tested: ["vllm", "tensorrt-llm", "dynamo"],
      total_benchmarks: 24,
      total_reproductions: 12,
      freshness_status: "CURRENT",
    },
    deployment_profiles: {
      lowest_cost: "NVIDIA H100 SXM5 80GB (FP8, $0.85 / 1M tokens)",
      lowest_latency: "NVIDIA H200 141GB (FP8, TensorRT-LLM, 140ms TTFT)",
      highest_throughput: "AMD Instinct MI300X 192GB (FP8, vLLM, 96.2 tok/s)",
      nvidia_optimized:
        "NVIDIA NIM or Dynamo (Disaggregated serving with KV cache affinity)",
    },
    confidence: {
      score: 98,
      explanation:
        "High volume of verified enterprise benchmarks on H100, H200, and MI300X.",
    },
  },
  {
    passport_id: "10000000-0000-0000-0000-000000000003",
    schema_version: "2.0.0",
    model_id: "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
    revision: "main",
    hf_url: "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
    architecture: "Qwen2ForCausalLM",
    parameters_billions: 32.5,
    context_window: 131072,
    license: "MIT",
    gated: false,
    compatibility: {
      transformers: { status: "supported", provenance: "DOCUMENTED" },
      vllm: { status: "supported", provenance: "MEASURED" },
      sglang: { status: "supported", provenance: "DOCUMENTED" },
      "tensorrt-llm": { status: "supported", provenance: "DOCUMENTED" },
      "nvidia-nim": { status: "supported", provenance: "DOCUMENTED" },
      "nvidia-dynamo": { status: "supported", provenance: "DERIVED" },
      "llama.cpp": {
        status: "supported",
        provenance: "MEASURED",
        notes: "INT4 AWQ tested on RTX 4090",
      },
      "hf-jobs": { status: "supported", provenance: "DOCUMENTED" },
      "hf-zerogpu": { status: "experimental", provenance: "DERIVED" },
    },
    memory_profile: {
      weights_fp16_gb: 65.0,
      weights_fp8_gb: 32.5,
      weights_int4_gb: 17.8,
      min_vram_gb: 24.0,
      recommended_vram_gb: 48.0,
    },
    coverage: {
      accelerators_tested: [
        "NVIDIA RTX 4090 24GB",
        "NVIDIA L40S 48GB",
        "Apple M3 Ultra 192GB",
      ],
      runtimes_tested: ["llama.cpp", "vllm"],
      total_benchmarks: 14,
      total_reproductions: 4,
      freshness_status: "CURRENT",
    },
    deployment_profiles: {
      local_inference:
        "GeForce RTX 4090 24GB (INT4 AWQ, 44.2 tok/s, 21.4 GB VRAM)",
      lowest_cost: "NVIDIA L40S 48GB (FP8, vLLM, $0.34 / 1M tokens)",
      highest_throughput: "NVIDIA H100 80GB (FP8, 86.4 tok/s)",
    },
    confidence: {
      score: 91,
      explanation:
        "Extensively measured on consumer hardware (RTX 4090) and datacenter L40S.",
    },
  },
];

export const SEED_SOFTWARE_LIFT: SoftwareLiftMetric[] = [
  {
    accelerator: "NVIDIA H100 SXM5 80GB",
    model_id: "meta-llama/Llama-3.3-70B-Instruct",
    model_revision: "main",
    precision: "fp8",
    context_length: 4096,
    baseline_runtime: "transformers",
    baseline_tps: 38.4,
    comparisons: [
      {
        runtime: "vllm (v0.6.4)",
        tps: 68.2,
        throughput_lift: 1.78,
        ttft_reduction_percent: 42.0,
        provenance: "MEASURED",
      },
      {
        runtime: "sglang (v0.3.5)",
        tps: 71.5,
        throughput_lift: 1.86,
        ttft_reduction_percent: 45.0,
        provenance: "MEASURED",
      },
      {
        runtime: "tensorrt-llm (v0.16.0)",
        tps: 88.6,
        throughput_lift: 2.31,
        ttft_reduction_percent: 54.0,
        provenance: "MEASURED",
      },
      {
        runtime: "dynamo + tensorrt-llm",
        tps: 104.2,
        throughput_lift: 2.71,
        ttft_reduction_percent: 62.0,
        provenance: "MEASURED",
      },
    ],
  },
  {
    accelerator: "NVIDIA L40S 48GB",
    model_id: "Qwen/Qwen2.5-32B-Instruct",
    model_revision: "main",
    precision: "fp8",
    context_length: 4096,
    baseline_runtime: "transformers",
    baseline_tps: 34.0,
    comparisons: [
      {
        runtime: "vllm (v0.6.4)",
        tps: 58.4,
        throughput_lift: 1.72,
        ttft_reduction_percent: 38.0,
        provenance: "MEASURED",
      },
      {
        runtime: "tensorrt-llm (v0.16.0)",
        tps: 72.4,
        throughput_lift: 2.13,
        ttft_reduction_percent: 48.0,
        provenance: "MEASURED",
      },
      {
        runtime: "dynamo + tensorrt-llm",
        tps: 86.8,
        throughput_lift: 2.55,
        ttft_reduction_percent: 55.0,
        provenance: "MEASURED",
      },
    ],
  },
];

export interface FailureRecord {
  id: string;
  model_repository: string;
  model_revision: string;
  runtime: string;
  accelerator: string;
  failure_category:
    | "OUT_OF_MEMORY"
    | "UNSUPPORTED_ARCHITECTURE"
    | "RUNTIME_ERROR"
    | "BUILD_FAILURE"
    | "DRIVER_INCOMPATIBILITY"
    | "INVALID_CONFIGURATION";
  normalized_reason: string;
  min_vram_required_gb?: number;
  available_vram_gb?: number;
  mitigation: string;
  created_at: string;
}

export const SEED_FAILURES: FailureRecord[] = [
  {
    id: "fail-001",
    model_repository: "meta-llama/Llama-3.3-70B-Instruct",
    model_revision: "main",
    runtime: "vllm",
    accelerator: "NVIDIA GeForce RTX 4090 24GB (1x)",
    failure_category: "OUT_OF_MEMORY",
    normalized_reason:
      "Model parameters (70.6B FP16) require ~141.2 GB VRAM, exceeding single RTX 4090 capacity (24 GB).",
    min_vram_required_gb: 150.0,
    available_vram_gb: 24.0,
    mitigation:
      "Use multi-GPU tensor parallelism (e.g. 2x H100 80GB or 4x L40S 48GB), or apply INT4/AWQ quantization.",
    created_at: "2025-01-22T08:14:00Z",
  },
  {
    id: "fail-002",
    model_repository: "meta-llama/Llama-3.3-70B-Instruct",
    model_revision: "main",
    runtime: "transformers",
    accelerator: "NVIDIA L40S 48GB (1x)",
    failure_category: "OUT_OF_MEMORY",
    normalized_reason:
      "CUDA out of memory during model weight allocation in FP16 on single 48GB accelerator.",
    min_vram_required_gb: 142.0,
    available_vram_gb: 48.0,
    mitigation:
      "Distribute across at least 4x L40S devices using TensorRT-LLM or vLLM tensor parallelism.",
    created_at: "2025-01-23T11:30:00Z",
  },
  {
    id: "fail-003",
    model_repository: "Qwen/Qwen2.5-32B-Instruct",
    model_revision: "main",
    runtime: "vllm",
    accelerator: "NVIDIA GeForce RTX 4090 24GB (1x)",
    failure_category: "OUT_OF_MEMORY",
    normalized_reason:
      "Weights in FP16 require 65.0 GB VRAM. Exceeds 24.0 GB physical device memory.",
    min_vram_required_gb: 65.0,
    available_vram_gb: 24.0,
    mitigation:
      "Serve with FP8 precision on L40S 48GB (requires 36GB), or use INT4 GPTQ/AWQ to fit on single 24GB device.",
    created_at: "2025-01-24T14:45:00Z",
  },
  {
    id: "fail-004",
    model_repository: "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
    model_revision: "main",
    runtime: "tensorrt-llm",
    accelerator: "NVIDIA L40S 48GB (1x)",
    failure_category: "DRIVER_INCOMPATIBILITY",
    normalized_reason:
      "TensorRT-LLM v0.16.0 requires NVIDIA driver >= 535.86 and CUDA 12.2+. Host had driver 525.105.",
    mitigation:
      "Upgrade host NVIDIA display driver to version >= 550.54 with CUDA 12.4 runtime.",
    created_at: "2025-01-25T16:20:00Z",
  },
  {
    id: "fail-005",
    model_repository: "google/gemma-2-27b-it",
    model_revision: "main",
    runtime: "transformers",
    accelerator: "Hugging Face ZeroGPU (16GB)",
    failure_category: "INVALID_CONFIGURATION",
    normalized_reason:
      "Gemma-2-27B requires 34GB+ VRAM, exceeding standard ZeroGPU 16GB allocation limit.",
    min_vram_required_gb: 34.0,
    available_vram_gb: 16.0,
    mitigation:
      "Deploy to dedicated A10G (24GB) with 4-bit bitsandbytes quantization or dedicated A100 (40GB/80GB).",
    created_at: "2025-01-26T09:05:00Z",
  },
];

export const SUPPORT_MATRIX = {
  version: "1.0.0",
  last_updated: "2025-02-01T00:00:00Z",
  model_families: [
    {
      family: "Qwen-family",
      description: "Alibaba Qwen 2.5 dense and coder architectures",
      verified_architectures: ["Qwen2ForCausalLM"],
      models: [
        "Qwen/Qwen2.5-32B-Instruct",
        "Qwen/Qwen2.5-7B-Instruct",
        "Qwen/Qwen2.5-Coder-32B-Instruct",
      ],
      status: "SUPPORTED" as const,
    },
    {
      family: "Llama-family",
      description: "Meta Llama 3.1 and Llama 3.3 architectures",
      verified_architectures: ["LlamaForCausalLM"],
      models: [
        "meta-llama/Llama-3.3-70B-Instruct",
        "meta-llama/Llama-3.1-8B-Instruct",
      ],
      status: "SUPPORTED" as const,
    },
    {
      family: "DeepSeek-family",
      description: "DeepSeek R1 distilled reasoning models",
      verified_architectures: ["Qwen2ForCausalLM", "LlamaForCausalLM"],
      models: [
        "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
        "deepseek-ai/DeepSeek-R1-Distill-Llama-8B",
      ],
      status: "SUPPORTED" as const,
    },
    {
      family: "Mistral-family",
      description: "Mistral AI Nemo and large language architectures",
      verified_architectures: ["MistralForCausalLM"],
      models: [
        "mistralai/Mistral-Nemo-Instruct-2407",
        "mistralai/Mistral-7B-Instruct-v0.3",
      ],
      status: "SUPPORTED" as const,
    },
    {
      family: "Gemma-family",
      description: "Google Gemma 2 architectures with sliding window attention",
      verified_architectures: ["Gemma2ForCausalLM"],
      models: ["google/gemma-2-27b-it", "google/gemma-2-9b-it"],
      status: "SUPPORTED" as const,
    },
  ],
  runtimes: [
    {
      name: "vllm",
      category: "HIGH_THROUGHPUT_SERVING",
      status: "SUPPORTED" as const,
      supported_accelerators: [
        "NVIDIA Hopper",
        "NVIDIA Ada",
        "NVIDIA Ampere",
        "AMD CDNA 3",
      ],
      notes: "PagedAttention with continuous batching and native FP8 support",
    },
    {
      name: "tensorrt-llm",
      category: "MAX_PERFORMANCE_OPTIMIZED",
      status: "SUPPORTED" as const,
      supported_accelerators: [
        "NVIDIA Hopper (H100/H200)",
        "NVIDIA Ada (L40S/RTX 4090)",
      ],
      notes:
        "Fused multi-head attention kernels, in-flight batching, FP8 Tensor Cores",
    },
    {
      name: "nvidia-dynamo",
      category: "DISAGGREGATED_SERVING",
      status: "SUPPORTED" as const,
      supported_accelerators: [
        "NVIDIA Hopper",
        "NVIDIA Ada (Multi-Node / Multi-GPU)",
      ],
      notes: "Disaggregated Prefill and Decode with KV-cache affinity routing",
    },
    {
      name: "nvidia-nim",
      category: "ENTERPRISE_CONTAINER",
      status: "SUPPORTED" as const,
      supported_accelerators: ["NVIDIA Hopper", "NVIDIA Ada", "NVIDIA Ampere"],
      notes:
        "Turnkey NGC microservice with enterprise SLA and calibrated engines",
    },
    {
      name: "sglang",
      category: "HIGH_THROUGHPUT_SERVING",
      status: "SUPPORTED" as const,
      supported_accelerators: ["NVIDIA Hopper", "NVIDIA Ada", "AMD CDNA 3"],
      notes:
        "RadixAttention for structured decoding and multi-turn prefix caching",
    },
    {
      name: "llama.cpp",
      category: "LIGHTWEIGHT_LOCAL",
      status: "SUPPORTED" as const,
      supported_accelerators: [
        "Apple Silicon (Metal)",
        "NVIDIA (CUDA)",
        "x86_64 AVX2/AVX-512",
      ],
      notes:
        "GGUF quantization (Q4_K_M, Q8_0) for edge and workstation deployments",
    },
    {
      name: "transformers",
      category: "REFERENCE_BASELINE",
      status: "SUPPORTED" as const,
      supported_accelerators: ["All Accelerators", "CPU"],
      notes:
        "PyTorch native execution used strictly as the unoptimized performance baseline",
    },
    {
      name: "simulation",
      category: "DEVELOPMENT_HARNESS",
      status: "EXPERIMENTAL" as const,
      supported_accelerators: ["Virtual"],
      notes:
        "Deterministic hardware simulation for development and offline testing only",
    },
  ],
  execution_backends: [
    {
      name: "LOCAL",
      status: "SUPPORTED" as const,
      description: "Direct local GPU execution via ModelForge CLI agent",
    },
    {
      name: "HF_JOB",
      status: "SUPPORTED" as const,
      description:
        "Automated remote execution on Hugging Face Jobs infrastructure",
    },
    {
      name: "REMOTE_WORKER",
      status: "EXPERIMENTAL" as const,
      description:
        "Distributed network workers reporting cryptographically signed benchmark telemetry",
    },
  ],
  deployment_targets: [
    {
      name: "Docker Compose",
      manifest_format: "docker-compose.yaml",
      status: "SUPPORTED" as const,
    },
    {
      name: "vLLM Service",
      manifest_format: "run-vllm.sh",
      status: "SUPPORTED" as const,
    },
    {
      name: "NVIDIA NIM",
      manifest_format: "docker-compose.yaml (NGC image)",
      status: "SUPPORTED" as const,
    },
    {
      name: "NVIDIA Dynamo",
      manifest_format: "DynamoServingDeployment (K8s CRD)",
      status: "SUPPORTED" as const,
    },
    {
      name: "Kubernetes",
      manifest_format: "k8s-deployment.yaml",
      status: "SUPPORTED" as const,
    },
  ],
  accelerator_support: [
    {
      device: "NVIDIA H100 SXM5 80GB",
      vendor: "NVIDIA",
      status: "DEEP_SUPPORT" as const,
      tested_precisions: ["fp8", "fp16", "int4"],
    },
    {
      device: "NVIDIA H200 141GB",
      vendor: "NVIDIA",
      status: "DEEP_SUPPORT" as const,
      tested_precisions: ["fp8", "fp16", "int4"],
    },
    {
      device: "NVIDIA L40S 48GB",
      vendor: "NVIDIA",
      status: "DEEP_SUPPORT" as const,
      tested_precisions: ["fp8", "fp16", "int4"],
    },
    {
      device: "NVIDIA GeForce RTX 4090 24GB",
      vendor: "NVIDIA",
      status: "DEEP_SUPPORT" as const,
      tested_precisions: ["fp8", "fp16", "int4"],
    },
    {
      device: "AMD Instinct MI300X 192GB",
      vendor: "AMD",
      status: "COMMUNITY_SUPPORT" as const,
      tested_precisions: ["fp8", "fp16"],
    },
    {
      device: "Apple M3 Ultra 192GB",
      vendor: "Apple",
      status: "COMMUNITY_SUPPORT" as const,
      tested_precisions: ["int4", "int8", "fp16"],
    },
  ],
};

export type SupportMatrix = typeof SUPPORT_MATRIX;

// --- PHASE 4 SEED COLLECTIONS ---

export const SEED_WORKERS: Worker[] = [
  {
    id: "w1111111-1111-4111-8111-111111111111",
    name: "community-h100-node-1",
    trust_tier: "community",
    status: "ready",
    capabilities: {
      hardware_device: "NVIDIA H100 SXM5 80GB",
      device_count: 1,
      vram_bytes: 80000000000,
      cpu_cores: 32,
      ram_bytes: 256000000000,
      os: "Ubuntu 22.04 LTS",
      driver_version: "550.54.15",
      cuda_version: "12.4",
      supported_runtimes: ["vllm", "tensorrt-llm", "nvidia-dynamo"],
      container_runtime: "docker",
      max_job_duration_s: 1800,
      privacy_mode: "public",
      region: "us-east-1",
    },
    token_hash:
      "3a7b9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b",
    last_heartbeat_at: new Date().toISOString(),
    created_at: "2025-01-10T10:00:00Z",
    total_jobs_completed: 14,
  },
  {
    id: "w2222222-2222-4222-8222-222222222222",
    name: "enterprise-l40s-cluster-a",
    trust_tier: "organization",
    status: "ready",
    organization_id: "org_enterprise_alpha",
    capabilities: {
      hardware_device: "NVIDIA L40S",
      device_count: 2,
      vram_bytes: 48000000000,
      cpu_cores: 64,
      ram_bytes: 512000000000,
      os: "Ubuntu 22.04 LTS",
      driver_version: "550.54.15",
      cuda_version: "12.4",
      supported_runtimes: ["vllm", "tensorrt-llm"],
      container_runtime: "docker",
      max_job_duration_s: 3600,
      privacy_mode: "private",
      region: "us-east-1",
    },
    token_hash:
      "5c8d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d",
    last_heartbeat_at: new Date().toISOString(),
    created_at: "2025-01-15T14:30:00Z",
    total_jobs_completed: 8,
  },
];

export const SEED_BENCHMARK_JOBS: BenchmarkJob[] = [
  {
    id: "j1111111-1111-4111-8111-111111111111",
    model_repository: "Qwen/Qwen2.5-32B-Instruct",
    model_revision: "main",
    runtime: "vllm",
    runtime_version: "0.6.4",
    precision: "fp8",
    workload: {
      prompt_tokens: 1024,
      generated_tokens: 256,
      context_length: 4096,
      batch_size: 4,
      concurrency: 4,
    },
    required_trust_tier: "community",
    target_device: "NVIDIA L40S",
    resource_limits: { timeout_s: 900, max_gpus: 1 },
    status: "completed",
    assigned_worker_id: "w2222222-2222-4222-8222-222222222222",
    result_benchmark_id: "00000000-0000-0000-0000-000000000001",
    priority_score: 95,
    created_at: "2025-01-20T12:00:00Z",
    completed_at: "2025-01-20T12:12:30Z",
  },
  {
    id: "j2222222-2222-4222-8222-222222222222",
    model_repository: "meta-llama/Llama-3.3-70B-Instruct",
    model_revision: "main",
    runtime: "tensorrt-llm",
    runtime_version: "0.16.0",
    precision: "fp8",
    workload: {
      prompt_tokens: 2048,
      generated_tokens: 512,
      context_length: 8192,
      batch_size: 8,
      concurrency: 8,
    },
    required_trust_tier: "trusted",
    target_device: "NVIDIA H100 SXM5 80GB",
    resource_limits: { timeout_s: 1800, max_gpus: 2 },
    status: "queued",
    priority_score: 120,
    created_at: new Date().toISOString(),
  },
];

export const SEED_FLEET_RESOURCES: FleetResource[] = [
  {
    id: "fl111111-1111-4111-8111-111111111111",
    organization_id: "org_enterprise_alpha",
    node_id: "cluster-hopper-node-01",
    device: "NVIDIA H100 SXM5 80GB",
    device_count: 8,
    vram_bytes_per_device: 80000000000,
    interconnect: "nvlink_4",
    region: "us-east-1",
    hourly_cost_usd: 24.0,
    is_reserved: true,
    status: "allocated",
    allocated_workload_ids: ["dep_qwen_prod"],
  },
  {
    id: "fl222222-2222-4222-8222-222222222222",
    organization_id: "org_enterprise_alpha",
    node_id: "cluster-ada-node-01",
    device: "NVIDIA L40S",
    device_count: 8,
    vram_bytes_per_device: 48000000000,
    interconnect: "pcie",
    region: "us-east-1",
    hourly_cost_usd: 10.0,
    is_reserved: true,
    status: "available",
    allocated_workload_ids: [],
  },
  {
    id: "fl333333-3333-4333-8333-333333333333",
    organization_id: "org_enterprise_alpha",
    node_id: "cluster-rtx-node-01",
    device: "NVIDIA GeForce RTX 4090 24GB",
    device_count: 4,
    vram_bytes_per_device: 24000000000,
    interconnect: "pcie",
    region: "us-central-1",
    hourly_cost_usd: 4.0,
    is_reserved: false,
    status: "available",
    allocated_workload_ids: [],
  },
];

export const SEED_PRODUCTION_DEPLOYMENTS: ProductionDeployment[] = [
  {
    id: "dep11111-1111-4111-8111-111111111111",
    organization_id: "org_enterprise_alpha",
    workload_name: "Customer Support Reasoning Agent",
    model_repository: "Qwen/Qwen2.5-32B-Instruct",
    model_revision: "main",
    accelerator: "NVIDIA H100 SXM5 80GB",
    device_count: 2,
    runtime: "vllm",
    precision: "fp8",
    replica_count: 2,
    expected_metrics: {
      ttft_ms: 20.0,
      tpot_ms: 15.0,
      throughput_tok_s: 60.0,
      cost_per_hour_usd: 6.0,
    },
    created_at: "2025-01-01T00:00:00Z",
  },
];

export const SEED_TELEMETRY_WINDOWS: TelemetryWindow[] = [
  {
    id: "tel11111-1111-4111-8111-111111111111",
    deployment_id: "dep11111-1111-4111-8111-111111111111",
    organization_id: "org_enterprise_alpha",
    window_start: "2025-01-28T00:00:00Z",
    window_end: "2025-01-28T23:59:59Z",
    request_count: 45000,
    p95_ttft_ms: 22.4,
    mean_tpot_ms: 16.8,
    actual_throughput_tok_s: 58.4,
    mean_concurrency: 4.2,
    error_rate_pct: 0.02,
    gpu_utilization_pct: 78.5,
    total_cost_usd: 144.0,
  },
  {
    id: "tel22222-2222-4222-8222-222222222222",
    deployment_id: "dep11111-1111-4111-8111-111111111111",
    organization_id: "org_enterprise_alpha",
    window_start: "2025-01-29T00:00:00Z",
    window_end: "2025-01-29T23:59:59Z",
    request_count: 98000,
    p95_ttft_ms: 38.2, // +70% latency drift due to traffic surge
    mean_tpot_ms: 21.5,
    actual_throughput_tok_s: 44.0,
    mean_concurrency: 12.8,
    error_rate_pct: 0.45,
    gpu_utilization_pct: 94.2,
    total_cost_usd: 144.0,
  },
];

export const SEED_DRIFT_EVENTS: DriftEvent[] = [
  {
    id: "dr111111-1111-4111-8111-111111111111",
    deployment_id: "dep11111-1111-4111-8111-111111111111",
    status: "action_recommended",
    ttft_delta_pct: 70.5,
    tpot_delta_pct: 28.0,
    throughput_delta_pct: -24.6,
    cost_delta_pct: 0.0,
    slo_attainment_pct: 84.5,
    detected_at: "2025-01-30T02:15:00Z",
    suggested_action:
      "Latency drift detected under concurrency surge. Migrate serving runtime from vLLM to TensorRT-LLM or deploy NVIDIA Dynamo disaggregated prefill/decode.",
  },
];

export const SEED_RECOMMENDATIONS: OptimizationRecommendation[] = [
  {
    id: "rec11111-1111-4111-8111-111111111111",
    deployment_id: "dep11111-1111-4111-8111-111111111111",
    organization_id: "org_enterprise_alpha",
    current_config: {
      accelerator: "NVIDIA H100 SXM5 80GB",
      device_count: 2,
      runtime: "vllm",
      precision: "fp8",
      cost_per_hour_usd: 6.0,
      p95_ttft_ms: 38.2,
    },
    recommended_config: {
      accelerator: "NVIDIA L40S",
      device_count: 2,
      runtime: "tensorrt-llm",
      precision: "fp8",
      cost_per_hour_usd: 2.5,
      projected_p95_ttft_ms: 24.0,
    },
    projected_monthly_savings_usd: 2520.0,
    projected_p95_latency_improvement_pct: 37.2,
    confidence_score: 92,
    evidence_summary:
      "Empirical benchmark #00000000-0000-0000-0000-000000000001 proves Qwen 2.5 32B FP8 runs at 86.8 tok/s on L40S with TensorRT-LLM, satisfying your 30ms TTFT SLO at 58% lower hourly cost.",
    status: "ready_for_review",
    created_at: "2025-01-30T04:00:00Z",
  },
];

export const SEED_VERIFIED_SAVINGS: VerifiedSavings[] = [
  {
    id: "sav11111-1111-4111-8111-111111111111",
    recommendation_id: "rec11111-1111-4111-8111-111111111111",
    organization_id: "org_enterprise_alpha",
    baseline_monthly_cost_usd: 4320.0,
    observed_monthly_cost_usd: 1800.0,
    verified_monthly_savings_usd: 2520.0,
    verified_at: "2025-02-01T12:00:00Z",
    observation_days: 30,
  },
];

// --- PHASE 5 SEED COLLECTIONS (Control Plane) ---

export const SEED_CONTROL_DEPLOYMENTS: InferenceDeploymentState[] = [
  {
    deployment_id: "dep-ctrl-1111-4111-8111-111111111111",
    organization_id: "org_enterprise_alpha",
    name: "qwen-32b-production-service",
    model: "Qwen/Qwen2.5-32B-Instruct",
    revision: "main",
    runtime: "vllm",
    runtime_version: "0.6.2",
    accelerator: "NVIDIA-L40S",
    accelerator_count: 2,
    replicas: 2,
    tensor_parallelism: 2,
    pipeline_parallelism: 1,
    health: "healthy",
    deployment_version: 1,
    traffic_split: { active_pct: 90, candidate_pct: 10, shadow_enabled: false },
    last_inspected_at: "2025-02-02T10:00:00Z",
  },
];

export const SEED_AUTOMATION_POLICIES: AutomationPolicy[] = [
  {
    policy_id: "pol-1111-4111-8111-111111111111",
    organization_id: "org_enterprise_alpha",
    name: "enterprise-guarded-policy",
    mode: "guarded_automation",
    requirements: {
      minimum_confidence: 85,
      minimum_reproductions: 1,
      predictions_allowed: true,
      prediction_max_uncertainty_percent: 20,
    },
    changes: {
      allow: ["change_replica_count", "update_autoscaling"],
      approval_required: [
        "change_runtime",
        "change_model_revision",
        "change_gpu_count",
        "change_precision",
        "change_dynamo_topology",
      ],
      deny: [],
    },
    blast_radius: {
      max_canary_percent: 50,
      max_gpu_change: 8,
      max_spend_usd_hour: 100,
      max_simultaneous_actions: 3,
    },
    economics: { minimum_projected_savings_percent: 5 },
    slo: { max_p95_regression_percent: 5 },
    maintenance_windows: [],
    freeze_windows: [],
    allowed_regions: ["us-east-1", "us-west-2", "eu-west-1"],
  },
];

export const SEED_OPTIMIZATION_ACTIONS: OptimizationAction[] = [
  {
    action_id: "act-1111-4111-8111-111111111111",
    organization_id: "org_enterprise_alpha",
    project_id: "default",
    deployment_id: "dep-ctrl-1111-4111-8111-111111111111",
    recommendation_id: "rec11111-1111-4111-8111-111111111111",
    action_type: "change_runtime",
    execution_mode: "guarded_automation",
    current_spec: {
      model: "Qwen/Qwen2.5-32B-Instruct",
      revision: "main",
      runtime: "vllm",
      runtime_version: "0.6.2",
      deployment_target: "kubernetes",
      precision: "fp8",
      accelerator: "NVIDIA-L40S",
      accelerator_count: 2,
      replicas: 2,
      tensor_parallelism: 2,
      pipeline_parallelism: 1,
      regions: ["us-east-1"],
      routing: { strategy: "canary", canary_traffic_pct: 10 },
      health_checks: { readiness_path: "/health/ready", liveness_path: "/health/live", initial_delay_seconds: 30, timeout_seconds: 5 },
      slo: { max_p95_ttft_ms: 38.2, max_mean_tpot_ms: 25.0, min_throughput_tok_s: 50.0, max_cost_per_hour_usd: 6.0 },
      version: 1,
    },
    target_spec: {
      model: "Qwen/Qwen2.5-32B-Instruct",
      revision: "main",
      runtime: "tensorrt-llm",
      runtime_version: "0.15.0",
      deployment_target: "kubernetes",
      precision: "fp8",
      accelerator: "NVIDIA-L40S",
      accelerator_count: 2,
      replicas: 2,
      tensor_parallelism: 2,
      pipeline_parallelism: 1,
      regions: ["us-east-1"],
      routing: { strategy: "canary", canary_traffic_pct: 10 },
      health_checks: { readiness_path: "/health/ready", liveness_path: "/health/live", initial_delay_seconds: 30, timeout_seconds: 5 },
      slo: { max_p95_ttft_ms: 24.0, max_mean_tpot_ms: 18.0, min_throughput_tok_s: 85.0, max_cost_per_hour_usd: 2.5 },
      version: 2,
    },
    reason: "Software lift migration from vLLM to TensorRT-LLM on NVIDIA L40S, achieving +37% latency improvement and $2,520/mo projected savings",
    evidence: {
      source_benchmark_ids: ["00000000-0000-0000-0000-000000000001"],
      confidence_score: 92,
      is_predicted: false,
    },
    policy_evaluation: {
      passed: true,
      mode_applied: "guarded_automation",
      checks: [
        { name: "confidence_threshold", passed: true, detail: "Confidence 92% exceeds minimum 85%" },
        { name: "blast_radius", passed: true, detail: "Canary traffic 10% within limit 50%" },
      ],
    },
    estimated_cost_delta_usd_month: -2520.0,
    estimated_p95_latency_delta_pct: -37.2,
    estimated_capacity_delta_pct: 35.0,
    risk: {
      level: "medium",
      score: 35,
      reasons: ["Serving runtime upgraded from vLLM to TensorRT-LLM"],
      dimensions: {
        model_change: false,
        runtime_change: true,
        hardware_change: false,
        topology_change: false,
        blast_radius_pct: 10,
        rollback_difficulty: "moderate",
      },
    },
    blast_radius: {
      max_traffic_pct: 10,
      affected_gpus: 2,
      affected_workload: "qwen-32b-production-service",
    },
    rollback_plan: {
      rollback_id: "rol-1111-4111-8111-111111111111",
      source_deployment_id: "dep-ctrl-1111-4111-8111-111111111111",
      target_stable_spec: {
        model: "Qwen/Qwen2.5-32B-Instruct",
        revision: "main",
        runtime: "vllm",
        runtime_version: "0.6.2",
        deployment_target: "kubernetes",
        precision: "fp8",
        accelerator: "NVIDIA-L40S",
        accelerator_count: 2,
        replicas: 2,
        tensor_parallelism: 2,
        pipeline_parallelism: 1,
        regions: ["us-east-1"],
        routing: { strategy: "canary", canary_traffic_pct: 0 },
        health_checks: { readiness_path: "/health/ready", liveness_path: "/health/live", initial_delay_seconds: 30, timeout_seconds: 5 },
        slo: { max_p95_ttft_ms: 38.2, max_mean_tpot_ms: 25.0, min_throughput_tok_s: 50.0, max_cost_per_hour_usd: 6.0 },
        version: 1,
      },
      required_resources: { accelerator: "NVIDIA-L40S", device_count: 2, replicas: 2 },
      estimated_rollback_duration_s: 45,
      known_risks: [],
      rollback_actions: ["Revert traffic split router to active deployment", "Decommission canary pod"],
      validation_checks: ["Verify health endpoint returns 200 OK"],
    },
    status: "canarying",
    action_hash: "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
    created_at: "2025-02-02T10:15:00Z",
    approved_by: "lead_infra_architect",
    approved_at: "2025-02-02T10:20:00Z",
    started_at: "2025-02-02T10:25:00Z",
    version: 1,
  },
];

export const SEED_CANARY_RUNS: CanaryRun[] = [
  {
    canary_id: "can-1111-4111-8111-111111111111",
    action_id: "act-1111-4111-8111-111111111111",
    deployment_id: "dep-ctrl-1111-4111-8111-111111111111",
    organization_id: "org_enterprise_alpha",
    current_stage_index: 0,
    total_stages: 4,
    active_traffic_percent: 10,
    status: "progressing",
    stage_metrics: [
      {
        stage_index: 0,
        traffic_percent: 10,
        request_count: 2450,
        duration_minutes: 25,
        p95_ttft_ms: 23.8,
        mean_tpot_ms: 17.5,
        error_rate_pct: 0.01,
        gpu_utilization_pct: 72,
        passed: true,
        evaluated_at: "2025-02-02T10:50:00Z",
      },
    ],
    started_at: "2025-02-02T10:25:00Z",
  },
];

export const SEED_PRODUCTION_OUTCOMES: ProductionOutcome[] = [
  {
    outcome_id: "out-1111-4111-8111-111111111111",
    action_id: "act-0000-4111-8111-000000000000",
    deployment_id: "dep-ctrl-1111-4111-8111-111111111111",
    organization_id: "org_enterprise_alpha",
    action_type: "change_runtime",
    before_metrics: {
      p95_ttft_ms: 38.2,
      mean_tpot_ms: 25.0,
      throughput_tok_s: 50.0,
      cost_per_hour_usd: 6.0,
      error_rate_pct: 0.02,
    },
    after_metrics: {
      p95_ttft_ms: 24.1,
      mean_tpot_ms: 17.8,
      throughput_tok_s: 86.2,
      cost_per_hour_usd: 2.5,
      error_rate_pct: 0.01,
    },
    observation_window_hours: 720,
    slo_delta_pct: -36.9,
    cost_delta_usd_month: -2520.0,
    quality_delta_pct: 0,
    capacity_delta_pct: 35.0,
    rollback_occurred: false,
    verified_at: "2025-02-01T12:00:00Z",
  },
];

export const SEED_AUTOMATION_FREEZES: AutomationFreeze[] = [];

export const SEED_CONTROL_AUDIT_LOGS: ControlAuditLog[] = [
  {
    log_id: "log-1111-4111-8111-111111111111",
    organization_id: "org_enterprise_alpha",
    action_id: "act-1111-4111-8111-111111111111",
    actor: { user_id: "lead_infra_architect", role: "admin", service_account: false },
    event_type: "action_approved",
    action_hash: "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
    details: { note: "Approved software lift for Qwen 2.5 32B onto TensorRT-LLM" },
    timestamp: "2025-02-02T10:20:00Z",
  },
];

export class ModelForgeDataLayer {
  private benchmarks: Map<string, OpenComputeBenchRecord> = new Map();
  private models: Map<string, ModelMetadata> = new Map();
  private passports: Map<string, ComputePassport> = new Map();
  private plans: Map<string, DeploymentPlan> = new Map();
  private softwareLift: SoftwareLiftMetric[] = SEED_SOFTWARE_LIFT;
  private failures: FailureRecord[] = SEED_FAILURES;

  // Phase 4 Collections
  private workers: Map<string, Worker> = new Map();
  private jobs: Map<string, BenchmarkJob> = new Map();
  private fleet: Map<string, FleetResource> = new Map();
  private deployments: Map<string, ProductionDeployment> = new Map();
  private telemetry: Map<string, TelemetryWindow[]> = new Map();
  private driftEvents: Map<string, DriftEvent[]> = new Map();
  private recommendations: Map<string, OptimizationRecommendation> = new Map();
  private verifiedSavings: Map<string, VerifiedSavings> = new Map();

  // Phase 5 Collections (Control Plane)
  private controlDeployments: Map<string, InferenceDeploymentState> = new Map();
  private actions: Map<string, OptimizationAction> = new Map();
  private canaryRuns: Map<string, CanaryRun> = new Map();
  private policies: Map<string, AutomationPolicy> = new Map();
  private outcomes: Map<string, ProductionOutcome> = new Map();
  private freezes: Map<string, AutomationFreeze> = new Map();
  private controlAuditLogs: ControlAuditLog[] = [];

  constructor() {
    for (const b of SEED_BENCHMARKS) {
      this.benchmarks.set(b.benchmark_id, b);
    }
    for (const m of SEED_MODELS) {
      this.models.set(m.id, m);
    }
    for (const p of SEED_PASSPORTS) {
      this.passports.set(`${p.model_id}@${p.revision}`, p);
    }
    for (const w of SEED_WORKERS) {
      this.workers.set(w.id, w);
    }
    for (const j of SEED_BENCHMARK_JOBS) {
      this.jobs.set(j.id, j);
    }
    for (const fl of SEED_FLEET_RESOURCES) {
      this.fleet.set(fl.id, fl);
    }
    for (const dep of SEED_PRODUCTION_DEPLOYMENTS) {
      this.deployments.set(dep.id, dep);
    }
    for (const tel of SEED_TELEMETRY_WINDOWS) {
      const list = this.telemetry.get(tel.deployment_id) || [];
      list.push(tel);
      this.telemetry.set(tel.deployment_id, list);
    }
    for (const dr of SEED_DRIFT_EVENTS) {
      const list = this.driftEvents.get(dr.deployment_id) || [];
      list.push(dr);
      this.driftEvents.set(dr.deployment_id, list);
    }
    for (const rec of SEED_RECOMMENDATIONS) {
      this.recommendations.set(rec.id, rec);
    }
    for (const sav of SEED_VERIFIED_SAVINGS) {
      this.verifiedSavings.set(sav.id, sav);
    }
    // Initialize Phase 5 Collections
    for (const cd of SEED_CONTROL_DEPLOYMENTS) {
      this.controlDeployments.set(cd.deployment_id, cd);
    }
    for (const pol of SEED_AUTOMATION_POLICIES) {
      this.policies.set(pol.organization_id, pol);
    }
    for (const act of SEED_OPTIMIZATION_ACTIONS) {
      this.actions.set(act.action_id, act);
    }
    for (const can of SEED_CANARY_RUNS) {
      this.canaryRuns.set(can.canary_id, can);
    }
    for (const out of SEED_PRODUCTION_OUTCOMES) {
      this.outcomes.set(out.outcome_id, out);
    }
    for (const frz of SEED_AUTOMATION_FREEZES) {
      this.freezes.set(frz.freeze_id, frz);
    }
    this.controlAuditLogs = [...SEED_CONTROL_AUDIT_LOGS];
  }

  listModels(family?: string): ModelMetadata[] {
    const list = Array.from(this.models.values());
    if (family)
      return list.filter(
        (m) => m.family.toLowerCase() === family.toLowerCase(),
      );
    return list;
  }

  getModel(id: string): ModelMetadata | undefined {
    return this.models.get(id);
  }

  listHardware(): HardwareDevice[] {
    return HARDWARE_CATALOG;
  }

  listBenchmarks(filters?: {
    model?: string;
    hardware?: string;
    runtime?: string;
    precision?: string;
    verifiedOnly?: boolean;
  }): OpenComputeBenchRecord[] {
    return Array.from(this.benchmarks.values()).filter((b) => {
      if (
        filters?.model &&
        !b.model.repository.toLowerCase().includes(filters.model.toLowerCase())
      )
        return false;
      if (
        filters?.hardware &&
        !b.hardware.device
          .toLowerCase()
          .includes(filters.hardware.toLowerCase())
      )
        return false;
      if (filters?.runtime && b.runtime.name !== filters.runtime) return false;
      if (filters?.precision && b.precision.type !== filters.precision)
        return false;
      if (filters?.verifiedOnly && b.verification.status !== "verified")
        return false;
      return true;
    });
  }

  getBenchmark(id: string): OpenComputeBenchRecord | undefined {
    return this.benchmarks.get(id);
  }

  addBenchmark(record: OpenComputeBenchRecord): void {
    this.benchmarks.set(record.benchmark_id, record);
  }

  // Compute Passport methods
  getComputePassport(
    modelId: string,
    revision = "main",
  ): ComputePassport | undefined {
    return (
      this.passports.get(`${modelId}@${revision}`) ||
      this.passports.get(`${modelId}@main`)
    );
  }

  listComputePassports(): ComputePassport[] {
    return Array.from(this.passports.values());
  }

  saveComputePassport(passport: ComputePassport): void {
    this.passports.set(`${passport.model_id}@${passport.revision}`, passport);
  }

  // Deployment Plan methods
  saveDeploymentPlan(plan: DeploymentPlan): void {
    this.plans.set(plan.plan_id, plan);
  }

  getDeploymentPlan(id: string): DeploymentPlan | undefined {
    return this.plans.get(id);
  }

  listDeploymentPlans(): DeploymentPlan[] {
    return Array.from(this.plans.values());
  }

  // Software Lift methods
  getSoftwareLift(modelId: string, accelerator?: string): SoftwareLiftMetric[] {
    return this.softwareLift.filter((s) => {
      if (!s.model_id.toLowerCase().includes(modelId.toLowerCase()))
        return false;
      if (
        accelerator &&
        !s.accelerator.toLowerCase().includes(accelerator.toLowerCase())
      )
        return false;
      return true;
    });
  }

  listSoftwareLift(): SoftwareLiftMetric[] {
    return this.softwareLift;
  }

  // Freshness calculation
  checkFreshness(record: OpenComputeBenchRecord): FreshnessStatus {
    const ageDays =
      (Date.now() - new Date(record.provenance.completed_at).getTime()) /
      (1000 * 60 * 60 * 24);
    if (ageDays > 180) return "STALE";
    if (ageDays > 60) return "AGING";
    return "CURRENT";
  }

  // Golden Benchmarks
  listGoldenBenchmarks(): OpenComputeBenchRecord[] {
    return Array.from(this.benchmarks.values()).filter(
      (b) => b.golden === true,
    );
  }

  // Failure Corpus methods
  listFailures(filters?: {
    model?: string;
    category?: string;
    runtime?: string;
  }): FailureRecord[] {
    return this.failures.filter((f) => {
      if (
        filters?.model &&
        !f.model_repository.toLowerCase().includes(filters.model.toLowerCase())
      )
        return false;
      if (filters?.category && f.failure_category !== filters.category)
        return false;
      if (
        filters?.runtime &&
        !f.runtime.toLowerCase().includes(filters.runtime.toLowerCase())
      )
        return false;
      return true;
    });
  }

  // Support Matrix
  getSupportMatrix(): SupportMatrix {
    return SUPPORT_MATRIX;
  }

  // --- PHASE 4 METHODS: WORKERS, JOBS, COVERAGE, FLEET, CONTINUOUS OPS ---

  // Workers
  registerWorker(worker: Worker): Worker {
    this.workers.set(worker.id, worker);
    return worker;
  }

  getWorker(id: string): Worker | undefined {
    return this.workers.get(id);
  }

  listWorkers(orgId?: string): Worker[] {
    const all = Array.from(this.workers.values());
    if (orgId)
      return all.filter(
        (w) => w.organization_id === orgId || !w.organization_id,
      );
    return all.filter(
      (w) => !w.organization_id || w.capabilities.privacy_mode === "public",
    );
  }

  heartbeatWorker(id: string): boolean {
    const worker = this.workers.get(id);
    if (!worker) return false;
    worker.last_heartbeat_at = new Date().toISOString();
    worker.status = "ready";
    return true;
  }

  // Benchmark Jobs
  enqueueJob(job: BenchmarkJob): BenchmarkJob {
    this.jobs.set(job.id, job);
    return job;
  }

  getJob(id: string): BenchmarkJob | undefined {
    return this.jobs.get(id);
  }

  claimJob(workerId: string, trustTier: WorkerTrustTier): BenchmarkJob | null {
    const worker = this.workers.get(workerId);
    if (!worker) return null;

    const tierRanking: Record<WorkerTrustTier, number> = {
      untrusted: 0,
      community: 1,
      trusted: 2,
      organization: 3,
      managed: 4,
      attested: 5,
    };
    const workerRank = tierRanking[trustTier] ?? 1;

    for (const job of this.jobs.values()) {
      const requiredRank = tierRanking[job.required_trust_tier] ?? 1;
      if (job.status === "queued" && workerRank >= requiredRank) {
        job.status = "assigned";
        job.assigned_worker_id = workerId;
        job.assigned_at = new Date().toISOString();
        return job;
      }
    }
    return null;
  }

  completeJob(jobId: string, resultBenchmarkId: string): BenchmarkJob | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    job.status = "completed";
    job.result_benchmark_id = resultBenchmarkId;
    job.completed_at = new Date().toISOString();
    return job;
  }

  failJob(jobId: string, error: string): BenchmarkJob | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    job.status = "failed";
    job.error_message = error;
    job.completed_at = new Date().toISOString();
    return job;
  }

  listJobs(filters?: { status?: JobStatus; orgId?: string }): BenchmarkJob[] {
    return Array.from(this.jobs.values()).filter((j) => {
      if (filters?.status && j.status !== filters.status) return false;
      if (
        filters?.orgId &&
        j.organization_id &&
        j.organization_id !== filters.orgId
      )
        return false;
      return true;
    });
  }

  // Benchmark Coverage Matrix
  getCoverageMatrix(modelId?: string): CoverageCell[] {
    const cells: CoverageCell[] = [];
    const models = modelId
      ? this.listModels().filter((m) =>
          m.id.toLowerCase().includes(modelId.toLowerCase()),
        )
      : this.listModels();

    const accelerators = [
      "NVIDIA H100 SXM5 80GB",
      "NVIDIA L40S",
      "NVIDIA GeForce RTX 4090 24GB",
      "AMD Instinct MI300X 192GB",
    ];
    const runtimes = ["vllm", "tensorrt-llm", "sglang", "llama.cpp"];
    const precisions = ["fp8", "fp16", "int4"];

    for (const model of models) {
      for (const accelerator of accelerators) {
        for (const runtime of runtimes) {
          for (const precision of precisions) {
            // Find existing benchmark matching tuple
            const match = Array.from(this.benchmarks.values()).find(
              (b) =>
                b.model.repository.toLowerCase() === model.id.toLowerCase() &&
                b.hardware.device.toLowerCase() === accelerator.toLowerCase() &&
                b.runtime.name.toLowerCase() === runtime.toLowerCase() &&
                b.precision.type.toLowerCase() === precision.toLowerCase(),
            );

            // Check if known failure
            const failure = this.failures.find(
              (f) =>
                f.model_repository.toLowerCase() === model.id.toLowerCase() &&
                f.accelerator.toLowerCase() === accelerator.toLowerCase(),
            );

            let status: CoverageCell["status"] = "untested";
            let gapPriority = 50;

            if (match) {
              const freshness = this.evaluateFreshness(
                match.provenance.completed_at,
              );
              status = freshness === "STALE" ? "stale" : "covered";
              gapPriority = freshness === "STALE" ? 40 : 0;
            } else if (failure) {
              status = "failed";
              gapPriority = 10;
            } else {
              // Higher priority for popular frontier models and H100/L40S
              if (model.id.includes("70B") || model.id.includes("32B"))
                gapPriority += 25;
              if (accelerator.includes("H100") || accelerator.includes("L40S"))
                gapPriority += 20;
            }

            cells.push({
              model_repository: model.id,
              model_revision: "main",
              accelerator,
              runtime,
              precision,
              status,
              benchmark_ids: match ? [match.benchmark_id] : [],
              last_tested_at: match?.provenance.completed_at,
              measured_throughput_tok_s: match?.metrics.tokens_per_second,
              gap_priority: Math.min(100, gapPriority),
            });
          }
        }
      }
    }
    return cells;
  }

  // Fleet Resources
  registerFleetResource(res: FleetResource): FleetResource {
    this.fleet.set(res.id, res);
    return res;
  }

  listFleetResources(orgId?: string): FleetResource[] {
    const list = Array.from(this.fleet.values());
    if (orgId) return list.filter((f) => f.organization_id === orgId);
    return list;
  }

  // Production Deployments & Telemetry
  registerDeployment(dep: ProductionDeployment): ProductionDeployment {
    this.deployments.set(dep.id, dep);
    return dep;
  }

  getDeployment(id: string): ProductionDeployment | undefined {
    return this.deployments.get(id);
  }

  listDeployments(orgId?: string): ProductionDeployment[] {
    const list = Array.from(this.deployments.values());
    if (orgId) return list.filter((d) => d.organization_id === orgId);
    return list;
  }

  recordTelemetryWindow(tel: TelemetryWindow): TelemetryWindow {
    const list = this.telemetry.get(tel.deployment_id) || [];
    list.push(tel);
    this.telemetry.set(tel.deployment_id, list);
    return tel;
  }

  listTelemetryWindows(deploymentId: string): TelemetryWindow[] {
    return this.telemetry.get(deploymentId) || [];
  }

  // Drift Events
  recordDriftEvent(event: DriftEvent): DriftEvent {
    const list = this.driftEvents.get(event.deployment_id) || [];
    list.push(event);
    this.driftEvents.set(event.deployment_id, list);
    return event;
  }

  listDriftEvents(deploymentId: string): DriftEvent[] {
    return this.driftEvents.get(deploymentId) || [];
  }

  // Recommendations & Verified Savings
  createRecommendation(
    rec: OptimizationRecommendation,
  ): OptimizationRecommendation {
    this.recommendations.set(rec.id, rec);
    return rec;
  }

  approveRecommendation(
    id: string,
    approver = "admin",
  ): OptimizationRecommendation | null {
    const rec = this.recommendations.get(id);
    if (!rec) return null;
    rec.status = "approved";
    rec.approved_by = approver;
    rec.approved_at = new Date().toISOString();
    return rec;
  }

  listRecommendations(orgId?: string): OptimizationRecommendation[] {
    const list = Array.from(this.recommendations.values());
    if (orgId) return list.filter((r) => r.organization_id === orgId);
    return list;
  }

  recordVerifiedSavings(sav: VerifiedSavings): VerifiedSavings {
    this.verifiedSavings.set(sav.id, sav);
    return sav;
  }

  listVerifiedSavings(orgId?: string): VerifiedSavings[] {
    const list = Array.from(this.verifiedSavings.values());
    if (orgId) return list.filter((s) => s.organization_id === orgId);
    return list;
  }

  // Benchmark Freshness Evaluator
  evaluateFreshness(collectedAt: string): FreshnessStatus {
    const ageDays =
      (Date.now() - new Date(collectedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays > 180) return "STALE";
    if (ageDays > 60) return "AGING";
    return "CURRENT";
  }

  // --- Phase 5: Autonomous Inference Control Plane Methods ---

  getControlDeployment(id: string): InferenceDeploymentState | null {
    return this.controlDeployments.get(id) || null;
  }

  listControlDeployments(orgId?: string): InferenceDeploymentState[] {
    const list = Array.from(this.controlDeployments.values());
    if (orgId) return list.filter((d) => d.organization_id === orgId);
    return list;
  }

  updateControlDeployment(dep: InferenceDeploymentState): InferenceDeploymentState {
    this.controlDeployments.set(dep.deployment_id, dep);
    return dep;
  }

  createOptimizationAction(action: OptimizationAction): OptimizationAction {
    this.actions.set(action.action_id, action);
    this.recordControlAuditLog({
      log_id: `log-${Date.now()}`,
      organization_id: action.organization_id,
      action_id: action.action_id,
      actor: { user_id: "system", role: "operator", service_account: true },
      event_type: "action_created",
      action_hash: action.action_hash,
      details: { action_type: action.action_type, deployment_id: action.deployment_id },
      timestamp: new Date().toISOString(),
    });
    return action;
  }

  getOptimizationAction(id: string): OptimizationAction | null {
    return this.actions.get(id) || null;
  }

  listOptimizationActions(orgId?: string, deploymentId?: string): OptimizationAction[] {
    let list = Array.from(this.actions.values());
    if (orgId) list = list.filter((a) => a.organization_id === orgId);
    if (deploymentId) list = list.filter((a) => a.deployment_id === deploymentId);
    return list;
  }

  updateOptimizationAction(action: OptimizationAction): OptimizationAction {
    this.actions.set(action.action_id, action);
    return action;
  }

  createCanaryRun(run: CanaryRun): CanaryRun {
    this.canaryRuns.set(run.canary_id, run);
    return run;
  }

  getCanaryRun(id: string): CanaryRun | null {
    return this.canaryRuns.get(id) || null;
  }

  updateCanaryRun(run: CanaryRun): CanaryRun {
    this.canaryRuns.set(run.canary_id, run);
    return run;
  }

  getAutomationPolicy(orgId: string): AutomationPolicy | null {
    return this.policies.get(orgId) || null;
  }

  setAutomationPolicy(policy: AutomationPolicy): AutomationPolicy {
    this.policies.set(policy.organization_id, policy);
    return policy;
  }

  recordProductionOutcome(outcome: ProductionOutcome): ProductionOutcome {
    this.outcomes.set(outcome.outcome_id, outcome);
    return outcome;
  }

  listProductionOutcomes(orgId?: string): ProductionOutcome[] {
    const list = Array.from(this.outcomes.values());
    if (orgId) return list.filter((o) => o.organization_id === orgId);
    return list;
  }

  activateFreeze(freeze: AutomationFreeze): AutomationFreeze {
    this.freezes.set(freeze.freeze_id, freeze);
    this.recordControlAuditLog({
      log_id: `log-${Date.now()}`,
      organization_id: freeze.organization_id,
      actor: { user_id: freeze.frozen_by, role: "admin", service_account: false },
      event_type: "freeze_activated",
      details: { scope: freeze.scope, target_id: freeze.target_id, reason: freeze.reason },
      timestamp: new Date().toISOString(),
    });
    return freeze;
  }

  liftFreeze(freezeId: string): boolean {
    const freeze = this.freezes.get(freezeId);
    if (!freeze) return false;
    freeze.status = "lifted";
    this.recordControlAuditLog({
      log_id: `log-${Date.now()}`,
      organization_id: freeze.organization_id,
      actor: { user_id: "admin", role: "admin", service_account: false },
      event_type: "freeze_lifted",
      details: { freeze_id: freezeId },
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  listFreezes(orgId?: string): AutomationFreeze[] {
    const list = Array.from(this.freezes.values());
    if (orgId) return list.filter((f) => f.organization_id === orgId);
    return list;
  }

  isFreezeActive(orgId: string, deploymentId?: string): boolean {
    const list = this.listFreezes(orgId);
    return list.some(
      (f) =>
        f.status === "active" &&
        (f.scope === "global" || (f.scope === "deployment" && f.target_id === deploymentId))
    );
  }

  recordControlAuditLog(log: ControlAuditLog): ControlAuditLog {
    this.controlAuditLogs.push(log);
    return log;
  }

  listControlAuditLogs(orgId?: string, actionId?: string): ControlAuditLog[] {
    let list = [...this.controlAuditLogs];
    if (orgId) list = list.filter((l) => l.organization_id === orgId);
    if (actionId) list = list.filter((l) => l.action_id === actionId);
    return list;
  }
}

export const dataLayer = new ModelForgeDataLayer();
