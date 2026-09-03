import { NextRequest, NextResponse } from "next/server";
import { dataLayer } from "@modelforge/database";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("org_id") || undefined;
  const actionId = searchParams.get("action_id") || undefined;
  const logs = dataLayer.listControlAuditLogs(orgId, actionId);
  return NextResponse.json(logs);
}
