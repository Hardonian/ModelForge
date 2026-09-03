import Link from "next/link";
import {
  Database,
  ExternalLink,
  Code,
  Download,
  ShieldCheck,
  Layers,
} from "lucide-react";

export default function DatasetsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div>
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-sky-400" />
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            OpenComputeBench Dataset
          </h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          The public, open-source dataset of reproducible AI inference benchmark
          observations published to Hugging Face Datasets.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
            <h2 className="text-base font-bold text-white">Dataset Overview</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              OpenComputeBench records multi-dimensional inference telemetry
              connecting models, quantizations, serving runtimes, and physical
              accelerators. Every row includes warmup and measured iterations,
              P50/P90/P95/P99 latency percentiles, memory waterfalls, and
              environment cryptographic hashes.
            </p>

            <div className="rounded-lg bg-black/60 p-4 border border-slate-800 font-mono text-xs text-slate-300">
              <div className="text-slate-500 mb-2">
                # Load OpenComputeBench via Hugging Face datasets:
              </div>
              <code>from datasets import load_dataset</code>
              <br />
              <code>
                ds = load_dataset(&quot;modelforge/opencomputebench&quot;)
              </code>
              <br />
              <code>print(ds[&quot;train&quot;][0])</code>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
            <h2 className="text-base font-bold text-white">
              Core Schema Entities
            </h2>
            <div className="divide-y divide-slate-800 text-xs font-mono">
              <div className="py-2.5 flex justify-between">
                <span className="text-sky-400 font-bold">model</span>
                <span className="text-slate-400">
                  repository, revision, parameters_billions, architecture
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-emerald-400 font-bold">hardware</span>
                <span className="text-slate-400">
                  vendor, device, vram_bytes, interconnect, count
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-amber-400 font-bold">runtime</span>
                <span className="text-slate-400">
                  vllm, tensorrt-llm, llama.cpp, sglang, version, flags
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-indigo-400 font-bold">metrics</span>
                <span className="text-slate-400">
                  ttft_ms (percentiles), tpot_ms, tokens_per_second, vram
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-purple-400 font-bold">provenance</span>
                <span className="text-slate-400">
                  environment_hash, result_hash, submitted_by, timestamps
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Dataset Summary</h3>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Schema Version:</span>
                <span className="text-white font-bold">1.0.0</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Total Records:</span>
                <span className="text-sky-400 font-bold">14,280+</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">License:</span>
                <span className="text-white font-bold">
                  CDLA-Permissive-2.0
                </span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-slate-400">Format:</span>
                <span className="text-white font-bold">Parquet & JSONL</span>
              </div>
            </div>

            <a
              href="https://huggingface.co/datasets"
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-sky-400 transition-all mt-4"
            >
              <span>View on Hugging Face</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
