import { NextRequest, NextResponse } from "next/server";
import { dataLayer } from "@modelforge/database";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const model = searchParams.get("model") || "";
  const accelerator = searchParams.get("accelerator") || "";

  if (model || accelerator) {
    const filtered = dataLayer.getSoftwareLift(model, accelerator);
    return NextResponse.json({ count: filtered.length, metrics: filtered });
  }

  const all = dataLayer.listSoftwareLift();
  return NextResponse.json({ count: all.length, metrics: all });
}
