"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FileText, Flame, Home, Layers3, PanelLeft } from "lucide-react";
import clsx from "clsx";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/heat-map", label: "Heat Map View", icon: Flame },
  { href: "/simulation", label: "Simulation Panel", icon: Layers3 },
  { href: "/results", label: "Results Panel", icon: FileText }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full rounded-[28px] border border-white/20 bg-sidebar p-5 text-white shadow-panel md:w-72">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-2xl border border-white/20 bg-white/12 p-3 text-white backdrop-blur-md">
          <PanelLeft size={22} />
        </div>
        <div>
          <div className="font-semibold text-white">CoolCity</div>
          <div className="text-sm text-emerald-50/80">Urban heat cockpit</div>
        </div>
      </div>

      <nav className="space-y-2">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition duration-300",
              pathname === href
                ? "bg-white/18 text-white shadow-lg backdrop-blur-md"
                : "text-emerald-50/88 hover:bg-white/12 hover:text-white"
            )}
          >
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-8 rounded-3xl border border-white/20 bg-white/12 p-5 text-white backdrop-blur-md">
        <div className="mb-3 flex items-center gap-2 text-emerald-100">
          <BarChart3 size={16} />
          Climate Action
        </div>
        <p className="text-sm text-emerald-50/82">
          Compare before and after cooling impact, then export a city-ready report.
        </p>
      </div>
    </aside>
  );
}
