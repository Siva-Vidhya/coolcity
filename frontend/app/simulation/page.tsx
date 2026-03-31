"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { SimulationDecisionPanel } from "@/components/simulation-decision-panel";

export default function SimulationPage() {
  return (
    <DashboardShell title="Simulation Panel" eyebrow="Cooling strategies">
      <SimulationDecisionPanel />
    </DashboardShell>
  );
}
