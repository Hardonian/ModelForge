import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ShieldCheck,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Layers,
  Cpu,
  HardDrive,
  Activity,
  Server,
  ArrowRight,
  Clock,
} from "lucide-react";
import { dataLayer } from "@modelforge/database";

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function PassportDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const modelId = slug.join("/");
  const passport = dataLayer.getComputePassport(modelId);

  if (!passport) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header / Identity Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-[#070d1a] to-slate-900 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-0.5 text-xs font-medium text-sky-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                Compute Passport v2.0.0
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                <Clock className="h-3 w-3" />
                {passport.coverage.freshness_status}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {passport.model_id}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400">
              <span className="text-amber-400">
                revision: {passport.revision}
              </span>
              <span>&bull;</span>
              <span>arch: {passport.architecture}</span>
              <span>&bull;</span>
              <span>params: {passport.parameters_billions}B</span>
              <span>&bull;</span>
              <span>
                context: {passport.context_window.toLocaleString()} tok
              </span>
              <span>&bull;</span>
              <span>license: {passport.license}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={passport.hf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:text-white hover:border-slate-600 transition-all"
            >
              <span>Hugging Face Hub</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </a>
            <Link
              href={`/planner?model=${passport.model_id}`}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Compile Deployment Plan</span>
            </Link>
          </div>
        </div>

        {/* Confidence & Coverage Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-800 bg-[#070b14] p-4 text-center">
            <div className="text-[11px] font-mono text-slate-400">
              Passport Confidence
            </div>
            <div className="text-2xl font-bold text-sky-400 mt-1">
              {passport.confidence.score}/100
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Empirical Evidence Score
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-[#070b14] p-4 text-center">
            <div className="text-[11px] font-mono text-slate-400">
              Multi-Run Benchmarks
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {passport.coverage.total_benchmarks}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Across {passport.coverage.accelerators_tested.length} Accelerators
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-[#070b14] p-4 text-center">
            <div className="text-[11px] font-mono text-slate-400">
              Verified Reproductions
            </div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              {passport.coverage.total_reproductions}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Hardware Match Delta &le; 3%
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-[#070b14] p-4 text-center">
            <div className="text-[11px] font-mono text-slate-400">
              Recommended VRAM
            </div>
            <div className="text-2xl font-bold text-amber-300 mt-1">
              {passport.memory_profile.recommended_vram_gb} GB
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Min Headroom: {passport.memory_profile.min_vram_gb} GB
            </div>
          </div>
        </div>
      </div>

      {/* Target Compatibility Matrix with Provenance */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              Execution Target Compatibility & Evidence Provenance
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Empirical status across inference runtimes, container images, and
              cloud orchestration systems.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 font-mono">
              <tr>
                <th className="pb-3 pr-4">Runtime / Target</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4">Provenance</th>
                <th className="pb-3 pl-4">Technical Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {Object.entries(passport.compatibility).map(([target, claim]) => {
                const isMeasured = claim.provenance === "MEASURED";
                const isSupported = claim.status === "supported";

                return (
                  <tr
                    key={target}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 pr-4 font-mono font-semibold text-white capitalize">
                      {target}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                          isSupported
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {claim.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                          isMeasured
                            ? "bg-sky-500/10 text-sky-300 border border-sky-500/30 font-bold"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}
                      >
                        {claim.provenance}
                      </span>
                    </td>
                    <td className="py-3 pl-4 text-slate-400 text-[11px]">
                      {claim.notes ||
                        "Compatibility verified against standard test matrix."}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deployment Profiles & Recommended Topologies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Server className="h-4 w-4 text-sky-400" />
            Recommended Deployment Topologies
          </h2>
          <div className="space-y-3 text-xs">
            {passport.deployment_profiles.nvidia_optimized && (
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-1">
                <div className="font-mono text-[10px] text-emerald-400 uppercase font-bold">
                  NVIDIA Optimized Target
                </div>
                <div className="font-semibold text-white">
                  {passport.deployment_profiles.nvidia_optimized}
                </div>
              </div>
            )}
            {passport.deployment_profiles.lowest_latency && (
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 space-y-1">
                <div className="font-mono text-[10px] text-indigo-400 uppercase font-bold">
                  Lowest Latency (P95 TTFT)
                </div>
                <div className="font-semibold text-white">
                  {passport.deployment_profiles.lowest_latency}
                </div>
              </div>
            )}
            {passport.deployment_profiles.lowest_cost && (
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 space-y-1">
                <div className="font-mono text-[10px] text-sky-400 uppercase font-bold">
                  Lowest Cost per 1M Tokens
                </div>
                <div className="font-semibold text-white">
                  {passport.deployment_profiles.lowest_cost}
                </div>
              </div>
            )}
            {passport.deployment_profiles.highest_throughput && (
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 space-y-1">
                <div className="font-mono text-[10px] text-amber-400 uppercase font-bold">
                  Highest Throughput
                </div>
                <div className="font-semibold text-white">
                  {passport.deployment_profiles.highest_throughput}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Memory Intelligence */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-amber-400" />
            Memory Footprint by Precision
          </h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/80">
              <div className="text-[10px] font-mono text-slate-400">
                FP16 / BF16
              </div>
              <div className="text-lg font-bold text-white mt-1">
                {passport.memory_profile.weights_fp16_gb} GB
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                2.0 bytes / param
              </div>
            </div>
            <div className="p-3 rounded-xl border border-sky-500/30 bg-sky-500/10">
              <div className="text-[10px] font-mono text-sky-300">
                FP8 Quantized
              </div>
              <div className="text-lg font-bold text-sky-200 mt-1">
                {passport.memory_profile.weights_fp8_gb} GB
              </div>
              <div className="text-[10px] text-sky-400/80 mt-0.5">
                1.0 byte / param
              </div>
            </div>
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/80">
              <div className="text-[10px] font-mono text-slate-400">
                INT4 / AWQ
              </div>
              <div className="text-lg font-bold text-white mt-1">
                {passport.memory_profile.weights_int4_gb} GB
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                0.55 bytes / param
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-800 bg-[#070b14] text-xs text-slate-300 leading-relaxed">
            <strong className="text-white">
              Inference KV Cache Recommendation:
            </strong>{" "}
            Serving at full context ({passport.context_window.toLocaleString()}{" "}
            tokens) requires dedicated KV cache headroom. On NVIDIA Ada/Hopper,
            FP8 KV cache reduces memory pressure by 50% without perplexity
            degradation.
          </div>
        </div>
      </div>
    </div>
  );
}
