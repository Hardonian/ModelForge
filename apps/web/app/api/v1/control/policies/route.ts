import { NextRequest, NextResponse } from "next/server";
import { dataLayer } from "@modelforge/database";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("org_id") || "org_enterprise_alpha";
  const policy = dataLayer.getAutomationPolicy(orgId);
  if (!policy) {
    return NextResponse.json({ error: "Policy not found" }, { status: 404 });
  }
  return NextResponse.json(policy);
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.organization_id) {
      return NextResponse.json({ error: "organization_id is required" }, { status: 400 });
    }
    const updated = dataLayer.setAutomationPolicy(body);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
