import { Users, Plus, ShieldCheck, Mail } from "lucide-react";

export default function TeamPage() {
  const members = [
    {
      name: "Alex Rivera",
      email: "alex@acme.ai",
      role: "Owner",
      joined: "2024-11-10",
    },
    {
      name: "Devon Vance",
      email: "devon@acme.ai",
      role: "Admin",
      joined: "2024-12-05",
    },
    {
      name: "Elena Rostova",
      email: "elena@acme.ai",
      role: "Developer",
      joined: "2025-01-12",
    },
    {
      name: "Marcus Chen",
      email: "marcus@acme.ai",
      role: "Viewer",
      joined: "2025-01-20",
    },
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Team Members & Access Control
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Role-based access control (RBAC) across private benchmarks, API
            keys, and workloads.
          </p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-400">
          <Plus className="h-3.5 w-3.5" />
          <span>Invite Member</span>
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/30">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 font-sans">Name</th>
              <th className="py-3 px-4 font-sans">Email</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Joined Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {members.map((m) => (
              <tr key={m.email} className="hover:bg-slate-800/20">
                <td className="py-3.5 px-4 font-bold text-white font-sans">
                  {m.name}
                </td>
                <td className="py-3.5 px-4 font-sans text-slate-400">
                  {m.email}
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                      m.role === "Owner"
                        ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {m.role}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-400">{m.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
