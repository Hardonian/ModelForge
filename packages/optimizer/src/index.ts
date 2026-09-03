import { z } from 'zod';
import { HARDWARE_CATALOG } from '@modelforge/hardware-registry';
import { computeModelFit, ModelFitResult } from '@modelforge/model-fit';

export const ObjectiveTypeSchema = z.enum([
  'lowest_cost',
  'lowest_latency',
  'highest_throughput',
  'lowest_vram',
  'best_balanced'
]);
export type ObjectiveType = z.infer<typeof ObjectiveTypeSchema>;

export const OptimizerQuerySchema = z.object({
  model: z.object({
    id: z.string(),
    parameters_billions: z.number().positive(),
    context_window: z.number().int().positive().default(32768),
    layers: z.number().int().positive().default(32),
    kv_heads: z.number().int().positive().default(8),
    head_dim: z.number().int().positive().default(128),
    architecture: z.string().default('transformer')
  }),
  workload: z.object({
    context_length: z.number().int().positive().default(4096),
    prompt_tokens: z.number().int().positive().default(1024),
    generated_tokens: z.number().int().positive().default(256),
    concurrency: z.number().int().positive().default(4),
    expected_requests_per_day: z.number().int().positive().default(50000),
    target_ttft_ms: z.number().positive().optional(),
    target_tpot_ms: z.number().positive().optional()
  }),
  constraints: z.object({
    max_cost_per_hour_usd: z.number().positive().optional(),
    max_cost_per_million_tokens_usd: z.number().positive().optional(),
    max_vram_gb: z.number().positive().optional(),
    allowed_vendors: z.array(z.enum(['nvidia', 'amd', 'apple', 'cpu'])).optional(),
    allowed_precisions: z.array(z.enum(['fp16', 'bf16', 'fp8', 'int8', 'int4', 'awq'])).optional(),
    max_devices: z.number().int().positive().default(4)
  }).default({ max_devices: 4 }),
  objective: ObjectiveTypeSchema.default('best_balanced')
});
export type OptimizerQuery = z.infer<typeof OptimizerQuerySchema>;

export const CandidateConfigSchema = z.object({
  id: z.string(),
  model_id: z.string(),
  precision: z.enum(['fp16', 'bf16', 'fp8', 'int8', 'int4', 'awq']),
  runtime: z.enum(['vllm', 'tensorrt-llm', 'llama.cpp', 'sglang', 'tgi', 'transformers']),
  hardware_device: z.string(),
  hardware_name: z.string(),
  hardware_vendor: z.string(),
  device_count: z.number().int().positive(),
  total_vram_gb: z.number().positive(),
  estimated_throughput_tps: z.number().positive(),
  estimated_ttft_ms: z.number().positive(),
  estimated_tpot_ms: z.number().positive(),
  cost_per_hour_usd: z.number().nonnegative(),
  cost_per_million_tokens_usd: z.number().nonnegative(),
  model_fit: z.custom<ModelFitResult>(),
  provenance: z.enum(['MEASURED', 'INTERPOLATED', 'PREDICTED', 'ESTIMATED']),
  manifests: z.object({
    docker_run_command: z.string(),
    docker_compose_yaml: z.string(),
    kubernetes_pod_yaml: z.string()
  })
});
export type CandidateConfig = z.infer<typeof CandidateConfigSchema>;

export const OptimizerResultSchema = z.object({
  query_id: z.string(),
  objective: ObjectiveTypeSchema,
  total_evaluated_configurations: z.number().int().nonnegative(),
  valid_configurations_count: z.number().int().nonnegative(),
  top_recommendations: z.array(CandidateConfigSchema),
  unviable_configurations_count: z.number().int().nonnegative()
});
export type OptimizerResult = z.infer<typeof OptimizerResultSchema>;

