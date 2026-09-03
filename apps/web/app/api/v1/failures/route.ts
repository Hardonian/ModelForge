import { NextRequest, NextResponse } from "next/server";
import { dataLayer } from "@modelforge/database";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const model = searchParams.get("model") || undefined;
  const category = searchParams.get("category") || undefined;
  const runtime = searchParams.get("runtime") || undefined;

  const failures = dataLayer.listFailures({ model, category, runtime });
  return NextResponse.json({
    total_count: failures.length,
    failures,
  });
}
