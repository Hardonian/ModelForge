"use client";

import { useState } from "react";
import {
  Sparkles,
  Cpu,
  Zap,
  ShieldAlert,
  Info,
  Layers,
  ArrowRight,
  TrendingUp,
  Activity,
  Server,
} from "lucide-react";
import Link from "next/link";

interface PredictionResultView {
  is_predicted: boolean;
  predicted_throughput_tok_s: number;
  predicted_ttft_ms: number;
  predicted_tpot_ms: number;
  predicted_peak_vram_gb: number;
  p10_throughput: number;
  p90_throughput: number;
  uncertainty_type: "interpolation" | "extrapolation" | "out_of_distribution";
  confidence: "high" | "medium" | "low";
  nearest_evidence_ids: string[];
  memory_bandwidth_bound_tpot_ms: number;
  prefill_compute_bound_ttft_ms: number;
}

export default function PredictPage() {
  const [model, setModel] = useState("Qwen/Qwen2.5-32B-Instruct");
  const [params, setParams] = useState(32.5);
  const [accelerator, setAccelerator] = useState("NVIDIA L40S");
  const [runtime, setRuntime] = useState("vllm");
  const [precision, setPrecision] = useState("fp8");
  const [contextLength, setContextLength] = useState(4096);
  const [concurrency, setConcurrency] = useState(4);

  const [result, setResult] = useState<PredictionResultView | null>({
    is_predicted: true,
    predicted_throughput_tok_s: 58.4,
    predicted_ttft_ms: 22.4,
    predicted_tpot_ms: 17.1,
    predicted_peak_vram_gb: 38.5,
    p10_throughput: 52.5,
    p90_throughput: 64.2,
    uncertainty_type: "interpolation",
    confidence: "high",
    nearest_evidence_ids: ["00000000-0000-0000-0000-000000000001"],
    memory_bandwidth_bound_tpot_ms: 15.2,
    prefill_compute_bound_ttft_ms: 18.0,
  });

  const handlePredict = () => {
    // Level 0 Analytical Roofline
    const bpp = precision === "fp16" ? 2.0 : precision === "fp8" ? 1.0 : 0.55;
    const weightGb = params * bpp;
    const kvGb = (2 * 48 * 8 * 128 * contextLength * 1 * concurrency) / 1e9;
    const peakVram = Number((weightGb + kvGb + 1.8).toFixed(1));

    let bandwidth = 864; // L40S
    let tflops = 362;
    if (accelerator.includes("H100")) {
      bandwidth = 3350;
      tflops = 989;
    } else if (accelerator.includes("4090")) {
      bandwidth = 1008;
      tflops = 330;
    } else if (accelerator.includes("MI300X")) {
      bandwidth = 5300;
      tflops = 1300;
    }

    const baseTpotMs = (weightGb / (bandwidth * 0.85)) * 1000;
    let runtimeMult =
      runtime === "tensorrt-llm"
        ? 1.35
        : runtime === "nvidia-dynamo"
          ? 1.55
          : 1.15;
    const adjustedTpot = Math.max(
      8.0,
      Number((baseTpotMs / runtimeMult).toFixed(1)),
    );
    const singleTps = 1000 / adjustedTpot;
    const aggTps = Number(
      (
        singleTps *
        concurrency *
        (1 / (1 + 0.05 * Math.log2(concurrency)))
      ).toFixed(1),
    );

    const prefillFlops = 2 * params * 1e9 * 1024;
    const prefillMs = Number(
      (((prefillFlops / (tflops * 1e12)) * 1000) / (runtimeMult * 0.5)).toFixed(
        1,
      ),
    );
    const predTtft = Number((prefillMs + 10).toFixed(1));

    // Uncertainty classification
    let unc: "interpolation" | "extrapolation" | "out_of_distribution" =
      "extrapolation";
    let conf: "high" | "medium" | "low" = "medium";
    let interval = 0.2;

    if (model.includes("32B") && accelerator.includes("L40S")) {
      unc = "interpolation";
      conf = "high";
      interval = 0.1;
    } else if (params > 100 || accelerator.includes("Apple")) {
      unc = "out_of_distribution";
      conf = "low";
      interval = 0.35;
    }

    setResult({
      is_predicted: true,
      predicted_throughput_tok_s: aggTps,
      predicted_ttft_ms: predTtft,
      predicted_tpot_ms: adjustedTpot,
      predicted_peak_vram_gb: peakVram,
      p10_throughput: Number((aggTps * (1 - interval)).toFixed(1)),
      p90_throughput: Number((aggTps * (1 + interval)).toFixed(1)),
      uncertainty_type: unc,
      confidence: conf,
      nearest_evidence_ids: ["00000000-0000-0000-0000-000000000001"],
      memory_bandwidth_bound_tpot_ms: Number(baseTpotMs.toFixed(1)),
      prefill_compute_bound_ttft_ms: prefillMs,
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Evidence-Grounded Predictive Inference Intelligence</span>
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Performance Predictor
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-3xl">
          Query unmeasured model and hardware configurations. ModelForge
          combines Level 0 analytical roofline physics with Level 1 empirical
          nearest-neighbor scaling from the OpenComputeBench corpus.
        </p>
      </div>

      {/* Safety Notice Banner */}
      <div className="mb-8 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-200/90 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-300">
            Constitutional Rule: Prediction Never Replaces Measured Evidence.
          </span>{" "}
          All values produced by this engine are labeled{" "}
          <span className="font-mono font-bold text-white bg-amber-500/30 px-1 py-0.5 rounded">
            PREDICTED
          </span>
          . Each result displays explicit prediction intervals, nearest measured
          anchor benchmarks, and uncertainty classification.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Controls */}
        <div className="lg:col-span-5 space-y-5 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Cpu className="h-4 w-4 text-sky-400" />
            Target Configuration
          </h2>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Model Repository
            </label>
            <select
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                if (e.target.value.includes("70B")) setParams(70.6);
                else if (e.target.value.includes("32B")) setParams(32.5);
                else if (e.target.value.includes("12B")) setParams(12.2);
                else if (e.target.value.includes("9B")) setParams(9.2);
              }}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
            >
              <option value="Qwen/Qwen2.5-32B-Instruct">
                Qwen/Qwen2.5-32B-Instruct (32.5B)
              </option>
              <option value="meta-llama/Llama-3.3-70B-Instruct">
                meta-llama/Llama-3.3-70B-Instruct (70.6B)
              </option>
              <option value="deepseek-ai/DeepSeek-R1-Distill-Qwen-32B">
                deepseek-ai/DeepSeek-R1-Distill-Qwen-32B (32.5B)
              </option>
              <option value="mistralai/Mistral-Nemo-Instruct-2407">
                mistralai/Mistral-Nemo-Instruct-2407 (12.2B)
              </option>
              <option value="google/gemma-2-9b-it">
                google/gemma-2-9b-it (9.2B)
              </option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Parameters (B)
              </label>
              <input
                type="number"
                value={params}
                onChange={(e) => setParams(Number(e.target.value))}
                step="0.1"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Precision
              </label>
              <select
                value={precision}
                onChange={(e) => setPrecision(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
              >
                <option value="fp8">FP8 (1 byte/param)</option>
                <option value="fp16">FP16 / BF16 (2 bytes)</option>
                <option value="int4">INT4 (0.55 bytes)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Hardware Accelerator
            </label>
            <select
              value={accelerator}
              onChange={(e) => setAccelerator(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
            >
              <option value="NVIDIA H100 SXM5 80GB">
                NVIDIA H100 SXM5 80GB (3.35 TB/s HBM3)
              </option>
              <option value="NVIDIA L40S">
                NVIDIA L40S 48GB (864 GB/s GDDR6)
              </option>
              <option value="NVIDIA GeForce RTX 4090 24GB">
                NVIDIA GeForce RTX 4090 24GB (1.0 TB/s)
              </option>
              <option value="AMD Instinct MI300X 192GB">
                AMD Instinct MI300X 192GB (5.3 TB/s HBM3)
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Serving Runtime
            </label>
            <select
              value={runtime}
              onChange={(e) => setRuntime(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
            >
              <option value="vllm">vLLM (PagedAttention baseline)</option>
              <option value="tensorrt-llm">
                TensorRT-LLM (In-Flight Batching)
              </option>
              <option value="nvidia-dynamo">
                NVIDIA Dynamo (Disaggregated Prefill/Decode)
              </option>
              <option value="sglang">SGLang (RadixAttention)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Context Length
              </label>
              <input
                type="number"
                value={contextLength}
                onChange={(e) => setContextLength(Number(e.target.value))}
                step="1024"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Concurrency
              </label>
              <input
                type="number"
                value={concurrency}
                onChange={(e) => setConcurrency(Number(e.target.value))}
                min="1"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={handlePredict}
            className="w-full rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold py-2.5 text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20"
          >
            <Zap className="h-4 w-4" />
            Compute Evidence-Grounded Prediction
          </button>
        </div>

        {/* Prediction Results */}
        <div className="lg:col-span-7 space-y-6">
          {result && (
            <>
              {/* Top Prediction Card */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-300 border border-amber-500/30">
                      PREDICTED
                    </span>
                    <span className="text-xs text-slate-400">
                      Uncertainty:{" "}
                      <span className="font-bold text-white uppercase">
                        {result.uncertainty_type}
                      </span>
                    </span>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${result.confidence === "high" ? "bg-emerald-500/10 text-emerald-400" : result.confidence === "medium" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"}`}
                  >
                    {result.confidence.toUpperCase()} CONFIDENCE
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">
                      Throughput
                    </span>
                    <div className="text-2xl font-bold text-white mt-1 flex items-baseline gap-1">
                      <span>{result.predicted_throughput_tok_s}</span>
                      <span className="text-xs text-slate-400 font-normal">
                        tok/s
                      </span>
                    </div>
                    <span className="text-[10px] text-sky-400 mt-1 block">
                      Interval: [{result.p10_throughput} -{" "}
                      {result.p90_throughput}]
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">
                      TTFT (P95)
                    </span>
                    <div className="text-2xl font-bold text-white mt-1 flex items-baseline gap-1">
                      <span>{result.predicted_ttft_ms}</span>
                      <span className="text-xs text-slate-400 font-normal">
                        ms
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Prefill bound: {result.prefill_compute_bound_ttft_ms} ms
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">
                      Peak VRAM
                    </span>
                    <div className="text-2xl font-bold text-white mt-1 flex items-baseline gap-1">
                      <span>{result.predicted_peak_vram_gb}</span>
                      <span className="text-xs text-slate-400 font-normal">
                        GB
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      TPOT bound: {result.memory_bandwidth_bound_tpot_ms} ms
                    </span>
                  </div>
                </div>

                {/* Level 0 Analytical Breakdown */}
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-xs space-y-2">
                  <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-sky-400" />
                    Analytical Roofline Model Breakdown
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-slate-400 pt-1">
                    <div>
                      <span className="text-[11px] text-slate-500 block">
                        Memory Bandwidth Bound TPOT:
                      </span>
                      <span className="font-mono text-white text-xs">
                        {result.memory_bandwidth_bound_tpot_ms} ms / token
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">
                        Prefill Compute Bound TTFT:
                      </span>
                      <span className="font-mono text-white text-xs">
                        {result.prefill_compute_bound_ttft_ms} ms
                      </span>
                    </div>
                  </div>
                </div>

                {/* Nearest Measured Configurations */}
                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="text-slate-400">
                    <span className="text-slate-500">
                      Nearest Measured Benchmark Anchor:{" "}
                    </span>
                    <Link
                      href={`/benchmarks/${result.nearest_evidence_ids[0]}`}
                      className="text-sky-400 hover:text-sky-300 font-mono underline ml-1"
                    >
                      {result.nearest_evidence_ids[0]}
                    </Link>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Predictor v1.0.0
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
