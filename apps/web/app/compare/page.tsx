import Link from "next/link";
import {
  Scale,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Cpu,
} from "lucide-react";
import { dataLayer } from "@modelforge/database";
import { VerificationBadge } from "@/components/Badges";

interface PageProps {
  searchParams: Promise<{
    a?: string;
    b?: string;
  }>;
}

export default async function ComparePage({ searchParams }: PageProps) {
  const { a, b } = await searchParams;
  const benchmarks = dataLayer.listBenchmarks();

  const runA =
    benchmarks.find((item) => item.benchmark_id === a) || benchmarks[0]!;
  const runB =
    benchmarks.find((item) => item.benchmark_id === b) ||
    benchmarks[1] ||
    benchmarks[0]!;

  const tps1 = runA.metrics.tokens_per_second;
  const tps2 = runB.metrics.tokens_per_second;
  const tpsDelta = tps1 > 0 ? (((tps2 - tps1) / tps1) * 100).toFixed(1) : "0";

  const ttft1 = runA.metrics.ttft_ms.p50_ms;
  const ttft2 = runB.metrics.ttft_ms.p50_ms;
  const ttftDelta =
    ttft1 > 0 ? (((ttft2 - ttft1) / ttft1) * 100).toFixed(1) : "0";

  const vram1 = Number((runA.metrics.peak_vram_bytes / 1e9).toFixed(1));
  const vram2 = Number((runB.metrics.peak_vram_bytes / 1e9).toFixed(1));
  const vramDelta = (vram2 - vram1).toFixed(1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-sky-400" />
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Configuration Comparison
          </h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Direct empirical side-by-side performance delta analysis between
          benchmark runs.
        </p>
      </div>

      {/* Selector Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl border border-slate-800 bg-slate-900/40">
        <div>
          <label className="text-xs font-mono text-slate-400 block mb-1">
            Configuration A
          </label>
          <div className="text-sm font-bold text-white font-sans">
            {runA.model.repository}
          </div>
          <div className="text-xs font-mono text-slate-400">
            {runA.hardware.device} · {runA.precision.type.toUpperCase()} ·{" "}
            {runA.runtime.name}
          </div>
        </div>

        <div>
          <label className="text-xs font-mono text-slate-400 block mb-1">
            Configuration B
          </label>
          <div className="text-sm font-bold text-white font-sans">
            {runB.model.repository}
          </div>
          <div className="text-xs font-mono text-slate-400">
            {runB.hardware.device} · {runB.precision.type.toUpperCase()} ·{" "}
            {runB.runtime.name}
          </div>
        </div>
      </div>

      {/* Comparison Delta Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/30">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4">Dimension</th>
              <th className="py-3.5 px-4">
                Config A ({runA.benchmark_id.slice(0, 8)})
              </th>
              <th className="py-3.5 px-4">
                Config B ({runB.benchmark_id.slice(0, 8)})
              </th>
              <th className="py-3.5 px-4">Delta / Advantage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            <tr>
              <td className="py-3.5 px-4 font-sans font-bold text-white">
                Model Architecture
              </td>
              <td className="py-3.5 px-4">
                {runA.model.architecture} ({runA.model.parameters_billions}B)
              </td>
              <td className="py-3.5 px-4">
                {runB.model.architecture} ({runB.model.parameters_billions}B)
              </td>
              <td className="py-3.5 px-4 text-slate-400">
                {runA.model.parameters_billions ===
                runB.model.parameters_billions
                  ? "Identical parameters"
                  : `${(runB.model.parameters_billions - runA.model.parameters_billions).toFixed(1)}B difference`}
              </td>
            </tr>
            <tr>
              <td className="py-3.5 px-4 font-sans font-bold text-white">
                Accelerator Hardware
              </td>
              <td className="py-3.5 px-4">{runA.hardware.device}</td>
              <td className="py-3.5 px-4">{runB.hardware.device}</td>
              <td className="py-3.5 px-4 text-slate-400">
                {runA.hardware.vendor} vs {runB.hardware.vendor}
              </td>
            </tr>
            <tr>
              <td className="py-3.5 px-4 font-sans font-bold text-white">
                Throughput (Tokens/sec)
              </td>
              <td className="py-3.5 px-4 font-bold text-sky-400">
                {tps1} tok/s
              </td>
              <td className="py-3.5 px-4 font-bold text-sky-400">
                {tps2} tok/s
              </td>
              <td className="py-3.5 px-4">
                <span
                  className={`font-bold ${Number(tpsDelta) > 0 ? "text-emerald-400" : "text-rose-400"}`}
                >
                  {Number(tpsDelta) > 0
                    ? `+${tpsDelta}% B faster`
                    : `${tpsDelta}% A faster`}
                </span>
              </td>
            </tr>
            <tr>
              <td className="py-3.5 px-4 font-sans font-bold text-white">
                P50 TTFT (Pre-fill Latency)
              </td>
              <td className="py-3.5 px-4">{ttft1} ms</td>
              <td className="py-3.5 px-4">{ttft2} ms</td>
              <td className="py-3.5 px-4">
                <span
                  className={`font-bold ${Number(ttftDelta) < 0 ? "text-emerald-400" : "text-rose-400"}`}
                >
                  {Number(ttftDelta) < 0
                    ? `${ttftDelta}% B lower`
                    : `+${ttftDelta}% B higher`}
                </span>
              </td>
            </tr>
            <tr>
              <td className="py-3.5 px-4 font-sans font-bold text-white">
                Peak VRAM Allocation
              </td>
              <td className="py-3.5 px-4">{vram1} GB</td>
              <td className="py-3.5 px-4">{vram2} GB</td>
              <td className="py-3.5 px-4">
                <span
                  className={`font-bold ${Number(vramDelta) <= 0 ? "text-emerald-400" : "text-amber-400"}`}
                >
                  {Number(vramDelta) <= 0
                    ? `${vramDelta} GB`
                    : `+${vramDelta} GB`}
                </span>
              </td>
            </tr>
            <tr>
              <td className="py-3.5 px-4 font-sans font-bold text-white">
                Serving Runtime
              </td>
              <td className="py-3.5 px-4">
                {runA.runtime.name} {runA.runtime.version}
              </td>
              <td className="py-3.5 px-4">
                {runB.runtime.name} {runB.runtime.version}
              </td>
              <td className="py-3.5 px-4 text-slate-400">
                {runA.runtime.name === runB.runtime.name
                  ? "Identical runtime"
                  : "Different engines"}
              </td>
            </tr>
            <tr>
              <td className="py-3.5 px-4 font-sans font-bold text-white">
                Verification Status
              </td>
              <td className="py-3.5 px-4">
                <VerificationBadge
                  status={runA.verification.status}
                  synthetic={runA.synthetic_fixture}
                />
              </td>
              <td className="py-3.5 px-4">
                <VerificationBadge
                  status={runB.verification.status}
                  synthetic={runB.synthetic_fixture}
                />
              </td>
              <td className="py-3.5 px-4 text-slate-400">
                Cryptographically signed
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
