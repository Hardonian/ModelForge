import Link from 'next/link';
import { ShieldCheck, ArrowRight, Sparkles, Cpu, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { dataLayer } from '@modelforge/database';

export default function PassportsPage() {
  const passports = dataLayer.listComputePassports();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>ModelForge Compute Passport Registry v2.0.0</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          Compute Passports
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          Revision-specific deployment specifications providing empirical evidence provenance, 
          hardware execution limits, and multi-runtime compatibility matrices for open-weight AI models.
        </p>
      </div>

      {/* Grid of Passports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {passports.map((passport) => {
          const freshnessColor = 
            passport.coverage.freshness_status === 'CURRENT'
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
              : 'text-amber-400 bg-amber-500/10 border-amber-500/30';

          return (
            <div
              key={passport.passport_id}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg backdrop-blur-sm space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500">{passport.architecture}</span>
                    <h2 className="text-base font-bold text-white leading-snug">
                      <Link href={`/passports/${passport.model_id}`} className="hover:text-sky-400 transition-colors">
                        {passport.model_id}
                      </Link>
                    </h2>
                    <span className="text-[11px] font-mono text-amber-400/90">@{passport.revision}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${freshnessColor}`}>
                    {passport.coverage.freshness_status}
                  </span>
                </div>

                {/* Parameters & Confidence */}
                <div className="grid grid-cols-3 gap-2 py-3 px-3 rounded-xl border border-slate-800/80 bg-[#070b14] text-center text-xs">
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono">Parameters</div>
                    <div className="font-bold text-white">{passport.parameters_billions}B</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono">Min VRAM</div>
                    <div className="font-bold text-amber-300">{passport.memory_profile.min_vram_gb} GB</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono">Confidence</div>
                    <div className="font-bold text-sky-400">{passport.confidence.score}/100</div>
                  </div>
                </div>

                {/* Compatibility Badges */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-mono text-slate-400">Verified Target Support:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(passport.compatibility).slice(0, 5).map(([target, claim]) => (
                      <span
                        key={target}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          claim.status === 'supported'
                            ? 'bg-slate-800 text-slate-200 border-slate-700'
                            : 'bg-amber-950/30 text-amber-300 border-amber-800/40'
                        }`}
                      >
                        {target}: <strong className={claim.provenance === 'MEASURED' ? 'text-emerald-400' : 'text-slate-400'}>{claim.provenance}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <Link
                  href={`/passports/${passport.model_id}`}
                  className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                >
                  View Passport <ArrowRight className="h-3 w-3" />
                </Link>
                <Link
                  href={`/planner?model=${passport.model_id}`}
                  className="rounded-lg bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 text-xs font-semibold text-sky-300 hover:bg-sky-500/20 transition-all flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  Plan SLO
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
