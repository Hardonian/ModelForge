import { z } from 'zod';
import { HardwareDevice, getHardwareDevice } from '@modelforge/hardware-registry';

export const ModelFitInputSchema = z.object({
  model: z.object({
    id: z.string(),
    parameters_billions: z.number().positive(),
    context_window: z.number().int().positive().default(8192),
    layers: z.number().int().positive().default(32),
    kv_heads: z.number().int().positive().default(8),
    head_dim: z.number().int().positive().default(128),
    architecture: z.string().default('transformer')
  }),
  hardware: z.object({
    device_slug: z.string(),
    device_count: z.number().int().positive().default(1)
  }),
  runtime: z.object({
    name: z.enum(['vllm', 'tensorrt-llm', 'llama.cpp', 'tgi', 'sglang', 'transformers']),
    version: z.string().default('latest')
  }),
  precision: z.enum(['fp32', 'fp16', 'bf16', 'fp8', 'int8', 'int4', 'awq']),
  workload: z.object({
    context_length: z.number().int().positive().default(2048),
    prompt_tokens: z.number().int().positive().default(512),
    generated_tokens: z.number().int().positive().default(256),
    concurrency: z.number().int().positive().default(1),
    target_ttft_ms: z.number().positive().optional(),
    target_tpot_ms: z.number().positive().optional(),
    workload_name: z.string().optional()
  }),
  benchmark_provenance: z.enum(['verified', 'community', 'reproduced', 'synthetic', 'estimated']).default('estimated')
});
export type ModelFitInput = z.infer<typeof ModelFitInputSchema>;

export const ModelFitDimensionsSchema = z.object({
  memory_fit: z.number().min(0).max(100),
  performance_fit: z.number().min(0).max(100),
  runtime_compatibility: z.number().min(0).max(100),
  context_fit: z.number().min(0).max(100),
  efficiency_fit: z.number().min(0).max(100),
  evidence_confidence: z.number().min(0).max(100)
});
export type ModelFitDimensions = z.infer<typeof ModelFitDimensionsSchema>;

export const MemoryBreakdownSchema = z.object({
  weights_vram_bytes: z.number().int().nonnegative(),
  kv_cache_vram_bytes: z.number().int().nonnegative(),
  activation_overhead_bytes: z.number().int().nonnegative(),
  total_required_vram_bytes: z.number().int().nonnegative(),
  available_vram_bytes: z.number().int().nonnegative(),
  vram_utilization_ratio: z.number().nonnegative(),
  is_oom: z.boolean()
});
export type MemoryBreakdown = z.infer<typeof MemoryBreakdownSchema>;

export const ModelFitResultSchema = z.object({
  algorithm_version: z.union([z.literal('1.0.0'), z.literal('2.0.0')]),
  overall_score: z.number().min(0).max(100),
  grade: z.enum(['A+', 'A', 'B', 'C', 'D', 'F']),
  workload_fit: z.object({
    workload_name: z.string(),
    score: z.number().min(0).max(100),
    grade: z.enum(['A+', 'A', 'B', 'C', 'D', 'F'])
  }).optional(),
  dimensions: ModelFitDimensionsSchema,
  memory_breakdown: MemoryBreakdownSchema,
  performance_estimates: z.object({
    estimated_ttft_ms: z.number().nonnegative(),
    estimated_tpot_ms: z.number().nonnegative(),
    estimated_tokens_per_sec: z.number().nonnegative()
  }),
  explanations: z.array(z.string()),
  warnings: z.array(z.string()),
  recommendation: z.string()
});
export type ModelFitResult = z.infer<typeof ModelFitResultSchema>;

export const BYTES_PER_PARAM: Record<string, number> = {
  fp32: 4.0,
  fp16: 2.0,
  bf16: 2.0,
  fp8: 1.0,
  int8: 1.0,
  int4: 0.5,
  awq: 0.55
};

export const KV_CACHE_BYTES_PER_ELEM: Record<string, number> = {
  fp32: 4.0,
  fp16: 2.0,
  bf16: 2.0,
  fp8: 1.0,
  int8: 1.0,
  int4: 0.5,
  awq: 1.0
};

