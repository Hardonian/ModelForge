import { NextRequest, NextResponse } from "next/server";
import {
  MultiNodeTopologySpecSchema,
  DistributedBenchmarkResultSchema,
} from "@modelforge/benchmark-schema";

export const dynamic = "force-dynamic";

// Standard hardware fabric profiles
const FABRICS: Record<
  string,
  { bandwidth_gbps: number; busbw_gbps: number; latency_us: number }
> = {
  infiniband_ndr: { bandwidth_gbps: 400, busbw_gbps: 352, latency_us: 1.2 },
  infiniband_xdr: { bandwidth_gbps: 800, busbw_gbps: 736, latency_us: 0.8 },
  roce_v2: { bandwidth_gbps: 200, busbw_gbps: 156, latency_us: 2.5 },
  nvlink_network: { bandwidth_gbps: 1800, busbw_gbps: 1710, latency_us: 0.4 },
  slingshot_11: { bandwidth_gbps: 200, busbw_gbps: 164, latency_us: 1.8 },
  tcp_ethernet: { bandwidth_gbps: 25, busbw_gbps: 11.2, latency_us: 25.0 },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const nodes = Math.max(1, parseInt(searchParams.get("nodes") || "2", 10));
  const gpusPerNode = Math.max(1, parseInt(searchParams.get("gpus_per_node") || "8", 10));
  const fabric = searchParams.get("fabric") || "infiniband_ndr";
  const model = searchParams.get("model") || "meta-llama/Llama-3-70B";

  const fabricInfo = FABRICS[fabric] || FABRICS.infiniband_ndr;
  const totalGpus = nodes * gpusPerNode;

  const recTp = fabric === "nvlink_network" ? Math.min(totalGpus, 16) : Math.min(gpusPerNode, 8);
  const recPp = Math.max(1, Math.floor(totalGpus / recTp));

  const topology = {
    nodes_count: nodes,
    gpus_per_node: gpusPerNode,
    total_gpus: totalGpus,
    interconnect_fabric: fabric,
    cross_node_bandwidth_gbps: fabricInfo.bandwidth_gbps,
    allreduce_busbw_gbps: fabricInfo.busbw_gbps,
    p2p_latency_us: fabricInfo.latency_us,
    recommended_tp_max: recTp,
    recommended_pp_min: recPp,
  };

  const messageMb = 128;
  const p = totalGpus;
  const busBytesSec = (fabricInfo.busbw_gbps * 1e9) / 8;
  const latencySec = fabricInfo.latency_us * 1e-6;
  const transferTime = p > 1 ? 2.0 * ((p - 1) / p) * ((messageMb * 1024 * 1024) / busBytesSec) : 0.0001;
  const latencyOverhead = p > 1 ? 2.0 * (p - 1) * latencySec : 0;
  const allreduceLatencyMs = Math.round((transferTime + latencyOverhead) * 1000 * 100) / 100;

  const commOverheadPct = Math.min(45, Math.max(2, Math.round((allreduceLatencyMs / (allreduceLatencyMs + 18)) * 100)));
  const scalingEfficiencyPct = Math.max(50, Math.round(100 - commOverheadPct * 0.85));
  const effectiveThroughputTokS = Math.round(totalGpus * 95 * (scalingEfficiencyPct / 100));

  const result = {
    benchmark_id: `dist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    model,
    topology,
    workload: {
      prompt_tokens: 1024,
      generated_tokens: 256,
      context_length: 1280,
      batch_size: 16,
      concurrency: 16,
    },
    allreduce_latency_ms: allreduceLatencyMs,
    effective_throughput_tok_s: effectiveThroughputTokS,
    communication_overhead_pct: commOverheadPct,
    scaling_efficiency_pct: scalingEfficiencyPct,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = DistributedBenchmarkResultSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid distributed benchmark payload", details: parsed.error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json({ status: "stored", benchmark: parsed.data }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
