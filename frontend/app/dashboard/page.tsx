import { DashboardShell } from "@/components/dashboard-shell";
import { DashboardControlCenter } from "@/components/dashboard-control-center";
import { getHeatData } from "@/lib/api";

export default async function DashboardPage() {
  const data = await getHeatData();

  return (
    <DashboardShell title="Dashboard" eyebrow="City overview">
      <DashboardControlCenter initialData={data} />
    </DashboardShell>
  );
}
