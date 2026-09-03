import { NextRequest, NextResponse } from "next/server";
import { dataLayer } from "@modelforge/database";

interface RouteContext {
  params: Promise<{ slug: string[] }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { slug } = await params;
  const modelId = slug.join("/");
  const { searchParams } = new URL(req.url);
  const revision = searchParams.get("rev") || "main";

  const passport = dataLayer.getComputePassport(modelId, revision);
  if (!passport) {
    return NextResponse.json(
      { error: `Compute passport not found for model: ${modelId}@${revision}` },
      { status: 404 },
    );
  }

  return NextResponse.json(passport);
}
