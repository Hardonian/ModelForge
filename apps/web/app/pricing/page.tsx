import Link from "next/link";
import { Check, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      tagline: "For developers, researchers & open-source teams",
      price: "$0",
      period: "forever",
      features: [
        "Full public benchmark explorer",
        "ModelFit score calculator",
        "Public workload optimizer",
        "100 API requests / day",
        "OpenComputeBench community submissions",
        "Standard community Discord support",
      ],
      cta: "Start Free",
      href: "/explore",
      highlighted: false,
    },
    {
      name: "Pro",
      tagline: "For AI engineers deploying production workloads",
      price: "$49",
      period: "per month",
      features: [
        "Everything in Free",
        "Saved production workloads & traces",
        "50,000 API requests / month",
        "Multi-accelerator comparison matrix",
        "Private configuration exports",
        "Automated Docker & K8s manifest generator",
        "Priority email support",
      ],
      cta: "Upgrade to Pro",
      href: "/dashboard/billing",
      highlighted: true,
    },
    {
      name: "Team",
      tagline: "For fast-growing AI teams & inference infrastructure",
      price: "$299",
      period: "per month",
      features: [
        "Everything in Pro",
        "Multi-tenant organizations & projects",
        "Private team benchmark repository",
        "Team-scoped API keys with RBAC",
        "500,000 API requests / month",
        "Detailed usage analytics & audit trails",
        "Dedicated Slack support channel",
      ],
      cta: "Start Team Trial",
      href: "/dashboard/billing",
      highlighted: false,
    },
    {
      name: "Enterprise",
      tagline: "For hyperscalers, cloud providers & large AI fleets",
      price: "Custom",
      period: "annual contract",
      features: [
        "Everything in Team",
        "Private benchmark runners inside your VPC",
        "Proprietary model registry isolation",
        "Continuous fleet inference FinOps",
        "SAML SSO & SCIM directory sync",
        "Custom benchmark verification harnesses",
        "Dedicated ML infrastructure architect",
      ],
      cta: "Contact Sales",
      href: "mailto:enterprise@modelforge.dev",
      highlighted: false,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          Transparent Inference Intelligence Pricing
        </h1>
        <p className="text-base text-slate-400">
          From open-source developers to venture-scale enterprise clusters. Pay
          only for private infrastructure and team orchestration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`flex flex-col justify-between rounded-2xl border p-6 transition-all ${
              plan.highlighted
                ? "border-sky-500/50 bg-gradient-to-b from-sky-500/10 to-slate-900/40 shadow-xl shadow-sky-500/10"
                : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
            }`}
          >
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  {plan.highlighted && (
                    <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-mono font-semibold text-sky-400 border border-sky-500/30">
                      MOST POPULAR
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1 min-h-[32px]">
                  {plan.tagline}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-3xl font-extrabold text-white">
                  {plan.price}
                </span>
                <span className="text-xs text-slate-400 font-mono ml-1.5">
                  / {plan.period}
                </span>
              </div>

              <ul className="space-y-2.5 pt-4 border-t border-slate-800/80 text-xs text-slate-300 font-sans">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-sky-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-8">
              <Link
                href={plan.href}
                className={`w-full flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition-all ${
                  plan.highlighted
                    ? "bg-sky-500 text-white shadow-md shadow-sky-500/25 hover:bg-sky-400"
                    : "bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <span>{plan.cta}</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
