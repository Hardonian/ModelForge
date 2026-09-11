"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Cpu,
  Terminal,
  Sparkles,
  Zap,
  ArrowUpRight,
  Menu,
  X,
  Compass,
  Layers,
  Server,
  Activity,
  ShieldCheck,
} from "lucide-react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#090d16]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            onClick={closeMenu}
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 shadow-md shadow-sky-500/20">
              <Cpu className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-white">
                  ModelForge
                </span>
                <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-medium text-sky-400 border border-sky-500/20">
                  OpenCompute
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Compute Intelligence Layer
              </span>
            </div>
          </Link>

          {/* Google Ecosystem Status Indicator */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-400 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Google TPU v6e Active</span>
          </div>

          <nav className="hidden lg:flex items-center gap-4 text-xs font-medium text-slate-300">
            <Link
              href="/explore"
              className="hover:text-white transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/passports"
              className="text-sky-400 hover:text-sky-300 transition-colors font-semibold"
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
              href="/hot-patch"
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold hover:bg-amber-500/20 transition-all shadow-sm shadow-amber-500/10"
            >
              <Zap className="h-3 w-3 fill-amber-400" />
              Hot-Patch Arena
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
              Silicon
            </Link>
            <Link
              href="/fleet"
              className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
            >
              Fleet
            </Link>
            <Link
              href="/continuous-optimization"
              className="text-violet-400 hover:text-violet-300 transition-colors font-medium"
            >
              FinOps
            </Link>
            <Link
              href="/docs"
              className="hover:text-white transition-colors"
            >
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
            className="hidden sm:flex items-center gap-1.5 rounded-md bg-sky-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-sky-500/30 hover:bg-sky-400 transition-all"
          >
            <span>Console</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            className="lg:hidden flex items-center justify-center h-9 w-9 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-800 bg-[#090d16]/98 backdrop-blur-2xl px-4 pt-3 pb-6 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
            <span className="text-xs font-mono text-slate-400">
              NAVIGATION & ENGINES
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Google TPU v6e Active
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm font-medium">
            <Link
              href="/hot-patch"
              onClick={closeMenu}
              className="col-span-2 flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-500/30 text-amber-300 font-semibold"
            >
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400 fill-amber-400" />
                Hot-Patch Arena (Gamified)
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-bold">
                Live
              </span>
            </Link>

            <Link
              href="/planner"
              onClick={closeMenu}
              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-indigo-400"
            >
              <Sparkles className="h-4 w-4" />
              <span>SLO Planner</span>
            </Link>

            <Link
              href="/passports"
              onClick={closeMenu}
              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-sky-400"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Passports</span>
            </Link>

            <Link
              href="/explore"
              onClick={closeMenu}
              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/60 text-slate-300"
            >
              <Compass className="h-4 w-4 text-slate-400" />
              <span>Explore</span>
            </Link>

            <Link
              href="/hardware"
              onClick={closeMenu}
              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/60 text-slate-300"
            >
              <Server className="h-4 w-4 text-slate-400" />
              <span>Hardware & TPUs</span>
            </Link>

            <Link
              href="/software-lift"
              onClick={closeMenu}
              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/60 text-slate-300"
            >
              <Activity className="h-4 w-4 text-emerald-400" />
              <span>Software Lift</span>
            </Link>

            <Link
              href="/continuous-optimization"
              onClick={closeMenu}
              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/60 text-violet-400"
            >
              <Layers className="h-4 w-4" />
              <span>FinOps</span>
            </Link>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
            <Link
              href="/dashboard"
              onClick={closeMenu}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-sky-500 py-2.5 text-xs font-semibold text-white shadow-md shadow-sky-500/20"
            >
              <span>Launch Console</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/docs"
              onClick={closeMenu}
              className="flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-xs font-medium text-slate-300"
            >
              Docs
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
