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
    <aside className="relative h-full min-h-screen w-full overflow-hidden rounded-none border-b border-white/20 bg-sidebar p-5 text-white shadow-panel transition-colors duration-300 dark:border-slate-700 dark:bg-sidebar-dark lg:h-[calc(100vh-2rem)] lg:min-h-0 lg:w-72 lg:rounded-[34px] lg:border lg:border-white/15">
      <div className="hero-orb -left-10 top-8 h-28 w-28 bg-white/20" />
      <div className="hero-orb bottom-16 right-0 h-32 w-32 bg-cyan-300/20 [animation-delay:1.2s]" />

      <div className="relative mb-5 flex items-center gap-3">
        <div className="rounded-2xl border border-white/20 bg-white/12 p-3 text-white shadow-neon backdrop-blur-md">
          <PanelLeft size={22} />
        </div>
        <div>
          <div className="font-semibold text-white">CoolCity</div>
          <div className="text-sm text-emerald-50/80">Climate intelligence cockpit</div>
        </div>
      </div>

      <div className="relative mb-6 rounded-[26px] border border-white/15 bg-white/10 p-4 backdrop-blur-md">
        <div className="mb-3 flex items-center gap-2 text-cyan-50">
          <Waves size={16} />
          Adaptive Theme
        </div>
        <ThemeToggle />
      </div>

      <nav className="relative space-y-2">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "relative flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-sm transition duration-300",
              pathname === href
                ? "bg-white/18 text-white shadow-neon backdrop-blur-md"
                : "text-emerald-50/88 hover:bg-white/10 hover:text-white hover:translate-x-1"
            )}
          >
            {pathname === href ? (
              <>
                <span className="absolute left-0 top-1/2 h-9 w-1 -translate-y-1/2 rounded-r-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.95)]" />
                <span className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-transparent" />
              </>
            ) : null}
            <span className={clsx("relative inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/12 bg-white/10", pathname === href && "bg-white/18")}>
              <Icon size={18} />
            </span>
            <span className="relative">{label}</span>
          </Link>
        ))}
      </nav>

      <div className="relative mt-8 rounded-[28px] border border-white/20 bg-white/12 p-5 text-white backdrop-blur-md">
        <div className="mb-3 flex items-center gap-2 text-emerald-100">
          <BarChart3 size={16} />
          Climate Action Layer
        </div>
        <p className="text-sm leading-6 text-emerald-50/82">
          Compare before and after cooling impact, monitor heat risk in real time, and coordinate action across citizens and city teams.
        </p>
      </div>
    </aside>
  );
}
