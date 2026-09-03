import Link from 'next/link';
import { Search, Filter, Cpu, Layers, BarChart3, ArrowRight } from 'lucide-react';
import { dataLayer } from '@modelforge/database';
import { HARDWARE_CATALOG } from '@modelforge/hardware-registry';
import { VerificationBadge, ModelFitBadge } from '@/components/Badges';

export default function ExplorePage() {
  const models = dataLayer.listModels();
  const hardware = HARDWARE_CATALOG;
  const benchmarks = dataLayer.listBenchmarks();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Explore the Compute Matrix</h1>
        <p className="text-sm text-slate-400 mt-1">
          Search across validated AI models, compute accelerators, serving runtimes, and benchmark observations.
        </p>
      </div>

      {/* Search Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-slate-800 pb-6">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search models, GPUs (e.g. Qwen, H100, RTX 4090)..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span>{models.length} Models</span>
            <span className="text-slate-600">·</span>
            <span>{hardware.length} Accelerators</span>
            <span className="text-slate-600">·</span>
            <span>{benchmarks.length} Benchmarks</span>
          </div>
        </div>
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Models Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-sky-400" />
              <h2 className="text-base font-bold text-white">Models</h2>
            </div>
            <Link href="/models" className="text-xs text-sky-400 hover:text-sky-300">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {models.map((m) => (
              <Link
                key={m.id}
                href={`/models/${m.id}`}
                className="block rounded-lg border border-slate-800 bg-slate-900/40 p-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-white">{m.name}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{m.id}</p>
                  </div>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                    {m.parameters_billions}B
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                  <span>Context: {m.context_window / 1000}k</span>
                  <span>·</span>
                  <span>{m.task}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Hardware Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Accelerators</h2>
            </div>
            <Link href="/hardware" className="text-xs text-emerald-400 hover:text-emerald-300">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {hardware.slice(0, 5).map((h) => (
              <Link
                key={h.id}
                href={`/hardware/${h.vendor}/${h.slug}`}
                className="block rounded-lg border border-slate-800 bg-slate-900/40 p-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-white">{h.name}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{h.manufacturer.architecture}</p>
                  </div>
                  <span className="rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-semibold">
                    {Math.round(h.manufacturer.vram_bytes / 1e9)} GB
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                  <span>Bandwidth: {h.manufacturer.memory_bandwidth_gb_s} GB/s</span>
                  <span>·</span>
                  <span>{h.manufacturer.tdp_watts}W TDP</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Benchmarks Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Top Benchmarks</h2>
            </div>
            <Link href="/benchmarks" className="text-xs text-indigo-400 hover:text-indigo-300">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {benchmarks.slice(0, 5).map((b) => (
              <Link
                key={b.benchmark_id}
                href={`/benchmarks/${b.benchmark_id}`}
                className="block rounded-lg border border-slate-800 bg-slate-900/40 p-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-xs text-white">{b.model.repository}</h3>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {b.hardware.device} · {b.precision.type.toUpperCase()}
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold text-sky-400">
                    {b.metrics.tokens_per_second} tps
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-400">TTFT: {b.metrics.ttft_ms.p50_ms}ms</span>
                  <VerificationBadge status={b.verification.status} synthetic={b.synthetic_fixture} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
