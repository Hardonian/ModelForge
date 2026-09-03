import Link from "next/link";
import {
  Gauge,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers,
  Cpu,
} from "lucide-react";
import { dataLayer } from "@modelforge/database";
import { HARDWARE_CATALOG } from "@modelforge/hardware-registry";
import { computeModelFit } from "@modelforge/model-fit";
import { ModelFitBadge } from "@/components/Badges";

interface PageProps {
  searchParams: Promise<{
    model?: string;
    hardware?: string;
    precision?: string;
    context?: string;
  }>;
}

export default async function ModelFitPage({ searchParams }: PageProps) {
  const { model, hardware, precision, context } = await searchParams;
  const models = dataLayer.listModels();
  const devices = HARDWARE_CATALOG;

  const selectedModelId = model || "Qwen/Qwen2.5-32B-Instruct";
  const selectedModel = dataLayer.getModel(selectedModelId) || models[0]!;
  const selectedHardwareSlug = hardware || "l40s-48gb";
  const selectedHardware =
    devices.find((d) => d.slug === selectedHardwareSlug) || devices[1]!;
  const selectedPrecision = (precision as any) || "fp8";
  const selectedContext = Number(context) || 4096;

  const fit = computeModelFit({
    model: {
      id: selectedModel.id,
      parameters_billions: selectedModel.parameters_billions,
      context_window: selectedModel.context_window,
      layers: selectedModel.layers,
      kv_heads: selectedModel.kv_heads,
      head_dim: selectedModel.head_dim,
      architecture: selectedModel.architecture,
    },
    hardware: {
      device_slug: selectedHardware.slug,
      device_count: 1,
    },
    runtime: {
      name: "vllm",
      version: "0.6.4",
    },
    precision: selectedPrecision,
    workload: {
      context_length: selectedContext,
      prompt_tokens: 1024,
      generated_tokens: 256,
      concurrency: 2,
    },
    benchmark_provenance:
      selectedHardware.observed.sample_count > 0 ? "verified" : "estimated",
  });

  const dims = [
    {
      name: "Memory Fit",
      val: fit.dimensions.memory_fit,
      desc: "Headroom ratio and OOM avoidance margin",
    },
    {
      name: "Performance Fit",
      val: fit.dimensions.performance_fit,
      desc: "Projected prefill & decode latency",
    },
    {
      name: "Runtime Compatibility",
      val: fit.dimensions.runtime_compatibility,
      desc: "Official kernel acceleration support",
    },
    {
      name: "Context Fit",
      val: fit.dimensions.context_fit,
      desc: "Context scaling vs native model window",
    },
    {
      name: "Efficiency Fit",
      val: fit.dimensions.efficiency_fit,
      desc: "Throughput per Watt & Amortized FinOps",
    },
    {
      name: "Evidence Confidence",
      val: fit.dimensions.evidence_confidence,
      desc: "Empirical benchmark backing ratio",
    },
  ];

  const mem = fit.memory_breakdown;
  const weightsGb = (mem.weights_vram_bytes / 1e9).toFixed(1);
  const kvGb = (mem.kv_cache_vram_bytes / 1e9).toFixed(1);
  const overheadGb = (mem.activation_overhead_bytes / 1e9).toFixed(1);
  const totalGb = (mem.total_required_vram_bytes / 1e9).toFixed(1);
  const availableGb = (mem.available_vram_bytes / 1e9).toFixed(1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div>
        <div className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-sky-400" />
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            ModelFit Calculator
          </h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          An explainable, deterministic multi-dimensional compatibility engine.
          Not a black-box LLM rating.
        </p>
      </div>

      {/* Selector Matrix */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1.5">
              Model
            </label>
            <div className="space-y-1">
              {models.map((m) => (
                <Link
                  key={m.id}
                  href={`/model-fit?model=${encodeURIComponent(m.id)}&hardware=${selectedHardwareSlug}&precision=${selectedPrecision}&context=${selectedContext}`}
                  className={`block px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                    selectedModelId === m.id
                      ? "bg-sky-500 text-white font-bold"
                      : "bg-slate-950/60 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  {m.name} ({m.parameters_billions}B)
                </Link>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1.5">
              Accelerator
            </label>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {devices.slice(0, 5).map((d) => (
                <Link
                  key={d.id}
                  href={`/model-fit?model=${encodeURIComponent(selectedModelId)}&hardware=${d.slug}&precision=${selectedPrecision}&context=${selectedContext}`}
                  className={`block px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                    selectedHardwareSlug === d.slug
                      ? "bg-sky-500 text-white font-bold"
                      : "bg-slate-950/60 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  {d.name} ({Math.round(d.manufacturer.vram_bytes / 1e9)}GB)
                </Link>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1.5">
              Precision
            </label>
            <div className="space-y-1">
              {[
                { p: "fp16", label: "FP16 / BF16 (Native)" },
                { p: "fp8", label: "FP8 E4M3 (Optimal)" },
                { p: "int4", label: "INT4 / AWQ (Compressed)" },
              ].map((item) => (
                <Link
                  key={item.p}
                  href={`/model-fit?model=${encodeURIComponent(selectedModelId)}&hardware=${selectedHardwareSlug}&precision=${item.p}&context=${selectedContext}`}
                  className={`block px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                    selectedPrecision === item.p
                      ? "bg-sky-500 text-white font-bold"
                      : "bg-slate-950/60 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1.5">
              Workload Context
            </label>
            <div className="space-y-1">
              {[2048, 4096, 8192, 16384].map((c) => (
                <Link
                  key={c}
                  href={`/model-fit?model=${encodeURIComponent(selectedModelId)}&hardware=${selectedHardwareSlug}&precision=${selectedPrecision}&context=${c}`}
                  className={`block px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                    selectedContext === c
                      ? "bg-sky-500 text-white font-bold"
                      : "bg-slate-950/60 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  {c / 1000}k Tokens
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ModelFit Score Hero Card */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-[#0d1627] p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 font-mono text-2xl font-black">
              {fit.overall_score}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">
                  ModelFit: {fit.overall_score} / 100
                </h2>
                <span className="rounded bg-sky-500 px-2 py-0.5 text-xs font-bold text-white font-mono">
                  Grade {fit.grade}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Algorithm v{fit.algorithm_version} · Evaluated for{" "}
                {selectedModel.name} on {selectedHardware.name}
              </p>
            </div>
          </div>

          <div className="text-right font-mono text-xs">
            <div className="text-slate-400">Memory Headroom</div>
            <div
              className={`text-base font-bold ${mem.is_oom ? "text-rose-400" : "text-emerald-400"}`}
            >
              {mem.is_oom
                ? "OOM Deficit"
                : `${Math.round((1 - mem.vram_utilization_ratio) * 100)}% Free VRAM`}
            </div>
          </div>
        </div>

        {/* 6 Dimension Radar Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 font-mono text-xs">
          {dims.map((dim) => (
            <div
              key={dim.name}
              className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 space-y-2"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-200">{dim.name}</span>
                <span
                  className={`font-extrabold ${dim.val >= 85 ? "text-emerald-400" : dim.val >= 60 ? "text-amber-400" : "text-rose-400"}`}
                >
                  {dim.val} / 100
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    dim.val >= 85
                      ? "bg-emerald-400"
                      : dim.val >= 60
                        ? "bg-amber-400"
                        : "bg-rose-500"
                  }`}
                  style={{ width: `${dim.val}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-400">{dim.desc}</p>
            </div>
          ))}
        </div>

        {/* Physical VRAM Waterfall */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <h3 className="text-sm font-bold text-white font-sans mb-2">
            Physical VRAM Allocation Breakdown
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
            <div className="rounded bg-slate-950/80 p-3">
              <span className="text-slate-500 text-[10px] block">
                Model Weights
              </span>
              <span className="text-sm font-bold text-white">
                {weightsGb} GB
              </span>
            </div>
            <div className="rounded bg-slate-950/80 p-3">
              <span className="text-slate-500 text-[10px] block">
                KV Cache ({selectedContext / 1000}k)
              </span>
              <span className="text-sm font-bold text-white">{kvGb} GB</span>
            </div>
            <div className="rounded bg-slate-950/80 p-3">
              <span className="text-slate-500 text-[10px] block">
                Activation / Runtime
              </span>
              <span className="text-sm font-bold text-white">
                {overheadGb} GB
              </span>
            </div>
            <div className="rounded bg-slate-950/80 p-3">
              <span className="text-slate-500 text-[10px] block">
                Total Required
              </span>
              <span className="text-sm font-bold text-sky-400">
                {totalGb} GB
              </span>
            </div>
            <div className="rounded bg-slate-950/80 p-3">
              <span className="text-slate-500 text-[10px] block">
                Available Device VRAM
              </span>
              <span className="text-sm font-bold text-emerald-400">
                {availableGb} GB
              </span>
            </div>
          </div>
        </div>

        {/* Diagnostic Explanations */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2 text-xs font-mono">
          {fit.explanations.map((exp, i) => (
            <div key={i} className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>{exp}</span>
            </div>
          ))}
          {fit.warnings.map((warn, i) => (
            <div key={i} className="flex items-center gap-1.5 text-rose-400">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>{warn}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
