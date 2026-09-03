import Link from "next/link";
import {
  Database,
  TrendingUp,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-400 font-mono">
          Product Vision & Technical Thesis
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          The Open Compute Intelligence Layer for AI.
        </h1>
        <p className="text-lg text-slate-300 leading-relaxed">
          ModelForge is building the foundational compute decision engine for AI
          inference — combining the community transparency of PCPartPicker, the
          scientific rigor of MLPerf, and the enterprise clarity of cloud
          FinOps.
        </p>
      </div>

      <div className="space-y-10 border-t border-slate-800 pt-10 text-slate-300 text-sm leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">
            1. The Problem: Combinatorial Inference Complexity
          </h2>
          <p>
            AI model architectures are proliferating daily. Hardware
            accelerators are expanding across NVIDIA, AMD, Apple Silicon, Intel
            Gaudi, and custom ASICs. Serving runtimes (vLLM, TensorRT-LLM,
            llama.cpp, SGLang) update weekly. Quantization precisions (FP8,
            INT4, AWQ) shift memory bandwidth and latency tradeoffs
            dramatically.
          </p>
          <p>
            Engineers are forced to make multimillion-dollar GPU cluster
            provisioning decisions based on fragmented blogs, cherry-picked
            vendor benchmarks, or costly trial-and-error OOM crashes in
            production.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">
            2. The Solution: OpenComputeBench Intelligence Graph
          </h2>
          <p>
            ModelForge constructs a living, cryptographically verified graph
            connecting every reproducible benchmark observation:
          </p>
          <div className="rounded-xl border border-slate-800 bg-black/60 p-4 font-mono text-xs text-sky-400">
            MODEL → REVISION → QUANTIZATION → RUNTIME → ACCELERATOR →
            INTERCONNECT → CONTEXT → TTFT → TPOT → PEAK VRAM → COST
          </div>
          <p>
            Every measurement is signed with deterministic environment and
            result hashes, ensuring that synthetic fixtures are never conflated
            with verified hardware runs.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">
            3. The Network Effect & Compounding Data Moat
          </h2>
          <p>ModelForge creates an organic virtuous flywheel:</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400">
            <li>
              More developers install the open-source CLI agent and run
              benchmarks.
            </li>
            <li>
              The OpenComputeBench graph deepens across rare model/hardware
              permutations.
            </li>
            <li>
              ModelFit scoring accuracy and workload optimizer recommendations
              improve.
            </li>
            <li>
              More enterprise teams deploy ModelForge to optimize
              high-throughput inference clusters.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">
            4. The Commercial SaaS Layer
          </h2>
          <p>
            While the core benchmark graph is open and public, enterprise teams
            utilize ModelForge for private workload traces, proprietary model
            registry profiling, multi-tenant RBAC, VPC-isolated benchmark
            runners, and automated cloud cost reduction.
          </p>
        </section>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold text-white">
            Ready to optimize your serving infrastructure?
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Run an optimization query or inspect your local GPU setup today.
          </p>
        </div>
        <Link
          href="/optimizer"
          className="rounded-lg bg-sky-500 px-5 py-2.5 text-xs font-semibold text-white hover:bg-sky-400 transition-all shrink-0"
        >
          Launch Optimizer →
        </Link>
      </div>
    </div>
  );
}
