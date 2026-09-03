import { NextRequest, NextResponse } from "next/server";
import { dataLayer } from "@modelforge/database";
import { Reconciler } from "@modelforge/reconciler";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const approvedBy = body.approved_by || "admin";

    const action = dataLayer.getOptimizationAction(id);
    if (!action) {
      return NextResponse.json({ error: "Action not found" }, { status: 404 });
    }

    // Integrity check: verify hash binds current and target specs
    const expectedHash = Reconciler.computeActionHash({
      deployment_id: action.deployment_id,
      action_type: action.action_type,
      current_spec: action.current_spec,
      target_spec: action.target_spec,
    });

    if (action.action_hash !== expectedHash) {
      return NextResponse.json(
        {
          error: "Action integrity check failed: specification has been altered since creation",
          expected_hash: expectedHash,
          action_hash: action.action_hash,
        },
        { status: 409 }
      );
    }

    const updated = dataLayer.updateOptimizationAction({
      ...action,
      status: "approved",
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    });

    dataLayer.recordControlAuditLog({
      log_id: `log-${Date.now()}`,
      organization_id: action.organization_id,
      action_id: action.action_id,
      actor: { user_id: approvedBy, role: "admin", service_account: false },
      event_type: "action_approved",
      action_hash: action.action_hash,
      details: { action_type: action.action_type, deployment_id: action.deployment_id },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
