import Link from 'next/link';
import { Cpu, Terminal, Sparkles, Database, Layers, ArrowUpRight } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-[#090d16]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
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
              <span className="text-[10px] text-slate-400 font-mono">Compute Intelligence Layer</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
            <Link href="/explore" className="hover:text-white transition-colors">
              Explore
            </Link>
            <Link href="/models" className="hover:text-white transition-colors">
              Models
            </Link>
            <Link href="/hardware" className="hover:text-white transition-colors">
              Hardware
            </Link>
            <Link href="/benchmarks" className="hover:text-white transition-colors">
              Benchmarks
            </Link>
            <Link href="/optimizer" className="flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors">
              <Sparkles className="h-3 w-3" />
              Optimizer
            </Link>
            <Link href="/model-fit" className="hover:text-white transition-colors">
              ModelFit
            </Link>
            <Link href="/leaderboards" className="hover:text-white transition-colors">
              Leaderboards
            </Link>
            <Link href="/docs" className="hover:text-white transition-colors">
              Docs
            </Link>
            <Link href="/pricing" className="hover:text-white transition-colors">
              Pricing
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
