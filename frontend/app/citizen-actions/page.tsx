import { CitizenActionsDashboard } from "@/components/citizen-actions-dashboard";
import { DashboardShell } from "@/components/dashboard-shell";
import { getHeatData } from "@/lib/api";

export default async function CitizenActionsPage() {
  const data = await getHeatData();

  return (
    <DashboardShell title="Citizen Actions" eyebrow="Community cooling">
      <CitizenActionsDashboard initialData={data} />
    </DashboardShell>
  );
}
