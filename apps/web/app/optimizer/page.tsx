import Link from 'next/link';
import { Sparkles, ArrowRight, Terminal, CheckCircle2, Copy, FileCode, Sliders, ShieldCheck } from 'lucide-react';
import { solveWorkloadOptimization } from '@modelforge/optimizer';
import { dataLayer } from '@modelforge/database';
import { ModelFitBadge, ProvenanceTag } from '@/components/Badges';

interface PageProps {
  searchParams: Promise<{
    model?: string;
    objective?: string;
    context?: string;
    concurrency?: string;
  }>;
}

export default async function OptimizerPage({ searchParams }: PageProps) {
  const { model, objective, context, concurrency } = await searchParams;
  const models = dataLayer.listModels();

  const selectedModelId = model || 'Qwen/Qwen2.5-32B-Instruct';
  const selectedModel = dataLayer.getModel(selectedModelId) || models[0]!;
  const contextLength = Number(context) || 4096;
  const concurrencyLevel = Number(concurrency) || 4;
  const targetObjective = (objective as any) || 'best_balanced';

  const result = solveWorkloadOptimization({
    model: {
      id: selectedModel.id,
      parameters_billions: selectedModel.parameters_billions,
      context_window: selectedModel.context_window,
      layers: selectedModel.layers,
      kv_heads: selectedModel.kv_heads,
      head_dim: selectedModel.head_dim,
      architecture: selectedModel.architecture
    },
    workload: {
      context_length: contextLength,
      prompt_tokens: 1024,
      generated_tokens: 256,
      concurrency: concurrencyLevel,
      expected_requests_per_day: 50000
    },
    constraints: {
      max_devices: 4
    },
    objective: targetObjective
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-sky-400" />
          <h1 className="text-3xl font-extrabold text-white tracking-tight">AI Workload Optimizer</h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Solve the combinatorial equation: Find the optimal accelerator + precision + runtime configuration satisfying latency targets and budget constraints.
        </p>
      </div>

      {/* Interactive Controls & Filters */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-800 text-xs font-mono text-slate-300">
          <Sliders className="h-4 w-4 text-sky-400" />
          <span className="font-bold">Workload Parameters & Optimization Objective</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1.5">Model Repository</label>
            <div className="text-sm font-bold text-white font-sans">{selectedModel.name}</div>
            <span className="text-[10px] font-mono text-slate-500">{selectedModel.parameters_billions}B Parameters</span>
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1.5">Target Objective</label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'best_balanced', label: 'Balanced' },
                { key: 'lowest_cost', label: 'Lowest Cost' },
                { key: 'highest_throughput', label: 'Max Throughput' },
                { key: 'lowest_latency', label: 'Lowest Latency' }
              ].map((obj) => (
                <Link
                  key={obj.key}
                  href={`/optimizer?model=${encodeURIComponent(selectedModel.id)}&objective=${obj.key}&context=${contextLength}&concurrency=${concurrencyLevel}`}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                    targetObjective === obj.key
                      ? 'bg-sky-500 text-white font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {obj.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1.5">Context Length</label>
            <div className="flex items-center gap-2">
              {[2048, 4096, 8192, 16384].map((c) => (
                <Link
                  key={c}
                  href={`/optimizer?model=${encodeURIComponent(selectedModel.id)}&objective=${targetObjective}&context=${c}&concurrency=${concurrencyLevel}`}
                  className={`px-2 py-1 rounded text-xs font-mono ${
                    contextLength === c
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {c / 1000}k
                </Link>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1.5">Target Concurrency</label>
            <div className="flex items-center gap-2">
              {[1, 2, 4, 8].map((conc) => (
                <Link
                  key={conc}
                  href={`/optimizer?model=${encodeURIComponent(selectedModel.id)}&objective=${targetObjective}&context=${contextLength}&concurrency=${conc}`}
                  className={`px-2.5 py-1 rounded text-xs font-mono ${
                    concurrencyLevel === conc
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {conc}x
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ranked Candidate Results */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Ranked Serving Configurations</h2>
            <p className="text-xs text-slate-400 font-mono">
              Evaluated {result.total_evaluated_configurations} potential configurations · {result.valid_configurations_count} viable candidates · {result.unviable_configurations_count} OOM/pruned
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {result.top_recommendations.map((candidate, idx) => (
            <div
              key={candidate.id}
              className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4 hover:border-slate-700 transition-all shadow-xl"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/20 font-mono font-bold text-sky-400 text-xs">
                    #{idx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">{candidate.hardware_name}</h3>
                    <p className="text-xs font-mono text-slate-400">
                      {candidate.model_id} · Precision: {candidate.precision.toUpperCase()} · Runtime: {candidate.runtime}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <ProvenanceTag provenance={candidate.provenance} />
                  <ModelFitBadge score={candidate.model_fit.overall_score} grade={candidate.model_fit.grade} />
                </div>
              </div>

              {/* Performance & FinOps Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 font-mono text-xs">
                <div className="rounded bg-slate-950/60 p-3">
                  <span className="text-slate-500 block text-[10px]">Estimated Throughput</span>
                  <span className="text-sm font-bold text-sky-400">{candidate.estimated_throughput_tps} tok/s</span>
                </div>
                <div className="rounded bg-slate-950/60 p-3">
                  <span className="text-slate-500 block text-[10px]">P50 TTFT</span>
                  <span className="text-sm font-bold text-white">{candidate.estimated_ttft_ms} ms</span>
                </div>
                <div className="rounded bg-slate-950/60 p-3">
                  <span className="text-slate-500 block text-[10px]">P50 TPOT</span>
                  <span className="text-sm font-bold text-white">{candidate.estimated_tpot_ms} ms</span>
                </div>
                <div className="rounded bg-slate-950/60 p-3">
                  <span className="text-slate-500 block text-[10px]">Est. Cost / 1M Tokens</span>
                  <span className="text-sm font-bold text-emerald-400">${candidate.cost_per_million_tokens_usd}</span>
                </div>
                <div className="rounded bg-slate-950/60 p-3">
                  <span className="text-slate-500 block text-[10px]">Cloud Rate</span>
                  <span className="text-sm font-bold text-slate-300">${candidate.cost_per_hour_usd} / hr</span>
                </div>
              </div>

              {/* Diagnostic Explanations */}
              <div className="text-xs text-slate-400 font-mono space-y-1">
                {candidate.model_fit.explanations.map((exp, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-emerald-400/90 text-[11px]">
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    <span>{exp}</span>
                  </div>
                ))}
              </div>

              {/* Manifest Launch Code Block */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1">
                    <FileCode className="h-3.5 w-3.5 text-sky-400" />
                    <span>Generated vLLM Docker Launch Command</span>
                  </span>
                </div>
                <div className="rounded-lg bg-black/70 p-3 text-slate-300 border border-slate-800 font-mono text-xs overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{candidate.manifests.docker_run_command}</pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
