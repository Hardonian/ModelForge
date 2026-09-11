import { NextRequest, NextResponse } from "next/server";
import { SpeculativeDecodingProfiler } from "@modelforge/performance-predictor";
import { SpeculativeDomain } from "@modelforge/benchmark-schema";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("target") || "meta-llama/Llama-3-70B";
  const draft = searchParams.get("draft") || undefined;
  const gamma = searchParams.get("gamma") ? parseInt(searchParams.get("gamma")!, 10) : undefined;
  const domain = (searchParams.get("domain") as SpeculativeDomain) || "general";
  const sweep = searchParams.get("sweep") === "true";

  try {
    const profile = SpeculativeDecodingProfiler.profilePair(target, draft, {
      lookahead_gamma: gamma,
      domain,
    });

    const gammaSweep = sweep
      ? SpeculativeDecodingProfiler.sweepGamma(target, draft)
      : undefined;

    return NextResponse.json({
      profile,
      sweep: gammaSweep,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { target, draft, gamma, domain, concurrency, context_length, precision } = body;

    if (!target) {
      return NextResponse.json({ error: "Missing required 'target' model" }, { status: 400 });
    }

    const profile = SpeculativeDecodingProfiler.profilePair(target, draft, {
      lookahead_gamma: gamma,
      domain,
      concurrency,
      context_length,
      precision,
    });

    const sweep = SpeculativeDecodingProfiler.sweepGamma(target, draft);

    return NextResponse.json({ profile, sweep }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
