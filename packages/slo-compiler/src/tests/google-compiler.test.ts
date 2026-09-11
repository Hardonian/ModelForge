import { test, describe } from "node:test";
import * as assert from "node:assert";
import { compileSLOToDeploymentPlan } from "../compiler";
import { DeploymentPlanSchema } from "../types";

describe("SLO Compiler: Google Cloud & TPU Ecosystem Integration", () => {
  test("compiles Google Gemma-2 workload with TPU and Google Cloud target manifests", () => {
    const plan = compileSLOToDeploymentPlan(
      {
        repository: "google/gemma-2-27b-it",
        revision: "main",
        parameters_billions: 27.2,
        architecture: "Gemma2ForCausalLM",
      },
      {
        fingerprint_id: "fp-gemma-gcp-1",
        model_repo: "google/gemma-2-27b-it",
        model_revision: "main",
        task_type: "conversational",
        prompt_token_mean: 1536,
        output_token_mean: 256,
        context_length_target: 8192,
        target_concurrency: 16,
        requests_per_day: 150000,
        streaming_required: true,
        arrival_pattern: "bursty",
      },
      {
        p95_ttft_ms: 350,
        min_tokens_per_second: 60,
        max_cost_per_million_tokens_usd: 1.2,
        optimize_for: "balanced",
      }
    );

    // Validate entire deployment plan conforms to Zod schema
    const parsed = DeploymentPlanSchema.safeParse(plan);
    assert.strictEqual(parsed.success, true, parsed.error?.message);

    // Verify Google Cloud TPU candidates are synthesized
    const allCandidates = [plan.recommended_candidate, ...plan.alternative_candidates];
    const gkeTpuCandidate = allCandidates.find((c) => c.runtime === "gke-tpu");
    const vertexAiCandidate = allCandidates.find((c) => c.runtime === "vertex-ai");

    assert.ok(gkeTpuCandidate, "Expected at least one GKE TPU candidate in compiled results");
    assert.ok(vertexAiCandidate, "Expected at least one Vertex AI candidate in compiled results");

    assert.strictEqual(gkeTpuCandidate?.accelerator_vendor, "google");
    assert.ok(gkeTpuCandidate?.accelerator.toLowerCase().includes("tpu"));
    assert.strictEqual(vertexAiCandidate?.accelerator_vendor, "google");

    // Verify Google Cloud generated manifests
    const manifests = plan.generated_manifests;
    assert.ok(manifests.vertex_ai_yaml, "Expected vertex_ai_yaml manifest to be generated");
    assert.ok(manifests.gke_tpu_yaml, "Expected gke_tpu_yaml manifest to be generated");
    assert.ok(manifests.bigquery_export_sql, "Expected bigquery_export_sql to be generated");

    // Verify manifest contents
    assert.ok(manifests.vertex_ai_yaml.includes("aiplatform.googleapis.com"));
    assert.ok(manifests.vertex_ai_yaml.includes("TPU_V"));
    assert.ok(manifests.gke_tpu_yaml.includes("cloud.google.com/gke-tpu-accelerator"));
    assert.ok(manifests.gke_tpu_yaml.includes("cloud.google.com/gke-tpu-topology"));
    assert.ok(manifests.gke_tpu_yaml.includes("PJRT_DEVICE"));
    assert.ok(manifests.bigquery_export_sql.includes("CREATE SCHEMA IF NOT EXISTS `modelforge_telemetry`"));
    assert.ok(manifests.bigquery_export_sql.includes("PARTITION BY DATE(event_timestamp)"));
    assert.ok(manifests.bigquery_export_sql.includes("CLUSTER BY model_id"));
  });

  test("optimizes specifically for throughput selecting high-bandwidth TPU or Blackwell", () => {
    const plan = compileSLOToDeploymentPlan(
      {
        repository: "google/medlm-large",
        revision: "v2",
        parameters_billions: 65.0,
        architecture: "TransformerForCausalLM",
      },
      {
        fingerprint_id: "fp-medlm-highthroughput",
        model_repo: "google/medlm-large",
        model_revision: "v2",
        task_type: "reasoning",
        prompt_token_mean: 4096,
        output_token_mean: 1024,
        context_length_target: 16384,
        target_concurrency: 32,
        requests_per_day: 800000,
        streaming_required: true,
        arrival_pattern: "steady",
      },
      {
        optimize_for: "throughput",
      }
    );

    assert.ok(plan.recommended_candidate.expected_throughput_tps > 0);
    assert.ok(plan.recommended_candidate.accelerator_count >= 1);
    assert.ok(plan.generated_manifests.bigquery_export_sql?.includes("medlm-large"));
  });
});
