import { NextRequest, NextResponse } from "next/server";
import { dataLayer } from "@modelforge/database";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const action = dataLayer.getOptimizationAction(id);
  if (!action) {
    return NextResponse.json({ error: "Action not found" }, { status: 404 });
  }
  return NextResponse.json(action);
}
