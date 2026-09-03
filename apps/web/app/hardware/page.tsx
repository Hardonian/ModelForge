import Link from 'next/link';
import { Cpu, Zap, Activity, ArrowRight } from 'lucide-react';
import { HARDWARE_CATALOG } from '@modelforge/hardware-registry';

export default function HardwareCatalogPage() {
  const devices = HARDWARE_CATALOG;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Hardware Registry</h1>
        <p className="text-sm text-slate-400 mt-1">
          Cataloged accelerators with exact manufacturer hardware specifications vs observed empirical community bandwidth.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device) => {
          const vramGb = Math.round(device.manufacturer.vram_bytes / 1e9);
          return (
            <div
              key={device.id}
              className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-6 hover:border-slate-700 transition-all hover:shadow-lg hover:shadow-emerald-500/5"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono uppercase text-emerald-400 font-semibold">{device.vendor}</span>
                    <h3 className="text-base font-bold text-white mt-0.5">{device.name}</h3>
                  </div>
                  <span className="rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 text-xs font-mono font-bold">
                    {vramGb} GB
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Memory Bandwidth</span>
                    <span className="text-slate-300 font-semibold">{device.manufacturer.memory_bandwidth_gb_s} GB/s</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">TDP</span>
                    <span className="text-slate-300">{device.manufacturer.tdp_watts} Watts</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Architecture</span>
                    <span className="text-slate-300">{device.manufacturer.architecture}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Interconnect</span>
                    <span className="text-slate-300">{device.manufacturer.interconnect}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 text-[11px] font-mono text-slate-400">
                  <Activity className="h-3.5 w-3.5 text-sky-400" />
                  <span>Observed Bandwidth: {device.observed.observed_effective_bandwidth_gb_s || 'N/A'} GB/s</span>
                  <span className="text-slate-600">({device.observed.sample_count} runs)</span>
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                  {device.supported_precisions.map((p) => (
                    <span
                      key={p}
                      className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] font-mono text-slate-300 uppercase"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">
                  {device.typical_cloud_cost_per_hour_usd ? `$${device.typical_cloud_cost_per_hour_usd.toFixed(2)}/hr` : 'On-Prem / Local'}
                </span>

                <Link
                  href={`/hardware/${device.vendor}/${device.slug}`}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  <span>Inspect accelerator</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
