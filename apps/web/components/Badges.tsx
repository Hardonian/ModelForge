import React from 'react';
import { CheckCircle2, Users, AlertCircle, Sparkles } from 'lucide-react';

export function ModelFitBadge({ score, grade }: { score: number; grade?: string }) {
  let colorClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  if (score < 60) {
    colorClass = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  } else if (score < 80) {
    colorClass = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  } else if (score < 90) {
    colorClass = 'bg-sky-500/10 text-sky-400 border-sky-500/30';
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono text-xs font-semibold ${colorClass}`}>
      <span className="text-[10px] uppercase tracking-wider text-slate-400">Fit</span>
      <span className="text-sm font-bold">{score}</span>
      {grade && <span className="rounded bg-black/30 px-1 text-[10px]">{grade}</span>}
    </div>
  );
}

export function VerificationBadge({ status, synthetic }: { status: string; synthetic?: boolean }) {
  if (synthetic) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
        <Sparkles className="h-3 w-3" />
        SYNTHETIC FIXTURE
      </span>
    );
  }

  switch (status) {
    case 'verified':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="h-3 w-3" />
          VERIFIED
        </span>
      );
    case 'community':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <Users className="h-3 w-3" />
          COMMUNITY
        </span>
      );
    case 'reproduced':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <CheckCircle2 className="h-3 w-3" />
          REPRODUCED
        </span>
      );
    case 'unverified':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700">
          <AlertCircle className="h-3 w-3" />
          UNVERIFIED
        </span>
      );
  }
}

export function ProvenanceTag({ provenance }: { provenance: 'MEASURED' | 'INTERPOLATED' | 'PREDICTED' | 'ESTIMATED' | string }) {
  let style = 'bg-slate-800 text-slate-400 border-slate-700';
  if (provenance === 'MEASURED') {
    style = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  } else if (provenance === 'INTERPOLATED') {
    style = 'bg-sky-500/10 text-sky-400 border-sky-500/30';
  } else if (provenance === 'PREDICTED') {
    style = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  }

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${style}`}>
      {provenance}
    </span>
  );
}
