"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FileText, Flame, HeartPulse, Home, Layers3, PanelLeft, Trophy, Waves } from "lucide-react";
import clsx from "clsx";

import { ThemeToggle } from "@/components/theme-toggle";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/heat-map", label: "Heat Map View", icon: Flame },
  { href: "/simulation", label: "Simulation Panel", icon: Layers3 },
  { href: "/results", label: "Results Panel", icon: FileText },
  { href: "/citizen-actions", label: "Citizen Actions", icon: Trophy },
  { href: "/health-risk", label: "Health Risk Intelligence", icon: HeartPulse }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="relative h-full min-h-screen w-full overflow-hidden rounded-none border-b border-white/20 bg-sidebar p-6 text-white shadow-panel transition-colors duration-300 dark:border-slate-700 dark:bg-sidebar-dark lg:h-[calc(100vh-2rem)] lg:min-h-0 lg:w-72 lg:rounded-[36px] lg:border lg:border-white/10 lg:shadow-2xl">
      <div className="hero-orb -left-10 top-8 h-28 w-28 bg-white/15" />
      <div className="hero-orb bottom-16 right-0 h-32 w-32 bg-cyan-200/15 [animation-delay:1.2s]" />

      <div className="relative mb-8 flex items-center gap-4">
        <div className="rounded-2xl border border-white/20 bg-white/10 p-3 text-white shadow-neon backdrop-blur-md">
          <PanelLeft size={24} />
        </div>
        <div>
          <div className="text-lg font-bold tracking-tight text-white">CoolCity</div>
          <div className="text-xs font-medium uppercase tracking-widest text-emerald-50/70">Cockpit</div>
        </div>
      </div>

      <div className="relative mb-8 rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-md">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-cyan-50">
          <Waves size={18} />
          Adaptive Theme
        </div>
        <ThemeToggle />
      </div>

      <nav className="relative space-y-2.5">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "relative flex items-center gap-4 overflow-hidden rounded-[20px] px-4 py-3.5 text-sm font-medium transition-all duration-300",
              pathname === href
                ? "bg-white/20 text-white shadow-neon backdrop-blur-md"
                : "text-emerald-50/70 hover:bg-white/10 hover:text-white hover:translate-x-1.5"
            )}
          >
            {pathname === href ? (
              <>
                <span className="absolute left-0 top-1/2 h-10 w-1 -translate-y-1/2 rounded-r-full bg-white shadow-[0_0_20px_rgba(255,255,255,1)]" />
                <span className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-transparent" />
              </>
            ) : null}
            <span className={clsx("relative inline-flex h-10 w-10 items-center justify-center rounded-[18px] border border-white/10 bg-white/5 transition-colors", pathname === href && "border-white/20 bg-white/20")}>
              <Icon size={20} />
            </span>
            <span className="relative">{label}</span>
          </Link>
        ))}
      </nav>

      <div className="relative mt-auto pt-8">
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-6 text-white backdrop-blur-md">
          <div className="mb-3 flex items-center gap-2 font-medium text-emerald-100">
            <BarChart3 size={18} />
            Climate Action Layer
          </div>
          <p className="text-sm leading-relaxed text-emerald-50/70">
            Compare before and after cooling impact, monitor heat risk in real time, and coordinate action across citizens and city teams.
          </p>
        </div>
      </div>
    </aside>
  );
}
