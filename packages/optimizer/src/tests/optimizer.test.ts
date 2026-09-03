import { describe, it } from "node:test";
import * as assert from "node:assert";
import { solveWorkloadOptimization } from "../index.js";

describe("Workload Optimizer Engine", () => {
  it("solves optimization for Qwen 32B with lowest_cost objective", () => {
    const result = solveWorkloadOptimization({
      model: {
        id: "Qwen/Qwen2.5-32B-Instruct",
        parameters_billions: 32.5,
        context_window: 32768,
        layers: 64,
        kv_heads: 8,
        head_dim: 128,
        architecture: "Qwen2ForCausalLM",
      },
      workload: {
        context_length: 4096,
        prompt_tokens: 1024,
        generated_tokens: 256,
        concurrency: 4,
        expected_requests_per_day: 20000,
      },
      constraints: {
        max_cost_per_hour_usd: 10.0,
        allowed_vendors: ["nvidia"],
        max_devices: 2,
      },
      objective: "lowest_cost",
    });

    assert.ok(result.valid_configurations_count > 0);
    assert.ok(result.top_recommendations.length > 0);

    const winner = result.top_recommendations[0]!;
    assert.ok(winner.cost_per_million_tokens_usd > 0);
    assert.ok(winner.manifests.docker_run_command.includes("docker run"));
    assert.ok(winner.manifests.kubernetes_pod_yaml.includes("kind: Pod"));
    assert.strictEqual(winner.model_fit.memory_breakdown.is_oom, false);
  });

  it("filters out configurations violating max VRAM constraint", () => {
    const result = solveWorkloadOptimization({
      model: {
        id: "meta-llama/Llama-3.3-70B-Instruct",
        parameters_billions: 70.6,
        context_window: 32768,
        layers: 80,
        kv_heads: 8,
        head_dim: 128,
        architecture: "LlamaForCausalLM",
      },
      workload: {
        context_length: 2048,
        prompt_tokens: 512,
        generated_tokens: 128,
        concurrency: 1,
        expected_requests_per_day: 5000,
      },
      constraints: {
        max_vram_gb: 30, // 30 GB maximum total VRAM
        max_devices: 1,
      },
      objective: "best_balanced",
    });

    for (const rec of result.top_recommendations) {
      assert.ok(rec.total_vram_gb <= 30);
    }
  });
});
