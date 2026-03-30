"use client";

import { useMemo, useState } from "react";

import { HeatCell } from "@/lib/types";

function cellColor(temp: number) {
  if (temp >= 38) return "bg-heat-high";
  if (temp >= 35) return "bg-heat-medium";
  return "bg-heat-low";
}

export function ComparisonSlider({ before, after }: { before: HeatCell[]; after: HeatCell[] }) {
  const [position, setPosition] = useState(50);

  const paired = useMemo(
    () => before.map((cell, index) => ({ before: cell, after: after[index] ?? cell })),
    [before, after]
  );

  return (
    <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-panel">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">Before vs After</h3>
          <p className="text-sm text-slate-500">Move the slider to reveal post-intervention cooling coverage.</p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{position}% after</div>
      </div>
      <div className="relative overflow-hidden rounded-[24px] border border-slate-100 bg-slate-50 p-4">
        <div className="grid grid-cols-4 gap-3">
          {paired.map((entry) => (
            <div key={`before-${entry.before.cell_id}`} className={`h-20 rounded-2xl ${cellColor(entry.before.current_temperature)}`} />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-4 overflow-hidden rounded-[20px]" style={{ width: `${position}%` }}>
          <div className="grid grid-cols-4 gap-3">
            {paired.map((entry) => (
              <div key={`after-${entry.after.cell_id}`} className={`h-20 rounded-2xl ${cellColor(entry.after.current_temperature)}`} />
            ))}
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-4 top-4 w-1 rounded-full bg-white shadow" style={{ left: `calc(${position}% + 0.75rem)` }} />
      </div>
      <input
        className="mt-5 w-full accent-emerald-700"
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
      />
    </div>
  );
}
