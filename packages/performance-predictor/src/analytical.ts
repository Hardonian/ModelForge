import { HardwareDevice } from "@modelforge/hardware-registry";
import { WorkloadSpec } from "@modelforge/benchmark-schema";

export interface ModelArchSpecs {
  parameters_billions: number;
  layers?: number;
  kv_heads?: number;
  head_dim?: number;
  context_window?: number;
}

export interface AnalyticalPrediction {
  predicted_ttft_ms: number;
  predicted_tpot_ms: number;
  predicted_throughput_tok_s: number;
  predicted_peak_vram_gb: number;
  memory_bandwidth_bound_tpot_ms: number;
  prefill_compute_bound_ttft_ms: number;
}

export function predictAnalytical(
  model: ModelArchSpecs,
  hardware: HardwareDevice,
  precision: string,
  workload: WorkloadSpec,
  runtime: string,
  deviceCount = 1,
): AnalyticalPrediction {
  const bpp = precision === "fp16" || precision === "bf16" ? 2.0 : precision === "fp8" ? 1.0 : 0.55;
  const layers = model.layers ?? Math.round(model.parameters_billions * 2.2);
  const kvHeads = model.kv_heads ?? 8;
  const headDim = model.head_dim ?? 128;

  // Weight Memory
  const weightBytes = model.parameters_billions * 1e9 * bpp;
  const weightGb = weightBytes / 1e9;

  // KV Cache Memory per token per sequence
  const kvElemBytes = bpp <= 1.0 ? 1 : 2;
  const bytesPerToken = 2 * layers * kvHeads * headDim * kvElemBytes;
  const kvCacheBytes = bytesPerToken * workload.context_length * workload.concurrency;
  const kvCacheGb = kvCacheBytes / 1e9;

  // Runtime overhead (CUDA graphs, activations, kernels)
  const runtimeOverheadGb = 1.2 * deviceCount;
  const predictedPeakVramGb = Number((weightGb + kvCacheGb + runtimeOverheadGb).toFixed(2));

  // Memory Bandwidth in GB/s scaled by tensor parallel device count
  const hwBandwidth = hardware?.manufacturer?.memory_bandwidth_gb_s || 1000;
  const effectiveBandwidthGBps = hwBandwidth * deviceCount * 0.85; // 85% bus efficiency
  const weightGbPerDevice = weightGb / deviceCount;

  // Runtime efficiency multiplier
  let runtimeEfficiency = 0.65; // baseline
  if (runtime === "tensorrt-llm" || runtime === "nvidia-dynamo") {
    runtimeEfficiency = 0.88;
  } else if (runtime === "vllm" || runtime === "sglang") {
    runtimeEfficiency = 0.78;
  } else if (runtime === "llama.cpp") {
    runtimeEfficiency = 0.72;
  }

  // Time Per Output Token (TPOT) - memory bound for single stream: weightGb / Bandwidth
  const baseTpotMs = (weightGbPerDevice / (effectiveBandwidthGBps / deviceCount)) * 1000;
  const adjustedTpotMs = Math.max(8.0, baseTpotMs / runtimeEfficiency);

  // Time To First Token (TTFT) - compute bound
  const hwTflops = hardware?.manufacturer?.fp16_tflops || (hwBandwidth > 2000 ? 1000 : 300);
  const approxTflops = hwTflops * deviceCount;
  const prefillFlops = 2 * model.parameters_billions * 1e9 * workload.prompt_tokens;
  const prefillComputeMs = (prefillFlops / (approxTflops * 1e12)) * 1000 / (runtimeEfficiency * 0.5);
  const predictedTtftMs = Number(Math.max(15.0, prefillComputeMs + 10).toFixed(1));

  // Aggregated system throughput
  const concurrencyScaling = Math.min(workload.concurrency, 32);
  const batchEfficiency = 1.0 / (1.0 + 0.05 * Math.log2(Math.max(1, concurrencyScaling)));
  const singleStreamTps = 1000 / adjustedTpotMs;
  const aggregatedTps = singleStreamTps * concurrencyScaling * batchEfficiency;

  return {
    predicted_ttft_ms: predictedTtftMs,
    predicted_tpot_ms: Number(adjustedTpotMs.toFixed(1)),
    predicted_throughput_tok_s: Number(aggregatedTps.toFixed(1)),
    predicted_peak_vram_gb: predictedPeakVramGb,
    memory_bandwidth_bound_tpot_ms: Number(baseTpotMs.toFixed(1)),
    prefill_compute_bound_ttft_ms: Number(prefillComputeMs.toFixed(1)),
  };
}
