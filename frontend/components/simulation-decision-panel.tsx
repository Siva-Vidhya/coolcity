"use client";

import { useMemo, useState } from "react";
import { Coins, Leaf, LoaderCircle, Play, ShieldAlert, ThermometerSun } from "lucide-react";

import { BudgetPieChart, ImpactComparisonChart, ReductionBarChart } from "@/components/charts";
import { ComparisonSlider } from "@/components/comparison-slider";
import { HeatMapComparison } from "@/components/heat-map-comparison";
import { RecommendationsTable } from "@/components/recommendations-table";
import { useRealtimeCityData } from "@/components/realtime-city-provider";
import { SimulationControls, Interventions } from "@/components/simulation-controls";
import { runSimulation } from "@/lib/api";
import { SimulationResponse } from "@/lib/types";
import { CITY_COORDINATES } from "@/services/weather";

const defaults: Interventions = {
  trees: 200,
  cool_roofs: 50,
  green_walls: 20,
  urban_parks: 5,
  water_bodies: 5
};

const scopeOptions = ["Entire City", "Selected Grid", "Hotspot Only"] as const;

const presetMap: Record<string, Interventions> = {
  quick: { trees: 300, cool_roofs: 100, green_walls: 40, urban_parks: 10, water_bodies: 5 },
  balanced: { trees: 500, cool_roofs: 150, green_walls: 80, urban_parks: 15, water_bodies: 10 },
  maximum: { trees: 1000, cool_roofs: 500, green_walls: 200, urban_parks: 50, water_bodies: 25 },
  budget: { trees: 200, cool_roofs: 50, green_walls: 20, urban_parks: 5, water_bodies: 0 }
};

const costModel = {
  trees: 500,
  cool_roofs: 2000,
  green_walls: 5000,
  urban_parks: 50000,
  water_bodies: 20000
};

function averageTemperature(cells: SimulationResponse["before"]) {
  return Number((cells.reduce((sum, cell) => sum + cell.current_temperature, 0) / cells.length).toFixed(1));
}

function averageHeatScore(cells: SimulationResponse["before"]) {
  const score = cells.reduce(
    (sum, cell) => sum + (cell.current_temperature * 1.6 + cell.population_density / 280 - cell.tree_cover * 60 + cell.built_density * 12),
    0
  );
  return Math.round(score / cells.length);
}

function riskLevel(temperature: number) {
  if (temperature >= 36) return "High";
  if (temperature >= 33) return "Medium";
  return "Low";
}

function greenCoverIncrease(interventions: Interventions) {
  return Number((interventions.trees / 1000 * 6 + interventions.green_walls / 200 * 4 + interventions.urban_parks / 50 * 7).toFixed(1));
}

function estimatedCost(interventions: Interventions) {
  return (
    interventions.trees * costModel.trees +
    interventions.cool_roofs * costModel.cool_roofs +
    interventions.green_walls * costModel.green_walls +
    interventions.urban_parks * costModel.urban_parks +
    interventions.water_bodies * costModel.water_bodies
  );
}

function recommendation(interventions: Interventions) {
  const impactRank = [
    { name: "Cool roofs + Trees", score: interventions.cool_roofs * 2 + interventions.trees * 0.015 },
    { name: "Water Bodies + Urban Parks", score: interventions.water_bodies * 10 + interventions.urban_parks * 3 },
    { name: "Green Walls + Trees", score: interventions.green_walls * 0.06 + interventions.trees * 0.01 }
  ].sort((a, b) => b.score - a.score);

  return impactRank[0]?.name ?? "Balanced intervention mix";
}

function scopeAdjustment(scope: (typeof scopeOptions)[number]) {
  if (scope === "Selected Grid") return 0.76;
  if (scope === "Hotspot Only") return 0.58;
  return 1;
}

function chartDataForCosts(interventions: Interventions) {
  return [
    { name: "Trees", value: interventions.trees * costModel.trees },
    { name: "Cool Roofs", value: interventions.cool_roofs * costModel.cool_roofs },
    { name: "Green Walls", value: interventions.green_walls * costModel.green_walls },
    { name: "Urban Parks", value: interventions.urban_parks * costModel.urban_parks },
    { name: "Water Bodies", value: interventions.water_bodies * costModel.water_bodies }
  ].filter((item) => item.value > 0);
}

