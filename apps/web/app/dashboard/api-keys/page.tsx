import {
  Key,
  Plus,
  ShieldCheck,
  Trash2,
  Copy,
  AlertTriangle,
} from "lucide-react";

export default function ApiKeysPage() {
  const keys = [
    {
      id: "1",
      name: "Production vLLM Cluster",
      prefix: "mf_live_9a4f...",
      created: "2025-01-10",
      lastUsed: "2 hours ago",
    },
    {
      id: "2",
      name: "CI/CD Benchmark Worker",
      prefix: "mf_live_3c2d...",
      created: "2025-01-18",
      lastUsed: "Yesterday",
    },
    {
      id: "3",
      name: "Dev Local Runner",
      prefix: "mf_live_7b1e...",
      created: "2025-02-01",
      lastUsed: "Just now",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            API Keys
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage organization authentication keys for the ModelForge CLI, SDK,
            and REST API.
          </p>
        </div>

        <button className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-sky-500/20 hover:bg-sky-400">
          <Plus className="h-3.5 w-3.5" />
          <span>Create New Key</span>
        </button>
      </div>

      {/* Security Architecture Notice */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 flex items-start gap-3 text-xs font-mono text-slate-300">
        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-white font-sans">
            Zero-Knowledge Hashing at Rest
          </span>
          <p className="text-slate-400 font-sans">
            ModelForge only stores the cryptographic SHA-256 hash of your API
            key in the database. Full secret keys are never visible after
            creation.
          </p>
        </div>
      </div>

      {/* Keys Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/30">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 font-sans">Key Name</th>
              <th className="py-3 px-4">Key Token Prefix</th>
              <th className="py-3 px-4">Created Date</th>
              <th className="py-3 px-4">Last Used</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {keys.map((k) => (
              <tr key={k.id} className="hover:bg-slate-800/20">
                <td className="py-3.5 px-4 font-bold text-white font-sans">
                  {k.name}
                </td>
                <td className="py-3.5 px-4 text-sky-400 font-semibold">
                  {k.prefix}
                </td>
                <td className="py-3.5 px-4 text-slate-400">{k.created}</td>
                <td className="py-3.5 px-4 text-slate-400">{k.lastUsed}</td>
                <td className="py-3.5 px-4 text-right">
                  <button className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-500/10">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
