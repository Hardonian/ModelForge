import { NextRequest, NextResponse } from "next/server";
import { dataLayer } from "@modelforge/database";
import { OpenComputeBenchSchema } from "@modelforge/benchmark-schema";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const resultBenchmark = body.result_benchmark;

    if (!resultBenchmark) {
      return NextResponse.json(
        { error: "result_benchmark is required" },
        { status: 400 },
      );
    }

    const parsedBench = OpenComputeBenchSchema.safeParse(resultBenchmark);
    if (!parsedBench.success) {
      return NextResponse.json(
        {
          error: "Invalid result_benchmark format",
          details: parsedBench.error.issues,
        },
        { status: 400 },
      );
    }

    // Add benchmark to repository and complete job
    dataLayer.addBenchmark(parsedBench.data);
    const updatedJob = dataLayer.completeJob(id, parsedBench.data.benchmark_id);

    if (!updatedJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({
      job: updatedJob,
      benchmark_id: parsedBench.data.benchmark_id,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
