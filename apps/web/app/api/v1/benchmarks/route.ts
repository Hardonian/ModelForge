import { NextRequest, NextResponse } from "next/server";
import { dataLayer } from "@modelforge/database";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const model = searchParams.get("model") || undefined;
  const hardware = searchParams.get("hardware") || undefined;
  const runtime = searchParams.get("runtime") || undefined;
  const precision = searchParams.get("precision") || undefined;

  const results = dataLayer.listBenchmarks({
    model,
    hardware,
    runtime,
    precision,
  });
  return NextResponse.json(results);
}
