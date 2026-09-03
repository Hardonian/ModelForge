import Link from "next/link";
import { Activity, Plus, Sparkles, CheckCircle2 } from "lucide-react";

export default function WorkloadsPage() {
  const workloads = [
    {
      id: "wl-1",
      name: "Chat Completion Agent",
      model: "Qwen 2.5 32B",
      gpu: "NVIDIA L40S 48GB",
      precision: "FP8",
      tpot: "15.1 ms",
      status: "Optimal",
    },
    {
      id: "wl-2",
      name: "Code Generation Service",
      model: "DeepSeek R1 Distill 32B",
      gpu: "RTX 4090 × 2",
      precision: "INT4",
      tpot: "24.1 ms",
      status: "Optimal",
    },
    {
      id: "wl-3",
      name: "Enterprise Document RAG",
      model: "Mistral NeMo 12B",
      gpu: "RTX 3090 24GB",
      precision: "FP16",
      tpot: "19.2 ms",
      status: "Optimal",
    },
    {
      id: "wl-4",
      name: "Frontier Reasoning Worker",
      model: "Llama 3.3 70B",
      gpu: "NVIDIA H100 80GB",
      precision: "FP8",
      tpot: "11.8 ms",
      status: "Optimal",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Monitored Workloads
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Track production model latency, hardware headroom, and SLA
            compliance.
          </p>
        </div>
        <Link
          href="/optimizer"
          className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-400"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Workload</span>
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/30">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 font-sans">Workload</th>
              <th className="py-3 px-4 font-sans">Model</th>
              <th className="py-3 px-4">Serving Hardware</th>
              <th className="py-3 px-4">Format</th>
              <th className="py-3 px-4 text-right">P95 TPOT</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {workloads.map((w) => (
              <tr key={w.id} className="hover:bg-slate-800/20">
                <td className="py-3.5 px-4 font-bold text-white font-sans">
                  {w.name}
                </td>
                <td className="py-3.5 px-4 font-sans">{w.model}</td>
                <td className="py-3.5 px-4 text-slate-200">{w.gpu}</td>
                <td className="py-3.5 px-4 uppercase">{w.precision}</td>
                <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                  {w.tpot}
                </td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {w.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
