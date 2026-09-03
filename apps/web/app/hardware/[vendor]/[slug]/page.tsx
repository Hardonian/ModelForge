import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Cpu,
  Zap,
  Activity,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import {
  getHardwareDevice,
  HARDWARE_CATALOG,
} from "@modelforge/hardware-registry";
import { dataLayer } from "@modelforge/database";
import { VerificationBadge } from "@/components/Badges";

interface PageProps {
  params: Promise<{
    vendor: string;
    slug: string;
  }>;
}

export default async function HardwareDetailPage({ params }: PageProps) {
  const { vendor, slug } = await params;
  const device =
    getHardwareDevice(slug) || HARDWARE_CATALOG.find((d) => d.slug === slug);

  if (!device) {
    notFound();
  }

  const vramGb = Math.round(device.manufacturer.vram_bytes / 1e9);
  const benchmarks = dataLayer.listBenchmarks({ hardware: device.name });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
        <Link
          href="/hardware"
          className="hover:text-white flex items-center gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Hardware</span>
        </Link>
        <span>/</span>
        <span className="uppercase text-slate-400">{device.vendor}</span>
        <span>/</span>
        <span className="text-slate-200">{device.slug}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-mono uppercase text-emerald-400 border border-emerald-500/20">
              {device.vendor}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Arch: {device.manufacturer.architecture}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Released: {device.release_year}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
            {device.name}
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Registry ID: {device.id}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right font-mono">
            <div className="text-xs text-slate-400">Typical Cloud Rate</div>
            <div className="text-lg font-bold text-white">
              {device.typical_cloud_cost_per_hour_usd
                ? `$${device.typical_cloud_cost_per_hour_usd.toFixed(2)} / hr`
                : "On-Prem / Local"}
            </div>
          </div>
        </div>
      </div>

      {/* Manufacturer Spec vs Observed Empirical Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Manufacturer Specifications */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-emerald-400" />
            <h2 className="text-base font-bold text-white">
              Manufacturer Specifications
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Official vendor hardware datasheet values.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-xs border-t border-slate-800">
            <div className="rounded bg-slate-950/60 p-3">
              <span className="text-slate-500 block text-[10px]">
                Physical VRAM
              </span>
              <span className="text-sm font-bold text-white">{vramGb} GB</span>
            </div>
            <div className="rounded bg-slate-950/60 p-3">
              <span className="text-slate-500 block text-[10px]">
                Memory Bandwidth
              </span>
              <span className="text-sm font-bold text-white">
                {device.manufacturer.memory_bandwidth_gb_s} GB/s
              </span>
            </div>
            <div className="rounded bg-slate-950/60 p-3">
              <span className="text-slate-500 block text-[10px]">
                Thermal Design Power (TDP)
              </span>
              <span className="text-sm font-bold text-white">
                {device.manufacturer.tdp_watts} Watts
              </span>
            </div>
            <div className="rounded bg-slate-950/60 p-3">
              <span className="text-slate-500 block text-[10px]">
                Interconnect Type
              </span>
              <span className="text-sm font-bold text-white">
                {device.manufacturer.interconnect}
              </span>
            </div>
            {device.manufacturer.fp8_tflops && (
              <div className="rounded bg-slate-950/60 p-3">
                <span className="text-slate-500 block text-[10px]">
                  FP8 Dense Compute
                </span>
                <span className="text-sm font-bold text-white">
                  {device.manufacturer.fp8_tflops} TFLOPS
                </span>
              </div>
            )}
            {device.manufacturer.fp16_tflops && (
              <div className="rounded bg-slate-950/60 p-3">
                <span className="text-slate-500 block text-[10px]">
                  FP16 / BF16 Compute
                </span>
                <span className="text-sm font-bold text-white">
                  {device.manufacturer.fp16_tflops} TFLOPS
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Observed Empirical Telemetry */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-sky-400" />
            <h2 className="text-base font-bold text-white">
              Empirical Telemetry
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Real measured values aggregated across multi-run community benchmark
            observations.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-xs border-t border-slate-800">
            <div className="rounded bg-slate-950/60 p-3">
              <span className="text-slate-500 block text-[10px]">
                Observed Effective Bandwidth
              </span>
              <span className="text-sm font-bold text-sky-400">
                {device.observed.observed_effective_bandwidth_gb_s
                  ? `${device.observed.observed_effective_bandwidth_gb_s} GB/s`
                  : "Analyzing"}
              </span>
            </div>
            <div className="rounded bg-slate-950/60 p-3">
              <span className="text-slate-500 block text-[10px]">
                Measured Benchmark Runs
              </span>
              <span className="text-sm font-bold text-white">
                {device.observed.sample_count} runs
              </span>
            </div>
            <div className="rounded bg-slate-950/60 p-3">
              <span className="text-slate-500 block text-[10px]">
                Bandwidth Efficiency
              </span>
              <span className="text-sm font-bold text-emerald-400">
                {device.observed.observed_effective_bandwidth_gb_s
                  ? `${Math.round((device.observed.observed_effective_bandwidth_gb_s / device.manufacturer.memory_bandwidth_gb_s) * 100)}% of theoretical`
                  : "90%+"}
              </span>
            </div>
            <div className="rounded bg-slate-950/60 p-3">
              <span className="text-slate-500 block text-[10px]">Category</span>
              <span className="text-sm font-bold text-white uppercase">
                {device.category}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-slate-400 text-xs block mb-2 font-mono">
              Supported Serving Runtimes:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {device.supported_runtimes.map((rt) => (
                <span
                  key={rt}
                  className="rounded bg-slate-800 px-2 py-1 text-xs font-mono text-slate-300"
                >
                  {rt}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Benchmarks on this hardware */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">
          Empirical Benchmarks on {device.name}
        </h2>
        {benchmarks.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-8 text-center text-xs text-slate-400">
            No benchmarks recorded yet on this specific device. Run `modelforge
            benchmark` on this hardware to publish the first observation.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/30">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Benchmark ID</th>
                  <th className="py-3 px-4">Model</th>
                  <th className="py-3 px-4">Precision</th>
                  <th className="py-3 px-4">Runtime</th>
                  <th className="py-3 px-4 text-right">Throughput</th>
                  <th className="py-3 px-4 text-right">P50 TTFT</th>
                  <th className="py-3 px-4 text-right">VRAM</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {benchmarks.map((b) => (
                  <tr key={b.benchmark_id} className="hover:bg-slate-800/20">
                    <td className="py-3.5 px-4 font-bold text-sky-400">
                      <Link href={`/benchmarks/${b.benchmark_id}`}>
                        {b.benchmark_id.slice(0, 8)}...
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-sans font-semibold text-white">
                      {b.model.repository}
                    </td>
                    <td className="py-3.5 px-4 uppercase">
                      {b.precision.type}
                    </td>
                    <td className="py-3.5 px-4">
                      {b.runtime.name} {b.runtime.version}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-sky-400">
                      {b.metrics.tokens_per_second} tok/s
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {b.metrics.ttft_ms.p50_ms} ms
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {(b.metrics.peak_vram_bytes / 1e9).toFixed(1)} GB
                    </td>
                    <td className="py-3.5 px-4">
                      <VerificationBadge
                        status={b.verification.status}
                        synthetic={b.synthetic_fixture}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