export function SimulationDecisionPanel() {
  const { selectedCity, selectedLocation, weather, airQuality, population, liveHeatData, refresh } = useRealtimeCityData();
  const [interventions, setInterventions] = useState<Interventions>(defaults);
  const [scope, setScope] = useState<(typeof scopeOptions)[number]>("Entire City");
  const [result, setResult] = useState<SimulationResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const liveCost = useMemo(() => estimatedCost(interventions), [interventions]);
  const liveReduction = useMemo(() => {
    const treeCooling = interventions.trees / 100 * 1.5;
    const roofCooling = interventions.cool_roofs / 50 * 2;
    const wallCooling = interventions.green_walls / 20 * 0.8;
    const parkCooling = interventions.urban_parks / 5 * 1.1;
    const waterCooling = interventions.water_bodies / 5 * 2.5;
    return Number(((treeCooling + roofCooling + wallCooling + parkCooling + waterCooling) * scopeAdjustment(scope) / 3.6).toFixed(1));
  }, [interventions, scope]);

  const liveCurrentTemp = result
    ? averageTemperature(result.before)
    : Number((weather?.temperature ?? liveHeatData?.summary.average_temperature ?? 37).toFixed(1));
  const liveSimulatedTemp = Number((liveCurrentTemp - liveReduction).toFixed(1));
  const liveClimateAfter = result
    ? Number((result.climate_score_before + liveReduction * 4.2 + greenCoverIncrease(interventions)).toFixed(1))
    : Number((((liveHeatData?.summary.climate_score ?? 37.7) + liveReduction * 4.2).toFixed(1)));

  async function handleSimulate() {
    setLoading(true);
    try {
      const response = await runSimulation({
        trees: interventions.trees,
        cool_roofs: interventions.cool_roofs,
        green_walls: interventions.green_walls,
        water_bodies: interventions.water_bodies
      });
      setResult(response);
    } finally {
      setLoading(false);
    }
  }

  function applyPreset(key: keyof typeof presetMap) {
    setInterventions(presetMap[key]);
  }

  const beforeTemp = result ? averageTemperature(result.before) : liveCurrentTemp;
  const afterTemp = result ? Number((averageTemperature(result.after) - interventions.urban_parks / 50 * 0.9).toFixed(1)) : liveSimulatedTemp;
  const beforeHeatScore = result ? averageHeatScore(result.before) : 67;
  const afterHeatScore = result ? Math.max(18, averageHeatScore(result.after) - interventions.urban_parks) : Math.max(18, beforeHeatScore - Math.round(liveReduction * 7));
  const beforeClimate = result ? result.climate_score_before : liveHeatData?.summary.climate_score ?? 37.7;
  const afterClimate = result ? Number((result.climate_score_after + interventions.urban_parks * 0.6).toFixed(1)) : liveClimateAfter;

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="grid w-full gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-1">
          <div className="glass-card-strong rounded-[30px] p-5">
            <div className="mb-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => applyPreset("quick")} className="rounded-full bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:bg-white">
                Quick Cool
              </button>
              <button type="button" onClick={() => applyPreset("balanced")} className="rounded-full bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:bg-white">
                Balanced Strategy
              </button>
              <button type="button" onClick={() => applyPreset("maximum")} className="rounded-full bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:bg-white">
                Maximum Cooling
              </button>
              <button type="button" onClick={() => applyPreset("budget")} className="rounded-full bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:bg-white">
                Budget Friendly
              </button>
            </div>

            <SimulationControls interventions={interventions} setInterventions={setInterventions} />

            <div className="mt-4 rounded-[24px] border border-white/50 bg-white/55 p-4">
              <div className="text-sm font-medium text-slate-800">Simulation Scope</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {scopeOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setScope(item)}
                    className={`rounded-full px-3 py-2 text-sm transition ${scope === item ? "bg-slate-900 text-white" : "bg-white text-slate-700 shadow-sm"}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <button type="button" onClick={handleSimulate} className="climate-button mt-4 bg-slate-950 text-white hover:bg-slate-800">
              {loading ? <LoaderCircle className="animate-spin" size={18} /> : <Play size={18} />}
              Run Simulation
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="glass-card rounded-[28px] p-5 md:col-span-2">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Live Simulation Context</div>
                  <div className="mt-2 text-lg font-semibold text-slate-950">{selectedLocation?.label ?? CITY_COORDINATES[selectedCity].label}</div>
                  <p className="mt-2 text-sm text-slate-600">
                    Weather {weather?.temperature ?? "--"} deg C, AQI {airQuality?.aqi ?? "--"}, population density {(population?.density ?? liveHeatData?.summary.avg_population_density ?? 0).toLocaleString()}.
                  </p>
                </div>
                <button type="button" onClick={() => void refresh()} className="rounded-full bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm transition hover:bg-white">
                  Refresh live inputs
                </button>
              </div>
            </div>
            <div className="glass-card rounded-[28px] p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Real-Time Temperature Simulation</div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm text-slate-600"><span>Current Temperature</span><span className="font-semibold text-slate-950">{liveCurrentTemp} deg C</span></div>
                <div className="flex items-center justify-between text-sm text-slate-600"><span>Simulated Temperature</span><span className="font-semibold text-slate-950">{liveSimulatedTemp} deg C</span></div>
                <div className="flex items-center justify-between text-sm text-slate-600"><span>Temperature Reduction</span><span className="font-semibold text-emerald-700">-{liveReduction} deg C</span></div>
              </div>
            </div>
            <div className="glass-card rounded-[28px] p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Best Strategy Recommendation</div>
              <div className="mt-4 text-lg font-semibold text-slate-950">{recommendation(interventions)}</div>
              <p className="mt-2 text-sm text-slate-600">Greedy impact estimate based on cooling effect per intervention mix.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 xl:col-span-2">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="glass-card rounded-[28px] p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Before Simulation</div>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between"><span>Temperature</span><span className="font-semibold text-slate-950">{beforeTemp} deg C</span></div>
                <div className="flex items-center justify-between"><span>Heat Score</span><span className="font-semibold text-slate-950">{beforeHeatScore}</span></div>
                <div className="flex items-center justify-between"><span>Climate Score</span><span className="font-semibold text-slate-950">{beforeClimate}</span></div>
                <div className="flex items-center justify-between"><span>Risk Level</span><span className="rounded-full bg-red-50 px-3 py-1 font-semibold text-red-700">{riskLevel(beforeTemp)}</span></div>
              </div>
            </div>
            <div className="glass-card rounded-[28px] p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">After Simulation</div>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between"><span>Temperature</span><span className="font-semibold text-slate-950">{afterTemp} deg C</span></div>
                <div className="flex items-center justify-between"><span>Heat Score</span><span className="font-semibold text-slate-950">{afterHeatScore}</span></div>
                <div className="flex items-center justify-between"><span>Climate Score</span><span className="font-semibold text-slate-950">{afterClimate}</span></div>
                <div className="flex items-center justify-between"><span>Risk Level</span><span className={`rounded-full px-3 py-1 font-semibold ${afterTemp >= 36 ? "bg-red-50 text-red-700" : afterTemp >= 33 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{riskLevel(afterTemp)}</span></div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="glass-card rounded-[24px] p-4">
              <div className="inline-flex rounded-xl bg-emerald-50 p-2 text-primary"><ThermometerSun size={16} /></div>
              <div className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">Temp Reduction</div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">-{liveReduction} deg C</div>
            </div>
            <div className="glass-card rounded-[24px] p-4">
              <div className="inline-flex rounded-xl bg-emerald-50 p-2 text-primary"><Leaf size={16} /></div>
              <div className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">Green Cover Increase</div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">{greenCoverIncrease(interventions)}%</div>
            </div>
            <div className="glass-card rounded-[24px] p-4">
              <div className="inline-flex rounded-xl bg-emerald-50 p-2 text-primary"><ShieldAlert size={16} /></div>
              <div className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">Heat Risk Reduction</div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">{Math.max(8, Math.round(liveReduction * 9))}%</div>
            </div>
            <div className="glass-card rounded-[24px] p-4">
              <div className="inline-flex rounded-xl bg-emerald-50 p-2 text-primary"><Coins size={16} /></div>
              <div className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">Estimated Cost</div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">INR {liveCost.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card-strong rounded-[30px] p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[24px] bg-white/70 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Total Budget Required</div>
            <div className="mt-2 text-2xl font-semibold text-slate-950">INR {liveCost.toLocaleString()}</div>
          </div>
          <div className="rounded-[24px] bg-white/70 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Before Climate Score</div>
            <div className="mt-2 text-2xl font-semibold text-slate-950">{beforeClimate}</div>
          </div>
          <div className="rounded-[24px] bg-white/70 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">After Climate Score</div>
            <div className="mt-2 text-2xl font-semibold text-slate-950">{afterClimate}</div>
          </div>
          <div className="rounded-[24px] bg-white/70 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Estimated Cooling Time</div>
            <div className="mt-2 text-2xl font-semibold text-slate-950">{Math.max(2, 10 - Math.round(liveReduction))} weeks</div>
          </div>
        </div>
      </div>

      {result ? (
        <>
          <HeatMapComparison before={result.before} after={result.after} avgDrop={result.avg_temperature_drop} maxDrop={result.max_temperature_drop} />
          <ComparisonSlider before={result.before} after={result.after} />
          <div className="grid w-full gap-6 lg:grid-cols-2 xl:grid-cols-3">
            <ReductionBarChart data={result.charts.temperature_reduction} />
            <BudgetPieChart data={chartDataForCosts(interventions)} />
            <ImpactComparisonChart
              data={[
                { name: "Before Heat Score", score: beforeHeatScore },
                { name: "After Heat Score", score: afterHeatScore }
              ]}
            />
          </div>
          <div className="grid w-full gap-6 lg:grid-cols-2">
            <ImpactComparisonChart
              data={[
                { name: "Before Climate", score: beforeClimate },
                { name: "After Climate", score: afterClimate }
              ]}
            />
            <ImpactComparisonChart
              data={[
                { name: "Cost", score: Math.min(100, Math.round(liveCost / 20000)) },
                { name: "Impact", score: Math.min(100, Math.round(liveReduction * 18)) }
              ]}
            />
          </div>
          <RecommendationsTable rows={result.recommendations} currency="INR" />
          <div className="glass-card rounded-[28px] p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Simulation Summary</div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-sm text-slate-500">Total Temperature Reduction</div>
                <div className="mt-1 text-xl font-semibold text-slate-950">-{liveReduction} deg C</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Best Intervention</div>
                <div className="mt-1 text-xl font-semibold text-slate-950">{recommendation(interventions)}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Estimated Cooling Time</div>
                <div className="mt-1 text-xl font-semibold text-slate-950">{Math.max(2, 10 - Math.round(liveReduction))} weeks</div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
