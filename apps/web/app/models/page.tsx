import Link from 'next/link';
import { Layers, Download, CheckCircle, Tag, ArrowRight } from 'lucide-react';
import { dataLayer } from '@modelforge/database';

export default function ModelsCatalogPage() {
  const models = dataLayer.listModels();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Model Intelligence Catalog</h1>
        <p className="text-sm text-slate-400 mt-1">
          Normalized model architectures, memory requirements, quantization feasibility, and verified benchmark observations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models.map((model) => (
          <div
            key={model.id}
            className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-6 hover:border-slate-700 transition-all hover:shadow-lg hover:shadow-sky-500/5"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono text-sky-400 font-semibold">{model.provider}</span>
                  <h3 className="text-base font-bold text-white mt-0.5">{model.name}</h3>
                </div>
                <span className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-mono font-bold text-slate-200">
                  {model.parameters_billions}B
                </span>
              </div>

              <p className="text-xs text-slate-400 font-mono">ID: {model.id}</p>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">Context Window</span>
                  <span className="text-slate-300 font-semibold">{model.context_window / 1000}k tokens</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Architecture</span>
                  <span className="text-slate-300 truncate block">{model.architecture}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Layers / KV Heads</span>
                  <span className="text-slate-300">{model.layers} / {model.kv_heads}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">License</span>
                  <span className="text-slate-300">{model.license}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2">
                {model.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-slate-800/60 px-2 py-0.5 text-[10px] font-mono text-slate-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                <Download className="h-3.5 w-3.5 text-slate-500" />
                <span>{(model.downloads_monthly / 1e6).toFixed(1)}M/mo</span>
              </div>

              <Link
                href={`/models/${model.id}`}
                className="flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300"
              >
                <span>Inspect model</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
