import { TrendingUp, Activity, Database } from "lucide-react";

export default function UsagePage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          API Usage & Quotas
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Track your organization&apos;s API requests, benchmark submission
          rate, and monthly consumption.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-1">
          <span className="text-slate-500 block text-[10px]">
            Requests This Billing Cycle
          </span>
          <span className="text-2xl font-bold text-sky-400">142,850</span>
          <span className="text-[10px] text-slate-500 block">
            28.5% of monthly quota
          </span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-1">
          <span className="text-slate-500 block text-[10px]">
            Optimizer Invocations
          </span>
          <span className="text-2xl font-bold text-emerald-400">1,240</span>
          <span className="text-[10px] text-slate-500 block">
            Unlimited on Team plan
          </span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-1">
          <span className="text-slate-500 block text-[10px]">Rate Limit</span>
          <span className="text-2xl font-bold text-white">500 req/min</span>
          <span className="text-[10px] text-emerald-400 block">
            0 throttled requests
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">
          Usage Over Current Billing Period
        </h3>
        <div className="h-32 flex items-end gap-2 pt-8 pb-2 border-b border-slate-800">
          {[35, 45, 60, 40, 75, 90, 80, 65, 85, 95, 70, 88].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-sky-500/30 hover:bg-sky-500 transition-colors rounded-t"
                style={{ height: `${h}%` }}
              ></div>
              <span className="text-[9px] font-mono text-slate-600">
                {i + 1}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[11px] font-mono text-slate-500">
          Daily API call volume for Acme AI Lab.
        </p>
      </div>
    </div>
  );
}
