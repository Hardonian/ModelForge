import { NextRequest, NextResponse } from "next/server";
import { dataLayer } from "@modelforge/database";
import { WorkerTrustTier } from "@modelforge/benchmark-schema";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const workerId = body.worker_id;
    const trustTier = (body.trust_tier || "community") as WorkerTrustTier;

    if (!workerId) {
      return NextResponse.json(
        { error: "worker_id is required" },
        { status: 400 },
      );
    }

    const job = dataLayer.claimJob(workerId, trustTier);
    return NextResponse.json({ job });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
