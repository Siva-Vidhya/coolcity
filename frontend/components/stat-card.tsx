"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

function parseDisplayValue(value: string) {
  const match = value.match(/-?\d[\d,]*(?:\.\d+)?/);
  if (!match || match.index === undefined) {
    return null;
  }

  const numericText = match[0];
  return {
    prefix: value.slice(0, match.index),
    suffix: value.slice(match.index + numericText.length),
    numericValue: Number(numericText.replace(/,/g, "")),
    decimals: numericText.includes(".") ? numericText.split(".")[1].length : 0
  };
}

type TrendInfo = {
  direction: "up" | "down";
  label: string;
};

function toneFromValue(value: string) {
  const numeric = Number((value.match(/-?\d+(?:\.\d+)?/) ?? ["0"])[0]);
  if (numeric >= 80 || /high/i.test(value)) return "from-red-500/18 via-rose-500/10 to-white/10";
  if (numeric >= 50) return "from-amber-400/18 via-cyan-400/8 to-white/10";
  return "from-emerald-400/18 via-cyan-400/10 to-white/10";
}

export function StatCard({
  label,
  value,
  hint,
  accent,
  className,
  href,
  trend
}: {
  label: string;
  value: string;
  hint: string;
  accent: ReactNode;
  className?: string;
  href?: string;
  trend?: TrendInfo;
}) {
  const parsed = useMemo(() => parseDisplayValue(value), [value]);
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (!parsed) {
      setDisplayValue(value);
      return;
    }

    let frameId = 0;
    const duration = 900;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = parsed.numericValue * eased;
      const formatted = current.toLocaleString(undefined, {
        minimumFractionDigits: parsed.decimals,
        maximumFractionDigits: parsed.decimals
      });
      setDisplayValue(`${parsed.prefix}${formatted}${parsed.suffix}`);

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [parsed, value]);

  const content = (
    <div className={clsx("glass-card group climate-hover relative overflow-hidden rounded-[30px] p-5", className)}>
      <div className={clsx("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90", toneFromValue(value))} />
      <div className="pointer-events-none absolute right-[-2.8rem] top-[-2.5rem] h-24 w-24 rounded-full bg-white/30 blur-3xl dark:bg-cyan-400/10" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cyan-100/40 via-transparent to-transparent dark:from-cyan-400/5" />

      <div className="relative mb-4 flex items-center justify-between text-slate-500 transition group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200">
        <span className="text-[0.78rem] uppercase tracking-[0.18em]">{label}</span>
        <span className="rounded-[18px] border border-cyan-100/80 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-2 text-primary transition duration-300 group-hover:scale-110 group-hover:-rotate-6 group-hover:shadow-neon dark:border-slate-700 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
          {accent}
        </span>
      </div>

      <div className="relative flex items-end justify-between gap-3">
        <div className="text-3xl font-semibold tracking-tight text-slate-950 transition group-hover:text-primary dark:text-slate-100">
          {displayValue}
        </div>
        <div className="climate-meter-bar w-20 opacity-85" />
      </div>

      {trend ? (
        <div
          className={clsx(
            "mt-3 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm",
            trend.direction === "up"
              ? "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200"
              : "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200"
          )}
        >
          {trend.direction === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend.label}
        </div>
      ) : null}

      <div className="mt-2 text-sm leading-6 text-slate-500 transition group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-300">
        {hint}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