function generateManifests(
  modelId: string,
  precision: string,
  runtime: string,
  deviceCount: number,
  gpuName: string
): {
  docker_run_command: string;
  docker_compose_yaml: string;
  kubernetes_pod_yaml: string;
} {
  const safeModelName = modelId.split('/').pop() || 'model';
  const dockerRun = `docker run --gpus '"device=0${deviceCount > 1 ? `-${deviceCount - 1}` : ''}"' \\
  -v ~/.cache/huggingface:/root/.cache/huggingface \\
  -p 8000:8000 \\
  --ipc=host \\
  vllm/vllm-openai:latest \\
  --model ${modelId} \\
  --tensor-parallel-size ${deviceCount} \\
  --dtype ${precision.includes('8') ? 'auto --kv-cache-dtype fp8' : 'auto'} \\
  --max-model-len 8192`;

  const dockerCompose = `version: '3.8'
services:
  ${safeModelName.toLowerCase()}-serving:
    image: vllm/vllm-openai:latest
    container_name: modelforge-${safeModelName.toLowerCase()}
    ports:
      - "8000:8000"
    environment:
      - HUGGING_FACE_HUB_TOKEN=\${HUGGING_FACE_HUB_TOKEN}
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: ${deviceCount}
              capabilities: [gpu]
    volumes:
      - ~/.cache/huggingface:/root/.cache/huggingface
    ipc: host
    command: >
      --model ${modelId}
      --tensor-parallel-size ${deviceCount}
      --max-model-len 8192`;

  const k8sPod = `apiVersion: v1
kind: Pod
metadata:
  name: modelforge-${safeModelName.toLowerCase().replace(/[^a-z0-9]/g, '-')}
  labels:
    app.kubernetes.io/name: modelforge-inference
    modelforge.ai/model: ${safeModelName}
    modelforge.ai/hardware: ${gpuName.replace(/[^a-zA-Z0-9]/g, '-')}
spec:
  containers:
  - name: inference-engine
    image: vllm/vllm-openai:latest
    args:
      - "--model"
      - "${modelId}"
      - "--tensor-parallel-size"
      - "${deviceCount}"
      - "--max-model-len"
      - "8192"
    resources:
      limits:
        nvidia.com/gpu: ${deviceCount}
    ports:
      - containerPort: 8000
    volumeMounts:
      - mountPath: /dev/shm
        name: dshm
  volumes:
    - name: dshm
      emptyDir:
        medium: Memory`;

  return {
    docker_run_command: dockerRun,
    docker_compose_yaml: dockerCompose,
    kubernetes_pod_yaml: k8sPod
  };
}

