import { NextRequest, NextResponse } from "next/server";
import { dataLayer } from "@modelforge/database";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("org_id") || "org_enterprise_alpha";

  const policy = dataLayer.getAutomationPolicy(orgId);
  const freezes = dataLayer.listFreezes(orgId);
  const isKillSwitchActive = dataLayer.isFreezeActive(orgId);
  const deployments = dataLayer.listControlDeployments(orgId);
  const actions = dataLayer.listOptimizationActions(orgId);
  const activeCanaries = actions.filter((a) => a.status === "canarying");
  const pendingActions = actions.filter((a) => a.status === "awaiting_approval" || a.status === "planned");

  return NextResponse.json({
    status: isKillSwitchActive ? "frozen" : "healthy",
    mode: policy?.mode || "advisory",
    kill_switch_active: isKillSwitchActive,
    active_deployments_count: deployments.length,
    pending_actions_count: pendingActions.length,
    canary_in_progress_count: activeCanaries.length,
    freezes: freezes.filter((f) => f.status === "active"),
  });
}
