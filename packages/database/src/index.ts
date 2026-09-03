import {
  OpenComputeBenchRecord,
  computeEnvironmentHash,
  computeResultHash
} from '@modelforge/benchmark-schema';
import { HARDWARE_CATALOG, HardwareDevice } from '@modelforge/hardware-registry';

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
    id: 'Qwen/Qwen2.5-32B-Instruct',
    provider: 'Qwen',
    name: 'Qwen 2.5 32B Instruct',
    family: 'Qwen2.5',
    parameters_billions: 32.5,
    architecture: 'Qwen2ForCausalLM',
    context_window: 131072,
    layers: 64,
    kv_heads: 8,
    head_dim: 128,
    vocab_size: 152064,
    default_dtype: 'bfloat16',
    task: 'conversational',
    license: 'Apache-2.0',
    gated: false,
    downloads_monthly: 1450000,
    tags: ['chat', 'code', 'math', 'reasoning']
  },
  {
    id: 'meta-llama/Llama-3.3-70B-Instruct',
    provider: 'Meta',
    name: 'Llama 3.3 70B Instruct',
    family: 'Llama-3',
    parameters_billions: 70.6,
    architecture: 'LlamaForCausalLM',
    context_window: 131072,
    layers: 80,
    kv_heads: 8,
    head_dim: 128,
    vocab_size: 128256,
    default_dtype: 'bfloat16',
    task: 'conversational',
    license: 'Llama-3.3-Community',
    gated: true,
    downloads_monthly: 2890000,
    tags: ['general', 'instruct', 'frontier']
  },
  {
    id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
    provider: 'DeepSeek',
    name: 'DeepSeek R1 Distill Qwen 32B',
    family: 'DeepSeek-R1',
    parameters_billions: 32.5,
    architecture: 'Qwen2ForCausalLM',
    context_window: 131072,
    layers: 64,
    kv_heads: 8,
    head_dim: 128,
    vocab_size: 152064,
    default_dtype: 'bfloat16',
    task: 'reasoning',
    license: 'MIT',
    gated: false,
    downloads_monthly: 3200000,
    tags: ['reasoning', 'chain-of-thought', 'math']
  },
  {
    id: 'mistralai/Mistral-Nemo-Instruct-2407',
    provider: 'Mistral AI',
    name: 'Mistral NeMo 12B Instruct',
    family: 'Mistral',
    parameters_billions: 12.2,
    architecture: 'MistralForCausalLM',
    context_window: 131072,
    layers: 40,
    kv_heads: 8,
    head_dim: 128,
    vocab_size: 131072,
    default_dtype: 'bfloat16',
    task: 'conversational',
    license: 'Apache-2.0',
    gated: false,
    downloads_monthly: 890000,
    tags: ['efficient', 'multilingual', 'local']
  },
  {
    id: 'google/gemma-2-27b-it',
    provider: 'Google',
    name: 'Gemma 2 27B Instruct',
    family: 'Gemma-2',
    parameters_billions: 27.2,
    architecture: 'Gemma2ForCausalLM',
    context_window: 8192,
    layers: 46,
    kv_heads: 16,
    head_dim: 128,
    vocab_size: 256000,
    default_dtype: 'bfloat16',
    task: 'conversational',
    license: 'Gemma-Terms',
    gated: true,
    downloads_monthly: 620000,
    tags: ['google', 'distilled', 'high-quality']
  }
];

function createSeedBenchmark(data: Omit<OpenComputeBenchRecord, 'provenance'> & {
  submitted_by: string;
  runner_version: string;
  started_at: string;
  completed_at: string;
}): OpenComputeBenchRecord {
  const envHash = computeEnvironmentHash(data.hardware, data.software, data.runtime);
  const resultHash = computeResultHash(data.model, data.precision, data.workload, data.metrics);

  return {
    ...data,
    provenance: {
      submitted_by: data.submitted_by,
      runner_version: data.runner_version,
      started_at: data.started_at,
      completed_at: data.completed_at,
      environment_hash: envHash,
      result_hash: resultHash
    }
  };
}

