"use client";

import { HeatMapCard } from "@/components/heat-map-card";
import { HeatCell } from "@/lib/types";

export function HeatMapComparison({
  before,
  after,
  avgDrop,
  maxDrop
}: {
  before: HeatCell[];
  after: HeatCell[];
  avgDrop: number;
  maxDrop: number;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-panel">
        <h3 className="text-lg font-semibold text-slate-950">Before and After Heatmap Comparison</h3>
        <p className="mt-2 text-sm text-slate-500">
          Compare baseline heat intensity with the simulated cooling outcome. Average reduction: {avgDrop} deg C. Maximum local reduction: {maxDrop} deg C.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <HeatMapCard
          cells={before}
          title="Before Simulation"
          description="Baseline city heat zones before applying any intervention."
        />
        <HeatMapCard
          cells={after}
          title="After Simulation"
          description="Projected heat zones after the selected cooling strategies are applied."
        />
      </div>
    </div>
  );
}
