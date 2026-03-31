"use client";

import clsx from "clsx";
import { LaptopMinimal, Moon, SunMedium } from "lucide-react";

import { ThemeMode, useTheme } from "@/components/theme-provider";

const options: { value: ThemeMode; label: string; icon: typeof SunMedium }[] = [
  { value: "light", label: "Light", icon: SunMedium },
  { value: "system", label: "System", icon: LaptopMinimal },
  { value: "dark", label: "Dark", icon: Moon }
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="rounded-[22px] border border-white/20 bg-white/10 p-1.5 shadow-neon backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/60">
      <div className="grid grid-cols-3 gap-1">
        {options.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-label={`Switch to ${label.toLowerCase()} mode`}
            className={clsx(
              "flex items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-medium transition duration-300",
              theme === value
                ? "bg-white/20 text-white shadow-neon dark:bg-slate-800 dark:text-slate-100"
                : "text-emerald-50/85 hover:bg-white/10 hover:text-white dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-slate-100"
            )}
          >
            <Icon size={14} className={theme === value ? "scale-110 animate-pulse" : ""} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
