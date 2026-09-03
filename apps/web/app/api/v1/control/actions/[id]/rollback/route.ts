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
    const reason = body.reason || "Manual operator abort";

    const action = dataLayer.getOptimizationAction(id);
    if (!action) {
      return NextResponse.json({ error: "Action not found" }, { status: 404 });
    }

    const provider = new SimulatedExecutionProvider();
    const engine = new ExecutionEngine(provider);
    const candidateId = body.candidate_id || `sim-cand-${action.action_id.slice(0, 8)}`;

    const rollbackResult = await engine.emergencyRollback(action, candidateId, reason);
    dataLayer.updateOptimizationAction(rollbackResult.action);

    // Revert deployment state traffic split to 100% active
    const dep = dataLayer.getControlDeployment(action.deployment_id);
    if (dep) {
      dataLayer.updateControlDeployment({
        ...dep,
        traffic_split: { active_pct: 100, candidate_pct: 0, shadow_enabled: false },
        last_inspected_at: new Date().toISOString(),
      });
    }

    dataLayer.recordControlAuditLog({
      log_id: `log-${Date.now()}`,
      organization_id: action.organization_id,
      action_id: action.action_id,
      actor: { user_id: body.actor || "operator", role: "operator", service_account: false },
      event_type: "rollback_triggered",
      action_hash: action.action_hash,
      details: { reason },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      action: rollbackResult.action,
      message: `Action ${id} successfully rolled back to last known good configuration`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
