import Link from 'next/link';
import { Cpu, ExternalLink, ShieldCheck, Code2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-[#060a12] text-slate-400 text-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-500">
                <Cpu className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-sm text-white">ModelForge</span>
            </div>
            <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
              The open compute intelligence layer for AI. Optimizing model + accelerator + runtime + precision serving configurations through reproducible empirical benchmarks.
            </p>
            <div className="flex items-center gap-2 pt-2 text-slate-400 text-[11px]">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>OpenComputeBench Schema v1.0.0</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 text-xs tracking-wider uppercase">Platform</h4>
            <ul className="space-y-2">
              <li><Link href="/models" className="hover:text-white transition-colors">Model Intelligence</Link></li>
              <li><Link href="/hardware" className="hover:text-white transition-colors">Hardware Registry</Link></li>
              <li><Link href="/benchmarks" className="hover:text-white transition-colors">Open Benchmark Graph</Link></li>
              <li><Link href="/optimizer" className="hover:text-white transition-colors">Workload Optimizer</Link></li>
              <li><Link href="/model-fit" className="hover:text-white transition-colors">ModelFit Calculator</Link></li>
              <li><Link href="/leaderboards" className="hover:text-white transition-colors">Leaderboards</Link></li>
              <li><Link href="/support" className="hover:text-white transition-colors text-sky-400">Support Matrix</Link></li>
              <li><Link href="/failures" className="hover:text-white transition-colors text-rose-400">Failure Corpus</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 text-xs tracking-wider uppercase">Developers</h4>
            <ul className="space-y-2">
              <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
              <li><Link href="/docs/schema" className="hover:text-white transition-colors">Benchmark Schema</Link></li>
              <li><Link href="/docs/cli" className="hover:text-white transition-colors">CLI Runner</Link></li>
              <li><Link href="/datasets" className="hover:text-white transition-colors">Hugging Face Dataset</Link></li>
              <li><Link href="/api" className="hover:text-white transition-colors">REST API</Link></li>
              <li><Link href="/status" className="hover:text-white transition-colors">System Status</Link></li>
              <li><a href="https://github.com/Hardonian/ModelForge" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">GitHub <ExternalLink className="h-3 w-3" /></a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 text-xs tracking-wider uppercase">Enterprise</h4>
            <ul className="space-y-2">
              <li><Link href="/pricing" className="hover:text-white transition-colors">Commercial Plans</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Private SaaS Console</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">Product Vision & Thesis</Link></li>
              <li><Link href="/docs/security" className="hover:text-white transition-colors">Security & Multi-Tenancy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} ModelForge Inc. Open source core under Apache-2.0.</p>
          <div className="flex items-center gap-4">
            <Link href="/status" className="flex items-center gap-1.5 hover:text-emerald-300 transition-colors">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              All Systems Operational
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
