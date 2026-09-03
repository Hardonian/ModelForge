import { NextRequest, NextResponse } from "next/server";
import { optimizeFleetPlacement } from "@modelforge/optimizer";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fleet, workloads } = body;

    if (!Array.isArray(fleet) || !Array.isArray(workloads)) {
      return NextResponse.json(
        { error: "fleet and workloads must be arrays" },
        { status: 400 },
      );
    }

    const result = optimizeFleetPlacement(fleet, workloads);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
