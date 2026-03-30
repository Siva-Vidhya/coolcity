import { Flame, Leaf, Users } from "lucide-react";

import { DashboardShell } from "@/components/dashboard-shell";
import { HeatMapCard } from "@/components/heat-map-card";
import { ScoreGauge } from "@/components/score-gauge";
import { StatCard } from "@/components/stat-card";
import { getHeatData } from "@/lib/api";

export default async function DashboardPage() {
  const data = await getHeatData();

  return (
    <DashboardShell title="Dashboard" eyebrow="City overview">
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Avg Surface Temp" value={`${data.summary.average_temperature} deg C`} hint="Current urban heat baseline" accent={<Flame size={18} />} />
          <StatCard label="Green Cover" value={`${data.summary.avg_tree_cover}%`} hint="Average vegetative canopy" accent={<Leaf size={18} />} />
          <StatCard label="Population Density" value={data.summary.avg_population_density.toLocaleString()} hint="People per sq km estimate" accent={<Users size={18} />} />
        </div>
        <ScoreGauge label="Area Climate Score" score={data.summary.climate_score} />
      </section>

      <section className="mt-6">
        <HeatMapCard cells={data.cells} title="City Heat Zones" description="High, medium, and low heat zones from the seeded urban grid dataset." />
      </section>
    </DashboardShell>
  );
}
