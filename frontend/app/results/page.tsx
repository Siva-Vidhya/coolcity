"use client";

import { useMemo, useState } from "react";
import { Download, LoaderCircle, Wallet } from "lucide-react";

import { DashboardShell } from "@/components/dashboard-shell";
import { RecommendationsTable } from "@/components/recommendations-table";
import { StatCard } from "@/components/stat-card";
import { Interventions, SimulationControls } from "@/components/simulation-controls";
import { optimizeBudget, reportUrl, runSimulation } from "@/lib/api";
import { OptimizationResponse, SimulationResponse } from "@/lib/types";

const defaults: Interventions = {
  trees: 200,
  cool_roofs: 50,
  green_walls: 20,
  water_bodies: 5
};

export default function ResultsPage() {
  const [interventions, setInterventions] = useState<Interventions>(defaults);
  const [budget, setBudget] = useState(500000);
  const [currency, setCurrency] = useState("INR");
  const [simulation, setSimulation] = useState<SimulationResponse | null>(null);
  const [optimization, setOptimization] = useState<OptimizationResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const pdfUrl = useMemo(() => reportUrl(interventions, budget, currency), [interventions, budget, currency]);

  async function handleGenerate() {
    setLoading(true);
    try {
      const [simulationResult, optimizationResult] = await Promise.all([
        runSimulation(interventions),
        optimizeBudget(budget, currency)
      ]);
      setSimulation(simulationResult);
      setOptimization(optimizationResult);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardShell title="Results Panel" eyebrow="Simulation outcomes">
      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-4">
          <SimulationControls interventions={interventions} setInterventions={setInterventions} />
          <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-panel">
            <h3 className="text-lg font-semibold text-slate-950">Budget Optimization</h3>
            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm text-slate-600">Currency</span>
                <select value={currency} onChange={(event) => setCurrency(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none">
                  <option value="INR">INR</option>
                  <option value="USD">USD ($)</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-600">Budget</span>
                <input value={budget} onChange={(event) => setBudget(Number(event.target.value))} type="number" min={0} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
              </label>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={handleGenerate} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-white transition hover:bg-slate-800">
                  {loading ? <LoaderCircle className="animate-spin" size={18} /> : <Wallet size={18} />}
                  Generate Results
                </button>
                <a href={pdfUrl} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-slate-900 transition hover:bg-slate-50">
                  <Download size={18} />
                  Download Report
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Simulated Cooling" value={`${simulation?.avg_temperature_drop ?? 0} deg C`} hint="Average reduction from selected interventions" accent={<Wallet size={18} />} />
            <StatCard label="Climate Score Gain" value={`${simulation ? simulation.climate_score_after - simulation.climate_score_before : 0}`} hint="Projected resilience lift" accent={<Wallet size={18} />} />
            <StatCard label="Optimized Spend" value={`${currency} ${optimization?.total_spend.toLocaleString() ?? "0"}`} hint="Recommended budget allocation" accent={<Wallet size={18} />} />
          </div>

          {simulation ? <RecommendationsTable rows={simulation.recommendations} currency={currency} /> : null}
          {optimization ? <RecommendationsTable rows={optimization.recommendations} currency={currency} /> : null}

          {!simulation && !optimization ? (
            <div className="rounded-[32px] border border-dashed border-slate-300 bg-white/70 p-10 text-center text-slate-500">
              Generate results to compare intervention impact and budget recommendations.
            </div>
          ) : null}
        </div>
      </div>
    </DashboardShell>
  );
}
