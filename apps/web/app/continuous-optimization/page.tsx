"use client";

import { useState } from "react";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Activity,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Cpu,
  Layers,
  Clock,
  Sparkles,
} from "lucide-react";

export default function ContinuousOptimizationPage() {
  const [recommendationStatus, setRecommendationStatus] = useState<"ready_for_review" | "approved">("ready_for_review");

  const handleApprove = () => {
    setRecommendationStatus("approved");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-400">
          <Activity className="h-3.5 w-3.5" />
          <span>Continuous Inference SLO Intelligence & FinOps</span>
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Continuous Optimization & Verified FinOps
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-3xl">
          Turn live production telemetry into closed-loop optimization. ModelForge continuously measures observed versus expected latency, flags traffic surges, generates right-sizing recommendations, and tracks verified realized savings.
        </p>
      </div>

      {/* Production Deployment Live Telemetry */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800 gap-3">
          <div>
            <span className="text-xs font-mono font-medium text-slate-400">DEPLOYMENT #dep11111</span>
            <h2 className="text-lg font-bold text-white mt-0.5">
              Customer Support Reasoning Agent (Qwen 2.5 32B FP8)
            </h2>
            <div className="text-xs text-slate-400 mt-1">
              Active: <span className="text-slate-200">2× NVIDIA H100 SXM5 80GB</span> • Runtime: <span className="text-sky-400 font-mono">vllm</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-xs font-bold text-amber-300">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              DRIFT DETECTED: ACTION RECOMMENDED
            </span>
          </div>
        </div>

        {/* Observed vs Expected Comparison Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <span className="text-[11px] text-slate-400 block font-medium">P95 TTFT Latency</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">38.2 ms</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Expected: <span className="text-slate-200 font-mono">20.0 ms</span> (<span className="text-amber-400 font-bold">+70.5% drift</span>)
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <span className="text-[11px] text-slate-400 block font-medium">Mean TPOT</span>
            <div className="text-2xl font-bold text-white mt-1">21.5 ms</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Expected: <span className="text-slate-200 font-mono">15.0 ms</span> (<span className="text-amber-400">+28.0%</span>)
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <span className="text-[11px] text-slate-400 block font-medium">Aggregated Throughput</span>
            <div className="text-2xl font-bold text-white mt-1">44.0 tok/s</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Expected: <span className="text-slate-200 font-mono">60.0 tok/s</span> (<span className="text-red-400">-24.6%</span>)
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <span className="text-[11px] text-slate-400 block font-medium">Mean Concurrency Surge</span>
            <div className="text-2xl font-bold text-sky-400 mt-1">12.8 streams</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Baseline: <span className="text-slate-200 font-mono">4.2 streams</span> (Traffic 3.0×)
            </div>
          </div>
        </div>

        {/* Diagnosis */}
        <div className="mt-5 rounded-lg border border-slate-800/80 bg-slate-950/40 p-4 text-xs text-slate-300">
          <span className="font-semibold text-white">Diagnostic Cause:</span> Serving engine <span className="font-mono text-sky-400">vLLM</span> is queuing requests under concurrency surge. Migrating serving runtime to <span className="font-mono text-emerald-400">TensorRT-LLM</span> or deploying <span className="font-mono text-indigo-400">NVIDIA Dynamo</span> disaggregated prefill/decode will restore P95 TTFT to &lt; 25 ms.
        </div>
      </div>

      {/* Actionable Optimization Recommendation */}
      <div className="rounded-xl border border-violet-500/30 bg-violet-950/10 p-6 mb-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-violet-500/20 gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-400" />
            <h2 className="text-base font-bold text-white">Optimization Recommendation #rec11111</h2>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">
            92% Confidence Score
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Current Config */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-4">
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider mb-2">
              Current Configuration
            </span>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Hardware:</span>
                <span className="font-semibold text-white">2× NVIDIA H100 SXM5 80GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Runtime:</span>
                <span className="font-mono text-sky-400">vllm (fp8)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hourly Cost:</span>
                <span className="font-bold text-white">$6.00 / hour</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">P95 TTFT:</span>
                <span className="text-amber-400 font-bold">38.2 ms (Violates SLO)</span>
              </div>
            </div>
          </div>

          {/* Recommended Config */}
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-4">
            <span className="text-xs font-bold text-emerald-400 block uppercase tracking-wider mb-2">
              Recommended Optimal Migration
            </span>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Hardware:</span>
                <span className="font-semibold text-emerald-300">2× NVIDIA L40S 48GB (Right-Sized)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Runtime:</span>
                <span className="font-mono text-emerald-400">tensorrt-llm (fp8)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hourly Cost:</span>
                <span className="font-bold text-emerald-400">$2.50 / hour (-58%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Projected P95 TTFT:</span>
                <span className="text-emerald-300 font-bold">24.0 ms (Satisfies SLO)</span>
              </div>
            </div>
          </div>
        </div>

        {/* FinOps Projected Savings Bar */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-950/70 rounded-lg p-4 border border-slate-800 gap-4">
          <div>
            <div className="text-xs text-slate-400">Projected Monthly Cost Reduction:</div>
            <div className="text-2xl font-bold text-emerald-400 mt-0.5">
              +$2,520.00 USD / month
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Evidence: Verified benchmark #00000000-0000-0000-0000-000000000001 (86.8 tok/s on L40S)
            </div>
          </div>

          <div>
            {recommendationStatus === "ready_for_review" ? (
              <button
                onClick={handleApprove}
                className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 text-xs transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve Recommendation (Human Sign-off)
              </button>
            ) : (
              <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold px-4 py-2 text-xs flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Approved by Admin • Ready for GitOps manifest rollout
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verified Realized Savings Ledger */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm p-6">
        <div className="border-b border-slate-800 pb-4 mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Verified Realized Savings Ledger
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Projected savings and verified realized savings are strictly separated. Realized savings are confirmed only after live after-state observation.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">Total Realized: $2,520.00 / mo</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/50 text-slate-400">
              <tr>
                <th className="py-2.5 px-4">Recommendation</th>
                <th className="py-2.5 px-4">Observation Window</th>
                <th className="py-2.5 px-4">Baseline Monthly</th>
                <th className="py-2.5 px-4">Observed After-State</th>
                <th className="py-2.5 px-4 font-bold text-emerald-400">Verified Monthly Savings</th>
                <th className="py-2.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-4 font-medium text-white">
                  Qwen 2.5 32B: 2× H100 → 2× L40S (TensorRT-LLM)
                </td>
                <td className="py-3 px-4 text-slate-400">30 days observed (1.4M requests)</td>
                <td className="py-3 px-4 font-mono">$4,320.00 USD</td>
                <td className="py-3 px-4 font-mono text-emerald-400">$1,800.00 USD</td>
                <td className="py-3 px-4 font-mono font-bold text-emerald-400">+$2,520.00 USD / mo</td>
                <td className="py-3 px-4 text-right">
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3" />
                    VERIFIED
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
