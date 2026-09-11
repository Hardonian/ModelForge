import { test, describe } from "node:test";
import * as assert from "node:assert";
import { GoogleVertexExecutionProvider } from "../adapters/google-vertex-provider";
import { GkeTpuExecutionProvider } from "../adapters/gke-tpu-provider";
import { ExecutionEngine } from "../execution-engine";
import { Reconciler } from "../reconciler";
import {
  InferenceDeploymentState,
  InferenceDeploymentSpec,
  OptimizationAction,
} from "@modelforge/benchmark-schema";
import { StageTelemetry } from "../canary";

function getMockGcpAction(): OptimizationAction {
  const currentState: InferenceDeploymentState = {
    deployment_id: "dep-gemma-27b",
    organization_id: "org-google-suite",
    name: "gemma-prod",
    model: "google/gemma-2-27b-it",
    revision: "main",
    runtime: "vllm",
    runtime_version: "0.6.4",
    accelerator: "tpu-v5p-95gb",
    accelerator_count: 4,
    replicas: 1,
    tensor_parallelism: 4,
    pipeline_parallelism: 1,
    health: "healthy",
    deployment_version: 1,
    traffic_split: { active_pct: 100, candidate_pct: 0, shadow_enabled: false },
    last_inspected_at: new Date().toISOString(),
  };

  const desiredSpec: InferenceDeploymentSpec = {
    model: "google/gemma-2-27b-it",
    revision: "main",
    runtime: "vllm",
    runtime_version: "0.6.4",
    deployment_target: "kubernetes",
    precision: "bf16",
    accelerator: "tpu-v5p-95gb",
    accelerator_count: 8,
    replicas: 1,
    tensor_parallelism: 8,
    pipeline_parallelism: 1,
    regions: ["us-central1"],
    routing: { strategy: "canary", canary_traffic_pct: 10 },
    health_checks: {
      readiness_path: "/health/ready",
      liveness_path: "/health/live",
      initial_delay_seconds: 30,
      timeout_seconds: 5,
    },
    slo: {
      max_p95_ttft_ms: 180,
      max_mean_tpot_ms: 15,
      min_throughput_tok_s: 140,
      max_cost_per_hour_usd: 33.6,
    },
    version: 2,
  };

  const action = Reconciler.planReconciliation({
    deploymentId: currentState.deployment_id,
    organizationId: currentState.organization_id,
    currentState,
    desiredSpec,
    executionMode: "guarded_automation",
  });

  action.status = "approved";
  action.approved_at = new Date().toISOString();
  action.approved_by = "scott@google.com";

  return action;
}

