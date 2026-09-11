import { describe, it } from "node:test";
import * as assert from "node:assert";
import {
  ShadowTrafficEngine,
  ShadowRequestPayload,
  ShadowReplayConfig,
  ShadowClient,
  ShadowReplayResponse,
} from "../shadow.js";
import { Reconciler } from "../reconciler.js";
import {
  KubernetesExecutionProvider,
  ClusterEndpointConfig,
} from "../adapters/kubernetes-provider.js";
import {
  InferenceDeploymentState,
  InferenceDeploymentSpec,
} from "@modelforge/benchmark-schema";

describe("Shadow Traffic Engine & Side-Effect Suppression", () => {
  const safeConfig: ShadowReplayConfig = {
    traffic_sample_pct: 100,
    suppress_external_mutations: true,
    suppress_email_and_notifications: true,
    suppress_database_writes: true,
    suppress_payments: true,
    max_shadow_duration_minutes: 60,
  };

  it("permits read-only GET requests without suppression", () => {
    const getRequest: ShadowRequestPayload = {
      requestId: "req-101",
      method: "GET",
      path: "/v1/models/qwen-32b/passport",
    };
    const check = ShadowTrafficEngine.isMutationSafe(getRequest, safeConfig);
    assert.strictEqual(check.safeToMirror, true);
    assert.strictEqual(check.suppressedSideEffect, false);
  });

  it("suppresses payment mutations accurately", () => {
    const chargeRequest: ShadowRequestPayload = {
      requestId: "req-102",
      method: "POST",
      path: "/api/v1/billing/charge",
      body: { amount_cents: 5000 },
    };
    const check = ShadowTrafficEngine.isMutationSafe(chargeRequest, safeConfig);
    assert.strictEqual(check.safeToMirror, false);
    assert.strictEqual(check.suppressedSideEffect, true);
    assert.ok(check.reason?.includes("Payment mutation suppressed"));
  });

  it("suppresses notifications and email triggers", () => {
    const notifyRequest: ShadowRequestPayload = {
      requestId: "req-103",
      method: "POST",
      path: "/api/v1/alert/webhook",
      body: { message: "Canary failure alert" },
    };
    const check = ShadowTrafficEngine.isMutationSafe(notifyRequest, safeConfig);
    assert.strictEqual(check.safeToMirror, false);
    assert.strictEqual(check.suppressedSideEffect, true);
    assert.ok(check.reason?.includes("Notification or webhook"));
  });

  it("suppresses database writes and persistent mutations", () => {
    const dbWriteRequest: ShadowRequestPayload = {
      requestId: "req-104",
      method: "POST",
      path: "/api/v1/database/upsert",
      body: { table: "deployments", record: { id: "1" } },
    };
    const check = ShadowTrafficEngine.isMutationSafe(dbWriteRequest, safeConfig);
    assert.strictEqual(check.safeToMirror, false);
    assert.strictEqual(check.suppressedSideEffect, true);
    assert.ok(check.reason?.includes("Persistent database mutation suppressed"));
  });

  it("sanitizes auth headers and tags shadow metadata", () => {
    const rawRequest: ShadowRequestPayload = {
      requestId: "req-105",
      method: "GET",
      path: "/v1/chat/completions",
      headers: {
        authorization: "Bearer secret-token-12345",
        cookie: "session=sensitive-auth",
        "x-api-key": "secret-key",
        "content-type": "application/json",
      },
    };

    const sanitized = ShadowTrafficEngine.sanitizeShadowRequest(rawRequest, safeConfig);
    assert.strictEqual(sanitized.headers?.["authorization"], undefined);
    assert.strictEqual(sanitized.headers?.["cookie"], undefined);
    assert.strictEqual(sanitized.headers?.["x-api-key"], undefined);
    assert.strictEqual(sanitized.headers?.["x-modelforge-shadow-mode"], "true");
    assert.strictEqual(sanitized.headers?.["x-modelforge-parent-request-id"], "req-105");
    assert.ok(sanitized.headers?.["x-modelforge-shadow-timestamp"]);
  });

  it("computes empirical quantiles correctly", () => {
    const sample = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    assert.strictEqual(ShadowTrafficEngine.calculatePercentile(sample, 50), 50);
    assert.strictEqual(ShadowTrafficEngine.calculatePercentile(sample, 90), 90);
    assert.strictEqual(ShadowTrafficEngine.calculatePercentile(sample, 95), 100);
    assert.strictEqual(ShadowTrafficEngine.calculatePercentile(sample, 99), 100);
  });

  it("executes batch replay with mock client measuring empirical latency and errors", async () => {
    class MockClient implements ShadowClient {
      async send(_url: string, req: ShadowRequestPayload): Promise<ShadowReplayResponse> {
        if (req.requestId === "req-fail") {
          return { statusCode: 500, latencyMs: 120, error: "Internal Error" };
        }
        return { statusCode: 200, latencyMs: 45 };
      }
    }

    const requests: ShadowRequestPayload[] = [
      { requestId: "req-1", method: "GET", path: "/v1/health" },
      { requestId: "req-2", method: "GET", path: "/v1/models" },
      { requestId: "req-3", method: "POST", path: "/api/charge", body: {} }, // suppressed
    ];

    const result = await ShadowTrafficEngine.replayBatch(
      "https://candidate-serving.internal",
      requests,
      safeConfig,
      new MockClient()
    );

    assert.strictEqual(result.shadow_requests_sent, 2);
    assert.strictEqual(result.side_effects_suppressed_count, 1);
    assert.strictEqual(result.error_count, 0);
    assert.strictEqual(result.passed, true);
    assert.strictEqual(result.mean_latency_ms, 45);
  });
});

