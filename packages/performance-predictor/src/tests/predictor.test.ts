import test from "node:test";
import assert from "node:assert/strict";
import {
  predictAnalytical,
  evaluatePredictionError,
  computeOfflineMetrics,
  PerformancePredictor,
} from "../index";
import { HARDWARE_CATALOG } from "@modelforge/hardware-registry";
import { OpenComputeBenchRecord } from "@modelforge/benchmark-schema";

const MOCK_CORPUS: OpenComputeBenchRecord[] = [
  {
    benchmark_id: "a1111111-1111-4111-8111-111111111111",
    schema_version: "1.0.0",
    golden: true,
    synthetic_fixture: false,
    model: {
      provider: "Qwen",
      repository: "Qwen/Qwen2.5-32B-Instruct",
      revision: "8a1b2c3d4e5f",
      architecture: "Qwen2ForCausalLM",
      parameters_billions: 32.5,
    },
    hardware: {
      vendor: "nvidia",
      device: "NVIDIA L40S",
      count: 1,
      vram_bytes_per_device: 48000000000,
      total_vram_bytes: 48000000000,
      interconnect: "pcie",
    },
    runtime: {
      name: "vllm",
      version: "0.6.4",
      engine_args: {},
    },
    precision: {
      type: "fp8",
    },
    software: {
      os: "Ubuntu 22.04",
      python_version: "3.11",
    },
    workload: {
      prompt_tokens: 1024,
      generated_tokens: 256,
      context_length: 4096,
      batch_size: 4,
      concurrency: 4,
    },
    metrics: {
      ttft_ms: { p50_ms: 18.0, p90_ms: 21.0, p95_ms: 22.4, p99_ms: 25.0, mean_ms: 19.5 },
      tpot_ms: { p50_ms: 15.0, p90_ms: 16.5, p95_ms: 17.1, p99_ms: 18.0, mean_ms: 15.8 },
      tokens_per_second: 58.4,
      requests_per_second: 2.2,
      peak_vram_bytes: 38500000000,
      sample_count: 50,
    },
    provenance: {
      submitted_by: "modelforge-ci",
      runner_version: "1.0.0",
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      environment_hash: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      result_hash: "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
    },
    verification: {
      status: "verified",
      reproduction_count: 3,
    },
  },
];

test("Performance Predictor - Level 0 Analytical", () => {
  const l40s = HARDWARE_CATALOG.find((h) => h.id === "l40s")!;
  const pred = predictAnalytical(
    { parameters_billions: 32.5 },
    l40s,
    "fp8",
    { prompt_tokens: 1024, generated_tokens: 256, context_length: 4096, batch_size: 4, concurrency: 4 },
    "vllm",
    1
  );

  assert.ok(pred.predicted_throughput_tok_s > 20, "Throughput should be positive and realistic");
  assert.ok(pred.predicted_peak_vram_gb > 30, "Peak VRAM should account for weights + KV cache");
  assert.ok(pred.predicted_ttft_ms > 0, "TTFT should be positive");
  assert.ok(pred.predicted_tpot_ms > 0, "TPOT should be positive");
});

test("Performance Predictor - Level 1 Nearest-Neighbor & Uncertainty", () => {
  const predictor = new PerformancePredictor();

  // 1. Interpolation test with matching model in corpus
  const res1 = predictor.predict(
    {
      model_repository: "Qwen/Qwen2.5-32B-Instruct",
      parameters_billions: 32.5,
      accelerator: "NVIDIA L40S",
      runtime: "vllm",
      precision: "fp8",
      workload: { prompt_tokens: 1024, generated_tokens: 256, context_length: 4096, batch_size: 4, concurrency: 4 },
    },
    MOCK_CORPUS
  );

  assert.equal(res1.is_predicted, true);
  assert.equal(res1.uncertainty_type, "interpolation");
  assert.equal(res1.confidence, "high");
  assert.equal(res1.nearest_evidence_benchmark_ids.length, 1);
  assert.ok(res1.prediction_interval.p10_throughput < res1.predicted_throughput_tok_s);
  assert.ok(res1.prediction_interval.p90_throughput > res1.predicted_throughput_tok_s);

  // 2. Extrapolation test (different hardware)
  const res2 = predictor.predict(
    {
      model_repository: "Qwen/Qwen2.5-32B-Instruct",
      parameters_billions: 32.5,
      accelerator: "NVIDIA H100 SXM5 80GB",
      runtime: "vllm",
      precision: "fp8",
      workload: { prompt_tokens: 1024, generated_tokens: 256, context_length: 4096, batch_size: 4, concurrency: 4 },
    },
    MOCK_CORPUS
  );

  assert.equal(res2.uncertainty_type, "extrapolation");
  assert.equal(res2.confidence, "medium");

  // 3. Out-of-distribution test (vastly different model size)
  const res3 = predictor.predict(
    {
      model_repository: "some-org/huge-405b",
      parameters_billions: 405.0,
      accelerator: "Apple M3 Ultra 192GB",
      runtime: "llama.cpp",
      precision: "fp16",
      workload: { prompt_tokens: 1024, generated_tokens: 256, context_length: 4096, batch_size: 1, concurrency: 1 },
    },
    MOCK_CORPUS
  );

  assert.equal(res3.uncertainty_type, "out_of_distribution");
  assert.equal(res3.confidence, "low");
});

test("Performance Predictor - Offline Evaluation & Error Metrics", () => {
  const predictor = new PerformancePredictor();
  const targetRecord = MOCK_CORPUS[0]!;

  const prediction = predictor.predict(
    {
      model_repository: targetRecord.model.repository,
      parameters_billions: targetRecord.model.parameters_billions,
      accelerator: targetRecord.hardware.device,
      runtime: targetRecord.runtime.name,
      precision: targetRecord.precision.type,
      workload: targetRecord.workload,
    },
    MOCK_CORPUS
  );

  const feedback = evaluatePredictionError(prediction, targetRecord);
  assert.ok(feedback.absolute_error >= 0);
  assert.ok(feedback.percentage_error >= 0);
  assert.equal(feedback.actual_throughput, 58.4);

  // Compute offline metrics over test pairs
  const pairs = [
    { predicted: 60.0, actual: 58.4 },
    { predicted: 100.0, actual: 95.0 },
    { predicted: 30.0, actual: 32.0 },
  ];
  const metrics = computeOfflineMetrics(pairs);

  assert.ok(metrics.mae > 0);
  assert.ok(metrics.mape_percent > 0);
  assert.ok(metrics.rmse > 0);
  assert.equal(metrics.sample_count, 3);
});
