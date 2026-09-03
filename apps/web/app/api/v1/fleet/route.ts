import { NextRequest, NextResponse } from "next/server";
import { dataLayer } from "@modelforge/database";
import { FleetResourceSchema } from "@modelforge/benchmark-schema";
import * as crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("org_id") || undefined;
  const fleet = dataLayer.listFleetResources(orgId);
  return NextResponse.json(fleet);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = FleetResourceSchema.safeParse({
      ...body,
      id: body.id || crypto.randomUUID(),
      allocated_workload_ids: body.allocated_workload_ids || [],
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid fleet resource schema", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const res = dataLayer.registerFleetResource(parsed.data);
    return NextResponse.json(res, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
