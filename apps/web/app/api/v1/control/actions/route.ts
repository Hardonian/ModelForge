import { NextRequest, NextResponse } from "next/server";
import { dataLayer } from "@modelforge/database";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("org_id") || undefined;
  const deploymentId = searchParams.get("deployment_id") || undefined;

  const actions = dataLayer.listOptimizationActions(orgId, deploymentId);
  return NextResponse.json(actions);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = dataLayer.createOptimizationAction(body);
    return NextResponse.json(action, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
