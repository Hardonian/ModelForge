import { NextRequest, NextResponse } from "next/server";
import { dataLayer } from "@modelforge/database";
import { OptimizationRecommendationSchema } from "@modelforge/benchmark-schema";
import * as crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("org_id") || undefined;
  const recs = dataLayer.listRecommendations(orgId);
  return NextResponse.json(recs);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = OptimizationRecommendationSchema.safeParse({
      ...body,
      id: body.id || crypto.randomUUID(),
      created_at: new Date().toISOString(),
      status: "ready_for_review",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid recommendation schema", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const rec = dataLayer.createRecommendation(parsed.data);
    return NextResponse.json(rec, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
