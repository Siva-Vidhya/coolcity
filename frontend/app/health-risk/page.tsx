import { DashboardShell } from "@/components/dashboard-shell";
import { HealthImpactDashboard } from "@/components/health-impact-dashboard";
import { getHeatData } from "@/lib/api";

export default async function HealthRiskPage() {
  const data = await getHeatData();

  return (
    <DashboardShell title="Health Impact Dashboard" eyebrow="Health risk intelligence">
      <HealthImpactDashboard initialData={data} />
    </DashboardShell>
  );
}
