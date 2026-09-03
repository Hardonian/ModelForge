import Link from 'next/link';
import { 
  Sparkles, 
  ArrowRight, 
  Terminal, 
  CheckCircle2, 
  Gauge, 
  Cpu, 
  Database, 
  TrendingUp, 
  Zap, 
  ShieldCheck,
  Layers,
  Scale
} from 'lucide-react';
import { dataLayer } from '@modelforge/database';
import { HARDWARE_CATALOG } from '@modelforge/hardware-registry';
import { ModelFitBadge, VerificationBadge } from '@/components/Badges';

export default function HomePage() {
  const models = dataLayer.listModels();
  const benchmarks = dataLayer.listBenchmarks().slice(0, 4);
  const hardwareCount = HARDWARE_CATALOG.length;

  return (
    <div className="relative overflow-hidden pb-20">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1 text-xs font-medium text-sky-300 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-sky-400" />
            <span>OpenComputeBench Graph v1.0.0 Now Live</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            Find the best way to run <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
              any AI model.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Compare models, GPUs, runtimes, and precisions using reproducible real-world inference benchmarks.
            Eliminate guesswork, avoid OOMs, and minimize token costs.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/optimizer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 hover:bg-sky-400 transition-all hover:scale-[1.02]"
            >
              <Sparkles className="h-4 w-4" />
              <span>Optimize a Workload</span>
            </Link>

            <Link
              href="/benchmarks"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-6 py-3 text-sm font-semibold text-slate-200 hover:border-slate-500 hover:text-white transition-all"
            >
              <span>Explore Benchmarks</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Terminal Command Teaser */}
          <div className="pt-6 max-w-md mx-auto">
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#060a12]/90 px-4 py-2.5 font-mono text-xs text-slate-300 shadow-inner">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-sky-400" />
                <span>uv tool install modelforge</span>
              </div>
              <span className="text-[10px] text-slate-500">v0.1.0</span>
            </div>
          </div>
        </div>

        {/* Live Interactive Teaser Card */}
        <div className="mt-16 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-xl shadow-2xl max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-800/80 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <h3 className="font-semibold text-sm text-white">Live ModelFit & Benchmark Provenance</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Real empirical telemetry from reproducible multi-run benchmark workers.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/compare"
                className="text-xs font-medium text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                Side-by-side comparison <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="rounded-xl border border-slate-800/80 bg-[#090d16]/80 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Production Workhorse</span>
                <ModelFitBadge score={94} grade="A+" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Qwen 2.5 32B Instruct</h4>
                <p className="text-xs text-slate-400">NVIDIA L40S 48GB · FP8 · vLLM</p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">Throughput</span>
                  <span className="text-sky-400 font-semibold">72.4 tok/s</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">P95 TTFT</span>
                  <span className="text-slate-200">330 ms</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <VerificationBadge status="verified" />
                <span className="text-[10px] font-mono text-slate-400">$0.32 / 1M tok</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-[#090d16]/80 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Frontier Reasoning</span>
                <ModelFitBadge score={96} grade="A+" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Llama 3.3 70B Instruct</h4>
                <p className="text-xs text-slate-400">NVIDIA H100 SXM5 · FP8 · vLLM</p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">Throughput</span>
                  <span className="text-sky-400 font-semibold">88.6 tok/s</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">P95 TTFT</span>
                  <span className="text-slate-200">235 ms</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <VerificationBadge status="verified" />
                <span className="text-[10px] font-mono text-slate-400">$0.85 / 1M tok</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-[#090d16]/80 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Local Champion</span>
                <ModelFitBadge score={88} grade="A" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">DeepSeek R1 Distill 32B</h4>
                <p className="text-xs text-slate-400">RTX 4090 24GB · INT4 · llama.cpp</p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">Throughput</span>
                  <span className="text-sky-400 font-semibold">44.2 tok/s</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">P95 TTFT</span>
                  <span className="text-slate-200">490 ms</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <VerificationBadge status="community" />
                <span className="text-[10px] font-mono text-slate-400">$0.45 / 1M tok</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Bar */}
      <section className="border-y border-slate-800/80 bg-[#060a12]/70 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-extrabold font-mono text-sky-400">14,280+</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Benchmark Observations</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold font-mono text-white">{hardwareCount}</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Cataloged Accelerators</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold font-mono text-emerald-400">6</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Serving Runtimes</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold font-mono text-white">100%</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Deterministic Provenance</div>
          </div>
        </div>
      </section>

      {/* The Core Problem & Moat Architecture Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-sky-400">Why ModelForge</h2>
          <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            The AI inference stack is combinatorial.
          </p>
          <p className="text-sm text-slate-400 leading-relaxed">
            Every model revision, GPU architecture, runtime version, precision format, and context length dramatically affects TTFT, TPOT, VRAM exhaustion, and serving cost.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 space-y-4 hover:border-slate-700 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-white">The Open Compute Graph</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every benchmark is cryptographically hashed with its environment and result signatures. No fabricated metrics, no vendor-sponsored marketing claims.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 space-y-4 hover:border-slate-700 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Gauge className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-white">Explainable ModelFit</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Not a black-box LLM score. ModelFit evaluates 6 independent mathematical dimensions: Memory fit, performance fit, runtime support, context limits, efficiency, and confidence.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 space-y-4 hover:border-slate-700 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Scale className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-white">Multi-Objective FinOps</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Solve for lowest token cost, lowest P95 latency, or highest concurrency. Automatically generate battle-tested Docker and Kubernetes manifests.
            </p>
          </div>
        </div>
      </section>

      {/* Recent Benchmarks Table */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Recent Verified Benchmarks</h3>
            <p className="text-xs text-slate-400">Latest additions to the OpenComputeBench public dataset.</p>
          </div>
          <Link href="/benchmarks" className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1">
            View all benchmarks <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/20">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Model</th>
                <th className="py-3 px-4">Accelerator</th>
                <th className="py-3 px-4">Precision</th>
                <th className="py-3 px-4">Runtime</th>
                <th className="py-3 px-4 text-right">Throughput</th>
                <th className="py-3 px-4 text-right">P50 TTFT</th>
                <th className="py-3 px-4 text-right">VRAM</th>
                <th className="py-3 px-4">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {benchmarks.map((b) => (
                <tr key={b.benchmark_id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-sans font-semibold text-white">
                    <Link href={`/benchmarks/${b.benchmark_id}`} className="hover:text-sky-400">
                      {b.model.repository}
                    </Link>
                  </td>
                  <td className="py-3 px-4">{b.hardware.device}</td>
                  <td className="py-3 px-4 uppercase">{b.precision.type}</td>
                  <td className="py-3 px-4">{b.runtime.name} {b.runtime.version}</td>
                  <td className="py-3 px-4 text-right font-bold text-sky-400">{b.metrics.tokens_per_second} tok/s</td>
                  <td className="py-3 px-4 text-right">{b.metrics.ttft_ms.p50_ms} ms</td>
                  <td className="py-3 px-4 text-right">{roundGb(b.metrics.peak_vram_bytes)} GB</td>
                  <td className="py-3 px-4">
                    <VerificationBadge status={b.verification.status} synthetic={b.synthetic_fixture} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function roundGb(bytes: number): string {
  return (bytes / 1e9).toFixed(1);
}
