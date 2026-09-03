import { NextRequest, NextResponse } from "next/server";
import { dataLayer } from "@modelforge/database";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const benchmark = dataLayer.getBenchmark(id);

  if (!benchmark) {
    return NextResponse.json({ error: "Benchmark not found" }, { status: 404 });
  }

  return NextResponse.json(benchmark);
}
