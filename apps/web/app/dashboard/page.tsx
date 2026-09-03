import Link from 'next/link';
import { Activity, BarChart3, Plus, ArrowRight, Zap, ShieldCheck } from 'lucide-react';
import { dataLayer } from '@modelforge/database';
import { VerificationBadge } from '@/components/Badges';

export default function DashboardOverviewPage() {
  const benchmarks = dataLayer.listBenchmarks().slice(0, 3);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Console Overview</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor private tenant workloads, active cluster profiling, and team benchmark runs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/optimizer"
            className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-sky-500/20 hover:bg-sky-400"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Optimization</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-1">
          <span className="text-[10px] text-slate-500 uppercase block">Active Workloads</span>
          <span className="text-2xl font-bold text-white">4</span>
          <span className="text-[11px] text-emerald-400 block pt-1">All meeting P95 SLAs</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-1">
          <span className="text-[10px] text-slate-500 uppercase block">API Quota Used</span>
          <span className="text-2xl font-bold text-sky-400">142.8k</span>
          <span className="text-[11px] text-slate-500 block pt-1">of 500,000 / month</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-1">
          <span className="text-[10px] text-slate-500 uppercase block">Private Benchmarks</span>
          <span className="text-2xl font-bold text-white">18</span>
          <span className="text-[11px] text-slate-400 block pt-1">Across 3 clusters</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-1">
          <span className="text-[10px] text-slate-500 uppercase block">FinOps Savings</span>
          <span className="text-2xl font-bold text-emerald-400">$2,480</span>
          <span className="text-[11px] text-slate-500 block pt-1">34% monthly reduction</span>
        </div>
      </div>

      {/* Active Workloads Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Active Monitored Workloads</h2>
          <Link href="/dashboard/workloads" className="text-xs text-sky-400 hover:text-sky-300">
            View all workloads →
          </Link>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/30">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-sans">Workload Name</th>
                <th className="py-3 px-4 font-sans">Model</th>
                <th className="py-3 px-4">Current GPU Serving</th>
                <th className="py-3 px-4 text-right">Target Latency</th>
                <th className="py-3 px-4 text-right">Current P95</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr className="hover:bg-slate-800/20">
                <td className="py-3.5 px-4 font-bold text-white font-sans">Customer Chat Agent</td>
                <td className="py-3.5 px-4 font-sans">Qwen 2.5 32B Instruct</td>
                <td className="py-3.5 px-4">NVIDIA L40S × 1 (FP8)</td>
                <td className="py-3.5 px-4 text-right">30 ms TPOT</td>
                <td className="py-3.5 px-4 text-right text-emerald-400 font-bold">15.1 ms</td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    HEALTHY
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-800/20">
                <td className="py-3.5 px-4 font-bold text-white font-sans">Code Generation Backend</td>
                <td className="py-3.5 px-4 font-sans">DeepSeek R1 Distill 32B</td>
                <td className="py-3.5 px-4">RTX 4090 × 2 (INT4)</td>
                <td className="py-3.5 px-4 text-right">25 ms TPOT</td>
                <td className="py-3.5 px-4 text-right text-emerald-400 font-bold">24.1 ms</td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    HEALTHY
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-800/20">
                <td className="py-3.5 px-4 font-bold text-white font-sans">Complex Reasoning Pipeline</td>
                <td className="py-3.5 px-4 font-sans">Llama 3.3 70B Instruct</td>
                <td className="py-3.5 px-4">NVIDIA H100 SXM5 × 1 (FP8)</td>
                <td className="py-3.5 px-4 text-right">15 ms TPOT</td>
                <td className="py-3.5 px-4 text-right text-emerald-400 font-bold">12.3 ms</td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    HEALTHY
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
