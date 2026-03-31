"use client";

import dynamic from "next/dynamic";
import clsx from "clsx";

import { HeatLegend } from "@/components/heat-legend";
import { HeatCell } from "@/lib/types";

const DynamicMap = dynamic(() => import("@/components/leaflet-map").then((mod) => mod.LeafletMap), {
  ssr: false,
  loading: () => <div className="climate-skeleton h-[430px] rounded-[28px]" />
});

export function HeatMapCard({
  cells,
  title,
  description,
  className,
  mapMode = "heat",
  highlightedCellIds = [],
  adoptedCellIds = []
}: {
  cells: HeatCell[];
  title: string;
  description: string;
  className?: string;
  mapMode?: "heat" | "density";
  highlightedCellIds?: number[];
  adoptedCellIds?: number[];
}) {
  return (
    <div className={clsx("glass-card-strong climate-hover overflow-hidden rounded-[32px] bg-gradient-to-br from-white/90 via-white/78 to-cyan-50/72 p-5 dark:from-slate-900/90 dark:via-slate-900/82 dark:to-slate-800/75", className)}>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <HeatLegend />
      </div>
      <div className="overflow-hidden rounded-[28px] border border-white/80 shadow-float">
        <DynamicMap cells={cells} mode={mapMode} highlightedCellIds={highlightedCellIds} adoptedCellIds={adoptedCellIds} />
      </div>
    </div>
  );
}
