'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Workflow, 
  Cpu, 
  Server, 
  Layers, 
  Download, 
  Copy, 
  Check, 
  ShieldCheck, 
  ArrowRight,
  Zap,
  DollarSign,
  Activity
} from 'lucide-react';
import { compileSLOToDeploymentPlan, WorkloadFingerprint, SLOSpec, DeploymentPlan } from '@modelforge/slo-compiler';

const SAMPLE_MODELS = [
  'Qwen/Qwen2.5-32B-Instruct',
  'meta-llama/Llama-3.3-70B-Instruct',
  'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B'
];

export default function PlannerPage() {
  const [modelRepo, setModelRepo] = useState('Qwen/Qwen2.5-32B-Instruct');
  const [modelRevision, setModelRevision] = useState('main');
  const [taskType, setTaskType] = useState<'rag' | 'code_generation' | 'general_chat' | 'batch_eval'>('rag');
  const [concurrency, setConcurrency] = useState(8);
  const [contextLength, setContextLength] = useState(4096);
  const [maxCost1m, setMaxCost1m] = useState(1.50);
  const [maxTtftMs, setMaxTtftMs] = useState(400);

  const [activeTab, setActiveTab] = useState<'dynamo' | 'nim' | 'vllm' | 'json'>('dynamo');
  const [copied, setCopied] = useState(false);

  // Compile SLO
  const workload: WorkloadFingerprint = {
    fingerprint_id: 'wf-demo',
    task_type: taskType,
    prompt_token_mean: Math.round(contextLength * 0.75),
    output_token_mean: Math.round(contextLength * 0.25),
    context_length_target: contextLength,
    target_concurrency: concurrency,
    requests_per_day: 50000,
    streaming_required: true,
    arrival_pattern: 'bursty'
  };

  const slo: SLOSpec = {
    max_p95_ttft_ms: maxTtftMs,
    max_p95_tpot_ms: 30,
    max_cost_per_1m_tokens_usd: maxCost1m,
    require_disaggregated_prefill_decode: concurrency >= 8
  };

  const plan: DeploymentPlan = compileSLOToDeploymentPlan(modelRepo, modelRevision, workload, slo);

  const copyManifest = () => {
    let content = '';
    if (activeTab === 'dynamo') content = plan.generated_manifests.dynamo_config_yaml || '';
    else if (activeTab === 'nim') content = plan.generated_manifests.docker_compose_yaml || '';
    else if (activeTab === 'vllm') content = plan.generated_manifests.vllm_docker_run || '';
    else content = JSON.stringify(plan, null, 2);

    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400">
          <Workflow className="h-3.5 w-3.5" />
          <span>Inference SLO Compiler v2.0.0</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          Deployment Planner & Topology Synthesizer
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          Compile exact inference SLAs into optimal serving topologies. Automatically synthesizes disaggregated 
          prefill/decode routing for <strong className="text-white">NVIDIA Dynamo</strong>, turnkey <strong className="text-white">NIM</strong> configurations, and <strong className="text-white">vLLM</strong> pods.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Workload & SLO Inputs */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-6 backdrop-blur-sm h-fit">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-400" />
            Workload & SLO Parameters
          </h2>

          {/* Model Repo */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-300">Model Repository</label>
            <input
              type="text"
              value={modelRepo}
              onChange={(e) => setModelRepo(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-[#070b14] px-3 py-2 text-xs font-mono text-white focus:border-sky-500 focus:outline-none"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SAMPLE_MODELS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModelRepo(m)}
                  className="text-[10px] font-mono px-2 py-0.5 rounded border border-slate-800 bg-slate-900 text-slate-400 hover:text-sky-300 hover:border-slate-700 transition-colors"
                >
                  {m.split('/')[1]}
                </button>
              ))}
            </div>
          </div>

          {/* Model Revision */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-300">Exact Revision / Commit</label>
            <input
              type="text"
              value={modelRevision}
              onChange={(e) => setModelRevision(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-[#070b14] px-3 py-2 text-xs font-mono text-white focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Task Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-300">Workload Task Profile</label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value as any)}
              className="w-full rounded-xl border border-slate-800 bg-[#070b14] px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
            >
              <option value="rag">Customer Support / RAG (Context Heavy)</option>
              <option value="code_generation">Code Autocomplete (Low Latency Decode)</option>
              <option value="general_chat">General Conversational Chat</option>
              <option value="batch_eval">Offline Batch Evaluation</option>
            </select>
          </div>

          {/* Concurrency Target */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Target Concurrency:</span>
              <span className="text-sky-400 font-bold">{concurrency} requests</span>
            </div>
            <input
              type="range"
              min="1"
              max="64"
              value={concurrency}
              onChange={(e) => setConcurrency(parseInt(e.target.value))}
              className="w-full accent-sky-500"
            />
          </div>

          {/* Context Length */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Context Length:</span>
              <span className="text-sky-400 font-bold">{contextLength.toLocaleString()} tokens</span>
            </div>
            <input
              type="range"
              min="1024"
              max="16384"
              step="1024"
              value={contextLength}
              onChange={(e) => setContextLength(parseInt(e.target.value))}
              className="w-full accent-sky-500"
            />
          </div>

          {/* Max P95 TTFT */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Max P95 TTFT SLA:</span>
              <span className="text-indigo-400 font-bold">{maxTtftMs} ms</span>
            </div>
            <input
              type="range"
              min="100"
              max="1000"
              step="50"
              value={maxTtftMs}
              onChange={(e) => setMaxTtftMs(parseInt(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          {/* Cost Ceiling */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Cost Ceiling / 1M tokens:</span>
              <span className="text-emerald-400 font-bold">${maxCost1m.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.20"
              max="5.00"
              step="0.10"
              value={maxCost1m}
              onChange={(e) => setMaxCost1m(parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>
        </div>

        {/* Right 2 Columns: Ranked Candidates & Manifests */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Ranked Candidate Banner */}
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 via-slate-900/60 to-slate-900/60 p-6 backdrop-blur-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase text-emerald-400 tracking-wider font-bold">
                  Recommended Deployment Candidate (Rank #1)
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">
                  {plan.recommended_candidate.target} &bull; {plan.recommended_candidate.hardware.device_name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  SLO Fit: {plan.recommended_candidate.slo_compliance_score}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="p-3 rounded-xl border border-slate-800 bg-[#070b14]">
                <div className="text-[10px] font-mono text-slate-400">Expected Throughput</div>
                <div className="text-lg font-bold text-emerald-300 mt-0.5">{plan.recommended_candidate.expected_tps} tok/s</div>
              </div>
              <div className="p-3 rounded-xl border border-slate-800 bg-[#070b14]">
                <div className="text-[10px] font-mono text-slate-400">P95 TTFT</div>
                <div className="text-lg font-bold text-white mt-0.5">{plan.recommended_candidate.expected_ttft_ms} ms</div>
              </div>
              <div className="p-3 rounded-xl border border-slate-800 bg-[#070b14]">
                <div className="text-[10px] font-mono text-slate-400">Cost / 1M Tokens</div>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">${plan.recommended_candidate.cost_per_1m_tokens_usd.toFixed(2)}</div>
              </div>
              <div className="p-3 rounded-xl border border-slate-800 bg-[#070b14]">
                <div className="text-[10px] font-mono text-slate-400">Evidence Provenance</div>
                <div className="text-lg font-bold text-sky-400 mt-0.5">{plan.recommended_candidate.evidence_provenance}</div>
              </div>
            </div>

            {/* Disaggregated Topology Callout */}
            {plan.recommended_candidate.topology.mode === 'disaggregated' && (
              <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-950/20 text-xs text-indigo-200 space-y-1">
                <div className="font-mono font-bold text-indigo-300 text-[11px] uppercase flex items-center gap-1.5">
                  <Workflow className="h-3.5 w-3.5" />
                  Disaggregated Prefill / Decode Topology Active
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Routing policy: <span className="font-mono text-white">{plan.recommended_candidate.topology.routing_policy}</span> across 
                  1x Prefill worker ({plan.recommended_candidate.topology.prefill_workers[0]?.device_type}) and 
                  1x Decode worker ({plan.recommended_candidate.topology.decode_workers[0]?.device_type}).
                </p>
              </div>
            )}
          </div>

          {/* Alternative Candidates Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Evaluated Candidate Topologies</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-400 font-mono">
                  <tr>
                    <th className="pb-2">Target</th>
                    <th className="pb-2">Hardware</th>
                    <th className="pb-2">Throughput</th>
                    <th className="pb-2">P95 TTFT</th>
                    <th className="pb-2">Cost/1M</th>
                    <th className="pb-2">SLO Fit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {plan.candidate_rankings.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-2.5 font-semibold text-white">{c.target}</td>
                      <td className="py-2.5 font-mono text-[11px]">{c.hardware.device_name}</td>
                      <td className="py-2.5 text-emerald-300 font-mono">{c.expected_tps} tok/s</td>
                      <td className="py-2.5 font-mono">{c.expected_ttft_ms} ms</td>
                      <td className="py-2.5 font-mono text-slate-300">${c.cost_per_1m_tokens_usd.toFixed(2)}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          c.meets_slo ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'
                        }`}>
                          {c.slo_compliance_score}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Generated Manifests Interactive Viewer */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('dynamo')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                    activeTab === 'dynamo' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  dynamo-config.yaml
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('nim')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                    activeTab === 'nim' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  docker-compose.yaml (NIM)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('vllm')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                    activeTab === 'vllm' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  run-vllm.sh
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('json')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                    activeTab === 'json' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  plan.json
                </button>
              </div>

              <button
                type="button"
                onClick={copyManifest}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs font-mono text-slate-300 hover:text-white transition-all w-fit"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Manifest'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl border border-slate-800 bg-[#060a12] text-xs font-mono text-slate-200 overflow-x-auto max-h-96">
              {activeTab === 'dynamo' && (plan.generated_manifests.dynamo_config_yaml || '# No Dynamo manifest')}
              {activeTab === 'nim' && (plan.generated_manifests.docker_compose_yaml || '# No NIM manifest')}
              {activeTab === 'vllm' && (plan.generated_manifests.vllm_docker_run || '# No vLLM script')}
              {activeTab === 'json' && JSON.stringify(plan, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
