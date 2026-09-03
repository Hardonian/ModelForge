import { NextRequest, NextResponse } from "next/server";
import { dataLayer } from "@modelforge/database";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const family = searchParams.get("family") || undefined;
  const models = dataLayer.listModels(family);
  return NextResponse.json(models);
}
