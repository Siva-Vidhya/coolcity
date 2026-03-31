"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, LoaderCircle, Share2, Sparkles, Wallet } from "lucide-react";

import { BudgetPieChart, ImpactComparisonChart, ReductionBarChart } from "@/components/charts";
import { HeatMapComparison } from "@/components/heat-map-comparison";
import { RecommendationsTable } from "@/components/recommendations-table";
import { StatCard } from "@/components/stat-card";
import { Interventions, SimulationControls } from "@/components/simulation-controls";
import { optimizeBudget, reportUrl, runSimulation } from "@/lib/api";
import { HeatCell, OptimizationResponse, SimulationResponse } from "@/lib/types";

const defaults: Interventions = {
  trees: 200,
  cool_roofs: 50,
  green_walls: 20,
  urban_parks: 5,
  water_bodies: 5
};

type HistoryItem = {
  id: string;
  timestamp: string;
  avgDrop: number;
  climateGain: number;
};

function averageTemp(cells: HeatCell[]) {
  return Number((cells.reduce((sum, cell) => sum + cell.current_temperature, 0) / cells.length).toFixed(1));
}

function averageHeatScore(cells: HeatCell[]) {
  const score = cells.reduce(
    (sum, cell) => sum + (cell.current_temperature * 1.6 + cell.population_density / 280 - cell.tree_cover * 60 + cell.built_density * 12),
    0
  );
  return Math.round(score / cells.length);
}

function riskLevel(temp: number) {
  if (temp >= 36) return "High";
  if (temp >= 33) return "Medium";
  return "Low";
}

function greenCoverIncrease(interventions: Interventions) {
  return Number((interventions.trees / 1000 * 6 + interventions.green_walls / 200 * 4 + interventions.urban_parks / 50 * 7).toFixed(1));
}

function coolingPotential(simulation: SimulationResponse | null) {
  if (!simulation) return 0;
  return Math.min(28, Math.round(simulation.avg_temperature_drop * 6 + (simulation.climate_score_after - simulation.climate_score_before) * 0.7));
}

function bestRecommendation(optimization: OptimizationResponse | null, simulation: SimulationResponse | null) {
  if (optimization?.recommendations?.length) {
    return optimization.recommendations
      .slice(0, 2)
      .map((item) => item.strategy)
      .join(" + ");
  }
  if (simulation?.recommendations?.length) {
    return simulation.recommendations
      .slice(0, 2)
      .map((item) => item.strategy)
      .join(" + ");
  }
  return "Tree Plantation + Cool Roofs";
}

function areaWiseRows(before: HeatCell[], after: HeatCell[]) {
  return before.map((cell, index) => {
    const afterCell = after[index] ?? cell;
    return {
      area: `Zone ${cell.cell_id}`,
      before: cell.current_temperature,
      after: afterCell.current_temperature,
      improvement: Number((afterCell.current_temperature - cell.current_temperature).toFixed(1)),
      risk: afterCell.heat_zone
    };
  });
}

function highRiskCount(cells: HeatCell[]) {
  return cells.filter((cell) => cell.heat_zone === "high").length;
}

