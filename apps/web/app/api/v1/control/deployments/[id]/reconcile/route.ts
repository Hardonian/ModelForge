import { NextRequest, NextResponse } from "next/server";
import { dataLayer } from "@modelforge/database";
import { Reconciler } from "@modelforge/reconciler";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const desiredSpec = body.desired_spec;

    if (!desiredSpec) {
      return NextResponse.json(
        { error: "desired_spec is required in request body" },
        { status: 400 }
      );
    }

    const currentState = dataLayer.getControlDeployment(id);
    if (!currentState) {
      return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
    }

    const policy = dataLayer.getAutomationPolicy(currentState.organization_id);
    const executionMode = body.execution_mode || policy?.mode || "advisory";

    const action = Reconciler.planReconciliation({
      deploymentId: id,
      organizationId: currentState.organization_id,
      currentState,
      desiredSpec,
      executionMode,
    });

    // Persist planned action
    const saved = dataLayer.createOptimizationAction(action);
    return NextResponse.json(saved, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
