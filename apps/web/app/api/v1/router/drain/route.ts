import { NextRequest, NextResponse } from "next/server";
import { smartRouterInstance } from "../shared";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const workerId = body.worker_id || body.id;
    const reason = body.reason || "spot_instance_preemption_notice";

    if (!workerId) {
      return NextResponse.json(
        { error: "Missing required 'worker_id' parameter" },
        { status: 400 },
      );
    }

    const drainReport = smartRouterInstance.drainWorker(workerId, reason);

    return NextResponse.json(
      {
        action: "spot_drain_initiated",
        drain_report: drainReport,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
