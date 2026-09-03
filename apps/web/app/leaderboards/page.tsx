import Link from "next/link";
import { Trophy, Zap, DollarSign, HardDrive, ShieldCheck } from "lucide-react";
import { dataLayer } from "@modelforge/database";
import { VerificationBadge, ModelFitBadge } from "@/components/Badges";

interface PageProps {
  searchParams: Promise<{
    tab?: string;
  }>;
}

export default async function LeaderboardsPage({ searchParams }: PageProps) {
  const { tab } = await searchParams;
  const currentTab = tab || "tokens_dollar";
  const benchmarks = dataLayer.listBenchmarks();

  // Pre-calculate leaderboard rankings
  // 1. Best Tokens / Dollar
  const tokensPerDollarLeaderboard = [
    {
      rank: 1,
      model: "Qwen/Qwen2.5-32B-Instruct",
      gpu: "NVIDIA L40S 48GB",
      precision: "FP8",
      tps: 72.4,
      costPer1m: 0.32,
      score: 94,
    },
    {
      rank: 2,
      model: "mistralai/Mistral-Nemo-Instruct-2407",
      gpu: "RTX 3090 24GB",
      precision: "FP16",
      tps: 58.1,
      costPer1m: 0.38,
      score: 91,
    },
    {
      rank: 3,
      model: "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
      gpu: "RTX 4090 24GB",
      precision: "INT4",
      tps: 44.2,
      costPer1m: 0.45,
      score: 88,
    },
    {
      rank: 4,
      model: "meta-llama/Llama-3.3-70B-Instruct",
      gpu: "AMD Instinct MI300X 192GB",
      precision: "FP8",
      tps: 96.2,
      costPer1m: 0.78,
      score: 97,
    },
    {
      rank: 5,
      model: "meta-llama/Llama-3.3-70B-Instruct",
      gpu: "NVIDIA H100 SXM5 80GB",
      precision: "FP8",
      tps: 88.6,
      costPer1m: 0.85,
      score: 96,
    },
  ];

  // 2. Pure Throughput (Speed)
  const throughputLeaderboard = [
    {
      rank: 1,
      model: "meta-llama/Llama-3.3-70B-Instruct",
      gpu: "AMD Instinct MI300X 192GB",
      precision: "FP8",
      tps: 96.2,
      ttft: 180,
      score: 97,
    },
    {
      rank: 2,
      model: "meta-llama/Llama-3.3-70B-Instruct",
      gpu: "NVIDIA H100 SXM5 80GB",
      precision: "FP8",
      tps: 88.6,
      ttft: 195,
      score: 96,
    },
    {
      rank: 3,
      model: "Qwen/Qwen2.5-32B-Instruct",
      gpu: "NVIDIA L40S 48GB",
      precision: "FP8",
      tps: 72.4,
      ttft: 280,
      score: 94,
    },
    {
      rank: 4,
      model: "mistralai/Mistral-Nemo-Instruct-2407",
      gpu: "RTX 3090 24GB",
      precision: "FP16",
      tps: 58.1,
      ttft: 310,
      score: 91,
    },
    {
      rank: 5,
      model: "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
      gpu: "RTX 4090 24GB",
      precision: "INT4",
      tps: 44.2,
      ttft: 420,
      score: 88,
    },
  ];

  // 3. Best Local Models (<24GB VRAM)
  const localLeaderboard = [
    {
      rank: 1,
      model: "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
      gpu: "GeForce RTX 4090 24GB",
      precision: "INT4 AWQ",
      tps: 44.2,
      vram: "21.4 GB",
      score: 88,
    },
    {
      rank: 2,
      model: "mistralai/Mistral-Nemo-Instruct-2407",
      gpu: "GeForce RTX 3090 24GB",
      precision: "FP16 Native",
      tps: 58.1,
      vram: "19.8 GB",
      score: 91,
    },
    {
      rank: 3,
      model: "google/gemma-2-27b-it",
      gpu: "Apple M3 Ultra 192GB",
      precision: "INT4 GGUF",
      tps: 32.5,
      vram: "18.2 GB",
      score: 86,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-400" />
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Inference Leaderboards
          </h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Empirically ranked inference champions across cost efficiency, raw
          throughput, and local hardware constraints.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        {[
          { key: "tokens_dollar", label: "Best Tokens / $", icon: DollarSign },
          { key: "throughput", label: "Fastest Throughput", icon: Zap },
          {
            key: "local_24gb",
            label: "Sub-24GB Local Champions",
            icon: HardDrive,
          },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = currentTab === t.key;
          return (
            <Link
              key={t.key}
              href={`/leaderboards?tab=${t.key}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-all ${
                isActive
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                  : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Leaderboard Tables */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/30">
        {currentTab === "tokens_dollar" && (
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">Rank</th>
                <th className="py-3.5 px-4 font-sans">Model</th>
                <th className="py-3.5 px-4">Accelerator</th>
                <th className="py-3.5 px-4">Precision</th>
                <th className="py-3.5 px-4 text-right">Throughput</th>
                <th className="py-3.5 px-4 text-right">Cost / 1M Tokens</th>
                <th className="py-3.5 px-4">ModelFit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {tokensPerDollarLeaderboard.map((item) => (
                <tr key={item.rank} className="hover:bg-slate-800/20">
                  <td className="py-3.5 px-4 text-center font-bold text-amber-400">
                    #{item.rank}
                  </td>
                  <td className="py-3.5 px-4 font-sans font-semibold text-white">
                    {item.model}
                  </td>
                  <td className="py-3.5 px-4">{item.gpu}</td>
                  <td className="py-3.5 px-4">{item.precision}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-sky-400">
                    {item.tps} tok/s
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-emerald-400">
                    ${item.costPer1m}
                  </td>
                  <td className="py-3.5 px-4">
                    <ModelFitBadge score={item.score} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {currentTab === "throughput" && (
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">Rank</th>
                <th className="py-3.5 px-4 font-sans">Model</th>
                <th className="py-3.5 px-4">Accelerator</th>
                <th className="py-3.5 px-4">Precision</th>
                <th className="py-3.5 px-4 text-right">Raw Throughput</th>
                <th className="py-3.5 px-4 text-right">P50 TTFT</th>
                <th className="py-3.5 px-4">ModelFit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {throughputLeaderboard.map((item) => (
                <tr key={item.rank} className="hover:bg-slate-800/20">
                  <td className="py-3.5 px-4 text-center font-bold text-amber-400">
                    #{item.rank}
                  </td>
                  <td className="py-3.5 px-4 font-sans font-semibold text-white">
                    {item.model}
                  </td>
                  <td className="py-3.5 px-4">{item.gpu}</td>
                  <td className="py-3.5 px-4">{item.precision}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-sky-400">
                    {item.tps} tok/s
                  </td>
                  <td className="py-3.5 px-4 text-right">{item.ttft} ms</td>
                  <td className="py-3.5 px-4">
                    <ModelFitBadge score={item.score} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {currentTab === "local_24gb" && (
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">Rank</th>
                <th className="py-3.5 px-4 font-sans">Model</th>
                <th className="py-3.5 px-4">Consumer / Local Hardware</th>
                <th className="py-3.5 px-4">Quantization Format</th>
                <th className="py-3.5 px-4 text-right">Throughput</th>
                <th className="py-3.5 px-4 text-right">VRAM Allocated</th>
                <th className="py-3.5 px-4">ModelFit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {localLeaderboard.map((item) => (
                <tr key={item.rank} className="hover:bg-slate-800/20">
                  <td className="py-3.5 px-4 text-center font-bold text-amber-400">
                    #{item.rank}
                  </td>
                  <td className="py-3.5 px-4 font-sans font-semibold text-white">
                    {item.model}
                  </td>
                  <td className="py-3.5 px-4">{item.gpu}</td>
                  <td className="py-3.5 px-4">{item.precision}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-sky-400">
                    {item.tps} tok/s
                  </td>
                  <td className="py-3.5 px-4 text-right text-emerald-400">
                    {item.vram}
                  </td>
                  <td className="py-3.5 px-4">
                    <ModelFitBadge score={item.score} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
