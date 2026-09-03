import { NextRequest, NextResponse } from "next/server";
import { dataLayer } from "@modelforge/database";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const model = searchParams.get("model") || undefined;
  const matrix = dataLayer.getCoverageMatrix(model);
  return NextResponse.json(matrix);
}
