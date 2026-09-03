import {
  CreditCard,
  Check,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

export default function BillingPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Billing & Subscriptions
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage your enterprise billing details, Stripe customer portal, and
          plan quotas.
        </p>
      </div>

      {/* Current Plan Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-sky-500/20 px-2 py-0.5 text-xs font-mono font-bold text-sky-400 border border-sky-500/30">
                CURRENT PLAN
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Renews on Mar 15, 2025
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">
              Team Tier ($299 / month)
            </h2>
          </div>

          <button className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:border-slate-500 transition-all">
            <span>Manage in Stripe Portal</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
          <div className="rounded-lg bg-slate-950/60 p-4 border border-slate-800/80">
            <span className="text-slate-500 block text-[10px] uppercase">
              API Quota
            </span>
            <span className="text-base font-bold text-white">500,000 / mo</span>
            <span className="text-[10px] text-emerald-400 block mt-1">
              142.8k consumed
            </span>
          </div>

          <div className="rounded-lg bg-slate-950/60 p-4 border border-slate-800/80">
            <span className="text-slate-500 block text-[10px] uppercase">
              Team Seats
            </span>
            <span className="text-base font-bold text-white">10 Seats</span>
            <span className="text-[10px] text-slate-400 block mt-1">
              4 seats active
            </span>
          </div>

          <div className="rounded-lg bg-slate-950/60 p-4 border border-slate-800/80">
            <span className="text-slate-500 block text-[10px] uppercase">
              Private Benchmarks
            </span>
            <span className="text-base font-bold text-white">Unlimited</span>
            <span className="text-[10px] text-slate-400 block mt-1">
              VPC-isolated
            </span>
          </div>
        </div>
      </div>

      {/* Payment Method & Invoices */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
        <h3 className="text-base font-bold text-white">Payment Method</h3>
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800 font-mono text-xs">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-sky-400" />
            <div>
              <span className="text-white font-bold block">
                Visa ending in 4242
              </span>
              <span className="text-slate-500 text-[10px]">Expires 12/28</span>
            </div>
          </div>
          <span className="text-emerald-400 text-xs font-semibold">
            Primary
          </span>
        </div>
      </div>
    </div>
  );
}
