"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";

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

export function StatCard({
  label,
  value,
  hint,
  accent
}: {
  label: string;
  value: string;
  hint: string;
  accent: ReactNode;
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

  return (
    <div className="glass-card group climate-hover rounded-[28px] p-5">
      <div className="mb-4 flex items-center justify-between text-slate-500 transition group-hover:text-slate-700">
        <span>{label}</span>
        <span className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-2 text-primary transition group-hover:scale-110 group-hover:from-emerald-100 group-hover:to-teal-100">
          {accent}
        </span>
      </div>
      <div className="text-3xl font-semibold text-slate-950 transition group-hover:text-primary">{displayValue}</div>
      <div className="mt-2 text-sm text-slate-500 transition group-hover:text-slate-600">{hint}</div>
    </div>
  );
}
