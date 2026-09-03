import {
  OpenComputeBenchRecord,
  WorkloadSpec,
  UncertaintyType,
  PredictionConfidence,
  PredictionResult,
} from "@modelforge/benchmark-schema";
import { HARDWARE_CATALOG } from "@modelforge/hardware-registry";
import { predictAnalytical, ModelArchSpecs } from "./analytical";
import * as crypto from "crypto";

export interface PredictionTarget {
  model_repository: string;
  model_revision?: string;
  parameters_billions: number;
  layers?: number;
  kv_heads?: number;
  head_dim?: number;
  accelerator: string;
  device_count?: number;
  runtime: string;
  precision: string;
  workload: WorkloadSpec;
}

interface NeighborMatch {
  record: OpenComputeBenchRecord;
  distance: number;
  weight: number;
  rationale: string;
}

export function predictWithNeighbors(
  target: PredictionTarget,
  corpus: OpenComputeBenchRecord[],
  predictorVersion = "predictor_v1.0.0",
): PredictionResult {
  const deviceCount = target.device_count || 1;
  const hwDevice =
    HARDWARE_CATALOG.find(
      (h) =>
        h.name.toLowerCase() === target.accelerator.toLowerCase() ||
        h.id.toLowerCase() === target.accelerator.toLowerCase() ||
        h.slug.toLowerCase() === target.accelerator.toLowerCase()
    ) || HARDWARE_CATALOG[0]!;

  const modelArch: ModelArchSpecs = {
    parameters_billions: target.parameters_billions,
    layers: target.layers,
    kv_heads: target.kv_heads,
    head_dim: target.head_dim,
  };

  // 1. Calculate Level 0 Analytical Baseline
  const analytical = predictAnalytical(
    modelArch,
    hwDevice,
    target.precision,
    target.workload,
    target.runtime,
    deviceCount
  );

  // 2. Filter corpus to non-synthetic verified records
  const eligibleRecords = corpus.filter((r) => !r.synthetic_fixture);

  // 3. Score distance to every benchmark in corpus
  const neighbors: NeighborMatch[] = [];

  for (const record of eligibleRecords) {
    let distance = 0;
    const reasons: string[] = [];

    // Parameter size distance (log ratio)
    const paramRatio = Math.abs(
      Math.log(target.parameters_billions / record.model.parameters_billions)
    );
    distance += paramRatio * 1.5;
    if (paramRatio < 0.1) reasons.push("identical model size");

    // Hardware match
    const isExactHw =
      record.hardware.device.toLowerCase() === target.accelerator.toLowerCase();
    if (!isExactHw) {
      distance += 0.8;
      reasons.push("different hardware");
    } else {
      reasons.push("exact hardware match");
    }

    // Runtime match
    if (record.runtime.name.toLowerCase() !== target.runtime.toLowerCase()) {
      distance += 0.5;
      reasons.push("different runtime");
    } else {
      reasons.push("exact runtime match");
    }

    // Precision match
    if (
      record.precision.type.toLowerCase() !== target.precision.toLowerCase()
    ) {
      distance += 0.3;
    }

    const weight = 1.0 / (1.0 + distance);
    neighbors.push({
      record,
      distance,
      weight,
      rationale: reasons.join(", "),
    });
  }

  // Sort by closest distance
  neighbors.sort((a, b) => a.distance - b.distance);
  const topNeighbors = neighbors.slice(0, 3);
  const nearestIds = topNeighbors.map((n) => n.record.benchmark_id);

  // 4. Uncertainty Classification
  let uncertaintyType: UncertaintyType = "out_of_distribution";
  let confidence: PredictionConfidence = "low";
  let intervalPct = 0.35; // default 35% error bound for OOD

  if (topNeighbors.length > 0 && topNeighbors[0]) {
    const minDistance = topNeighbors[0].distance;
    if (minDistance < 0.35) {
      uncertaintyType = "interpolation";
      confidence = "high";
      intervalPct = 0.10; // 10% interval
    } else if (minDistance < 1.2) {
      uncertaintyType = "extrapolation";
      confidence = "medium";
      intervalPct = 0.20; // 20% interval
    } else {
      uncertaintyType = "out_of_distribution";
      confidence = "low";
      intervalPct = 0.35;
    }
  }

  // 5. Compute blended prediction
  let finalThroughput = analytical.predicted_throughput_tok_s;
  let finalTtft = analytical.predicted_ttft_ms;
  let finalTpot = analytical.predicted_tpot_ms;
  const finalVram = analytical.predicted_peak_vram_gb;

  if (topNeighbors.length > 0 && topNeighbors[0] && topNeighbors[0].distance < 1.0) {
    const bestMatch = topNeighbors[0];
    const empiricalTps = bestMatch.record.metrics.tokens_per_second;
    const empiricalTtft = bestMatch.record.metrics.ttft_ms.p95_ms || bestMatch.record.metrics.ttft_ms.mean_ms;

    // Blend: 70% empirical neighbor scaling, 30% analytical
    const paramScale = bestMatch.record.model.parameters_billions / target.parameters_billions;
    const scaledEmpiricalTps = empiricalTps * Math.pow(paramScale, 0.9);
    finalThroughput = Number((0.7 * scaledEmpiricalTps + 0.3 * analytical.predicted_throughput_tok_s).toFixed(1));
    finalTtft = Number((0.7 * empiricalTtft + 0.3 * analytical.predicted_ttft_ms).toFixed(1));
    finalTpot = Number((1000 / (finalThroughput / Math.max(1, target.workload.concurrency))).toFixed(1));
  }

  const p10Throughput = Number((finalThroughput * (1 - intervalPct)).toFixed(1));
  const p90Throughput = Number((finalThroughput * (1 + intervalPct)).toFixed(1));
  const p10Ttft = Number((finalTtft * (1 - intervalPct)).toFixed(1));
  const p90Ttft = Number((finalTtft * (1 + intervalPct)).toFixed(1));

  return {
    prediction_id: crypto.randomUUID(),
    is_predicted: true,
    model_repository: target.model_repository,
    model_revision: target.model_revision || "main",
    accelerator: target.accelerator,
    device_count: deviceCount,
    runtime: target.runtime,
    precision: target.precision,
    workload: target.workload,
    predicted_ttft_ms: finalTtft,
    predicted_tpot_ms: finalTpot,
    predicted_throughput_tok_s: finalThroughput,
    predicted_peak_vram_gb: finalVram,
    prediction_interval: {
      p10_throughput: p10Throughput,
      p90_throughput: p90Throughput,
      p10_ttft: p10Ttft,
      p90_ttft: p90Ttft,
    },
    uncertainty_type: uncertaintyType,
    confidence,
    nearest_evidence_benchmark_ids: nearestIds,
    predictor_version: predictorVersion,
    created_at: new Date().toISOString(),
  };
}
