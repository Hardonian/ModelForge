import { NextRequest, NextResponse } from "next/server";
import { dataLayer } from "@modelforge/database";
import * as crypto from "crypto";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("org_id") || undefined;
  const freezes = dataLayer.listFreezes(orgId);
  return NextResponse.json(freezes);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.organization_id || !body.reason) {
      return NextResponse.json(
        { error: "organization_id and reason are required" },
        { status: 400 }
      );
    }

    const freeze = dataLayer.activateFreeze({
      freeze_id: crypto.randomUUID(),
      organization_id: body.organization_id,
      scope: body.scope || "global",
      target_id: body.target_id,
      reason: body.reason,
      frozen_by: body.frozen_by || "admin",
      frozen_at: new Date().toISOString(),
      status: "active",
    });

    return NextResponse.json(freeze, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const freezeId = searchParams.get("freeze_id");
  if (!freezeId) {
    return NextResponse.json({ error: "freeze_id query parameter is required" }, { status: 400 });
  }

  const lifted = dataLayer.liftFreeze(freezeId);
  if (!lifted) {
    return NextResponse.json({ error: "Freeze not found or already lifted" }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: `Freeze ${freezeId} lifted successfully` });
}
