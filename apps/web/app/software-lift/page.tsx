import Link from "next/link";
import {
  TrendingUp,
  Sparkles,
  ShieldAlert,
  Cpu,
  CheckCircle2,
  Layers,
  ArrowRight,
  Info,
} from "lucide-react";
import { dataLayer } from "@modelforge/database";

export default function SoftwareLiftPage() {
  const liftMetrics = dataLayer.listSoftwareLift();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Flagship Metric &bull; Software Lift Index</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          Software Lift: Serving Runtime Multipliers
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          Measuring the empirical throughput gain and latency reduction achieved
          on identical hardware and workload by optimizing the inference
          software stack.
        </p>
      </div>

      {/* Strict Equivalence Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 backdrop-blur-md flex items-start gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div className="space-y-1 text-xs">
          <h3 className="font-bold text-white text-sm">
            Strict Workload Equivalence Principle
          </h3>
          <p className="text-slate-300 leading-relaxed">
            Software Lift measurements are only valid when holding the{" "}
            <strong className="text-white">accelerator</strong>,{" "}
            <strong className="text-white">model revision</strong>,{" "}
            <strong className="text-white">quantization format</strong>,{" "}
            <strong className="text-white">context length</strong>, and{" "}
            <strong className="text-white">client concurrency</strong> strictly
            identical. Never compare FP16 Transformers to FP8 TensorRT-LLM and
            attribute the gain solely to software.
          </p>
        </div>
      </div>

      {/* Comparison Sections */}
      <div className="space-y-8">
        {liftMetrics.map((metric, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 md:p-8 backdrop-blur-md space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-mono uppercase text-sky-400 tracking-wider">
                  {metric.accelerator} &bull; {metric.precision.toUpperCase()}
                </span>
                <h2 className="text-xl font-bold text-white mt-0.5">
                  {metric.model_id}
                </h2>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  Revision: {metric.model_revision} | Context:{" "}
                  {metric.context_length.toLocaleString()} tokens
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/planner?model=${metric.model_id}`}
                  className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-3.5 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/20 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Deploy Highest Lift</span>
                </Link>
              </div>
            </div>

            {/* Baseline Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Baseline */}
              <div className="rounded-xl border border-slate-800 bg-[#070b14] p-4 text-center">
                <div className="text-[11px] font-mono text-slate-400">
                  Baseline (Transformers)
                </div>
                <div className="text-2xl font-bold text-white mt-1">
                  {metric.baseline_tps}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    tok/s
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  1.00x reference
                </div>
              </div>

              {/* Comparisons */}
              {metric.comparisons.map((c, cIdx) => {
                const isMax = cIdx === metric.comparisons.length - 1;
                return (
                  <div
                    key={c.runtime}
                    className={`rounded-xl p-4 text-center ${
                      isMax
                        ? "border border-emerald-500/40 bg-emerald-950/20"
                        : "border border-slate-800 bg-[#070b14]"
                    }`}
                  >
                    <div className="text-[11px] font-mono text-slate-300 capitalize">
                      {c.runtime}
                    </div>
                    <div
                      className={`text-2xl font-bold mt-1 ${isMax ? "text-emerald-300" : "text-sky-300"}`}
                    >
                      {c.tps}{" "}
                      <span className="text-xs font-normal text-slate-400">
                        tok/s
                      </span>
                    </div>
                    <div className="text-[11px] font-mono font-bold text-emerald-400 mt-1">
                      +{c.throughput_lift}x Lift
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      -{c.ttft_reduction_percent}% TTFT
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Visual Bar Comparison */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-mono text-slate-400">
                Throughput Progression (tok/s):
              </div>
              <div className="space-y-2 text-xs font-mono">
                {/* Baseline Bar */}
                <div className="flex items-center gap-3">
                  <span className="w-36 truncate text-slate-400">
                    Transformers
                  </span>
                  <div className="flex-1 bg-slate-800/80 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-slate-500 h-full rounded-full text-[10px] text-white flex items-center pl-2 font-bold"
                      style={{ width: `${(metric.baseline_tps / 110) * 100}%` }}
                    >
                      {metric.baseline_tps}
                    </div>
                  </div>
                  <span className="w-16 text-right text-slate-500">1.00x</span>
                </div>

                {/* Comparison Bars */}
                {metric.comparisons.map((c) => (
                  <div key={c.runtime} className="flex items-center gap-3">
                    <span className="w-36 truncate text-white">
                      {c.runtime}
                    </span>
                    <div className="flex-1 bg-slate-800/80 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-sky-500 to-emerald-400 h-full rounded-full text-[10px] text-black flex items-center pl-2 font-bold"
                        style={{ width: `${(c.tps / 110) * 100}%` }}
                      >
                        {c.tps}
                      </div>
                    </div>
                    <span className="w-16 text-right text-emerald-400 font-bold">
                      +{c.throughput_lift}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
