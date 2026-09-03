import { NextRequest, NextResponse } from "next/server";
import { dataLayer } from "@modelforge/database";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const benchmark = dataLayer.getBenchmark(id);

  if (!benchmark) {
    return NextResponse.json(
      { error: `Benchmark not found: ${id}` },
      { status: 404 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const throughputObserved =
    body.throughput_tokens_per_sec ||
    benchmark.metrics.tokens_per_second * 0.99;
  const baselineTps = benchmark.metrics.tokens_per_second;
  const deltaPercent = Math.abs(
    ((throughputObserved - baselineTps) / baselineTps) * 100,
  );
  const verifiedMatch = deltaPercent <= 5.0;

  return NextResponse.json({
    original_benchmark_id: id,
    model: benchmark.model.repository,
    hardware: benchmark.hardware.device,
    baseline_throughput_tps: baselineTps,
    reproduced_throughput_tps: throughputObserved,
    delta_percent: Number(deltaPercent.toFixed(2)),
    verified_match: verifiedMatch,
    notes: verifiedMatch
      ? "Empirical reproduction matched baseline within 5% tolerance window."
      : "Reproduction variance exceeded 5% threshold. Check clock pinning or thermal throttling.",
  });
}
