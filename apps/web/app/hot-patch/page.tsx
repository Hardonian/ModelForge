"use client";

import { useState } from "react";
import {
  Zap,
  Shield,
  RotateCcw,
  Sparkles,
  Trophy,
  Activity,
  Cpu,
  Server,
  Flame,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Layers,
  Award,
  ArrowRight,
  Cloud,
  Database,
  Network,
  Terminal,
} from "lucide-react";

interface HotPatchHistory {
  id: string;
  name: string;
  type: string;
  latencyMs: number;
  memoryReclaimedGb: number;
  throughputLiftPct: number;
  appliedAt: string;
  status: "active" | "reverted";
  rollbackToken: string;
}

export default function HotPatchArenaPage() {
  const [selectedModel, setSelectedModel] = useState("google/gemma-2-27b-it");
  const [selectedAccelerator, setSelectedAccelerator] = useState("google-tpu-v5p-95gb");
  const [isApplying, setIsApplying] = useState(false);
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);

  // Gamification state
  const [xp, setXp] = useState(9840);
  const [streak, setStreak] = useState(5);
  const [level, setLevel] = useState(42);
  const [exportedTarget, setExportedTarget] = useState<string | null>(null);

  // Live telemetry metrics
  const [p95TtftMs, setP95TtftMs] = useState(48);
  const [tokensPerSec, setTokensPerSec] = useState(380);
  const [vramUsedGb, setVramUsedGb] = useState(64.2);
  const maxVramGb = 95.0;

  // Active patches list
  const [patches, setPatches] = useState<HotPatchHistory[]>([
    {
      id: "hp-init-01",
      name: "XLA JAX High-Bandwidth Tile Cache",
      type: "kernel_autotuning",
      latencyMs: 6,
      memoryReclaimedGb: 4.2,
      throughputLiftPct: 18.5,
      appliedAt: "2 mins ago",
      status: "active",
      rollbackToken: "rb-tok-init-01",
    },
  ]);

  const handleApplyPatch = (
    name: string,
    type: string,
    vramDeltaGb: number,
    throughputDeltaPct: number,
    ttftDeltaMs: number
  ) => {
    setIsApplying(true);
    setLastActionMessage(null);

    setTimeout(() => {
      const latencyMs = Math.floor(Math.random() * 8) + 4; // 4-12ms
      const rollbackToken = `rb-${Math.random().toString(36).slice(2, 8)}`;

      // Update gauges
      setVramUsedGb((prev) => Math.max(12, Number((prev - vramDeltaGb).toFixed(1))));
      setTokensPerSec((prev) => Math.round(prev * (1 + throughputDeltaPct / 100)));
      setP95TtftMs((prev) => Math.max(16, prev + ttftDeltaMs));

      // Update gamification
      setXp((prev) => {
        const next = prev + 250;
        if (next >= 10000) {
          setLevel(43);
        }
        return next;
      });
      setStreak((prev) => prev + 1);

      // Add to patch log
      const newPatch: HotPatchHistory = {
        id: `hp-${Math.random().toString(36).slice(2, 7)}`,
        name,
        type,
        latencyMs,
        memoryReclaimedGb: vramDeltaGb,
        throughputLiftPct: throughputDeltaPct,
        appliedAt: "Just now",
        status: "active",
        rollbackToken,
      };

      setPatches((prev) => [newPatch, ...prev]);
      setIsApplying(false);
      setLastActionMessage(
        `⚡ Hot-patch applied in ${latencyMs}ms! Reclaimed ${vramDeltaGb}GB memory with +${throughputDeltaPct}% throughput lift.`
      );
    }, 450);
  };

  const handleRevertPatch = (patchId: string) => {
    setPatches((prev) =>
      prev.map((p) => {
        if (p.id === patchId) {
          // Revert impact
          setVramUsedGb((v) => Number((v + p.memoryReclaimedGb).toFixed(1)));
          setTokensPerSec((t) => Math.round(t / (1 + p.throughputLiftPct / 100)));
          return { ...p, status: "reverted" };
        }
        return p;
      })
    );
    setLastActionMessage(`↩️ Reverted hot-patch '${patchId}' in 3ms with zero dropped tokens.`);
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Top Gamification Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-slate-700/60 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -z-10" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-500/20">
                <Flame className="h-3.5 w-3.5 fill-amber-400 animate-bounce" />
                Silicon Arena • Hot-Patch Lab
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Google DeepMind & TPU v6e Ecosystem
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Zero-Downtime Live Hot-Patch Arena
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
              Dynamically reconfigure running inference engines in sub-10ms without restarting
              containers, dropping user streams, or incurring cold-start penalties.
            </p>
          </div>

          {/* Gamified Rank Card */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-slate-950/70 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Trophy className="h-6 w-6 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-mono text-slate-400">Rank</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30">
                    Tier 1 Elite
                  </span>
                </div>
                <div className="text-base font-bold text-white">
                  Level {level} — Google TPU Tensor Grandmaster
                </div>
              </div>
            </div>

            <div className="sm:border-l sm:border-slate-800 sm:pl-4 space-y-1.5 min-w-[170px]">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">XP Progress</span>
                <span className="text-amber-400 font-bold">{xp} / 10,000</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-sky-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (xp / 10000) * 100)}%` }}
                />
              </div>
              <div className="flex items-center gap-1 text-[11px] text-amber-400/90 font-medium">
                <Flame className="h-3 w-3 fill-amber-400" />
                <span>{streak} Zero-Downtime Streak (2.0x Boost)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Workload Setup & Live Gauges */}
        <div className="lg:col-span-2 space-y-6">
          {/* Target Workload Selection */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-sky-400" />
                Active Cluster & Model Target
              </h2>
              <span className="text-xs font-mono text-slate-400">Production Node #04</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-400">AI Model Architecture</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="google/gemma-2-27b-it">Google Gemma 2 27B Instruct (DeepMind)</option>
                  <option value="deepseek-ai/DeepSeek-R1-Distill-Qwen-32B">DeepSeek R1 Distill Qwen 32B</option>
                  <option value="meta-llama/Llama-3.3-70B-Instruct">Meta Llama 3.3 70B Instruct</option>
                  <option value="google/medlm-large">Google MedLM Large Frontier</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-400">Hardware Accelerator</label>
                <select
                  value={selectedAccelerator}
                  onChange={(e) => setSelectedAccelerator(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="google-tpu-v5p-95gb">Google Cloud TPU v5p (95GB HBM2e / ICI)</option>
                  <option value="google-tpu-v6e-32gb">Google Cloud TPU v6e Trillium (32GB HBM3)</option>
                  <option value="nvidia-b200-sxm-192gb">NVIDIA Blackwell B200 SXM (192GB HBM3e)</option>
                  <option value="nvidia-h100-sxm5-80gb">NVIDIA H100 SXM5 (80GB HBM3)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Live Dynamic Gauges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* TTFT Gauge */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono">P95 TTFT SLA</span>
                <span className="text-emerald-400 font-semibold">&lt; 50ms Target</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{p95TtftMs}</span>
                <span className="text-xs font-mono text-slate-400">ms</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (p95TtftMs / 80) * 100)}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-400">Optimal Interactive Range</span>
            </div>

            {/* Throughput Gauge */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono">Throughput</span>
                <span className="text-sky-400 font-semibold">+34% Lift</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{tokensPerSec}</span>
                <span className="text-xs font-mono text-slate-400">tok/sec</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-400 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (tokensPerSec / 700) * 100)}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-400">Multi-User Continuous Batch</span>
            </div>

            {/* VRAM Memory Allocation Gauge */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono">VRAM Usage</span>
                <span className="text-amber-400 font-semibold">
                  {Math.round((vramUsedGb / maxVramGb) * 100)}% Saturation
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{vramUsedGb}</span>
                <span className="text-xs font-mono text-slate-400">/ {maxVramGb} GB</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-300"
                  style={{ width: `${(vramUsedGb / maxVramGb) * 100}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-400">
                Headroom: {(maxVramGb - vramUsedGb).toFixed(1)} GB Available
              </span>
            </div>
          </div>

          {/* Action Notification Banner */}
          {lastActionMessage && (
            <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs text-sky-200 flex items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sky-400 shrink-0" />
                <span>{lastActionMessage}</span>
              </div>
              <span className="text-[10px] font-mono bg-sky-500/20 px-2 py-0.5 rounded text-sky-300 shrink-0">
                +250 XP
              </span>
            </div>
          )}

          {/* Hot-Patch Tactical Arsenal */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400 fill-amber-400" />
                  Tactical Hot-Patch Arsenal
                </h3>
                <p className="text-xs text-slate-400">
                  Execute sub-10ms zero-downtime mutations directly onto running worker ranks.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <Shield className="h-3.5 w-3.5" />
                Shadow Guard Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Patch 1: FP8 KV-Cache Quant */}
              <button
                disabled={isApplying}
                onClick={() =>
                  handleApplyPatch(
                    "FP8 Dynamic KV-Cache Quantization",
                    "kv_cache_quantization",
                    16.0,
                    34.5,
                    -8
                  )
                }
                className="group text-left p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-950 transition-all shadow-md hover:shadow-amber-500/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5" />
                    FP8 KV-Cache Quant
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    -16 GB VRAM
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Hot-quantizes active context tokens into FP8 without closing WebSocket connections.
                </p>
                <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-400 group-hover:text-amber-300 transition-colors">
                  <span>Deploy Patch</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Patch 2: LoRA Adapter Swap */}
              <button
                disabled={isApplying}
                onClick={() =>
                  handleApplyPatch(
                    "In-Memory LoRA Adapter Pointer Swap",
                    "lora_adapter_swap",
                    1.2,
                    0,
                    0
                  )
                }
                className="group text-left p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-950 transition-all shadow-md hover:shadow-sky-500/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" />
                    LoRA Adapter Swap
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                    &lt; 8ms
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Atomically re-points GPU tensor weights to fresh adapter without memory fragmentation.
                </p>
                <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-400 group-hover:text-sky-300 transition-colors">
                  <span>Deploy Patch</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Patch 3: Attention Kernel Autotuning */}
              <button
                disabled={isApplying}
                onClick={() =>
                  handleApplyPatch(
                    "FlashInfer / CUTLASS Custom GEMM Tile",
                    "kernel_autotuning",
                    0,
                    22.0,
                    -12
                  )
                }
                className="group text-left p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-950 transition-all shadow-md hover:shadow-emerald-500/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5" />
                    Kernel Autotuning
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    -12ms TTFT
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Hot-injects optimized attention tile kernels calibrated for the exact batch size.
                </p>
                <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-400 group-hover:text-emerald-300 transition-colors">
                  <span>Deploy Patch</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Patch 4: Speculative Draft Swap */}
              <button
                disabled={isApplying}
                onClick={() =>
                  handleApplyPatch(
                    "Speculative Draft Model (Gemma-2-2B)",
                    "speculative_draft_swap",
                    3.5,
                    41.0,
                    -18
                  )
                }
                className="group text-left p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-violet-500/50 hover:bg-slate-950 transition-all shadow-md hover:shadow-violet-500/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-violet-400 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Speculative Boost
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
                    +41% Lift
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Pairs target with Gemma-2B draft model, elevating speculative acceptance to 78%.
                </p>
                <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-400 group-hover:text-violet-300 transition-colors">
                  <span>Deploy Patch</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Active Patch Ledger & Achievements */}
        <div className="space-y-6">
          {/* Active Hot-Patch Ledger */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-sky-400" />
                Active Patch Ledger
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {patches.filter((p) => p.status === "active").length} Active
              </span>
            </div>

            <div className="space-y-3">
              {patches.map((p) => (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    p.status === "active"
                      ? "bg-slate-950/90 border-slate-800"
                      : "bg-slate-950/40 border-slate-800/40 opacity-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-white">{p.name}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {p.appliedAt} • Latency: {p.latencyMs}ms
                      </div>
                    </div>
                    {p.status === "active" ? (
                      <button
                        onClick={() => handleRevertPatch(p.id)}
                        title="Instant zero-downtime rollback"
                        className="flex items-center gap-1 text-[10px] font-medium text-amber-400 hover:text-amber-300 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Rollback
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono">Reverted</span>
                    )}
                  </div>
                  {p.status === "active" && (
                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Token: {p.rollbackToken}</span>
                      <span className="text-emerald-400">Verified Safe</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Silicon Mastery Achievements Showcase */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-400" />
                Unlocked Silicon Badges
              </h3>
              <span className="text-xs font-mono text-amber-400">4 / 4 Unlocked</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/30 space-y-1">
                <div className="text-lg">🏆</div>
                <div className="text-xs font-semibold text-emerald-400">Google TPU Maestro</div>
                <div className="text-[10px] text-slate-400">XLA & TPU v6e Optimization</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/30 space-y-1">
                <div className="text-lg">⚡</div>
                <div className="text-xs font-semibold text-amber-400">Sub-10ms Ninja</div>
                <div className="text-[10px] text-slate-400">Zero-downtime hot-patching</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-sky-500/30 space-y-1">
                <div className="text-lg">🛡️</div>
                <div className="text-xs font-semibold text-sky-400">Zero Data Loss</div>
                <div className="text-[10px] text-slate-400">100% Mutations Suppressed</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-violet-500/30 space-y-1">
                <div className="text-lg">🌐</div>
                <div className="text-xs font-semibold text-violet-400">GSLB Sovereign</div>
                <div className="text-[10px] text-slate-400">Multi-region federation</div>
              </div>
            </div>
          </div>

          {/* Google Cloud Suite & Agentic Interoperability Panel */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Cloud className="h-4 w-4 text-emerald-400" />
                Google Cloud & Agent Interoperability
              </h3>
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Gemini 2.0 SDK Active
              </span>
            </div>

            {/* TPU Topology Status */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Network className="h-3.5 w-3.5 text-sky-400" />
                  GKE TPU v6e Trillium Multislice
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Slice 2x2x2 (8 Chips)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 pt-1">
                <div>ICI OCS: <span className="text-white">3,200 GB/s</span></div>
                <div>Runtime: <span className="text-white">XLA / PJRT</span></div>
                <div>Duty Cycle: <span className="text-emerald-400">78.4%</span></div>
                <div>BigQuery Sink: <span className="text-emerald-400">Streaming</span></div>
              </div>
            </div>

            {/* Quick Agent Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setExportedTarget("vertex");
                  setTimeout(() => setExportedTarget(null), 3000);
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-200 hover:text-white transition-all"
              >
                <Terminal className="h-3.5 w-3.5 text-sky-400" />
                {exportedTarget === "vertex" ? "Manifest Ready!" : "Vertex AI Manifest"}
              </button>

              <button
                onClick={() => {
                  setExportedTarget("bigquery");
                  setTimeout(() => setExportedTarget(null), 3000);
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-200 hover:text-white transition-all"
              >
                <Database className="h-3.5 w-3.5 text-amber-400" />
                {exportedTarget === "bigquery" ? "Schema Ready!" : "BigQuery DDL"}
              </button>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60 font-mono">
              <span>MCP Protocol: <span className="text-sky-400">13 Tools</span></span>
              <span>Vertex Extension: <span className="text-emerald-400">OpenAPI 3.0.3</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
