import Link from 'next/link';
import { Code, Key, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ApiProductPage() {
  const endpoints = [
    { method: 'GET', path: '/api/v1/benchmarks', desc: 'Query verified benchmarks with filtering by model, GPU, runtime, precision' },
    { method: 'GET', path: '/api/v1/benchmarks/:id', desc: 'Retrieve single reproducible benchmark record with percentiles & environment hashes' },
    { method: 'POST', path: '/api/v1/benchmark-submissions', desc: 'Submit OpenComputeBench observation with anti-tamper hash verification' },
    { method: 'POST', path: '/api/v1/model-fit', desc: 'Compute explainable 6-dimension ModelFit score for model + hardware configuration' },
    { method: 'POST', path: '/api/v1/optimizer', desc: 'Solve multi-objective workload optimization query and generate deployment manifests' },
    { method: 'GET', path: '/api/v1/models', desc: 'List normalized model intelligence catalog' },
    { method: 'GET', path: '/api/v1/hardware', desc: 'List hardware registry with specs and empirical observed bandwidth' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div>
        <div className="flex items-center gap-2">
          <Code className="h-5 w-5 text-sky-400" />
          <h1 className="text-3xl font-extrabold text-white tracking-tight">ModelForge API</h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Production REST API for inference telemetry, ModelFit scoring, and automated infrastructure optimization.
        </p>
      </div>

      {/* Auth Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white font-sans font-bold">
            <Key className="h-4 w-4 text-sky-400" />
            <span>Authentication</span>
          </div>
          <p className="text-slate-400 font-sans">
            Authenticate requests using standard Bearer API tokens. Keys are hashed at rest via SHA-256.
          </p>
          <code className="text-slate-300 block pt-1">Authorization: Bearer mf_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx</code>
        </div>

        <Link
          href="/dashboard/api-keys"
          className="rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-sky-500/20 hover:bg-sky-400 font-sans"
        >
          Create API Key →
        </Link>
      </div>

      {/* Endpoints Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Versioned Endpoints (v1)</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/30">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 w-24">Method</th>
                <th className="py-3 px-4">Endpoint</th>
                <th className="py-3 px-4 font-sans">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {endpoints.map((ep) => (
                <tr key={ep.path} className="hover:bg-slate-800/20">
                  <td className="py-3.5 px-4 font-bold">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${ep.method === 'GET' ? 'bg-sky-500/10 text-sky-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {ep.method}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-white font-bold">{ep.path}</td>
                  <td className="py-3.5 px-4 font-sans text-slate-400">{ep.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
