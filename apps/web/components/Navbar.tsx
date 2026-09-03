import Link from "next/link";
import {
  Cpu,
  Terminal,
  Sparkles,
  Database,
  Layers,
  ArrowUpRight,
} from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-[#090d16]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 shadow-md shadow-sky-500/20">
              <Cpu className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                ModelForge
                <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-medium text-sky-400 border border-sky-500/20">
                  OpenCompute
                </span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Compute Intelligence Layer
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-5 text-xs font-medium text-slate-300">
            <Link
              href="/explore"
              className="hover:text-white transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/passports"
              className="flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors font-semibold"
            >
              Passports
            </Link>
            <Link
              href="/planner"
              className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors font-semibold"
            >
              <Sparkles className="h-3 w-3" />
              SLO Planner
            </Link>
            <Link
              href="/software-lift"
              className="hover:text-white transition-colors"
            >
              Software Lift
            </Link>
            <Link href="/models" className="hover:text-white transition-colors">
              Models
            </Link>
            <Link
              href="/hardware"
              className="hover:text-white transition-colors"
            >
              Hardware
            </Link>
            <Link href="/coverage" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
              Coverage
            </Link>
            <Link href="/predict" className="text-amber-400 hover:text-amber-300 transition-colors font-medium">
              Predictor
            </Link>
            <Link href="/fleet" className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
              Fleet & Capacity
            </Link>
            <Link href="/continuous-optimization" className="text-violet-400 hover:text-violet-300 transition-colors font-medium">
              FinOps
            </Link>
            <Link href="/benchmarks" className="hover:text-white transition-colors">
              Benchmarks
            </Link>
            <Link href="/docs" className="hover:text-white transition-colors">
              Docs
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/docs/cli"
            className="hidden sm:flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-mono text-slate-300 hover:border-slate-600 hover:text-white transition-all"
          >
            <Terminal className="h-3.5 w-3.5 text-sky-400" />
            <span>modelforge cli</span>
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-md bg-sky-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-sky-500/30 hover:bg-sky-400 transition-all"
          >
            <span>Console</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
