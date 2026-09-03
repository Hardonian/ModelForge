import { test, describe } from "node:test";
import * as assert from "node:assert";
import { compileSLOToDeploymentPlan } from "../compiler";

describe("SLO Compiler & Topology Planner", () => {
  test("compiles workload into ranked candidate configurations with SLO satisfaction", () => {
    const plan = compileSLOToDeploymentPlan(
      {
        repository: "Qwen/Qwen2.5-32B-Instruct",
        revision: "main",
        parameters_billions: 32.5,
        architecture: "Qwen2ForCausalLM",
      },
      {
        fingerprint_id: "fp-rag-1",
        model_repo: "Qwen/Qwen2.5-32B-Instruct",
        model_revision: "main",
        task_type: "rag",
        prompt_token_mean: 4096,
        output_token_mean: 512,
        context_length_target: 8192,
        target_concurrency: 16,
        requests_per_day: 100000,
        streaming_required: true,
        arrival_pattern: "bursty",
      },
      {
        p95_ttft_ms: 600,
        min_tokens_per_second: 50,
        availability_target: 99.95,
        max_cost_per_million_tokens_usd: 1.5,
        optimize_for: "balanced",
      },
    );

    assert.strictEqual(plan.schema_version, "2.0.0");
    assert.ok(plan.plan_id.length > 0);
    assert.strictEqual(plan.is_immutable, true);
    assert.ok(plan.alternative_candidates.length > 0);

    // Verify recommended candidate has complete metrics and provenance
    const rec = plan.recommended_candidate;
    assert.ok(rec.expected_throughput_tps > 0);
    assert.ok(rec.expected_p95_ttft_ms > 0);
    assert.ok(rec.confidence_score >= 0 && rec.confidence_score <= 100);
    assert.ok(
      [
        "MEASURED",
        "DOCUMENTED",
        "INTERPOLATED",
        "PREDICTED",
        "ESTIMATED",
      ].includes(rec.provenance),
    );
  });

  test("generates NVIDIA Dynamo disaggregated topology for high concurrency workloads", () => {
    const plan = compileSLOToDeploymentPlan(
      {
        repository: "meta-llama/Llama-3.3-70B-Instruct",
        revision: "70b-v1",
        parameters_billions: 70.6,
        architecture: "LlamaForCausalLM",
      },
      {
        fingerprint_id: "fp-high-conc",
        model_repo: "meta-llama/Llama-3.3-70B-Instruct",
        model_revision: "70b-v1",
        task_type: "conversational",
        prompt_token_mean: 2048,
        output_token_mean: 256,
        context_length_target: 4096,
        target_concurrency: 32,
        requests_per_day: 500000,
        streaming_required: true,
        arrival_pattern: "bursty",
      },
      {
        p95_ttft_ms: 300,
        optimize_for: "throughput",
      },
    );

    // Filter candidates for dynamo
    const dynamoCandidate = [
      plan.recommended_candidate,
      ...plan.alternative_candidates,
    ].find((c) => c.runtime === "dynamo");

    assert.ok(
      dynamoCandidate,
      "Expected at least one Dynamo candidate in results",
    );
    if (dynamoCandidate?.disaggregated_topology?.enabled) {
      assert.ok(dynamoCandidate.disaggregated_topology.prefill_workers >= 1);
      assert.strictEqual(
        dynamoCandidate.disaggregated_topology.kv_routing_policy,
        "kv_cache_affinity",
      );
    }
  });

  test("simulates What-If capacity growth and hardware migration scenarios", async () => {
    const { simulateCapacityScenario } = await import("../capacity_planner.js");
    const base = {
      model_id: "Qwen/Qwen2.5-32B-Instruct",
      parameters_billions: 32.5,
      accelerator: "NVIDIA L40S",
      device_count: 1,
      runtime: "vllm",
      precision: "fp8",
      context_length: 4096,
      concurrency: 4,
      hourly_cost_usd: 1.25,
      baseline_ttft_ms: 25.0,
      baseline_throughput_tok_s: 58.0,
    };

    const res = simulateCapacityScenario(base, {
      name: "Traffic Surge 2x",
      traffic_growth_pct: 100,
      context_growth_pct: 50,
      target_accelerator: "NVIDIA H100 SXM5 80GB",
      target_runtime: "tensorrt-llm",
    });

    assert.strictEqual(res.scenario_name, "Traffic Surge 2x");
    assert.ok(res.required_devices >= 1);
    assert.ok(res.projected_throughput_tok_s > base.baseline_throughput_tok_s);
    assert.ok(res.confidence_score > 0);
  });

  test("evaluates observed vs expected performance drift and verifies savings", async () => {
    const {
      compareObservedVsExpected,
      detectDrift,
      generateOptimizationRecommendation,
      verifySavings,
    } = await import("../continuous_optimizer.js");

    const deployment = {
      id: "dep-1",
      organization_id: "org-1",
      workload_name: "Chatbot",
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
      created_at: new Date().toISOString(),
    };

    const windowBaseline = {
      id: "win-1",
      deployment_id: "dep-1",
      organization_id: "org-1",
      window_start: "2025-01-01T00:00:00Z",
      window_end: "2025-01-01T23:59:59Z",
      request_count: 50000,
      p95_ttft_ms: 21.0,
      mean_tpot_ms: 15.5,
      actual_throughput_tok_s: 59.0,
      mean_concurrency: 4.0,
      error_rate_pct: 0.01,
      gpu_utilization_pct: 75.0,
      total_cost_usd: 144.0,
    };

    const windowDrifted = {
      id: "win-2",
      deployment_id: "dep-1",
      organization_id: "org-1",
      window_start: "2025-01-02T00:00:00Z",
      window_end: "2025-01-02T23:59:59Z",
      request_count: 90000,
      p95_ttft_ms: 38.0, // Significant latency drift
      mean_tpot_ms: 21.0,
      actual_throughput_tok_s: 42.0,
      mean_concurrency: 14.0,
      error_rate_pct: 0.2,
      gpu_utilization_pct: 95.0,
      total_cost_usd: 144.0,
    };

    const cmp = compareObservedVsExpected(deployment, windowDrifted);
    assert.strictEqual(cmp.is_drift_detected, true);
    assert.ok(cmp.ttft_delta_pct > 50);

    const driftStatus = detectDrift([windowBaseline, windowDrifted]);
    assert.ok(["watch", "action_recommended", "critical"].includes(driftStatus));

    const rec = generateOptimizationRecommendation(deployment, windowDrifted);
    assert.ok(rec.projected_monthly_savings_usd >= 0);
    assert.strictEqual(rec.status, "ready_for_review");

    // After migration to optimized configuration
    const windowOptimized = {
      id: "win-3",
      deployment_id: "dep-1",
      organization_id: "org-1",
      window_start: "2025-01-10T00:00:00Z",
      window_end: "2025-01-10T23:59:59Z",
      request_count: 90000,
      p95_ttft_ms: 24.0,
      mean_tpot_ms: 16.0,
      actual_throughput_tok_s: 68.0,
      mean_concurrency: 12.0,
      error_rate_pct: 0.01,
      gpu_utilization_pct: 82.0,
      total_cost_usd: 80.0, // Observed lower cost!
    };

    const verified = verifySavings(windowBaseline, windowOptimized, rec.id, "org-1");
    assert.ok(verified.verified_monthly_savings_usd > 0);
    assert.strictEqual(verified.observation_days, 30);
  });
});

