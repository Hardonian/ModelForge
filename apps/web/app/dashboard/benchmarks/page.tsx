import Link from 'next/link';
import { BarChart3, Plus, ShieldCheck } from 'lucide-react';
import { dataLayer } from '@modelforge/database';
import { VerificationBadge } from '@/components/Badges';

export default function PrivateBenchmarksPage() {
  const benchmarks = dataLayer.listBenchmarks();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Organization Benchmark Runs</h1>
          <p className="text-xs text-slate-400 mt-0.5">Private benchmark observations submitted from internal cluster runners.</p>
        </div>
        <Link href="/docs/cli" className="rounded-lg bg-sky-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-400">
          <span>Run Local Benchmark →</span>
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/30">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Benchmark ID</th>
              <th className="py-3 px-4 font-sans">Model</th>
              <th className="py-3 px-4">Hardware</th>
              <th className="py-3 px-4 text-right">Throughput</th>
              <th className="py-3 px-4 text-right">P50 TTFT</th>
              <th className="py-3 px-4">Access Level</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {benchmarks.map((b) => (
              <tr key={b.benchmark_id} className="hover:bg-slate-800/20">
                <td className="py-3.5 px-4 font-bold text-sky-400">
                  <Link href={`/benchmarks/${b.benchmark_id}`}>{b.benchmark_id.slice(0, 8)}...</Link>
                </td>
                <td className="py-3.5 px-4 font-sans text-white">{b.model.repository}</td>
                <td className="py-3.5 px-4">{b.hardware.device}</td>
                <td className="py-3.5 px-4 text-right font-bold text-sky-400">{b.metrics.tokens_per_second} tok/s</td>
                <td className="py-3.5 px-4 text-right">{b.metrics.ttft_ms.p50_ms} ms</td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                    Tenant Private
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
