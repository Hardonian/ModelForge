import Link from 'next/link';
import { dataLayer } from '@modelforge/database';

export const metadata = {
  title: 'Inference Architecture Support Matrix — ModelForge',
  description: 'Verified support matrix across model architectures, serving runtimes, deployment targets, and compute hardware.'
};

export const dynamic = 'force-dynamic';

export default function SupportMatrixPage() {
  const matrix = dataLayer.getSupportMatrix();

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-3">
            RELEASE v{matrix.version} OFFICIAL MATRIX
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
            Architecture Support Matrix
          </h1>
          <p className="text-slate-400 mt-2 text-sm md:text-base">
            Official deployment compatibility boundaries between open Hugging Face weights and production compute.
          </p>
        </div>

        <div>
          <Link
            href="/api/v1/support-matrix"
            target="_blank"
            className="px-4 py-2 text-xs font-mono rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 transition inline-block"
          >
            Machine-Readable JSON →
          </Link>
        </div>
      </div>

      {/* 1. Model Families */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span>Supported Model Families</span>
          <span className="text-xs font-normal text-slate-400 font-mono">({matrix.model_families.length} families)</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matrix.model_families.map((fam) => (
            <div key={fam.family} className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white text-base">{fam.family}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    {fam.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">{fam.description}</p>
                <div className="text-xs font-mono text-slate-300 mb-2">
                  <span className="text-slate-500 block text-[10px] uppercase">Architectures</span>
                  {fam.verified_architectures.join(', ')}
                </div>
              </div>
              <div className="pt-3 border-t border-slate-800/60 text-xs text-sky-400 font-mono">
                {fam.models.length} Verified Model Repositories
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Serving Runtimes */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span>Inference Serving Runtimes</span>
          <span className="text-xs font-normal text-slate-400 font-mono">({matrix.runtimes.length} runtimes)</span>
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4">Runtime</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Accelerators</th>
                <th className="py-3 px-4">Optimization Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {matrix.runtimes.map((rt) => (
                <tr key={rt.name} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4 font-mono font-bold text-white">{rt.name}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{rt.category}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      rt.status === 'SUPPORTED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {rt.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">{rt.supported_accelerators.join(', ')}</td>
                  <td className="py-3 px-4 text-slate-400">{rt.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Accelerator Support & Deployment Targets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Accelerators */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Hardware Accelerators</h2>
          <div className="space-y-3">
            {matrix.accelerator_support.map((acc) => (
              <div key={acc.device} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white text-sm">{acc.device}</h4>
                  <div className="flex gap-1.5 mt-1">
                    {acc.tested_precisions.map((p) => (
                      <span key={p} className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
                  acc.status === 'DEEP_SUPPORT' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {acc.status === 'DEEP_SUPPORT' ? 'Deep Support' : 'Community'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Deployment Targets */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Deployment Manifest Targets</h2>
          <div className="space-y-3">
            {matrix.deployment_targets.map((tgt) => (
              <div key={tgt.name} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white text-sm">{tgt.name}</h4>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">Manifest: {tgt.manifest_format}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {tgt.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
