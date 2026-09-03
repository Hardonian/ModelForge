import { NextRequest, NextResponse } from "next/server";
import { dataLayer } from "@modelforge/database";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const orgId = searchParams.get("org_id") || undefined;

  if (id) {
    const deployment = dataLayer.getControlDeployment(id);
    if (!deployment) {
      return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
    }
    return NextResponse.json(deployment);
  }

  const list = dataLayer.listControlDeployments(orgId);
  return NextResponse.json(list);
}