export function calculateMemoryRequirements(input: ModelFitInput, hardware: HardwareDevice): MemoryBreakdown {
  const bytesPerParam = BYTES_PER_PARAM[input.precision] ?? 2.0;
  // Model weights (parameters in billions * 1e9 * bytes per param)
  const weightsBytes = Math.round(input.model.parameters_billions * 1e9 * bytesPerParam);

  // KV cache: 2 (K and V) * layers * kv_heads * head_dim * context_length * bytes_per_elem * concurrency
  const kvBytesPerElem = KV_CACHE_BYTES_PER_ELEM[input.precision] ?? 2.0;
  const kvCacheBytes = Math.round(
    2 *
      input.model.layers *
      input.model.kv_heads *
      input.model.head_dim *
      input.workload.context_length *
      kvBytesPerElem *
      input.workload.concurrency
  );

  // Activation & CUDA context / engine runtime overhead (~18% of weights + static 1.2 GB runtime buffer)
  const activationOverheadBytes = Math.round(weightsBytes * 0.15 + 1.2 * 1e9);

  const totalRequiredBytes = weightsBytes + kvCacheBytes + activationOverheadBytes;
  const availableVramBytes = hardware.manufacturer.vram_bytes * input.hardware.device_count;
  const utilization = totalRequiredBytes / availableVramBytes;

  return {
    weights_vram_bytes: weightsBytes,
    kv_cache_vram_bytes: kvCacheBytes,
    activation_overhead_bytes: activationOverheadBytes,
    total_required_vram_bytes: totalRequiredBytes,
    available_vram_bytes: availableVramBytes,
    vram_utilization_ratio: Math.round(utilization * 1000) / 1000,
    is_oom: totalRequiredBytes > availableVramBytes
  };
}