describe("Multi-Cluster Kubernetes Federation (TD-MED-02)", () => {
  const federatedClusters: ClusterEndpointConfig[] = [
    {
      name: "us-east-primary",
      region: "us-east-1",
      apiEndpoint: "https://k8s-useast.internal:6443",
      weight: 70,
      isPrimary: true,
      healthy: true,
    },
    {
      name: "eu-west-failover",
      region: "eu-west-1",
      apiEndpoint: "https://k8s-euwest.internal:6443",
      weight: 30,
      isPrimary: false,
      healthy: true,
    },
  ];

  it("initializes federated cluster endpoints and generates GSLB annotations in dryRun", async () => {
    const provider = new KubernetesExecutionProvider(federatedClusters);
    const endpoints = provider.getClusterEndpoints();
    assert.strictEqual(endpoints.length, 2);
    assert.strictEqual(endpoints[0]?.name, "us-east-primary");

    const sampleState: InferenceDeploymentState = {
      deployment_id: "dep-fed-1",
      organization_id: "org-1",
      name: "qwen-fed",
      model: "Qwen/Qwen2.5-32B-Instruct",
      revision: "main",
      runtime: "vllm",
      runtime_version: "0.6.2",
      accelerator: "NVIDIA-L40S",
      accelerator_count: 2,
      replicas: 2,
      tensor_parallelism: 2,
      pipeline_parallelism: 1,
      health: "healthy",
      deployment_version: 1,
      traffic_split: { active_pct: 100, candidate_pct: 0, shadow_enabled: false },
      last_inspected_at: new Date().toISOString(),
    };

    const desiredSpec: InferenceDeploymentSpec = {
      model: "Qwen/Qwen2.5-32B-Instruct",
      revision: "main",
      runtime: "vllm",
      runtime_version: "0.6.2",
      deployment_target: "kubernetes",
      precision: "fp16",
      accelerator: "NVIDIA-L40S",
      accelerator_count: 2,
      replicas: 4,
      tensor_parallelism: 2,
      pipeline_parallelism: 1,
      regions: ["us-east-1", "eu-west-1"],
      routing: { strategy: "canary", canary_traffic_pct: 10 },
      health_checks: {
        readiness_path: "/health/ready",
        liveness_path: "/health/live",
        initial_delay_seconds: 30,
        timeout_seconds: 5,
      },
      slo: {
        max_p95_ttft_ms: 60,
        max_mean_tpot_ms: 25,
        min_throughput_tok_s: 30,
        max_cost_per_hour_usd: 5.0,
      },
      version: 2,
    };

    const mockAction = Reconciler.planReconciliation({
      deploymentId: "dep-fed-1",
      organizationId: "org-1",
      currentState: sampleState,
      desiredSpec,
    });

    const dryRun = await provider.dryRun(mockAction);
    assert.strictEqual(dryRun.valid, true);
    assert.ok(dryRun.diff.includes("gslb.modelforge.ai/federation-enabled: \"true\""));
    assert.ok(dryRun.diff.includes("us-east-primary (us-east-1) [weight: 70%]"));
  });

  it("handles multi-cluster traffic rebalancing and failover cleanly", async () => {
    const provider = new KubernetesExecutionProvider(federatedClusters);

    // Rebalance 50/50
    const rebalance = await provider.setMultiClusterTrafficSplit({
      "us-east-primary": 50,
      "eu-west-failover": 50,
    });
    assert.strictEqual(rebalance.success, true);
    assert.strictEqual(rebalance.activeWeights["us-east-primary"], 50);
    assert.strictEqual(rebalance.activeWeights["eu-west-failover"], 50);

    // Failover us-east-primary -> eu-west-failover
    const failover = await provider.failoverCluster("us-east-primary", "eu-west-failover");
    assert.strictEqual(failover.success, true);
    assert.strictEqual(failover.newPrimary, "eu-west-failover");
    assert.strictEqual(failover.rebalancedWeights["us-east-primary"], 0);
    assert.strictEqual(failover.rebalancedWeights["eu-west-failover"], 100);
  });
});