function downloadCsv(simulation: SimulationResponse) {
  const rows = areaWiseRows(simulation.before, simulation.after);
  const csv = ["Area,Before Temp,After Temp,Improvement,Final Risk"]
    .concat(rows.map((row) => `${row.area},${row.before},${row.after},${row.improvement},${row.risk}`))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "coolcity-results.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function ResultsDecisionDashboard() {
  const [interventions, setInterventions] = useState<Interventions>(defaults);
  const [budget, setBudget] = useState(500000);
  const [currency, setCurrency] = useState("INR");
  const [simulation, setSimulation] = useState<SimulationResponse | null>(null);
  const [optimization, setOptimization] = useState<OptimizationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"improvement" | "risk">("improvement");
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const pdfUrl = useMemo(() => reportUrl(interventions, budget, currency), [interventions, budget, currency]);

  async function handleGenerate() {
    setLoading(true);
    try {
      const [simulationResult, optimizationResult] = await Promise.all([
        runSimulation({
          trees: interventions.trees,
          cool_roofs: interventions.cool_roofs,
          green_walls: interventions.green_walls,
          water_bodies: interventions.water_bodies
        }),
        optimizeBudget(budget, currency)
      ]);
      setSimulation(simulationResult);
      setOptimization(optimizationResult);
      setHistory((prev) => [
        {
          id: crypto.randomUUID(),
          timestamp: new Date().toLocaleString(),
          avgDrop: simulationResult.avg_temperature_drop,
          climateGain: Number((simulationResult.climate_score_after - simulationResult.climate_score_before).toFixed(1))
        },
        ...prev
      ].slice(0, 5));
    } finally {
      setLoading(false);
    }
  }

  const beforeTemp = simulation ? averageTemp(simulation.before) : 0;
  const afterTemp = simulation ? averageTemp(simulation.after) : 0;
  const beforeHeatScore = simulation ? averageHeatScore(simulation.before) : 0;
  const afterHeatScore = simulation ? averageHeatScore(simulation.after) : 0;
  const climateGain = simulation ? Number((simulation.climate_score_after - simulation.climate_score_before).toFixed(1)) : 0;
  const co2Reduction = simulation ? Math.round(simulation.avg_temperature_drop * 3.4 + interventions.trees / 120) : 0;
  const energySaving = simulation ? Math.round(simulation.avg_temperature_drop * 2.3 + interventions.cool_roofs / 80) : 0;
  const urbanHeatReduction = simulation ? Math.round((simulation.avg_temperature_drop / Math.max(beforeTemp, 1)) * 100 * 2.4) : 0;
  const performanceScore = simulation ? Math.min(100, Math.round(simulation.avg_temperature_drop * 16 + climateGain * 1.3)) : 0;

  const areaRows = useMemo(() => {
    if (!simulation) return [];
    const rows = areaWiseRows(simulation.before, simulation.after);
    return [...rows].sort((a, b) => {
      if (sortBy === "risk") {
        const riskRank = { high: 3, medium: 2, low: 1 };
        return riskRank[b.risk] - riskRank[a.risk];
      }
      return a.improvement - b.improvement;
    });
  }, [simulation, sortBy]);

  async function handleShare() {
    const shareText = `CoolCity results: ${bestRecommendation(optimization, simulation)} with ${simulation?.avg_temperature_drop ?? 0} deg C cooling impact.`;
    if (navigator.share) {
      await navigator.share({ title: "CoolCity Results", text: shareText });
      return;
    }
    await navigator.clipboard.writeText(shareText);
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("coolcity-results-history");
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("coolcity-results-history", JSON.stringify(history));
  }, [history]);

  return (
    <div className="grid w-full min-w-0 gap-6 lg:grid-cols-2 xl:grid-cols-3">
      <div className="space-y-4 xl:col-span-1">
        <SimulationControls interventions={interventions} setInterventions={setInterventions} />
        <div className="glass-card-strong rounded-[28px] p-5">
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
              <button type="button" onClick={handleGenerate} className="climate-button bg-slate-950 text-white hover:bg-slate-800">
                {loading ? <LoaderCircle className="animate-spin" size={18} /> : <Wallet size={18} />}
                Generate Results
              </button>
              <a href={pdfUrl} className="climate-button border border-slate-200 bg-white text-slate-900 hover:bg-slate-50">
                <Download size={18} />
                Download Report
              </a>
              <button type="button" disabled={!simulation} onClick={() => simulation && downloadCsv(simulation)} className="climate-button border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 disabled:opacity-50">
                <Download size={18} />
                Download CSV
              </button>
              <button type="button" disabled={!simulation} onClick={handleShare} className="climate-button border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 disabled:opacity-50">
                <Share2 size={18} />
                Share Results
              </button>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-[28px] p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Sparkles size={16} className="text-primary" />
            Simulation History
          </div>
          <div className="mt-4 space-y-3">
            {history.length ? (
              history.map((item, index) => (
                <div key={item.id} className="rounded-2xl bg-white/70 p-3 text-sm text-slate-700">
                  <div className="font-semibold">Simulation {index + 1}</div>
                  <div className="mt-1 text-slate-500">{item.timestamp}</div>
                  <div className="mt-2">Cooling: -{item.avgDrop} deg C</div>
                  <div>Climate Gain: +{item.climateGain}</div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4 text-sm text-slate-500">
                Generate results to store recent simulations here.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 xl:col-span-2">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Simulated Cooling" value={`${simulation?.avg_temperature_drop ?? 0} deg C`} hint="Average reduction from selected interventions" accent={<Wallet size={18} />} />
          <StatCard label="Climate Score Gain" value={`${climateGain}`} hint="Projected resilience lift" accent={<Wallet size={18} />} />
          <StatCard label="Cooling Performance Score" value={`${performanceScore} / 100`} hint="Overall cooling outcome score" accent={<Wallet size={18} />} />
        </div>

        {simulation ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="glass-card rounded-[28px] p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Before Simulation</div>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between"><span>Avg Temperature</span><span className="font-semibold text-slate-950">{beforeTemp} deg C</span></div>
                  <div className="flex items-center justify-between"><span>Heat Score</span><span className="font-semibold text-slate-950">{beforeHeatScore}</span></div>
                  <div className="flex items-center justify-between"><span>Climate Score</span><span className="font-semibold text-slate-950">{simulation.climate_score_before}</span></div>
                  <div className="flex items-center justify-between"><span>Risk Level</span><span className="rounded-full bg-red-50 px-3 py-1 font-semibold text-red-700">{riskLevel(beforeTemp)}</span></div>
                </div>
              </div>
              <div className="glass-card rounded-[28px] p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">After Simulation</div>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between"><span>Avg Temperature</span><span className="font-semibold text-emerald-700">{afterTemp} deg C</span></div>
                  <div className="flex items-center justify-between"><span>Heat Score</span><span className="font-semibold text-emerald-700">{afterHeatScore}</span></div>
                  <div className="flex items-center justify-between"><span>Climate Score</span><span className="font-semibold text-emerald-700">{simulation.climate_score_after}</span></div>
                  <div className="flex items-center justify-between"><span>Risk Level</span><span className={`rounded-full px-3 py-1 font-semibold ${afterTemp >= 36 ? "bg-red-50 text-red-700" : afterTemp >= 33 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{riskLevel(afterTemp)}</span></div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <StatCard label="Temperature Reduction" value={`${simulation.avg_temperature_drop} deg C`} hint="Cooling gain after intervention" accent={<Wallet size={18} />} />
              <StatCard label="Green Cover Increase" value={`${greenCoverIncrease(interventions)}%`} hint="Projected vegetation uplift" accent={<Wallet size={18} />} />
              <StatCard label="Heat Risk Reduction" value={`${Math.max(0, highRiskCount(simulation.before) - highRiskCount(simulation.after))}`} hint="High-risk zones reduced" accent={<Wallet size={18} />} />
              <StatCard label="Climate Score Improvement" value={`${climateGain}`} hint="Net climate score gain" accent={<Wallet size={18} />} />
            </div>

            <div className="glass-card rounded-[28px] p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Recommended Cooling Strategy</div>
              <div className="mt-3 text-2xl font-semibold text-slate-950">{bestRecommendation(optimization, simulation)}</div>
              <p className="mt-2 text-sm text-slate-600">Optimization output indicates this combination delivers the strongest cooling and resilience payoff.</p>
            </div>

            <HeatMapComparison before={simulation.before} after={simulation.after} avgDrop={simulation.avg_temperature_drop} maxDrop={simulation.max_temperature_drop} />

            <div className="grid w-full gap-6 lg:grid-cols-2 xl:grid-cols-3">
              <ReductionBarChart data={simulation.charts.temperature_reduction} />
              <ImpactComparisonChart data={[{ name: "Before Heat Score", score: beforeHeatScore }, { name: "After Heat Score", score: afterHeatScore }]} />
              <ImpactComparisonChart data={[{ name: "Cost", score: Math.min(100, Math.round((optimization?.total_spend ?? simulation.total_cost) / 20000)) }, { name: "Cooling Impact", score: Math.min(100, Math.round(simulation.avg_temperature_drop * 20)) }]} />
            </div>

            <div className="grid w-full gap-6 lg:grid-cols-2">
              <BudgetPieChart data={simulation.charts.budget_allocation} />
              <div className="glass-card rounded-[28px] p-5">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Area-Wise Results</div>
                  <select value={sortBy} onChange={(event) => setSortBy(event.target.value as "improvement" | "risk")} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                    <option value="improvement">Highest improvement</option>
                    <option value="risk">Highest risk</option>
                  </select>
                </div>
                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-950 text-white">
                      <tr>
                        <th className="px-4 py-3 font-medium">Area</th>
                        <th className="px-4 py-3 font-medium">Before Temp</th>
                        <th className="px-4 py-3 font-medium">After Temp</th>
                        <th className="px-4 py-3 font-medium">Improvement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {areaRows.map((row) => (
                        <tr key={row.area} className="border-t border-slate-100 text-slate-700">
                          <td className="px-4 py-3">{row.area}</td>
                          <td className="px-4 py-3">{row.before} deg C</td>
                          <td className="px-4 py-3">{row.after} deg C</td>
                          <td className="px-4 py-3 text-emerald-700">{row.improvement} deg C</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="grid w-full gap-6 lg:grid-cols-3">
              <div className="glass-card rounded-[28px] p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Total Cooling Potential</div>
                <div className="mt-3 text-3xl font-semibold text-slate-950">{coolingPotential(simulation)}%</div>
              </div>
              <div className="glass-card rounded-[28px] p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Environmental Impact Metrics</div>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <div>CO2 Reduction: {co2Reduction}%</div>
                  <div>Energy Saving: {energySaving}%</div>
                  <div>Urban Heat Reduction: {urbanHeatReduction}%</div>
                </div>
              </div>
              <div className="glass-card rounded-[28px] p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Risk Reduction Summary</div>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <div>High Risk Areas Reduced: {highRiskCount(simulation.before)} {"->"} {highRiskCount(simulation.after)}</div>
                  <div>Medium Risk Shift: {simulation.before.filter((cell) => cell.heat_zone === "medium").length} {"->"} {simulation.after.filter((cell) => cell.heat_zone === "medium").length}</div>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-[28px] p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Key Insights</div>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li>High population zones improved most where cooling interventions stacked together.</li>
                <li>{bestRecommendation(optimization, simulation)} emerged as the strongest combined strategy.</li>
                <li>Green walls and parks provided moderate gains but strengthened long-term climate score improvement.</li>
              </ul>
            </div>

            <RecommendationsTable rows={simulation.recommendations} currency={currency} />
            {optimization ? <RecommendationsTable rows={optimization.recommendations} currency={currency} /> : null}
          </>
        ) : (
          <div className="rounded-[32px] border border-dashed border-slate-300 bg-white/70 p-10 text-center text-slate-500">
            Generate results to compare intervention impact, budget recommendations, and city-wide cooling outcomes.
          </div>
        )}
      </div>
    </div>
  );
}
