"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Sparkles,
  Zap,
  Server,
  LayoutDashboard,
} from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Explore", href: "/explore", icon: Compass },
    { label: "Planner", href: "/planner", icon: Sparkles },
    { label: "Hot-Patch", href: "/hot-patch", icon: Zap, highlight: true },
    { label: "Silicon", href: "/hardware", icon: Server },
    { label: "Console", href: "/dashboard", icon: LayoutDashboard },
  ];

  return (
    <div className="lg:hidden fixed bottom-3 inset-x-3 z-50 pointer-events-none">
      <nav className="pointer-events-auto mx-auto max-w-md rounded-2xl bg-[#0b1120]/90 backdrop-blur-xl border border-slate-700/60 shadow-2xl shadow-black/80 px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-sky-400 font-semibold"
                  : item.highlight
                  ? "text-amber-400 hover:text-amber-300"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {item.highlight && (
                <span className="absolute -top-1 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              )}
              <div
                className={`flex items-center justify-center h-6 w-6 rounded-lg ${
                  isActive
                    ? "bg-sky-500/20 text-sky-400"
                    : item.highlight
                    ? "bg-amber-500/10 text-amber-400"
                    : ""
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
