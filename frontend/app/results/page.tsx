"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { ResultsDecisionDashboard } from "@/components/results-decision-dashboard";

export default function ResultsPage() {
  return (
    <DashboardShell title="Results Panel" eyebrow="Simulation outcomes">
      <ResultsDecisionDashboard />
    </DashboardShell>
  );
}
