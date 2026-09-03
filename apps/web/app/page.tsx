import Link from 'next/link';
import { 
  Sparkles, 
  ArrowRight, 
  Terminal, 
  CheckCircle2, 
  Cpu, 
  Layers, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Server, 
  Activity,
  Workflow
} from 'lucide-react';
import { dataLayer } from '@modelforge/database';
import { HARDWARE_CATALOG } from '@modelforge/hardware-registry';

export default function HomePage() {
  const passports = dataLayer.listComputePassports();
  const softwareLift = dataLayer.listSoftwareLift();

  return (
    <div className="relative overflow-hidden pb-24">
      {/* Hero Section */}
      <section className="relative pt-14 pb-20 md:pt-20 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-xs font-medium text-sky-300 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-sky-400" />
            <span>ModelForge Phase 2 &bull; Deployment Intelligence Layer</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
            From Hugging Face model to <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
              production infrastructure.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto font-normal">
            Evidence-backed deployment intelligence for open AI. Automatically compile workload SLOs into
            optimal topologies across NVIDIA Dynamo, NIM, vLLM, and TensorRT-LLM.
          </p>

          {/* Above-The-Fold Hugging Face Paste Experience */}
          <div className="pt-4 max-w-2xl mx-auto">
            <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-3 shadow-2xl backdrop-blur-xl transition-all focus-within:border-sky-500/80 focus-within:ring-2 focus-within:ring-sky-500/20">
              <form action="/planner" method="GET" className="flex flex-col sm:flex-row items-center gap-2">
                <div className="flex items-center gap-2 w-full px-3 py-2">
                  <span className="text-slate-500 font-mono text-sm hidden sm:inline">huggingface.co/</span>
                  <input
                    type="text"
                    name="model"
                    defaultValue="Qwen/Qwen2.5-32B-Instruct"
                    placeholder="org/model@revision (e.g. meta-llama/Llama-3.3-70B-Instruct)"
                    className="w-full bg-transparent text-sm font-mono text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="submit"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition-all whitespace-nowrap"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Build Plan</span>
                  </button>
                  <Link
                    href="/passports"
                    className="hidden md:flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-600 transition-all whitespace-nowrap"
                  >
                    <span>Passports</span>
                  </Link>
                </div>
              </form>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-3 text-xs text-slate-400">
              <span className="text-slate-500">Popular:</span>
              <Link
                href="/planner?model=Qwen/Qwen2.5-32B-Instruct"
                className="rounded-full border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-slate-300 hover:border-sky-500/40 hover:text-sky-300 font-mono text-[11px] transition-colors"
              >
                Qwen2.5-32B
              </Link>
              <Link
                href="/planner?model=meta-llama/Llama-3.3-70B-Instruct"
                className="rounded-full border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-slate-300 hover:border-sky-500/40 hover:text-sky-300 font-mono text-[11px] transition-colors"
              >
                Llama-3.3-70B
              </Link>
              <Link
                href="/planner?model=deepseek-ai/DeepSeek-R1-Distill-Qwen-32B"
                className="rounded-full border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-slate-300 hover:border-sky-500/40 hover:text-sky-300 font-mono text-[11px] transition-colors"
              >
                DeepSeek-R1-32B
              </Link>
            </div>
          </div>

          {/* Pipeline Diagram */}
          <div className="pt-8 max-w-4xl mx-auto">
            <div className="rounded-xl border border-slate-800/80 bg-[#090d16]/70 p-4 backdrop-blur-md">
              <div className="grid grid-cols-2 sm:grid-cols-5 items-center gap-2 text-center text-xs">
                <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/80">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">1. Source</div>
                  <div className="font-semibold text-white mt-0.5">HF Model</div>
                </div>
                <div className="hidden sm:block text-slate-600 font-mono">→</div>
                <div className="p-2.5 rounded-lg border border-sky-500/30 bg-sky-500/10">
                  <div className="text-[10px] text-sky-400 uppercase font-mono">2. Evidence</div>
                  <div className="font-semibold text-white mt-0.5">Compute Passport</div>
                </div>
                <div className="hidden sm:block text-slate-600 font-mono">→</div>
                <div className="p-2.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10">
                  <div className="text-[10px] text-indigo-400 uppercase font-mono">3. Topology</div>
                  <div className="font-semibold text-white mt-0.5">Dynamo / NIM / vLLM</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Flagship Pillars Section */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Compute Passports */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Compute Passports</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Revision-specific deployment specs (<span className="font-mono text-slate-200">org/model@revision</span>) with
                empirical evidence provenance (<span className="text-sky-300 font-mono">MEASURED</span> vs <span className="text-slate-400 font-mono">DOCUMENTED</span>),
                VRAM profiles, and multi-runtime compatibility.
              </p>
            </div>
            <Link
              href="/passports"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
            >
              Browse Compute Passports <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Card 2: Inference SLO Compiler & Dynamo */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Workflow className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Inference SLO Compiler</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Determines the exact topology for your SLA. Automatically synthesizes disaggregated prefill/decode
                manifests for <strong className="text-white">NVIDIA Dynamo</strong> and turnkey <strong className="text-white">NIM</strong> compositions.
              </p>
            </div>
            <Link
              href="/planner"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Launch SLO Planner <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Card 3: Software Lift Metric */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Software Lift Metric</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                How much throughput lift can you extract on identical hardware by upgrading your serving software?
                Transformers (1.00x) &rarr; vLLM (1.78x) &rarr; TensorRT-LLM (2.31x) &rarr; Dynamo (2.71x).
              </p>
            </div>
            <Link
              href="/software-lift"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              View Software Lift Benchmarks <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Live Software Lift Preview Banner */}
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-[#0a1122] to-slate-950 p-6 md:p-8 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div>
              <span className="text-[11px] font-mono uppercase text-emerald-400 tracking-wider">Live Software Lift Analysis</span>
              <h2 className="text-xl md:text-2xl font-bold text-white mt-1">
                Hopper H100: Llama-3.3-70B Throughput Lift
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Holding hardware (NVIDIA H100 SXM5 80GB) and workload (FP8, 4096 ctx) strictly identical.
              </p>
            </div>
            <Link
              href="/software-lift"
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-all whitespace-nowrap"
            >
              Explore Full Comparison
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-6">
            <div className="rounded-xl border border-slate-800 bg-[#070b14] p-4 text-center">
              <div className="text-[11px] text-slate-400 font-mono">Transformers (Baseline)</div>
              <div className="text-2xl font-bold text-white mt-1">38.4 <span className="text-xs font-normal text-slate-400">tok/s</span></div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">1.00x &bull; 0% TTFT red.</div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#070b14] p-4 text-center">
              <div className="text-[11px] text-sky-400 font-mono">vLLM v0.6.4</div>
              <div className="text-2xl font-bold text-sky-300 mt-1">68.2 <span className="text-xs font-normal text-slate-400">tok/s</span></div>
              <div className="text-[11px] text-emerald-400 mt-1 font-mono font-bold">+1.78x Lift &bull; -42% TTFT</div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#070b14] p-4 text-center">
              <div className="text-[11px] text-indigo-400 font-mono">TensorRT-LLM</div>
              <div className="text-2xl font-bold text-indigo-300 mt-1">88.6 <span className="text-xs font-normal text-slate-400">tok/s</span></div>
              <div className="text-[11px] text-emerald-400 mt-1 font-mono font-bold">+2.31x Lift &bull; -54% TTFT</div>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-center">
              <div className="text-[11px] text-emerald-400 font-mono font-bold">Dynamo + TRT-LLM</div>
              <div className="text-2xl font-bold text-emerald-300 mt-1">104.2 <span className="text-xs font-normal text-slate-400">tok/s</span></div>
              <div className="text-[11px] text-emerald-400 mt-1 font-mono font-bold">+2.71x Lift &bull; -62% TTFT</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
