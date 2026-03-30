import { DashboardShell } from "@/components/dashboard-shell";
import { HeatMapCard } from "@/components/heat-map-card";
import { getHeatData } from "@/lib/api";

export default async function HeatMapPage() {
  const data = await getHeatData();

  return (
    <DashboardShell title="Heat Map View" eyebrow="Heat detection">
      <HeatMapCard
        cells={data.cells}
        title="Interactive Heatmap Overlay"
        description="Leaflet-based map with heat zone circles for rapid hotspot analysis."
      />
    </DashboardShell>
  );
}