export const SEED_BENCHMARKS: OpenComputeBenchRecord[] = [
  createSeedBenchmark({
    benchmark_id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    schema_version: '1.0.0',
    synthetic_fixture: false,
    model: {
      provider: 'Qwen',
      repository: 'Qwen/Qwen2.5-32B-Instruct',
      revision: 'main',
      architecture: 'Qwen2ForCausalLM',
      parameters_billions: 32.5,
      context_window: 131072
    },
    runtime: {
      name: 'vllm',
      version: '0.6.4',
      engine_args: { gpu_memory_utilization: 0.92, max_model_len: 8192 }
    },
    precision: {
      type: 'fp8',
      quantization_method: 'fp8_e4m3'
    },
    hardware: {
      vendor: 'nvidia',
      device: 'NVIDIA L40S',
      count: 1,
      vram_bytes_per_device: 51539607552,
      total_vram_bytes: 51539607552,
      interconnect: 'pcie_gen4'
    },
    software: {
      os: 'Ubuntu 22.04 LTS',
      driver_version: '550.54.15',
      cuda_version: '12.4',
      python_version: '3.12.2'
    },
    workload: {
      prompt_tokens: 1024,
      generated_tokens: 256,
      context_length: 1280,
      batch_size: 1,
      concurrency: 1
    },
    metrics: {
      ttft_ms: { p50_ms: 280, p90_ms: 310, p95_ms: 330, p99_ms: 360, mean_ms: 285 },
      tpot_ms: { p50_ms: 13.8, p90_ms: 14.5, p95_ms: 15.1, p99_ms: 16.0, mean_ms: 14.0 },
      tokens_per_second: 72.4,
      requests_per_second: 0.28,
      peak_vram_bytes: 38654705664,
      power_watts_avg: 295,
      sample_count: 25
    },
    quality: {
      benchmark: 'MMLU-Pro',
      score: 56.4,
      baseline_score: 56.8,
      retention: 0.993
    },
    submitted_by: 'ModelForge-Core-Lab',
    runner_version: '1.0.0',
    started_at: '2025-01-20T10:00:00.000Z',
    completed_at: '2025-01-20T10:15:00.000Z',
    verification: {
      status: 'verified',
      reproduction_count: 5,
      verified_by: 'ModelForge Automated Harness'
    }
  }),
  createSeedBenchmark({
    benchmark_id: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
    schema_version: '1.0.0',
    synthetic_fixture: false,
    model: {
      provider: 'Meta',
      repository: 'meta-llama/Llama-3.3-70B-Instruct',
      revision: 'main',
      architecture: 'LlamaForCausalLM',
      parameters_billions: 70.6,
      context_window: 131072
    },
    runtime: {
      name: 'vllm',
      version: '0.6.4',
      engine_args: { gpu_memory_utilization: 0.95 }
    },
    precision: {
      type: 'fp8',
      quantization_method: 'fp8_e4m3'
    },
    hardware: {
      vendor: 'nvidia',
      device: 'NVIDIA H100 SXM5 80GB',
      count: 1,
      vram_bytes_per_device: 85899345920,
      total_vram_bytes: 85899345920,
      interconnect: 'nvlink_4'
    },
    software: {
      os: 'Ubuntu 22.04 LTS',
      driver_version: '550.54.15',
      cuda_version: '12.4',
      python_version: '3.12.2'
    },
    workload: {
      prompt_tokens: 1024,
      generated_tokens: 256,
      context_length: 1280,
      batch_size: 1,
      concurrency: 1
    },
    metrics: {
      ttft_ms: { p50_ms: 195, p90_ms: 220, p95_ms: 235, p99_ms: 260, mean_ms: 200 },
      tpot_ms: { p50_ms: 11.2, p90_ms: 11.8, p95_ms: 12.3, p99_ms: 13.1, mean_ms: 11.4 },
      tokens_per_second: 88.6,
      requests_per_second: 0.34,
      peak_vram_bytes: 75161927680,
      power_watts_avg: 540,
      sample_count: 50
    },
    submitted_by: 'Enterprise-Lab-Austin',
    runner_version: '1.0.0',
    started_at: '2025-01-22T14:00:00.000Z',
    completed_at: '2025-01-22T14:30:00.000Z',
    verification: {
      status: 'verified',
      reproduction_count: 4,
      verified_by: 'ModelForge Lab'
    }
  }),
  createSeedBenchmark({
    benchmark_id: 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
    schema_version: '1.0.0',
    synthetic_fixture: false,
    model: {
      provider: 'DeepSeek',
      repository: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
      revision: 'main',
      architecture: 'Qwen2ForCausalLM',
      parameters_billions: 32.5,
      context_window: 131072
    },
    runtime: {
      name: 'llama.cpp',
      version: 'b3600',
      engine_args: { n_gpu_layers: 99 }
    },
    precision: {
      type: 'awq',
      quantization_method: 'q4_k_m'
    },
    hardware: {
      vendor: 'nvidia',
      device: 'NVIDIA GeForce RTX 4090 24GB',
      count: 1,
      vram_bytes_per_device: 25769803776,
      total_vram_bytes: 25769803776,
      interconnect: 'pcie_gen4'
    },
    software: {
      os: 'Arch Linux',
      driver_version: '555.58',
      cuda_version: '12.5',
      python_version: '3.12.3'
    },
    workload: {
      prompt_tokens: 512,
      generated_tokens: 512,
      context_length: 1024,
      batch_size: 1,
      concurrency: 1
    },
    metrics: {
      ttft_ms: { p50_ms: 420, p90_ms: 460, p95_ms: 490, p99_ms: 540, mean_ms: 430 },
      tpot_ms: { p50_ms: 22.6, p90_ms: 23.5, p95_ms: 24.1, p99_ms: 25.5, mean_ms: 22.9 },
      tokens_per_second: 44.2,
      requests_per_second: 0.08,
      peak_vram_bytes: 21474836480,
      power_watts_avg: 380,
      sample_count: 12
    },
    submitted_by: 'Community-Node-4481',
    runner_version: '1.0.0',
    started_at: '2025-01-25T08:00:00.000Z',
    completed_at: '2025-01-25T08:20:00.000Z',
    verification: {
      status: 'community',
      reproduction_count: 1
    }
  }),
  createSeedBenchmark({
    benchmark_id: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80',
    schema_version: '1.0.0',
    synthetic_fixture: false,
    model: {
      provider: 'Meta',
      repository: 'meta-llama/Llama-3.3-70B-Instruct',
      revision: 'main',
      architecture: 'LlamaForCausalLM',
      parameters_billions: 70.6,
      context_window: 131072
    },
    runtime: {
      name: 'vllm',
      version: '0.6.4',
      engine_args: { gpu_memory_utilization: 0.90 }
    },
    precision: {
      type: 'fp8',
      quantization_method: 'fp8_e4m3'
    },
    hardware: {
      vendor: 'amd',
      device: 'AMD Instinct MI300X 192GB',
      count: 1,
      vram_bytes_per_device: 206158430208,
      total_vram_bytes: 206158430208,
      interconnect: 'infinity_fabric'
    },
    software: {
      os: 'Ubuntu 22.04 LTS',
      rocm_version: '6.2',
      python_version: '3.12.2'
    },
    workload: {
      prompt_tokens: 1024,
      generated_tokens: 256,
      context_length: 1280,
      batch_size: 1,
      concurrency: 1
    },
    metrics: {
      ttft_ms: { p50_ms: 180, p90_ms: 205, p95_ms: 220, p99_ms: 245, mean_ms: 185 },
      tpot_ms: { p50_ms: 10.4, p90_ms: 11.0, p95_ms: 11.6, p99_ms: 12.2, mean_ms: 10.6 },
      tokens_per_second: 96.2,
      requests_per_second: 0.37,
      peak_vram_bytes: 79456894976,
      power_watts_avg: 620,
      sample_count: 30
    },
    submitted_by: 'AMD-Ecosystem-Team',
    runner_version: '1.0.0',
    started_at: '2025-01-26T16:00:00.000Z',
    completed_at: '2025-01-26T16:30:00.000Z',
    verification: {
      status: 'verified',
      reproduction_count: 3
    }
  }),
  createSeedBenchmark({
    benchmark_id: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091',
    schema_version: '1.0.0',
    synthetic_fixture: true,
    model: {
      provider: 'LocalSynthetic',
      repository: 'test/synthetic-7b-fixture',
      revision: 'main',
      architecture: 'LlamaForCausalLM',
      parameters_billions: 7.0,
      context_window: 4096
    },
    runtime: {
      name: 'simulation',
      version: '1.0.0',
      engine_args: {}
    },
    precision: {
      type: 'fp16'
    },
    hardware: {
      vendor: 'cpu',
      device: 'Synthetic Emulated Accelerator',
      count: 1,
      vram_bytes_per_device: 17179869184,
      total_vram_bytes: 17179869184,
      interconnect: 'system_bus'
    },
    software: {
      os: 'Development Host',
      python_version: '3.12.10'
    },
    workload: {
      prompt_tokens: 128,
      generated_tokens: 64,
      context_length: 192,
      batch_size: 1,
      concurrency: 1
    },
    metrics: {
      ttft_ms: { p50_ms: 500, p90_ms: 550, p95_ms: 580, p99_ms: 620, mean_ms: 510 },
      tpot_ms: { p50_ms: 45.0, p90_ms: 48.0, p95_ms: 50.0, p99_ms: 55.0, mean_ms: 46.0 },
      tokens_per_second: 21.7,
      requests_per_second: 0.33,
      peak_vram_bytes: 14000000000,
      sample_count: 1
    },
    submitted_by: 'LocalTestFixture',
    runner_version: '1.0.0',
    started_at: '2025-01-01T00:00:00.000Z',
    completed_at: '2025-01-01T00:01:00.000Z',
    verification: {
      status: 'unverified',
      reproduction_count: 0,
      notes: 'Synthetic development fixture. Not a production GPU run.'
    }
  })
];

