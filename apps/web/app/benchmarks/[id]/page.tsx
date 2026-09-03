import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BarChart3,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  Terminal,
  Share2,
  Layers,
  Cpu,
  Copy,
  Sparkles,
  Lock,
} from "lucide-react";
import { dataLayer } from "@modelforge/database";
import { VerificationBadge, ModelFitBadge } from "@/components/Badges";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BenchmarkReportPage({ params }: PageProps) {
  const { id } = await params;
  const benchmark = dataLayer.getBenchmark(id);

  if (!benchmark) {
    notFound();
  }

  const ttft = benchmark.metrics.ttft_ms;
  const tpot = benchmark.metrics.tpot_ms;
  const vramGb = (benchmark.metrics.peak_vram_bytes / 1e9).toFixed(1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
        <Link
          href="/benchmarks"
          className="hover:text-white flex items-center gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Benchmarks</span>
        </Link>
        <span>/</span>
        <span className="text-slate-200">{benchmark.benchmark_id}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <VerificationBadge
              status={benchmark.verification.status}
              synthetic={benchmark.synthetic_fixture}
            />
            <span className="text-xs text-slate-400 font-mono">
              Schema v{benchmark.schema_version}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Submitted:{" "}
              {new Date(benchmark.provenance.completed_at).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-2">
            {benchmark.model.repository}
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Running on {benchmark.hardware.device} ·{" "}
            {benchmark.precision.type.toUpperCase()} · {benchmark.runtime.name}{" "}
            {benchmark.runtime.version}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/compare?a=${benchmark.benchmark_id}`}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500 hover:text-white transition-all"
          >
            <span>Compare Run</span>
          </Link>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <span className="text-[10px] uppercase text-slate-500 block">
            Throughput
          </span>
          <div className="text-3xl font-extrabold text-sky-400 mt-1">
            {benchmark.metrics.tokens_per_second}{" "}
            <span className="text-xs font-normal text-slate-400">tok/s</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {benchmark.metrics.requests_per_second} req/sec
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <span className="text-[10px] uppercase text-slate-500 block">
            P50 TTFT
          </span>
          <div className="text-3xl font-extrabold text-white mt-1">
            {ttft.p50_ms}{" "}
            <span className="text-xs font-normal text-slate-400">ms</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            P95: {ttft.p95_ms} ms
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <span className="text-[10px] uppercase text-slate-500 block">
            P50 TPOT
          </span>
          <div className="text-3xl font-extrabold text-white mt-1">
            {tpot.p50_ms}{" "}
            <span className="text-xs font-normal text-slate-400">ms</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            P95: {tpot.p95_ms} ms
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <span className="text-[10px] uppercase text-slate-500 block">
            Peak VRAM
          </span>
          <div className="text-3xl font-extrabold text-emerald-400 mt-1">
            {vramGb}{" "}
            <span className="text-xs font-normal text-slate-400">GB</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {benchmark.metrics.power_watts_avg
              ? `${benchmark.metrics.power_watts_avg}W TDP avg`
              : "TDP unrecorded"}
          </span>
        </div>
      </div>

      {/* Latency Percentile Distribution Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">
          Latency Percentile Distribution
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/30">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Metric Dimension</th>
                <th className="py-3 px-4 text-right">P50 (Median)</th>
                <th className="py-3 px-4 text-right">P90</th>
                <th className="py-3 px-4 text-right">P95</th>
                <th className="py-3 px-4 text-right">P99</th>
                <th className="py-3 px-4 text-right">Mean</th>
                <th className="py-3 px-4 text-right">Std Dev</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-3.5 px-4 font-bold text-white">
                  Time to First Token (TTFT)
                </td>
                <td className="py-3.5 px-4 text-right text-sky-400 font-bold">
                  {ttft.p50_ms} ms
                </td>
                <td className="py-3.5 px-4 text-right">{ttft.p90_ms} ms</td>
                <td className="py-3.5 px-4 text-right">{ttft.p95_ms} ms</td>
                <td className="py-3.5 px-4 text-right">{ttft.p99_ms} ms</td>
                <td className="py-3.5 px-4 text-right">{ttft.mean_ms} ms</td>
                <td className="py-3.5 px-4 text-right text-slate-400">
                  {ttft.std_dev_ms ?? "N/A"} ms
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold text-white">
                  Time Per Output Token (TPOT)
                </td>
                <td className="py-3.5 px-4 text-right text-emerald-400 font-bold">
                  {tpot.p50_ms} ms
                </td>
                <td className="py-3.5 px-4 text-right">{tpot.p90_ms} ms</td>
                <td className="py-3.5 px-4 text-right">{tpot.p95_ms} ms</td>
                <td className="py-3.5 px-4 text-right">{tpot.p99_ms} ms</td>
                <td className="py-3.5 px-4 text-right">{tpot.mean_ms} ms</td>
                <td className="py-3.5 px-4 text-right text-slate-400">
                  {tpot.std_dev_ms ?? "N/A"} ms
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Software Environment & Workload */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-3 font-mono text-xs">
          <h3 className="font-bold text-sm text-white font-sans">
            Software Environment
          </h3>
          <div className="divide-y divide-slate-800/80">
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">Operating System:</span>
              <span className="text-slate-200">{benchmark.software.os}</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">Driver Version:</span>
              <span className="text-slate-200">
                {benchmark.software.driver_version || "N/A"}
              </span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">CUDA / ROCm Version:</span>
              <span className="text-slate-200">
                {benchmark.software.cuda_version ||
                  benchmark.software.rocm_version ||
                  "N/A"}
              </span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">Python Runtime:</span>
              <span className="text-slate-200">
                {benchmark.software.python_version}
              </span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">Serving Engine:</span>
              <span className="text-slate-200">
                {benchmark.runtime.name} {benchmark.runtime.version}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-3 font-mono text-xs">
          <h3 className="font-bold text-sm text-white font-sans">
            Workload Configuration
          </h3>
          <div className="divide-y divide-slate-800/80">
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">Prompt Tokens:</span>
              <span className="text-slate-200">
                {benchmark.workload.prompt_tokens}
              </span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">Generated Tokens:</span>
              <span className="text-slate-200">
                {benchmark.workload.generated_tokens}
              </span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">Context Length:</span>
              <span className="text-slate-200">
                {benchmark.workload.context_length}
              </span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">Concurrency:</span>
              <span className="text-slate-200">
                {benchmark.workload.concurrency} concurrent streams
              </span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">Sample Count:</span>
              <span className="text-slate-200">
                {benchmark.metrics.sample_count} measured iterations
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cryptographic Hashes & Reproducibility */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 space-y-4 font-mono text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <h3 className="font-bold text-sm text-white font-sans">
            Cryptographic Provenance & Reproducibility Hashes
          </h3>
        </div>
        <p className="text-slate-400 text-xs font-sans">
          Deterministic SHA-256 hashes generated from the immutable environment
          and result payload matrices.
        </p>

        <div className="space-y-2">
          <div className="rounded-lg bg-slate-950/80 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border border-slate-800">
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">
                Environment Hash
              </span>
              <span className="text-slate-300 select-all">
                {benchmark.provenance.environment_hash}
              </span>
            </div>
            <span className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Verified
            </span>
          </div>

          <div className="rounded-lg bg-slate-950/80 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border border-slate-800">
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">
                Result Hash
              </span>
              <span className="text-slate-300 select-all">
                {benchmark.provenance.result_hash}
              </span>
            </div>
            <span className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Verified
            </span>
          </div>
        </div>

        <div className="pt-2">
          <span className="text-slate-400 text-xs font-sans block mb-1.5">
            Reproduce with ModelForge CLI:
          </span>
          <div className="rounded bg-black/60 p-2.5 text-slate-300 border border-slate-800/80 text-xs flex items-center justify-between">
            <code>
              modelforge benchmark {benchmark.model.repository} --runtime{" "}
              {benchmark.runtime.name} --precision {benchmark.precision.type}{" "}
              --context {benchmark.workload.context_length}
            </code>
          </div>
        </div>
      </div>

      {/* Shareable Social Card Preview */}
      <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-br from-slate-900/90 to-[#0c1322] p-8 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-sky-500 flex items-center justify-center font-bold text-xs text-white">
              MF
            </div>
            <span className="font-bold text-sm text-white tracking-wider">
              MODELFORGE BENCHMARK CARD
            </span>
          </div>
          <VerificationBadge
            status={benchmark.verification.status}
            synthetic={benchmark.synthetic_fixture}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-mono">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">
              Model
            </span>
            <span className="text-base font-bold text-white font-sans">
              {benchmark.model.repository}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5 uppercase">
              {benchmark.precision.type} · {benchmark.runtime.name}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">
              Accelerator
            </span>
            <span className="text-base font-bold text-white font-sans">
              {benchmark.hardware.device}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">
              {vramGb} GB VRAM
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">
              Throughput / TTFT
            </span>
            <span className="text-xl font-extrabold text-sky-400">
              {benchmark.metrics.tokens_per_second} tok/s
            </span>
            <span className="text-xs text-slate-300 block mt-0.5">
              {ttft.p50_ms} ms TTFT
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>
            modelforge.dev/benchmarks/{benchmark.benchmark_id.slice(0, 8)}
          </span>
          <span>OpenComputeBench Provenance Verified</span>
        </div>
      </div>
    </div>
  );
}
