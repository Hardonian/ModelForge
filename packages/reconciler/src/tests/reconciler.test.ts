import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  Reconciler,
  PolicyEngine,
  ExecutionEngine,
  SimulatedExecutionProvider,
  ShadowTrafficEngine,
  ProductionOutcomeRecorder,
} from "../index";
import {
  InferenceDeploymentState,
  InferenceDeploymentSpec,
  AutomationPolicy,
  CanaryPolicy,
} from "@modelforge/benchmark-schema";

describe("ModelForge Autonomous Inference Control Plane", () => {
  const sampleState: InferenceDeploymentState = {
    deployment_id: "11111111-1111-1111-1111-111111111111",
    organization_id: "org-enterprise",
    name: "qwen-prod",
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
    runtime: "tensorrt-llm",
    runtime_version: "0.15.0",
    deployment_target: "kubernetes",
    precision: "fp16",
    accelerator: "NVIDIA-L40S",
    accelerator_count: 2,
    replicas: 2,
    tensor_parallelism: 2,
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
      max_p95_ttft_ms: 60,
      max_mean_tpot_ms: 25,
      min_throughput_tok_s: 30,
      max_cost_per_hour_usd: 5.0,
    },
    version: 2,
  };

  const samplePolicy: AutomationPolicy = {
    policy_id: "22222222-2222-2222-2222-222222222222",
    organization_id: "org-enterprise",
    name: "prod-policy",
    mode: "guarded_automation",
    requirements: {
      minimum_confidence: 80,
      minimum_reproductions: 1,
      predictions_allowed: true,
      prediction_max_uncertainty_percent: 25,
    },
    changes: {
      allow: ["change_runtime", "change_replica_count"],
      approval_required: ["change_gpu_count", "change_model_revision"],
      deny: ["change_precision"],
    },
    blast_radius: {
      max_canary_percent: 50,
      max_gpu_change: 4,
      max_spend_usd_hour: 25,
      max_simultaneous_actions: 3,
    },
    economics: { minimum_projected_savings_percent: 5 },
    slo: { max_p95_regression_percent: 5 },
    maintenance_windows: [],
    freeze_windows: [],
    allowed_regions: ["us-east-1", "us-west-2"],
  };

  const sampleCanaryPolicy: CanaryPolicy = {
    version: 1,
    stages: [
      { traffic_percent: 10, min_requests: 100, min_duration_minutes: 5, max_duration_minutes: 60 },
      { traffic_percent: 50, min_requests: 500, min_duration_minutes: 15, max_duration_minutes: 120 },
      { traffic_percent: 100, min_requests: 1000, min_duration_minutes: 30, max_duration_minutes: 180 },
    ],
    promotion: {
      max_p95_latency_regression_percent: 5,
      max_error_rate_delta_percent: 0.2,
      min_cost_improvement_percent: 0,
    },
    rollback: {
      p95_latency_regression_percent: 15,
      error_rate_percent: 2,
      oom_threshold_count: 1,
    },
  };

  test("Reconciler plans state transition and generates hash binding", () => {
    const action = Reconciler.planReconciliation({
      deploymentId: sampleState.deployment_id,
      organizationId: sampleState.organization_id,
      currentState: sampleState,
      desiredSpec,
      executionMode: "guarded_automation",
    });

    assert.equal(action.action_type, "change_runtime");
    assert.equal(action.risk.level, "medium");
    assert.ok(action.action_hash.length === 64, "SHA-256 hash generated");
    assert.ok(action.rollback_plan.rollback_actions.length > 0);
  });

  test("PolicyEngine evaluates action and enforces blast radius", () => {
    const evaluation = PolicyEngine.evaluateAction(
      {
        action_type: "change_runtime",
        confidence: 90,
        is_predicted: false,
        gpu_delta: 0,
        projected_savings_pct: 15,
        p95_latency_delta_pct: -10,
        canary_traffic_pct: 10,
        hourly_cost_usd: 5,
        region: "us-east-1",
      },
      samplePolicy
    );

    assert.equal(evaluation.allowed, true);
    assert.equal(evaluation.requires_human_approval, false);
    assert.equal(evaluation.denial_reasons.length, 0);

    // Test denied action type
    const deniedEval = PolicyEngine.evaluateAction(
      {
        action_type: "change_precision",
        confidence: 95,
        is_predicted: false,
        gpu_delta: 0,
        projected_savings_pct: 20,
        p95_latency_delta_pct: 0,
        canary_traffic_pct: 10,
        hourly_cost_usd: 5,
      },
      samplePolicy
    );
    assert.equal(deniedEval.allowed, false);
    assert.ok(deniedEval.denial_reasons[0]?.includes("denied"));
  });

  test("ExecutionEngine executes safe canary progression through to full promotion", async () => {
    const provider = new SimulatedExecutionProvider();
    const engine = new ExecutionEngine(provider);

    const action = Reconciler.planReconciliation({
      deploymentId: sampleState.deployment_id,
      organizationId: sampleState.organization_id,
      currentState: sampleState,
      desiredSpec,
    });

    // Step 1: Start execution
    const startResult = await engine.startExecution(action, false);
    assert.equal(startResult.action.status, "canarying");
    assert.ok(startResult.canaryRun);
    assert.equal(startResult.canaryRun.status, "progressing");

    const candidateId = "cand-test-123";

    // Step 2: Progress stage 1 (10% traffic -> 50% traffic)
    const stage1Telemetry = {
      request_count: 150,
      duration_minutes: 10,
      p95_ttft_ms: 55, // baseline 60 -> -8.3% regression (improvement)
      mean_tpot_ms: 22,
      error_rate_pct: 0.01,
      gpu_utilization_pct: 68,
    };

    const stage1Result = await engine.progressCanary(
      startResult.action,
      startResult.canaryRun,
      stage1Telemetry,
      sampleCanaryPolicy,
      candidateId
    );
    assert.equal(stage1Result.canaryRun?.current_stage_index, 1);
    assert.equal(stage1Result.canaryRun?.active_traffic_percent, 50);

    // Step 3: Progress stage 2 (50% traffic -> 100% full promotion)
    const stage2Telemetry = {
      request_count: 600,
      duration_minutes: 20,
      p95_ttft_ms: 54,
      mean_tpot_ms: 21,
      error_rate_pct: 0.02,
      gpu_utilization_pct: 74,
    };

    const stage2Result = await engine.progressCanary(
      stage1Result.action,
      stage1Result.canaryRun!,
      stage2Telemetry,
      sampleCanaryPolicy,
      candidateId
    );
    assert.equal(stage2Result.canaryRun?.current_stage_index, 2);
    assert.equal(stage2Result.canaryRun?.active_traffic_percent, 100);

    // Step 4: Final stage evaluation -> Complete promotion
    const finalTelemetry = {
      request_count: 1200,
      duration_minutes: 40,
      p95_ttft_ms: 53,
      mean_tpot_ms: 20,
      error_rate_pct: 0.01,
      gpu_utilization_pct: 80,
    };

    const finalResult = await engine.progressCanary(
      stage2Result.action,
      stage2Result.canaryRun!,
      finalTelemetry,
      sampleCanaryPolicy,
      candidateId
    );
    assert.equal(finalResult.action.status, "completed");
    assert.equal(finalResult.canaryRun?.status, "completed");
    assert.ok(finalResult.outcome);
    assert.equal(finalResult.outcome.rollback_occurred, false);

    // Verify outcome calibration
    const feedback = ProductionOutcomeRecorder.analyzeOutcome(finalResult.outcome, action);
    assert.ok(feedback.recommendation_quality_score > 70);
  });

  test("ExecutionEngine detects threshold breach and executes automatic rollback", async () => {
    const provider = new SimulatedExecutionProvider();
    const engine = new ExecutionEngine(provider);

    const action = Reconciler.planReconciliation({
      deploymentId: sampleState.deployment_id,
      organizationId: sampleState.organization_id,
      currentState: sampleState,
      desiredSpec,
    });

    const startResult = await engine.startExecution(action, false);
    assert.ok(startResult.canaryRun);

    // Inject high latency surge (+45% regression, threshold is 15%)
    const badTelemetry = {
      request_count: 200,
      duration_minutes: 10,
      p95_ttft_ms: 145, // baseline 100 -> +45% regression!
      mean_tpot_ms: 40,
      error_rate_pct: 0.05,
      gpu_utilization_pct: 95,
    };

    const rollbackResult = await engine.progressCanary(
      startResult.action,
      startResult.canaryRun,
      badTelemetry,
      sampleCanaryPolicy,
      "cand-bad-999"
    );

    assert.equal(rollbackResult.action.status, "rolled_back");
    assert.equal(rollbackResult.action.result?.restored_last_known_good, true);
    assert.ok(rollbackResult.canaryRun?.failure_reason?.includes("breached rollback threshold"));
  });

  test("ExecutionEngine rejects execution when emergency kill switch is active", async () => {
    const provider = new SimulatedExecutionProvider();
    const engine = new ExecutionEngine(provider);

    const action = Reconciler.planReconciliation({
      deploymentId: sampleState.deployment_id,
      organizationId: sampleState.organization_id,
      currentState: sampleState,
      desiredSpec,
    });

    const result = await engine.startExecution(action, true); // isFreezeActive = true
    assert.equal(result.action.status, "failed");
    assert.ok(result.error?.includes("Emergency kill switch"));
  });

  test("ShadowTrafficEngine validates side-effect suppression rules", () => {
    const unsafeConfig = {
      traffic_sample_pct: 10,
      suppress_external_mutations: false,
      suppress_email_and_notifications: true,
      suppress_database_writes: true,
      suppress_payments: true,
      max_shadow_duration_minutes: 30,
    };
    const safetyCheck = ShadowTrafficEngine.evaluateShadowSafety(unsafeConfig);
    assert.equal(safetyCheck.safe, false);

    const safeConfig = {
      ...unsafeConfig,
      suppress_external_mutations: true,
    };
    const safeCheck = ShadowTrafficEngine.evaluateShadowSafety(safeConfig);
    assert.equal(safeCheck.safe, true);
  });
});
