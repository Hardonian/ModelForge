import {
  InferenceDeploymentSpec,
  InferenceDeploymentState,
  OptimizationAction,
  ActionType,
  ChangeRisk,
  RollbackPlan,
  ExecutionMode,
} from "@modelforge/benchmark-schema";
import * as crypto from "crypto";

export class Reconciler {
  static computeActionHash(action: {
    deployment_id: string;
    action_type: string;
    current_spec: InferenceDeploymentSpec;
    target_spec: InferenceDeploymentSpec;
  }): string {
    const payload = JSON.stringify({
      deployment_id: action.deployment_id,
      action_type: action.action_type,
      current: action.current_spec,
      target: action.target_spec,
    });
    return crypto.createHash("sha256").update(payload).digest("hex");
  }

  static evaluateChangeRisk(
    current: InferenceDeploymentSpec,
    target: InferenceDeploymentSpec,
    canaryTrafficPct: number
  ): ChangeRisk {
    const reasons: string[] = [];
    let score = 10;

    const modelChanged = current.model !== target.model || current.revision !== target.revision;
    const runtimeChanged = current.runtime !== target.runtime;
    const hardwareChanged =
      current.accelerator !== target.accelerator ||
      current.accelerator_count !== target.accelerator_count;
    const topologyChanged =
      current.tensor_parallelism !== target.tensor_parallelism ||
      current.pipeline_parallelism !== target.pipeline_parallelism ||
      current.prefill_workers !== target.prefill_workers ||
      current.decode_workers !== target.decode_workers;

    if (modelChanged) {
      score += 35;
      reasons.push("Model repository or revision changed");
    }
    if (runtimeChanged) {
      score += 25;
      reasons.push(`Serving runtime changed (${current.runtime} -> ${target.runtime})`);
    }
    if (hardwareChanged) {
      score += 20;
      reasons.push(`Accelerator specification changed (${current.accelerator} -> ${target.accelerator})`);
    }
    if (topologyChanged) {
      score += 15;
      reasons.push("Tensor parallel or disaggregated prefill/decode topology modified");
    }

    let rollbackDifficulty: "easy" | "moderate" | "complex" = "easy";
    if (hardwareChanged || modelChanged) {
      rollbackDifficulty = "complex";
    } else if (runtimeChanged || topologyChanged) {
      rollbackDifficulty = "moderate";
    }

    let level: "low" | "medium" | "high" | "critical" = "low";
    if (score >= 65) level = "critical";
    else if (score >= 45) level = "high";
    else if (score >= 25) level = "medium";

    return {
      level,
      score: Math.min(score, 100),
      reasons: reasons.length > 0 ? reasons : ["Configuration change within safe scaling bounds"],
      dimensions: {
        model_change: modelChanged,
        runtime_change: runtimeChanged,
        hardware_change: hardwareChanged,
        topology_change: topologyChanged,
        blast_radius_pct: canaryTrafficPct,
        rollback_difficulty: rollbackDifficulty,
      },
    };
  }

  static determineActionType(
    current: InferenceDeploymentSpec,
    target: InferenceDeploymentSpec
  ): ActionType {
    if (current.model !== target.model || current.revision !== target.revision) {
      return "change_model_revision";
    }
    if (current.runtime !== target.runtime) {
      return "change_runtime";
    }
    if (current.precision !== target.precision) {
      return "change_precision";
    }
    if (
      current.accelerator !== target.accelerator ||
      current.accelerator_count !== target.accelerator_count
    ) {
      return "change_gpu_count";
    }
    if (
      current.tensor_parallelism !== target.tensor_parallelism ||
      current.pipeline_parallelism !== target.pipeline_parallelism ||
      current.prefill_workers !== target.prefill_workers ||
      current.decode_workers !== target.decode_workers
    ) {
      return "change_dynamo_topology";
    }
    if (current.replicas !== target.replicas) {
      return "change_replica_count";
    }
    return "noop";
  }

