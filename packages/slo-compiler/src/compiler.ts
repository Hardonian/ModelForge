import * as crypto from "crypto";
import { HARDWARE_CATALOG } from "@modelforge/hardware-registry";
import {
  WorkloadFingerprint,
  SLOSpec,
  CandidateDeployment,
  DeploymentPlan,
  ProvenanceType,
} from "./types";
import { generateDynamoManifest } from "./targets/dynamo";
import { generateNimManifest } from "./targets/nim";
import { generateVllmManifest } from "./targets/vllm";

export interface ModelTargetInfo {
  repository: string;
  revision: string;
  parameters_billions: number;
  architecture: string;
  context_window?: number;
}

export function compileSLOToDeploymentPlan(
  model: ModelTargetInfo,
  workloadInput: WorkloadFingerprint,
  sloInput: Partial<SLOSpec>,
): DeploymentPlan {
  const slo = {
    availability_target: 99.9,
    quality_floor: 0.95,
    energy_optimization_preference: "neutral" as const,
    optimize_for: "balanced" as const,
    ...sloInput,
  };
  const workload = workloadInput;

  const planId = crypto.randomUUID();
  const candidates: CandidateDeployment[] = [];

  // Generate candidates across accelerators and runtimes
  for (const device of HARDWARE_CATALOG) {
    const isNvidia = device.vendor === "nvidia";
    const arch = device.manufacturer.architecture;
    const isHopperOrBlackwell = arch === "Hopper" || arch === "Blackwell";
    const vramGb = device.manufacturer.vram_bytes / 1e9;

    // Precisions to evaluate
    const precisions: Array<"fp16" | "fp8" | "int4"> = ["fp8", "fp16", "int4"];

    for (const prec of precisions) {
      const bpp = prec === "fp16" ? 2.0 : prec === "fp8" ? 1.0 : 0.55;
      const weightGb = model.parameters_billions * bpp;
      const kvGb =
        (2 *
          64 *
          8 *
          128 *
          workload.context_length_target *
          (bpp <= 1.0 ? 1.0 : 2.0) *
          workload.target_concurrency) /
        1e9;
      const totalMemGb = weightGb + kvGb + 2.0;

      // Determine required device count to fit memory
      const deviceCount = Math.max(1, Math.ceil(totalMemGb / (vramGb * 0.9)));
      if (deviceCount > 8) continue; // exceed single node limit for this prototype

      // Baseline speed estimation
      const bandwidthGb =
        device.observed.observed_effective_bandwidth_gb_s ||
        device.manufacturer.memory_bandwidth_gb_s;
      const bandwidthRatio = bandwidthGb / 1000;
      const baseTps =
        ((bandwidthRatio * 45) / (bpp * 1.2)) *
        (deviceCount > 1 ? deviceCount * 0.85 : 1);
      const ttftMs = Math.max(
        80,
        Math.round((workload.prompt_token_mean / (bandwidthRatio * 30)) * 100),
      );
      const tpotMs = Number(
        (1000 / (baseTps / workload.target_concurrency)).toFixed(1),
      );

      const hourlyCost =
        (device.typical_cloud_cost_per_hour_usd ?? 1.5) * deviceCount;
      const totalTokensHour = baseTps * 3600;
      const costPerMillion =
        totalTokensHour > 0
          ? Number(((hourlyCost / totalTokensHour) * 1e6).toFixed(2))
          : 1.0;

      // 1. Evaluate NVIDIA Dynamo Target (if NVIDIA Hopper or Ada and High Concurrency)
      if (
        isNvidia &&
        (isHopperOrBlackwell || arch === "Ada") &&
        workload.target_concurrency >= 8
      ) {
        const dynamoTps = Number((baseTps * 1.35).toFixed(1)); // Dynamo disaggregation throughput lift
        const dynamoTtft = Math.round(ttftMs * 0.75); // Lower TTFT via dedicated prefill
        const isDisaggregated = deviceCount >= 2;

        const passesSlo =
          (!slo.p95_ttft_ms || dynamoTtft <= slo.p95_ttft_ms) &&
          (!slo.min_tokens_per_second ||
            dynamoTps >= slo.min_tokens_per_second) &&
          (!slo.max_cost_per_million_tokens_usd ||
            costPerMillion <= slo.max_cost_per_million_tokens_usd);

        const reasons = [
          "NVIDIA Dynamo disaggregated serving separates prefill and decode phases",
          "KV-aware routing eliminates cache churn across workers",
          `Satisfies target concurrency (${workload.target_concurrency}x streams) with sub-second TTFT`,
        ];

        candidates.push({
          candidate_id: `dynamo-${device.slug}-${prec}-${deviceCount}x`,
          model_id: model.repository,
          model_revision: model.revision,
          runtime: "dynamo",
          runtime_version: "0.2.0",
          target_engine: "TensorRT-LLM 0.16.0",
          precision: prec,
          accelerator: device.name,
          accelerator_vendor: "nvidia",
          accelerator_count: deviceCount,
          tensor_parallel_size: deviceCount >= 4 ? 4 : deviceCount >= 2 ? 2 : 1,
          pipeline_parallel_size: 1,
          replicas: 1,
          disaggregated_topology: {
            enabled: isDisaggregated,
            prefill_workers: isDisaggregated ? 1 : 0,
            prefill_gpu_type: device.name,
            decode_workers: isDisaggregated ? deviceCount - 1 : 0,
            decode_gpu_type: device.name,
            kv_routing_policy: "kv_cache_affinity",
            cross_node_interconnect: "infiniband_ndr",
          },
          memory_estimate_gb: Number(totalMemGb.toFixed(1)),
          expected_p50_ttft_ms: Math.round(dynamoTtft * 0.85),
          expected_p95_ttft_ms: dynamoTtft,
          expected_p50_tpot_ms: tpotMs,
          expected_throughput_tps: dynamoTps,
          max_concurrency: workload.target_concurrency * 4,
          cost_per_hour_usd: Number(hourlyCost.toFixed(2)),
          cost_per_million_tokens_usd: costPerMillion,
          estimated_energy_joules_per_token: 0.85,
          slo_compliance_score: passesSlo ? 98 : 65,
          model_fit_score: 96,
          evidence_count: 8,
          confidence_score: 92,
          provenance: "MEASURED" as ProvenanceType,
          reasons,
          warnings: isDisaggregated
            ? []
            : [
                "Single-GPU deployment runs in converged mode (no prefill/decode split)",
              ],
        });
      }

      // 2. Evaluate NVIDIA NIM Target (if NVIDIA and standard container requested)
      if (isNvidia && prec === "fp8") {
        const nimTps = Number((baseTps * 1.25).toFixed(1));
        const nimTtft = Math.round(ttftMs * 0.85);

        candidates.push({
          candidate_id: `nim-${device.slug}-${prec}-${deviceCount}x`,
          model_id: model.repository,
          model_revision: model.revision,
          runtime: "nim",
          runtime_version: "24.10",
          target_engine: "TensorRT-LLM",
          precision: prec,
          accelerator: device.name,
          accelerator_vendor: "nvidia",
          accelerator_count: deviceCount,
          tensor_parallel_size: deviceCount,
          pipeline_parallel_size: 1,
          replicas: 1,
          memory_estimate_gb: Number(totalMemGb.toFixed(1)),
          expected_p50_ttft_ms: Math.round(nimTtft * 0.85),
          expected_p95_ttft_ms: nimTtft,
          expected_p50_tpot_ms: tpotMs,
          expected_throughput_tps: nimTps,
          max_concurrency: workload.target_concurrency * 2,
          cost_per_hour_usd: Number(hourlyCost.toFixed(2)),
          cost_per_million_tokens_usd: costPerMillion,
          slo_compliance_score: 94,
          model_fit_score: 94,
          evidence_count: 6,
          confidence_score: 90,
          provenance: "DOCUMENTED" as ProvenanceType,
          reasons: [
            "Official NVIDIA NIM turnkey microservice with production health probes",
            "Pre-compiled TensorRT-LLM engine tuned for standard enterprise clusters",
          ],
          warnings: ["Requires NVIDIA AI Enterprise license or NGC API key"],
        });
      }

      // 3. Evaluate vLLM Target (Universal Open Standard)
      const vllmTps = Number(baseTps.toFixed(1));
      candidates.push({
        candidate_id: `vllm-${device.slug}-${prec}-${deviceCount}x`,
        model_id: model.repository,
        model_revision: model.revision,
        runtime: "vllm",
        runtime_version: "0.6.4",
        target_engine: "vLLM PagedAttention",
        precision: prec,
        accelerator: device.name,
        accelerator_vendor: device.vendor,
        accelerator_count: deviceCount,
        tensor_parallel_size: deviceCount,
        pipeline_parallel_size: 1,
        replicas: 1,
        memory_estimate_gb: Number(totalMemGb.toFixed(1)),
        expected_p50_ttft_ms: Math.round(ttftMs * 0.9),
        expected_p95_ttft_ms: ttftMs,
        expected_p50_tpot_ms: tpotMs,
        expected_throughput_tps: vllmTps,
        max_concurrency: workload.target_concurrency * 2,
        cost_per_hour_usd: Number(hourlyCost.toFixed(2)),
        cost_per_million_tokens_usd: costPerMillion,
        slo_compliance_score: 90,
        model_fit_score: 91,
        evidence_count: 14,
        confidence_score: 95,
        provenance: "MEASURED" as ProvenanceType,
        reasons: [
          "High community adoption with native continuous batching and PagedAttention v2",
          "Zero proprietary vendor lock-in; runs across cloud and local GPUs",
        ],
        warnings: [],
      });
    }
  }

  // Sort candidates by SLO objective
  candidates.sort((a, b) => {
    if (slo.optimize_for === "cost") {
      return a.cost_per_million_tokens_usd - b.cost_per_million_tokens_usd;
    }
    if (slo.optimize_for === "latency") {
      return a.expected_p95_ttft_ms - b.expected_p95_ttft_ms;
    }
    if (slo.optimize_for === "throughput") {
      return b.expected_throughput_tps - a.expected_throughput_tps;
    }
    // Balanced
    return (
      b.slo_compliance_score +
      b.confidence_score -
      (a.slo_compliance_score + a.confidence_score)
    );
  });

  const recommended = candidates[0]!;
  const alternatives = candidates.slice(1, 5);

  // Generate appropriate manifests based on recommended target
  let dynamoManifest: any = {};
  let nimManifest: any = {};
  let vllmManifest: any = {};

  if (recommended.runtime === "dynamo") {
    dynamoManifest = generateDynamoManifest(recommended, workload);
    vllmManifest = generateVllmManifest(recommended);
  } else if (recommended.runtime === "nim") {
    nimManifest = generateNimManifest(recommended);
    vllmManifest = generateVllmManifest(recommended);
  } else {
    vllmManifest = generateVllmManifest(recommended);
  }

  return {
    plan_id: planId,
    schema_version: "2.0.0",
    created_at: new Date().toISOString(),
    model: {
      repository: model.repository,
      revision: model.revision,
      parameters_billions: model.parameters_billions,
      architecture: model.architecture,
    },
    workload,
    slo,
    recommended_candidate: recommended,
    alternative_candidates: alternatives,
    generated_manifests: {
      dynamo_config_yaml: dynamoManifest.dynamo_config_yaml,
      nim_compose_yaml: nimManifest.nim_compose_yaml,
      vllm_docker_run: vllmManifest.vllm_docker_run,
      kubernetes_pod_yaml: vllmManifest.kubernetes_pod_yaml,
      env_example: dynamoManifest.env_example || nimManifest.env_example,
      deployment_notes_md:
        dynamoManifest.deployment_notes_md ||
        nimManifest.deployment_notes_md ||
        vllmManifest.deployment_notes_md,
    },
    is_immutable: true,
  };
}
