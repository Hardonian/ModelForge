import { FolderKanban, Plus, ArrowRight } from 'lucide-react';

export default function ProjectsPage() {
  const projects = [
    { id: 'proj-1', name: 'Conversational Support Agent', workloads: 2, benchmarks: 8, created: '2025-01-05' },
    { id: 'proj-2', name: 'Internal Code Autocomplete', workloads: 1, benchmarks: 4, created: '2025-01-12' },
    { id: 'proj-3', name: 'Document Summarization Pipeline', workloads: 1, benchmarks: 6, created: '2025-01-20' }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Team Projects</h1>
          <p className="text-xs text-slate-400 mt-0.5">Organize workloads, benchmark suites, and serving configurations by project.</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-400">
          <Plus className="h-3.5 w-3.5" />
          <span>New Project</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projects.map((p) => (
          <div key={p.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
            <div className="flex items-start justify-between">
              <FolderKanban className="h-5 w-5 text-sky-400" />
              <span className="text-[10px] font-mono text-slate-500">{p.id}</span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{p.name}</h3>
              <p className="text-xs text-slate-400 font-mono mt-1">{p.workloads} Workloads · {p.benchmarks} Benchmarks</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