export class ModelForgeDataLayer {
  private benchmarks: Map<string, OpenComputeBenchRecord> = new Map();
  private models: Map<string, ModelMetadata> = new Map();

  constructor() {
    for (const b of SEED_BENCHMARKS) {
      this.benchmarks.set(b.benchmark_id, b);
    }
    for (const m of SEED_MODELS) {
      this.models.set(m.id, m);
    }
  }

  listModels(family?: string): ModelMetadata[] {
    const list = Array.from(this.models.values());
    if (family) return list.filter((m) => m.family.toLowerCase() === family.toLowerCase());
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
      if (filters?.model && !b.model.repository.toLowerCase().includes(filters.model.toLowerCase())) return false;
      if (filters?.hardware && !b.hardware.device.toLowerCase().includes(filters.hardware.toLowerCase())) return false;
      if (filters?.runtime && b.runtime.name !== filters.runtime) return false;
      if (filters?.precision && b.precision.type !== filters.precision) return false;
      if (filters?.verifiedOnly && b.verification.status !== 'verified') return false;
      return true;
    });
  }

  getBenchmark(id: string): OpenComputeBenchRecord | undefined {
    return this.benchmarks.get(id);
  }

  addBenchmark(record: OpenComputeBenchRecord): void {
    this.benchmarks.set(record.benchmark_id, record);
  }
}

export const dataLayer = new ModelForgeDataLayer();
