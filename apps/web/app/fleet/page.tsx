"use client";

import { useState } from "react";
import {
  Server,
  Cpu,
  Layers,
  TrendingUp,
  DollarSign,
  CheckCircle,
  AlertCircle,
  BarChart3,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function FleetPage() {
  // Mock enterprise fleet resources
  const [fleet] = useState([
    {
      id: "fl-1",
      node_id: "cluster-hopper-node-01",
      device: "NVIDIA H100 SXM5 80GB",
      device_count: 8,
      vram_gb: 80,
      hourly_cost_usd: 24.0,
      is_reserved: true,
      status: "allocated",
      allocated_workloads: ["Customer Support Reasoning Agent (4 GPUs)"],
    },
    {
      id: "fl-2",
      node_id: "cluster-ada-node-01",
      device: "NVIDIA L40S",
      device_count: 8,
      vram_gb: 48,
      hourly_cost_usd: 10.0,
      is_reserved: true,
      status: "available",
      allocated_workloads: [],
    },
    {
      id: "fl-3",
      node_id: "cluster-rtx-node-01",
      device: "NVIDIA GeForce RTX 4090 24GB",
      device_count: 4,
      vram_gb: 24,
      hourly_cost_usd: 4.0,
      is_reserved: false,
      status: "available",
      allocated_workloads: [],
    },
  ]);

  // What-If Simulation Controls
  const [trafficGrowth, setTrafficGrowth] = useState(100);
  const [contextGrowth, setContextGrowth] = useState(50);
  const [targetHw, setTargetHw] = useState("NVIDIA L40S");

  const baselineCost = 17520; // $24/hr * 730 hr/mo
  const simulatedCost = targetHw.includes("H100") ? 17520 : 7300; // L40S is $10/hr
  const savings = baselineCost - simulatedCost;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400">
          <Server className="h-3.5 w-3.5" />
          <span>Private Enterprise Hardware & Capacity Intelligence</span>
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Fleet Optimizer & Capacity Planner
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-3xl">
          Optimize placement of enterprise workloads across heterogeneous GPU
          clusters. Simulate What-If traffic surges, context growth, and
          hardware migrations before committing capital.
        </p>
      </div>

      {/* Fleet Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        {fleet.map((res) => (
          <div
            key={res.id}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-slate-400">
                  {res.node_id}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    res.is_reserved
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {res.is_reserved ? "RESERVED INSTANCE" : "ON-DEMAND"}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-2 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-cyan-400" />
                {res.device_count}× {res.device}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {res.vram_gb} GB VRAM per device • $
                {res.hourly_cost_usd.toFixed(2)}/hr
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/80">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400">Allocation Status:</span>
                <span
                  className={
                    res.status === "allocated"
                      ? "text-amber-400 font-semibold"
                      : "text-emerald-400 font-semibold"
                  }
                >
                  {res.status.toUpperCase()}
                </span>
              </div>
              {res.allocated_workloads.length > 0 ? (
                <div className="text-[11px] text-slate-300 bg-slate-950/60 rounded p-2 mt-1">
                  {res.allocated_workloads.join(", ")}
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 italic mt-1">
                  0 workloads assigned (Idle capacity)
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* What-If Capacity Simulator */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm p-6 mb-10">
        <div className="border-b border-slate-800 pb-4 mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-400" />
            What-If Scenario Simulator
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Simulate capacity requirements under changing workload parameters
            without re-benchmarking manually.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls */}
          <div className="lg:col-span-5 space-y-5">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                <span>Traffic Surge Growth</span>
                <span className="font-mono text-cyan-400">
                  +{trafficGrowth}% (2.0x Concurrency)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="300"
                step="25"
                value={trafficGrowth}
                onChange={(e) => setTrafficGrowth(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                <span>Context Length Growth</span>
                <span className="font-mono text-cyan-400">
                  +{contextGrowth}% (KV Memory Scaled)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                step="25"
                value={contextGrowth}
                onChange={(e) => setContextGrowth(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Hardware Target Migration
              </label>
              <select
                value={targetHw}
                onChange={(e) => setTargetHw(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="NVIDIA L40S">
                  NVIDIA L40S 48GB (Optimal FinOps Right-Sizing)
                </option>
                <option value="NVIDIA H100 SXM5 80GB">
                  NVIDIA H100 SXM5 80GB (Maximum Throughput)
                </option>
                <option value="NVIDIA GeForce RTX 4090 24GB">
                  NVIDIA RTX 4090 24GB (Cost Floor)
                </option>
              </select>
            </div>
          </div>

          {/* Results Projection */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <span className="text-[11px] text-slate-400 block font-medium">
                Required Device Count
              </span>
              <div className="text-2xl font-bold text-white mt-1">
                {targetHw.includes("4090") ? "4 GPUs" : "2 GPUs"}
              </div>
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Fits available reserved capacity
              </p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <span className="text-[11px] text-slate-400 block font-medium">
                Estimated P95 TTFT
              </span>
              <div className="text-2xl font-bold text-white mt-1">
                {targetHw.includes("H100") ? "18.2 ms" : "24.5 ms"}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Target SLO: &lt; 30 ms
              </p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <span className="text-[11px] text-slate-400 block font-medium">
                Projected Monthly Spend
              </span>
              <div className="text-2xl font-bold text-white mt-1">
                ${simulatedCost.toLocaleString()} USD
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Baseline: ${baselineCost.toLocaleString()} USD
              </p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <span className="text-[11px] text-slate-400 block font-medium">
                Projected FinOps Savings
              </span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {savings > 0 ? `+$${savings.toLocaleString()} /mo` : "$0 /mo"}
              </div>
              <p className="text-[11px] text-emerald-400/90 mt-1">
                58% cost reduction at identical SLO
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
