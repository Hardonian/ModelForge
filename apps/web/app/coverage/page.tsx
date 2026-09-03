import { dataLayer } from "@modelforge/database";
import { Table, Layers, Cpu, ShieldCheck, AlertTriangle, XCircle, Clock, Zap } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function CoveragePage() {
  const matrix = dataLayer.getCoverageMatrix();

  const coveredCount = matrix.filter((c) => c.status === "covered").length;
  const staleCount = matrix.filter((c) => c.status === "stale").length;
  const failedCount = matrix.filter((c) => c.status === "failed").length;
  const untestedCount = matrix.filter((c) => c.status === "untested").length;
  const highPriorityGaps = matrix
    .filter((c) => c.status === "untested")
    .sort((a, b) => b.gap_priority - a.gap_priority)
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
          <Layers className="h-3.5 w-3.5" />
          <span>Active Learning & Empirical Evidence Matrix</span>
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Benchmark Coverage Matrix
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-3xl">
          ModelForge maps every model × accelerator × runtime × precision tuple. Gaps in empirical evidence are scored by active learning priority and scheduled across distributed workers.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="h-4 w-4" />
            <span>COVERED CELLS</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{coveredCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Verified reproducible evidence</p>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-4">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
            <Clock className="h-4 w-4" />
            <span>STALE CELLS</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{staleCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">&gt; 90 days since retest</p>
        </div>

        <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-4">
          <div className="flex items-center gap-2 text-red-400 text-xs font-semibold">
            <XCircle className="h-4 w-4" />
            <span>KNOWN FAILURES</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{failedCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">OOM or architectural mismatch</p>
        </div>

        <div className="rounded-xl border border-sky-500/20 bg-sky-950/10 p-4">
          <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold">
            <Zap className="h-4 w-4" />
            <span>UNTESTED CELLS</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{untestedCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Scheduled by active learning</p>
        </div>
      </div>

      {/* High Priority Active Learning Gaps */}
      <div className="mb-8 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          Highest-Priority Evidence Gaps (Active Learning Queue)
        </h2>
        <p className="text-xs text-slate-400 mt-1 mb-4">
          These configurations have high frontier model adoption and accelerator demand. ModelForge automatically queues these jobs for community and organization workers.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {highPriorityGaps.map((gap, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/40 p-3"
            >
              <div className="overflow-hidden pr-2">
                <div className="font-mono text-xs font-bold text-white truncate">
                  {gap.model_repository.split("/")[1] || gap.model_repository}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {gap.accelerator} • <span className="text-sky-400">{gap.runtime}</span> ({gap.precision})
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                  Priority {gap.gap_priority}
                </span>
                <span className="text-[10px] text-slate-500 mt-1">Queued</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Complete Matrix Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
        <div className="border-b border-slate-800 px-5 py-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Full Configuration Matrix ({matrix.length} tuples)</h3>
          <span className="text-xs text-slate-400">Deterministic Active Learning Priority</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/50 text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Model Repository</th>
                <th className="py-3 px-4 font-semibold">Accelerator</th>
                <th className="py-3 px-4 font-semibold">Runtime</th>
                <th className="py-3 px-4 font-semibold">Precision</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Measured Tok/s</th>
                <th className="py-3 px-4 font-semibold">Gap Priority</th>
                <th className="py-3 px-4 font-semibold text-right">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {matrix.map((cell, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-white truncate max-w-[220px]">
                    {cell.model_repository}
                  </td>
                  <td className="py-3 px-4">{cell.accelerator}</td>
                  <td className="py-3 px-4 font-mono text-sky-400">{cell.runtime}</td>
                  <td className="py-3 px-4 font-mono uppercase text-[11px]">{cell.precision}</td>
                  <td className="py-3 px-4">
                    {cell.status === "covered" ? (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                        <ShieldCheck className="h-3 w-3" />
                        COVERED
                      </span>
                    ) : cell.status === "stale" ? (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-400 border border-amber-500/20">
                        <Clock className="h-3 w-3" />
                        STALE
                      </span>
                    ) : cell.status === "failed" ? (
                      <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-400 border border-red-500/20">
                        <XCircle className="h-3 w-3" />
                        FAILED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-400">
                        UNTESTED
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-white">
                    {cell.measured_throughput_tok_s ? `${cell.measured_throughput_tok_s} tok/s` : "—"}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full ${cell.gap_priority > 70 ? "bg-amber-400" : "bg-sky-400"}`}
                          style={{ width: `${cell.gap_priority}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">{cell.gap_priority}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {cell.benchmark_ids.length > 0 ? (
                      <Link
                        href={`/benchmarks/${cell.benchmark_ids[0]}`}
                        className="text-sky-400 hover:text-sky-300 font-mono text-[11px] underline"
                      >
                        {cell.benchmark_ids[0]?.slice(0, 8)}...
                      </Link>
                    ) : (
                      <span className="text-slate-600 text-[11px]">Unmeasured</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
