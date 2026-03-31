"use client";

import Link from "next/link";
import { Activity, Flame, Sparkles } from "lucide-react";

const actions = [
  { href: "/simulation", label: "Simulate Cooling", icon: Sparkles },
  { href: "/heat-map", label: "View Heat Map", icon: Flame },
  { href: "/health-risk", label: "Health Risk", icon: Activity }
];

export function FloatingQuickActions() {
  return (
    <div className="floating-action-dock">
      {actions.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className="floating-action-button group climate-hover">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white shadow-neon">
            <Icon size={16} className="transition duration-300 group-hover:scale-110 group-hover:rotate-6" />
          </span>
          <span>{label}</span>
        </Link>
      ))}
    </div>
  );
}