export function solveWorkloadOptimization(rawQuery: OptimizerQuery): OptimizerResult {
  const query = OptimizerQuerySchema.parse(rawQuery);
  const precisions: ('fp16' | 'bf16' | 'fp8' | 'int8' | 'int4' | 'awq')[] =
    query.constraints.allowed_precisions ?? ['fp16', 'bf16', 'fp8', 'int8', 'int4'];
  const runtimes: ('vllm' | 'tensorrt-llm' | 'llama.cpp' | 'sglang')[] = ['vllm', 'llama.cpp'];

  let totalEvaluated = 0;
  let unviableCount = 0;
  const candidates: CandidateConfig[] = [];

  for (const device of HARDWARE_CATALOG) {
    if (query.constraints.allowed_vendors && !query.constraints.allowed_vendors.includes(device.vendor as any)) {
      continue;
    }

    const deviceCounts = [1, 2, 4].filter((c) => c <= query.constraints.max_devices);

    for (const count of deviceCounts) {
      const totalVramGb = (device.manufacturer.vram_bytes * count) / 1e9;
      if (query.constraints.max_vram_gb && totalVramGb > query.constraints.max_vram_gb) {
        continue;
      }

      for (const precision of precisions) {
        if (!device.supported_precisions.includes(precision)) continue;

        for (const runtime of runtimes) {
          if (!device.supported_runtimes.includes(runtime)) continue;

          totalEvaluated++;

          try {
            const fit = computeModelFit({
              model: {
                id: query.model.id,
                parameters_billions: query.model.parameters_billions,
                context_window: query.model.context_window,
                layers: query.model.layers,
                kv_heads: query.model.kv_heads,
                head_dim: query.model.head_dim
              },
              hardware: {
                device_slug: device.slug,
                device_count: count
              },
              runtime: {
                name: runtime,
                version: 'latest'
              },
              precision,
              workload: {
                context_length: query.workload.context_length,
                prompt_tokens: query.workload.prompt_tokens,
                generated_tokens: query.workload.generated_tokens,
                concurrency: query.workload.concurrency,
                target_ttft_ms: query.workload.target_ttft_ms,
                target_tpot_ms: query.workload.target_tpot_ms
              },
              benchmark_provenance: device.observed.sample_count > 0 ? 'community' : 'estimated'
            });

            if (fit.memory_breakdown.is_oom) {
              unviableCount++;
              continue;
            }

            const baseCostPerHour = (device.typical_cloud_cost_per_hour_usd || 1.0) * count;
            if (query.constraints.max_cost_per_hour_usd && baseCostPerHour > query.constraints.max_cost_per_hour_usd) {
              unviableCount++;
              continue;
            }

            const tps = fit.performance_estimates.estimated_tokens_per_sec;
            // Cost per 1M tokens = (Cost/hour / (tps * 3600)) * 1,000,000
            const tokensPerHour = tps * 3600;
            const costPer1mTokens = tokensPerHour > 0 ? (baseCostPerHour / tokensPerHour) * 1e6 : 999;

            if (
              query.constraints.max_cost_per_million_tokens_usd &&
              costPer1mTokens > query.constraints.max_cost_per_million_tokens_usd
            ) {
              unviableCount++;
              continue;
            }

            const manifests = generateManifests(query.model.id, precision, runtime, count, device.name);

            candidates.push({
              id: `${device.slug}-${count}x-${precision}-${runtime}`,
              model_id: query.model.id,
              precision,
              runtime,
              hardware_device: device.slug,
              hardware_name: `${device.name} × ${count}`,
              hardware_vendor: device.vendor,
              device_count: count,
              total_vram_gb: Math.round(totalVramGb * 10) / 10,
              estimated_throughput_tps: tps,
              estimated_ttft_ms: fit.performance_estimates.estimated_ttft_ms,
              estimated_tpot_ms: fit.performance_estimates.estimated_tpot_ms,
              cost_per_hour_usd: Math.round(baseCostPerHour * 100) / 100,
              cost_per_million_tokens_usd: Math.round(costPer1mTokens * 100) / 100,
              model_fit: fit,
              provenance: device.observed.sample_count > 100 ? 'INTERPOLATED' : 'ESTIMATED',
              manifests
            });
          } catch {
            unviableCount++;
          }
        }
      }
    }
  }

  // Sort by target objective
  candidates.sort((a, b) => {
    switch (query.objective) {
      case 'lowest_cost':
        return a.cost_per_million_tokens_usd - b.cost_per_million_tokens_usd;
      case 'lowest_latency':
        return a.estimated_tpot_ms - b.estimated_tpot_ms;
      case 'highest_throughput':
        return b.estimated_throughput_tps - a.estimated_throughput_tps;
      case 'lowest_vram':
        return a.total_vram_gb - b.total_vram_gb;
      case 'best_balanced':
      default:
        // Balanced score combines ModelFit overall score with cost efficiency penalty
        const scoreA = a.model_fit.overall_score - (a.cost_per_million_tokens_usd / 2);
        const scoreB = b.model_fit.overall_score - (b.cost_per_million_tokens_usd / 2);
        return scoreB - scoreA;
    }
  });

  return {
    query_id: `opt-${Date.now()}`,
    objective: query.objective,
    total_evaluated_configurations: totalEvaluated,
    valid_configurations_count: candidates.length,
    top_recommendations: candidates.slice(0, 5),
    unviable_configurations_count: unviableCount
  };
}
