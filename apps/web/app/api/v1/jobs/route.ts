import { NextRequest, NextResponse } from "next/server";
import { dataLayer } from "@modelforge/database";
import { BenchmarkJobSchema, JobStatus } from "@modelforge/benchmark-schema";
import * as crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as JobStatus | null;
  const orgId = searchParams.get("org_id") || undefined;

  const jobs = dataLayer.listJobs({
    status: status || undefined,
    orgId,
  });
  return NextResponse.json(jobs);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = BenchmarkJobSchema.safeParse({
      ...body,
      id: body.id || crypto.randomUUID(),
      created_at: new Date().toISOString(),
      status: "queued",
      priority_score: body.priority_score || 100,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid job schema", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const job = dataLayer.enqueueJob(parsed.data);
    return NextResponse.json(job, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