  static createRollbackPlan(
    deploymentId: string,
    currentSpec: InferenceDeploymentSpec
  ): RollbackPlan {
    return {
      rollback_id: crypto.randomUUID(),
      source_deployment_id: deploymentId,
      target_stable_spec: currentSpec,
      required_resources: {
        accelerator: currentSpec.accelerator,
        device_count: currentSpec.accelerator_count,
        replicas: currentSpec.replicas,
      },
      estimated_rollback_duration_s: 45,
      known_risks: ["Temporary cold start latency if old replicas were completely drained"],
      rollback_actions: [
        "Revert traffic split router to 100% active deployment",
        "Restore last known good model weights and runtime container",
        "Decommission unhealthy candidate container",
      ],
      validation_checks: [
        "Verify health endpoint returns 200 OK",
        "Verify P95 latency is within baseline SLO",
        "Verify 0% traffic routed to failed candidate",
      ],
      verified_at: new Date().toISOString(),
    };
  }

  static planReconciliation(params: {
    deploymentId: string;
    organizationId: string;
    projectId?: string;
    currentState: InferenceDeploymentState;
    desiredSpec: InferenceDeploymentSpec;
    executionMode?: ExecutionMode;
    evidence?: {
      source_benchmark_ids?: string[];
      confidence_score?: number;
      is_predicted?: boolean;
    };
    estimatedCostDeltaUsdMonth?: number;
    estimatedP95LatencyDeltaPct?: number;
  }): OptimizationAction {
    const currentSpec: InferenceDeploymentSpec =
      params.currentState.last_known_good_spec ?? {
        model: params.currentState.model,
        revision: params.currentState.revision,
        runtime: params.currentState.runtime,
        runtime_version: params.currentState.runtime_version,
        deployment_target: "kubernetes",
        precision: "fp16",
        accelerator: params.currentState.accelerator,
        accelerator_count: params.currentState.accelerator_count,
        replicas: params.currentState.replicas,
        tensor_parallelism: params.currentState.tensor_parallelism,
        pipeline_parallelism: params.currentState.pipeline_parallelism,
        prefill_workers: params.currentState.prefill_workers,
        decode_workers: params.currentState.decode_workers,
        regions: ["us-east-1"],
        routing: { strategy: "canary", canary_traffic_pct: 0 },
        health_checks: {
          readiness_path: "/health/ready",
          liveness_path: "/health/live",
          initial_delay_seconds: 30,
          timeout_seconds: 5,
        },
        slo: {
          max_p95_ttft_ms: 100,
          max_mean_tpot_ms: 30,
          min_throughput_tok_s: 20,
          max_cost_per_hour_usd: 10,
        },
        version: params.currentState.deployment_version,
      };

    const actionType = this.determineActionType(currentSpec, params.desiredSpec);
    const risk = this.evaluateChangeRisk(currentSpec, params.desiredSpec, 1);
    const rollbackPlan = this.createRollbackPlan(params.deploymentId, currentSpec);

    const actionId = crypto.randomUUID();
    const actionHash = this.computeActionHash({
      deployment_id: params.deploymentId,
      action_type: actionType,
      current_spec: currentSpec,
      target_spec: params.desiredSpec,
    });

    return {
      action_id: actionId,
      organization_id: params.organizationId,
      project_id: params.projectId ?? "default",
      deployment_id: params.deploymentId,
      action_type: actionType,
      execution_mode: params.executionMode ?? "advisory",
      current_spec: currentSpec,
      target_spec: params.desiredSpec,
      reason: `Reconciliation: ${actionType} to achieve desired performance and cost envelope`,
      evidence: {
        source_benchmark_ids: params.evidence?.source_benchmark_ids ?? [],
        confidence_score: params.evidence?.confidence_score ?? 90,
        is_predicted: params.evidence?.is_predicted ?? false,
      },
      policy_evaluation: {
        passed: true,
        mode_applied: params.executionMode ?? "advisory",
        checks: [{ name: "reconciliation_generated", passed: true, detail: "Plan generated successfully" }],
      },
      estimated_cost_delta_usd_month: params.estimatedCostDeltaUsdMonth ?? -500,
      estimated_p95_latency_delta_pct: params.estimatedP95LatencyDeltaPct ?? -15,
      estimated_capacity_delta_pct: 20,
      risk,
      blast_radius: {
        max_traffic_pct: 10,
        affected_gpus: Math.abs(params.desiredSpec.accelerator_count - currentSpec.accelerator_count) + 1,
        affected_workload: params.currentState.name,
      },
      rollback_plan: rollbackPlan,
      status: "planned",
      action_hash: actionHash,
      created_at: new Date().toISOString(),
      version: 1,
    };
  }
}
