import Link from 'next/link';
import { BookOpen, Terminal, Code2, ShieldCheck, Cpu, ArrowRight } from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-sky-400" />
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Developer Documentation</h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Complete guides, CLI reference, benchmark schema specification, and REST API integration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-3">
          <Terminal className="h-5 w-5 text-sky-400" />
          <h3 className="text-base font-bold text-white">CLI Benchmark Agent</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Install and run the `modelforge` CLI to inspect host hardware, run multi-phase reproducible benchmarks, and submit verified results.
          </p>
          <div className="pt-2">
            <code className="text-[11px] font-mono text-sky-300 block bg-black/60 p-2 rounded border border-slate-800">
              uv tool install modelforge
            </code>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-3">
          <Code2 className="h-5 w-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">OpenComputeBench Schema</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            JSON Schema and Pydantic validation definitions for OpenComputeBench v1.0.0. Understand latency percentile structures and cryptographic hashing.
          </p>
          <div className="pt-2">
            <code className="text-[11px] font-mono text-emerald-300 block bg-black/60 p-2 rounded border border-slate-800">
              schema_version: &quot;1.0.0&quot;
            </code>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-3">
          <Cpu className="h-5 w-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">REST API Reference</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Query verified benchmarks, calculate ModelFit scores programmatically, and trigger the workload optimizer via versioned `/api/v1` endpoints.
          </p>
          <div className="pt-2">
            <Link href="/api" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              Explore API Endpoints <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-8 space-y-6">
        <h2 className="text-xl font-bold text-white">Quickstart Workflow</h2>

        <div className="space-y-4 text-xs font-mono text-slate-300">
          <div className="space-y-1">
            <span className="text-slate-400 font-sans font-semibold">1. Inspect host hardware & dependencies:</span>
            <pre className="rounded bg-black/70 p-3 border border-slate-800">modelforge doctor</pre>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-sans font-semibold">2. Calculate model memory requirements across precisions:</span>
            <pre className="rounded bg-black/70 p-3 border border-slate-800">modelforge model inspect Qwen/Qwen2.5-32B-Instruct</pre>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-sans font-semibold">3. Execute benchmark with vLLM engine:</span>
            <pre className="rounded bg-black/70 p-3 border border-slate-800">modelforge benchmark Qwen/Qwen2.5-32B-Instruct --runtime vllm --precision fp8 --output run.json</pre>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-sans font-semibold">4. Validate cryptographic integrity and schema:</span>
            <pre className="rounded bg-black/70 p-3 border border-slate-800">modelforge validate run.json</pre>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-sans font-semibold">5. Submit observation to OpenComputeBench network:</span>
            <pre className="rounded bg-black/70 p-3 border border-slate-800">modelforge submit run.json</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
