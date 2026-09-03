import { Settings, Shield, Bell, Save } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Organization Settings
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage organization profile, audit retention, and benchmark webhooks.
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white">General Information</h2>
          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="text-slate-400 block mb-1">
                Organization Name
              </label>
              <input
                type="text"
                defaultValue="Acme AI Lab"
                className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-white font-sans focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">
                Organization Slug
              </label>
              <input
                type="text"
                defaultValue="acme-ai"
                disabled
                className="w-full rounded border border-slate-800 bg-slate-950/40 p-2 text-slate-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white">
            Benchmark Webhook URL
          </h2>
          <div className="font-mono text-xs space-y-2">
            <input
              type="text"
              placeholder="https://your-api.com/webhooks/modelforge"
              defaultValue="https://api.acme.ai/inference/benchmarks"
              className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-white font-mono focus:border-sky-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 font-sans">
              ModelForge will POST signed JSON payloads when reproducible
              benchmark runs complete on your registered runners.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-400">
            <Save className="h-3.5 w-3.5" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
