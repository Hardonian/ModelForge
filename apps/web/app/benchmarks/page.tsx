import Link from 'next/link';
import { BarChart3, Filter, Search, ShieldCheck, ArrowRight } from 'lucide-react';
import { dataLayer } from '@modelforge/database';
import { VerificationBadge } from '@/components/Badges';

export default function BenchmarksIndexPage() {
  const benchmarks = dataLayer.listBenchmarks();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-sky-500/10 px-2 py-0.5 text-xs font-mono text-sky-400 border border-sky-500/20">
              OpenComputeBench Dataset
            </span>
            <span className="text-xs text-slate-400 font-mono">v1.0.0</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
            Reproducible Benchmark Observations
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Cryptographically signed, deterministic inference benchmarks across architectures, runtimes, and accelerators.
          </p>
        </div>

        <Link
          href="/docs/cli"
          className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-xs font-mono text-slate-300 hover:border-slate-500 hover:text-white transition-all"
        >
          <span>Run `modelforge benchmark` →</span>
        </Link>
      </div>

      {/* Benchmarks Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/20 shadow-xl">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4">Benchmark ID</th>
              <th className="py-3.5 px-4 font-sans">Model Repository</th>
              <th className="py-3.5 px-4">Accelerator</th>
              <th className="py-3.5 px-4">Precision</th>
              <th className="py-3.5 px-4">Runtime</th>
              <th className="py-3.5 px-4 text-right">Throughput</th>
              <th className="py-3.5 px-4 text-right">P50 TTFT</th>
              <th className="py-3.5 px-4 text-right">P50 TPOT</th>
              <th className="py-3.5 px-4 text-right">Peak VRAM</th>
              <th className="py-3.5 px-4">Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {benchmarks.map((b) => (
              <tr key={b.benchmark_id} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3.5 px-4 font-bold text-sky-400">
                  <Link href={`/benchmarks/${b.benchmark_id}`} className="hover:underline">
                    {b.benchmark_id.slice(0, 8)}...
                  </Link>
                </td>
                <td className="py-3.5 px-4 font-sans font-semibold text-white">
                  <Link href={`/models/${b.model.repository}`} className="hover:text-sky-400">
                    {b.model.repository}
                  </Link>
                </td>
                <td className="py-3.5 px-4 text-slate-200">{b.hardware.device}</td>
                <td className="py-3.5 px-4 uppercase text-slate-300 font-bold">{b.precision.type}</td>
                <td className="py-3.5 px-4 text-slate-400">{b.runtime.name} {b.runtime.version}</td>
                <td className="py-3.5 px-4 text-right font-bold text-sky-400">{b.metrics.tokens_per_second} tok/s</td>
                <td className="py-3.5 px-4 text-right">{b.metrics.ttft_ms.p50_ms} ms</td>
                <td className="py-3.5 px-4 text-right">{b.metrics.tpot_ms.p50_ms} ms</td>
                <td className="py-3.5 px-4 text-right">{(b.metrics.peak_vram_bytes / 1e9).toFixed(1)} GB</td>
                <td className="py-3.5 px-4">
                  <VerificationBadge status={b.verification.status} synthetic={b.synthetic_fixture} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
