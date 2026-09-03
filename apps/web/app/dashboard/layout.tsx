import Link from 'next/link';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Activity, 
  BarChart3, 
  Key, 
  TrendingUp, 
  Users, 
  CreditCard, 
  Settings,
  ShieldCheck,
  Cpu
} from 'lucide-react';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
    { label: 'Workloads', href: '/dashboard/workloads', icon: Activity },
    { label: 'Private Benchmarks', href: '/dashboard/benchmarks', icon: BarChart3 },
    { label: 'API Keys', href: '/dashboard/api-keys', icon: Key },
    { label: 'Usage & Quota', href: '/dashboard/usage', icon: TrendingUp },
    { label: 'Team & RBAC', href: '/dashboard/team', icon: Users },
    { label: 'Billing & Plans', href: '/dashboard/billing', icon: CreditCard },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings }
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col md:flex-row border-t border-slate-800 bg-[#090d16]">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-slate-800 bg-[#060a12] p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="px-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">Acme AI Lab</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 block mt-0.5">Org ID: org-89104 (Team Plan)</span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900/60 transition-colors"
                >
                  <Icon className="h-4 w-4 text-slate-500" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/40 text-[11px] font-mono text-slate-400 space-y-1">
          <div className="text-slate-300 font-semibold flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Tenant Isolation: Active</span>
          </div>
          <p className="text-[10px] text-slate-500">Row Level Security (RLS) enforced.</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
