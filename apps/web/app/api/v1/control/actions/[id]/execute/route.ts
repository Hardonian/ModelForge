import { NextRequest, NextResponse } from "next/server";
import { dataLayer } from "@modelforge/database";
import {
  ExecutionEngine,
  SimulatedExecutionProvider,
} from "@modelforge/reconciler";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const action = dataLayer.getOptimizationAction(id);
    if (!action) {
      return NextResponse.json({ error: "Action not found" }, { status: 404 });
    }

    const isFreezeActive = dataLayer.isFreezeActive(action.organization_id, action.deployment_id);
    if (isFreezeActive) {
      return NextResponse.json(
        { error: "Mutation blocked: Emergency kill switch or maintenance freeze is active" },
        { status: 423 }
      );
    }

    const provider = new SimulatedExecutionProvider();
    const engine = new ExecutionEngine(provider);

    // If starting execution from approved status
    if (action.status === "approved" || action.status === "planned") {
      const execResult = await engine.startExecution(action, isFreezeActive);
      dataLayer.updateOptimizationAction(execResult.action);
      if (execResult.canaryRun) {
        dataLayer.createCanaryRun(execResult.canaryRun);
      }

      dataLayer.recordControlAuditLog({
        log_id: `log-${Date.now()}`,
        organization_id: action.organization_id,
        action_id: action.action_id,
        actor: { user_id: "system", role: "operator", service_account: true },
        event_type: "execution_started",
        action_hash: action.action_hash,
        details: { status: execResult.action.status },
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(execResult);
    }

    // If progressing an active canary
    if (action.status === "canarying") {
      const canaryRuns = Array.from(dataLayer.listOptimizationActions(action.organization_id));
      const canaryRunId = action.result?.canary_run_id;
      const canaryRun = canaryRunId ? dataLayer.getCanaryRun(canaryRunId) : null;

      if (!canaryRun) {
        return NextResponse.json(
          { error: "No active canary run found for this action" },
          { status: 400 }
        );
      }

      const policy = dataLayer.getAutomationPolicy(action.organization_id);
      const canaryPolicy = {
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

      const telemetry = body.telemetry || {
        request_count: 1500,
        duration_minutes: 30,
        p95_ttft_ms: action.target_spec.slo.max_p95_ttft_ms * 0.95,
        mean_tpot_ms: action.target_spec.slo.max_mean_tpot_ms * 0.95,
        error_rate_pct: 0.01,
        gpu_utilization_pct: 75,
      };

      const candidateId = body.candidate_id || `sim-cand-${action.action_id.slice(0, 8)}`;

      const stepResult = await engine.progressCanary(
        action,
        canaryRun,
        telemetry,
        canaryPolicy,
        candidateId
      );

      dataLayer.updateOptimizationAction(stepResult.action);
      if (stepResult.canaryRun) {
        dataLayer.updateCanaryRun(stepResult.canaryRun);
      }
      if (stepResult.outcome) {
        dataLayer.recordProductionOutcome(stepResult.outcome);
      }

      // Update deployment actual state if completed
      if (stepResult.action.status === "completed") {
        const dep = dataLayer.getControlDeployment(action.deployment_id);
        if (dep) {
          dataLayer.updateControlDeployment({
            ...dep,
            runtime: action.target_spec.runtime,
            runtime_version: action.target_spec.runtime_version,
            accelerator: action.target_spec.accelerator,
            replicas: action.target_spec.replicas,
            deployment_version: dep.deployment_version + 1,
            traffic_split: { active_pct: 100, candidate_pct: 0, shadow_enabled: false },
            last_inspected_at: new Date().toISOString(),
          });
        }
      }

      return NextResponse.json(stepResult);
    }

    return NextResponse.json(
      { error: `Cannot execute action in status '${action.status}'` },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
