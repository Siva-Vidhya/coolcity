"use client";

import { ShieldAlert, ThermometerSun, Wallet } from "lucide-react";

import { StatCard } from "@/components/stat-card";
import { HeatCell } from "@/lib/types";

function highHeatCount(cells: HeatCell[]) {
  return cells.filter((cell) => cell.heat_zone === "high").length;
}

export function ImpactSummaryPanel({
  before,
  after,
  averageDrop,
  totalCost,
  currency
}: {
  before: HeatCell[];
  after: HeatCell[];
  averageDrop: number;
  totalCost: number;
  currency: string;
}) {
  const highRiskBefore = highHeatCount(before);
  const highRiskAfter = highHeatCount(after);
  const reducedZones = Math.max(0, highRiskBefore - highRiskAfter);
  const reducedPercent = highRiskBefore > 0 ? Math.round((reducedZones / highRiskBefore) * 100) : 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard
        label="Temperature Reduction"
        value={`${averageDrop} deg C`}
        hint="Average cooling achieved across the simulated city grid."
        accent={<ThermometerSun size={18} />}
      />
      <StatCard
        label="Budget Used"
        value={`${currency} ${totalCost.toLocaleString()}`}
        hint="Estimated spend required for the selected intervention mix."
        accent={<Wallet size={18} />}
      />
      <StatCard
        label="Heat Risk Reduction"
        value={`${reducedZones} zones`}
        hint={`${reducedPercent}% fewer high-risk heat zones after simulation.`}
        accent={<ShieldAlert size={18} />}
      />
    </div>
  );
}
