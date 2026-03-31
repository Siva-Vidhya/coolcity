import { DashboardShell } from "@/components/dashboard-shell";
import { HeatMapIntelligencePanel } from "@/components/heat-map-intelligence-panel";
import { getHeatData } from "@/lib/api";

export default async function HeatMapPage({
  searchParams
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const data = await getHeatData();
  const params = searchParams ? await searchParams : undefined;

  return (
    <DashboardShell title="Heat Map View" eyebrow="Heat detection">
      <HeatMapIntelligencePanel initialData={data} initialView={params?.view} />
    </DashboardShell>
  );
}
