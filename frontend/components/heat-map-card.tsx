"use client";

import dynamic from "next/dynamic";

import { HeatLegend } from "@/components/heat-legend";
import { HeatCell } from "@/lib/types";

const DynamicMap = dynamic(() => import("@/components/leaflet-map").then((mod) => mod.LeafletMap), {
  ssr: false,
  loading: () => <div className="h-[430px] animate-pulse rounded-[28px] bg-slate-200" />
});

export function HeatMapCard({
  cells,
  title,
  description
}: {
  cells: HeatCell[];
  title: string;
  description: string;
}) {
  return (
    <div className="glass-card-strong climate-hover rounded-[32px] p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <HeatLegend />
      </div>
      <DynamicMap cells={cells} />
    </div>
  );
}
