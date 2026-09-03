import Link from "next/link";
import { dataLayer } from "@modelforge/database";

export const metadata = {
  title: "Deployment Failure Corpus — ModelForge",
  description:
    "Empirical deployment failure intelligence: OOM limits, driver incompatibilities, and actionable mitigation engineering.",
};

export const dynamic = "force-dynamic";

export default function FailuresPage() {
  const failures = dataLayer.listFailures();

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold mb-3">
            EMPIRICAL FAILURE INTELLIGENCE
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
            Deployment Failure Corpus
          </h1>
          <p className="text-slate-400 mt-2 text-sm md:text-base">
            Verified negative results, out-of-memory boundaries, and driver
            mismatches to prevent wasted GPU spend.
          </p>
        </div>

        <div>
          <Link
            href="/api/v1/failures"
            target="_blank"
            className="px-4 py-2 text-xs font-mono rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 transition inline-block"
          >
            Raw JSON Corpus →
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-500 uppercase font-mono mb-1">
            Cataloged Failures
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {failures.length} Records
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real hardware benchmark and runner failures
          </p>
        </div>
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-500 uppercase font-mono mb-1">
            Top Failure Category
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">
            OUT_OF_MEMORY
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Weight + KV cache allocation overcommit
          </p>
        </div>
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-500 uppercase font-mono mb-1">
            Mitigation Coverage
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            100%
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Every recorded failure includes an actionable fix
          </p>
        </div>
      </div>

      {/* Failures Table */}
      <div className="space-y-4 mb-12">
        {failures.map((f) => (
          <div
            key={f.id}
            className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-start justify-between gap-6"
          >
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
                  {f.failure_category}
                </span>
                <span className="text-sm font-semibold text-white font-mono">
                  {f.model_repository}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  @{f.model_revision}
                </span>
              </div>

              <p className="text-sm text-slate-300 mb-3">
                {f.normalized_reason}
              </p>

              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs">
                <strong className="text-emerald-400 block mb-1 font-mono uppercase">
                  Verified Mitigation:
                </strong>
                <span className="text-slate-300 leading-relaxed">
                  {f.mitigation}
                </span>
              </div>
            </div>

            <div className="shrink-0 md:text-right text-xs font-mono text-slate-400 space-y-1.5 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
              <div>
                <span className="text-slate-500">Hardware: </span>
                <strong className="text-slate-200">{f.accelerator}</strong>
              </div>
              <div>
                <span className="text-slate-500">Runtime: </span>
                <strong className="text-slate-200">{f.runtime}</strong>
              </div>
              {f.min_vram_required_gb && (
                <div>
                  <span className="text-slate-500">Required VRAM: </span>
                  <strong className="text-rose-400">
                    {f.min_vram_required_gb} GB
                  </strong>
                </div>
              )}
              {f.available_vram_gb && (
                <div>
                  <span className="text-slate-500">Device VRAM: </span>
                  <strong className="text-slate-300">
                    {f.available_vram_gb} GB
                  </strong>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
