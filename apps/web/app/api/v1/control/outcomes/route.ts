import { NextRequest, NextResponse } from "next/server";
import { dataLayer } from "@modelforge/database";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("org_id") || undefined;
  const outcomes = dataLayer.listProductionOutcomes(orgId);
  return NextResponse.json(outcomes);
}