describe("Google Cloud Execution Providers", () => {
  describe("GoogleVertexExecutionProvider", () => {
    test("generates detailed dryRun with gcloud CLI and Vertex REST payload", async () => {
      const provider = new GoogleVertexExecutionProvider({
        projectId: "test-gcp-project",
        region: "us-central1",
        endpointId: "gemma-endpoint-v1",
        acceleratorType: "TPU_V5P",
        acceleratorCount: 4,
      });

      const action = getMockGcpAction();
      const dryRun = await provider.dryRun(action);

      assert.strictEqual(dryRun.valid, true);
      assert.ok(dryRun.diff.includes("Google Cloud Vertex AI Canary Deployment Plan"));
      assert.ok(dryRun.diff.includes("gcloud ai endpoints deploy-model"));
      assert.ok(dryRun.diff.includes("TPU_V5P"));
      assert.ok(dryRun.warnings.length > 0);
      assert.ok(dryRun.estimated_duration_s > 0);
    });

    test("provisions candidate, updates traffic split, and handles rollback cleanly", async () => {
      const provider = new GoogleVertexExecutionProvider();
      const action = getMockGcpAction();

      const prov = await provider.provisionCandidate(action.action_id, action.target_spec);
      assert.strictEqual(prov.success, true);
      assert.ok(prov.candidateId.startsWith("vertex-cand-"));

      const warmup = await provider.warmupCandidate(prov.candidateId);
      assert.strictEqual(warmup.ready, true);
      assert.ok(warmup.warmupDurationMs > 0);

      // Canary traffic split 5%
      const split = await provider.setTrafficSplit(action.deployment_id, prov.candidateId, 5);
      assert.strictEqual(split.success, true);
      assert.strictEqual(split.activePct, 95);
      assert.strictEqual(split.candidatePct, 5);

      // Rollback
      const rb = await provider.rollback(action.deployment_id, prov.candidateId, action.rollback_plan);
      assert.strictEqual(rb.success, true);
      assert.strictEqual(rb.restoredLastKnownGood, true);

      const status = provider.getEndpointStatus();
      assert.strictEqual(status.trafficSplit[status.activeModelId], 100);
      assert.strictEqual(status.trafficSplit[prov.candidateId], 0);
    });

    test("promotes candidate to full production and drains old model", async () => {
      const provider = new GoogleVertexExecutionProvider();
      const action = getMockGcpAction();

      const prov = await provider.provisionCandidate(action.action_id, action.target_spec);
      await provider.warmupCandidate(prov.candidateId);
      await provider.setTrafficSplit(action.deployment_id, prov.candidateId, 50);

      const promote = await provider.promoteCandidate(action.deployment_id, prov.candidateId);
      assert.strictEqual(promote.success, true);

      const status = provider.getEndpointStatus();
      assert.strictEqual(status.activeModelId, prov.candidateId);
      assert.strictEqual(status.trafficSplit[prov.candidateId], 100);

      const decommission = await provider.drainAndDecommission(action.deployment_id, "model-vertex-initial-v1");
      assert.strictEqual(decommission.success, true);
    });
  });

  describe("GkeTpuExecutionProvider", () => {
    test("generates multislice TPU Kubernetes manifest and Gateway HTTPRoute in dryRun", async () => {
      const provider = new GkeTpuExecutionProvider({
        clusterName: "gke-tpu-v5p-cluster",
        project: "modelforge-gcp",
        region: "us-central1-b",
        namespace: "serving-prod",
        tpuType: "tpu-v5p-slice",
        topology: "2x2x2",
        chipCount: 8,
        runtime: "vllm-tpu",
      });

      const action = getMockGcpAction();
      const dryRun = await provider.dryRun(action);

      assert.strictEqual(dryRun.valid, true);
      assert.ok(dryRun.diff.includes("GKE Cloud TPU Multislice Topology Transition"));
      assert.ok(dryRun.diff.includes("cloud.google.com/gke-tpu-accelerator: \"tpu-v5p-slice\""));
      assert.ok(dryRun.diff.includes("cloud.google.com/gke-tpu-topology: \"2x2x2\""));
      assert.ok(dryRun.diff.includes("PJRT_DEVICE"));
      assert.ok(dryRun.diff.includes("HTTPRoute"));
    });

    test("executes end-to-end canary lifecycle with GKE TPU provider in ExecutionEngine", async () => {
      const provider = new GkeTpuExecutionProvider();
      const engine = new ExecutionEngine(provider);
      const action = getMockGcpAction();

      // Start execution
      const startRes = await engine.startExecution(action);
      assert.strictEqual(startRes.action.status, "canarying");
      assert.ok(startRes.canaryRun);
      assert.strictEqual(startRes.canaryRun?.status, "progressing");

      const telemetry: StageTelemetry = {
        p95_ttft_ms: 90,
        mean_tpot_ms: 14,
        error_rate_pct: 0.001,
        request_count: 5000,
        duration_minutes: 15,
        gpu_utilization_pct: 82,
      };

      // Progress canary to promotion
      const stepRes = await engine.progressCanary(
        startRes.action,
        startRes.canaryRun!,
        telemetry,
        {
          version: 1,
          stages: [{ traffic_percent: 100, min_requests: 100, min_duration_minutes: 5, max_duration_minutes: 60 }],
          promotion: {
            max_p95_latency_regression_percent: 10,
            max_error_rate_delta_percent: 0.5,
            min_cost_improvement_percent: 0,
          },
          rollback: {
            p95_latency_regression_percent: 20,
            error_rate_percent: 2,
            oom_threshold_count: 1,
          },
        },
        "candidate-1"
      );

      assert.strictEqual(stepRes.action.status, "completed");
      assert.ok(stepRes.outcome);
      assert.strictEqual(stepRes.outcome?.action_type, action.action_type);
    });
  });
});
