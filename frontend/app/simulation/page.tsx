"use client";

import { useState } from "react";
import { LoaderCircle, Play } from "lucide-react";

import { BudgetPieChart, ImpactComparisonChart, ReductionBarChart } from "@/components/charts";
import { ComparisonSlider } from "@/components/comparison-slider";
import { DashboardShell } from "@/components/dashboard-shell";
import { HeatMapComparison } from "@/components/heat-map-comparison";
import { ImpactSummaryPanel } from "@/components/impact-summary-panel";
import { RecommendationsTable } from "@/components/recommendations-table";
import { Interventions, SimulationControls } from "@/components/simulation-controls";
import { runSimulation } from "@/lib/api";
import { SimulationResponse } from "@/lib/types";

const defaults: Interventions = {
  trees: 200,
  cool_roofs: 50,
  green_walls: 20,
  water_bodies: 5
};

export default function SimulationPage() {
  const [interventions, setInterventions] = useState<Interventions>(defaults);
  const [result, setResult] = useState<SimulationResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSimulate() {
    setLoading(true);
    try {
      const response = await runSimulation(interventions);
      setResult(response);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardShell title="Simulation Panel" eyebrow="Cooling strategies">
      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-4">
          <SimulationControls interventions={interventions} setInterventions={setInterventions} />
          <button type="button" onClick={handleSimulate} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-white transition hover:bg-slate-800">
            {loading ? <LoaderCircle className="animate-spin" size={18} /> : <Play size={18} />}
            Run Simulation
          </button>
        </div>

        <div className="space-y-4">
          {result ? (
            <>
              <HeatMapComparison
                before={result.before}
                after={result.after}
                avgDrop={result.avg_temperature_drop}
                maxDrop={result.max_temperature_drop}
              />
              <ComparisonSlider before={result.before} after={result.after} />
            </>
          ) : (
            <div className="rounded-[32px] border border-dashed border-slate-300 bg-white/70 p-10 text-center text-slate-500">
              Run a scenario to view the map update and post-intervention comparison.
            </div>
          )}
        </div>
      </div>

      {result ? (
        <section className="mt-6 space-y-4">
          <ImpactSummaryPanel
            before={result.before}
            after={result.after}
            averageDrop={result.avg_temperature_drop}
            totalCost={result.total_cost}
            currency="INR"
          />
          <div className="grid gap-4 xl:grid-cols-3">
            <ReductionBarChart data={result.charts.temperature_reduction} />
            <BudgetPieChart data={result.charts.budget_allocation} />
            <ImpactComparisonChart data={result.charts.impact_comparison} />
          </div>
          <RecommendationsTable rows={result.recommendations} currency="INR" />
        </section>
      ) : null}
    </DashboardShell>
  );
}