export function computeModelFit(rawInput: ModelFitInput): ModelFitResult {
  const input = ModelFitInputSchema.parse(rawInput);
  const hardware = getHardwareDevice(input.hardware.device_slug);

  if (!hardware) {
    throw new Error(`Hardware device slug not found in registry: ${input.hardware.device_slug}`);
  }

  const memory = calculateMemoryRequirements(input, hardware);
  const explanations: string[] = [];
  const warnings: string[] = [];

  // 1. Memory Fit Score (0-100)
  let memoryFit = 0;
  if (memory.is_oom) {
    const deficitGb = Math.round((memory.total_required_vram_bytes - memory.available_vram_bytes) / 1e9);
    warnings.push(`Workload exceeds physical VRAM by ${deficitGb} GB. High risk of OOM crash.`);
    memoryFit = Math.max(5, Math.round((memory.available_vram_bytes / memory.total_required_vram_bytes) * 30));
  } else if (memory.vram_utilization_ratio <= 0.75) {
    memoryFit = 100;
    explanations.push(`Excellent memory headroom: ${Math.round((1 - memory.vram_utilization_ratio) * 100)}% free VRAM remaining.`);
  } else if (memory.vram_utilization_ratio <= 0.90) {
    memoryFit = 92;
    explanations.push(`Optimal memory utilization: ${Math.round(memory.vram_utilization_ratio * 100)}% of VRAM allocated.`);
  } else {
    memoryFit = 65;
    warnings.push(`Tight memory margin (${Math.round(memory.vram_utilization_ratio * 100)}% allocated). Concurrent spike could cause KV eviction.`);
  }

  // 2. Performance Fit Score (0-100)
  // Memory bandwidth in GB/s determines decode token generation rate:
  // Theoretical max decode tokens/sec ~= Bandwidth (GB/s) / (Model Weights GB)
  const bandwidthGbps = (hardware.manufacturer.memory_bandwidth_gb_s || 800) * input.hardware.device_count;
  const weightsGb = memory.weights_vram_bytes / 1e9;
  // Effective efficiency factor ~ 65% of memory bus saturation in autoregressive decode
  const rawDecodeTps = weightsGb > 0 ? (bandwidthGbps / weightsGb) * 0.65 : 30;
  const concurrencyScaling = Math.min(input.workload.concurrency, 8);
  const estimatedTps = Math.round(rawDecodeTps * Math.pow(concurrencyScaling, 0.7) * 10) / 10;
  const estimatedTpotMs = Math.round((1000 / (rawDecodeTps || 1)) * 10) / 10;
  const estimatedTtftMs = Math.round((input.workload.prompt_tokens / (rawDecodeTps * 4 || 100)) * 1000);

  let performanceFit = 85;
  if (input.workload.target_tpot_ms) {
    if (estimatedTpotMs <= input.workload.target_tpot_ms) {
      performanceFit = Math.min(100, Math.round(85 + ((input.workload.target_tpot_ms - estimatedTpotMs) / input.workload.target_tpot_ms) * 15));
      explanations.push(`Meets TPOT target: ${estimatedTpotMs}ms <= ${input.workload.target_tpot_ms}ms.`);
    } else {
      performanceFit = Math.max(20, Math.round(85 - ((estimatedTpotMs - input.workload.target_tpot_ms) / input.workload.target_tpot_ms) * 50));
      warnings.push(`Projected TPOT (${estimatedTpotMs}ms) exceeds target (${input.workload.target_tpot_ms}ms).`);
    }
  }

  // 3. Runtime Compatibility Score (0-100)
  let runtimeFit = 95;
  if (!hardware.supported_runtimes.includes(input.runtime.name)) {
    runtimeFit = 40;
    warnings.push(`Runtime '${input.runtime.name}' is not officially verified on ${hardware.name}.`);
  }
  if (!hardware.supported_precisions.includes(input.precision)) {
    runtimeFit = Math.min(runtimeFit, 45);
    warnings.push(`Precision '${input.precision}' lacks native acceleration on ${hardware.name}.`);
  } else {
    explanations.push(`Native hardware acceleration confirmed for ${input.precision} on ${hardware.name}.`);
  }

  // 4. Context Fit Score (0-100)
  let contextFit = 100;
  if (input.workload.context_length > input.model.context_window) {
    contextFit = 20;
    warnings.push(`Requested context (${input.workload.context_length}) exceeds model native context window (${input.model.context_window}).`);
  } else {
    const contextRatio = input.workload.context_length / input.model.context_window;
    contextFit = Math.round(100 - contextRatio * 15);
  }

  // 5. Efficiency Fit (0-100)
  const tdp = hardware.manufacturer.tdp_watts * input.hardware.device_count;
  const tokensPerWatt = tdp > 0 ? (estimatedTps / tdp) * 100 : 10;
  const efficiencyFit = Math.min(100, Math.max(30, Math.round(tokensPerWatt * 40)));

  // 6. Evidence Confidence (0-100)
  let confidenceFit = 50;
  switch (input.benchmark_provenance) {
    case 'verified':
      confidenceFit = 98;
      explanations.push('Scored using reproducible multi-run verified benchmark observations.');
      break;
    case 'community':
      confidenceFit = 82;
      explanations.push('Scored using validated community benchmark telemetry.');
      break;
    case 'reproduced':
      confidenceFit = 92;
      break;
    case 'synthetic':
      confidenceFit = 60;
      warnings.push('Scored using local synthetic test fixture; not a live production GPU run.');
      break;
    case 'estimated':
    default:
      confidenceFit = 52;
      explanations.push('Scored using analytical performance model based on memory bandwidth and compute architecture.');
      break;
  }

  // Calculate Weighted Overall ModelFit Score
  // If OOM, overall score cannot exceed 30
  const weightedScore = Math.round(
    memoryFit * 0.35 +
      performanceFit * 0.25 +
      runtimeFit * 0.15 +
      contextFit * 0.10 +
      efficiencyFit * 0.08 +
      confidenceFit * 0.07
  );
  const overallScore = memory.is_oom ? Math.min(30, weightedScore) : weightedScore;

  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
  if (overallScore >= 93) grade = 'A+';
  else if (overallScore >= 85) grade = 'A';
  else if (overallScore >= 75) grade = 'B';
  else if (overallScore >= 60) grade = 'C';
  else if (overallScore >= 45) grade = 'D';

  let workloadFit: { workload_name: string; score: number; grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' } | undefined = undefined;
  if (input.workload.workload_name) {
    // Workload-Aware ModelFit scoring
    const isRag = input.workload.workload_name.toLowerCase().includes('rag');
    const isCode = input.workload.workload_name.toLowerCase().includes('code');
    let wScore = overallScore;

    if (isRag) {
      // RAG emphasizes context headroom and prefill latency
      wScore = Math.round(memoryFit * 0.40 + contextFit * 0.25 + performanceFit * 0.20 + runtimeFit * 0.15);
    } else if (isCode) {
      // Code generation emphasizes fast decode TPOT and concurrency
      wScore = Math.round(performanceFit * 0.45 + memoryFit * 0.25 + runtimeFit * 0.20 + efficiencyFit * 0.10);
    }
    const finalWScore = memory.is_oom ? Math.min(30, wScore) : Math.min(100, Math.max(0, wScore));
    let wGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
    if (finalWScore >= 93) wGrade = 'A+';
    else if (finalWScore >= 85) wGrade = 'A';
    else if (finalWScore >= 75) wGrade = 'B';
    else if (finalWScore >= 60) wGrade = 'C';
    else if (finalWScore >= 45) wGrade = 'D';

    workloadFit = {
      workload_name: input.workload.workload_name,
      score: finalWScore,
      grade: wGrade
    };
  }

  let recommendation = `Configuration is fully viable for production serving.`;
  if (memory.is_oom) {
    recommendation = `Not viable due to VRAM exhaustion. Consider quantizing to FP8/INT4 or adding accelerator nodes.`;
  } else if (overallScore < 70) {
    recommendation = `Sub-optimal performance or runtime compatibility. Review precision or investigate higher bandwidth accelerators.`;
  }

  return {
    algorithm_version: '2.0.0',
    overall_score: overallScore,
    grade,
    workload_fit: workloadFit,
    dimensions: {
      memory_fit: memoryFit,
      performance_fit: performanceFit,
      runtime_compatibility: runtimeFit,
      context_fit: contextFit,
      efficiency_fit: efficiencyFit,
      evidence_confidence: confidenceFit
    },
    memory_breakdown: memory,
    performance_estimates: {
      estimated_ttft_ms: estimatedTtftMs,
      estimated_tpot_ms: estimatedTpotMs,
      estimated_tokens_per_sec: estimatedTps
    },
    explanations,
    warnings,
    recommendation
  };
}
