import { NextRequest, NextResponse } from "next/server";
import { dataLayer } from "@modelforge/database";
import { WorkerSchema } from "@modelforge/benchmark-schema";
import * as crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("org_id") || undefined;
  const workers = dataLayer.listWorkers(orgId);
  return NextResponse.json(workers);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = WorkerSchema.safeParse({
      ...body,
      id: body.id || crypto.randomUUID(),
      created_at: body.created_at || new Date().toISOString(),
      last_heartbeat_at: new Date().toISOString(),
      total_jobs_completed: body.total_jobs_completed || 0,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid worker schema", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const worker = dataLayer.registerWorker(parsed.data);
    return NextResponse.json(worker, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
