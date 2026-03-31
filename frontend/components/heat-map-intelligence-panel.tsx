"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, CloudSun, Droplets, Flame, Leaf, ThermometerSun, Wind } from "lucide-react";

import { HeatIntelligenceMap, HeatOverlayCell } from "@/components/heat-intelligence-map";
import { useRealtimeCityData } from "@/components/realtime-city-provider";
import { HeatDataResponse } from "@/lib/types";
import { CITY_COORDINATES } from "@/services/weather";

type TimeSlot = "morning" | "afternoon" | "evening" | "night";

const TIME_OFFSETS: Record<TimeSlot, number> = {
  morning: -1.2,
  afternoon: 1.4,
  evening: 0.2,
  night: -2.3
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function heatScoreForCell(
  cell: HeatDataResponse["cells"][number],
  liveTemperature: number,
  timeSlot: TimeSlot,
  predicted: boolean,
  livePopulationDensity: number
) {
  const displayTemperature = Number(
    (cell.current_temperature + TIME_OFFSETS[timeSlot] + (liveTemperature - 34) * 0.18 + (predicted ? 1 : 0)).toFixed(1)
  );
  const adjustedPopulation = Math.round((cell.population_density + livePopulationDensity) / 2);
  const heatScore = Math.round(
    clamp(displayTemperature * 1.65 + adjustedPopulation / 260 - cell.tree_cover * 60 + cell.built_density * 14, 0, 100)
  );

  if (heatScore >= 78 || displayTemperature >= 39) {
    return { displayTemperature, adjustedPopulation, heatScore, riskLevel: "very_high" as const };
  }
  if (heatScore >= 62 || displayTemperature >= 36.5) {
    return { displayTemperature, adjustedPopulation, heatScore, riskLevel: "high" as const };
  }
  if (heatScore >= 44 || displayTemperature >= 33.5) {
    return { displayTemperature, adjustedPopulation, heatScore, riskLevel: "medium" as const };
  }
  return { displayTemperature, adjustedPopulation, heatScore, riskLevel: "low" as const };
}

function CellMetric({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/45 bg-white/55 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
      <div className="mb-2 inline-flex rounded-xl bg-emerald-50 p-2 text-primary dark:bg-slate-800">{icon}</div>
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-base font-semibold text-slate-950 dark:text-slate-100">{value}</div>
    </div>
  );
}

export function HeatMapIntelligencePanel({ initialData, initialView }: { initialData: HeatDataResponse; initialView?: string }) {
  const {
    selectedCity,
    setSelectedCity,
    selectedLocation,
    weather,
    airQuality,
    population,
    liveHeatData,
    heatRiskScore,
    refresh,
    loading
  } = useRealtimeCityData();

  const [timeSlot, setTimeSlot] = useState<TimeSlot>("afternoon");
  const [showPredicted, setShowPredicted] = useState(false);
  const [selectedCell, setSelectedCell] = useState<HeatOverlayCell | null>(null);
  const [visibleRiskLevels, setVisibleRiskLevels] = useState({ low: true, medium: true, high: true, very_high: true });
  const [layerToggles, setLayerToggles] = useState({
    showPopulation: initialView === "density",
    showGreenCover: false,
    showTemperature: true,
    showHeatScore: true
  });

  const cityData = liveHeatData ?? initialData;
  const cityLabel = selectedLocation?.label ?? CITY_COORDINATES[selectedCity].label;
  const liveWeather = weather ?? {
    temperature: cityData.summary.average_temperature,
    humidity: 58,
    windSpeed: 6.4,
    feelsLike: cityData.summary.average_temperature + 1.2,
    condition: "Live data pending",
    source: "Local fallback"
  };

  const overlayCells = useMemo(() => {
    const density = population?.density ?? cityData.summary.avg_population_density;
    const cells = cityData.cells.map((cell) => {
      const score = heatScoreForCell(cell, liveWeather.temperature, timeSlot, showPredicted, density);
      return {
        ...cell,
        current_temperature: score.displayTemperature,
        population_density: score.adjustedPopulation,
        displayTemperature: score.displayTemperature,
        heatScore: score.heatScore,
        riskLevel: score.riskLevel
      };
    });
    const hotspots = [...cells]
      .sort((a, b) => b.displayTemperature - a.displayTemperature)
      .slice(0, 3)
      .map((cell) => cell.cell_id);
    return cells.map((cell) => ({ ...cell, isHotspot: hotspots.includes(cell.cell_id) }));
  }, [cityData.cells, cityData.summary.avg_population_density, liveWeather.temperature, population?.density, showPredicted, timeSlot]);

  useEffect(() => {
    if (!selectedCell && overlayCells.length > 0) {
      setSelectedCell(overlayCells[0]);
      return;
    }
    if (selectedCell) {
      const next = overlayCells.find((cell) => cell.cell_id === selectedCell.cell_id);
      if (next) {
        setSelectedCell(next);
      }
    }
  }, [overlayCells, selectedCell]);

  const filteredCells = overlayCells.filter((cell) => visibleRiskLevels[cell.riskLevel]);
  const avgTemperature = filteredCells.length
    ? Number((filteredCells.reduce((sum, cell) => sum + cell.displayTemperature, 0) / filteredCells.length).toFixed(1))
    : 0;
  const hottestZone = [...overlayCells].sort((a, b) => b.displayTemperature - a.displayTemperature)[0];
  const coolestZone = [...overlayCells].sort((a, b) => a.displayTemperature - b.displayTemperature)[0];
  const heatRiskIndex = filteredCells.length
    ? Math.round(filteredCells.reduce((sum, cell) => sum + cell.heatScore, 0) / filteredCells.length)
    : 0;
  const hasHeatAlert = overlayCells.some((cell) => cell.displayTemperature > 36);

  return (
    <div className="w-full min-w-0 space-y-6">
      <section className="glass-card-strong rounded-[34px] p-5">
        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-emerald-100 bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-primary dark:border-slate-700 dark:bg-slate-900/80">
              Smart Urban Heat Intelligence Map
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100 md:text-[2rem]">
              Real-time heat, risk, and hotspot visibility for {cityLabel}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Live weather, population density, and prediction overlays are now synchronized with the global city intelligence provider.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedCity}
              onChange={(event) => setSelectedCity(event.target.value as keyof typeof CITY_COORDINATES)}
              className="rounded-full border border-emerald-100 bg-white/85 px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
              aria-label="Quick heat profile"
            >
              {Object.entries(CITY_COORDINATES).map(([key, profile]) => (
                <option key={key} value={key}>
                  {profile.label} profile
                </option>
              ))}
            </select>
            <select
              value={timeSlot}
              onChange={(event) => setTimeSlot(event.target.value as TimeSlot)}
              className="rounded-full border border-emerald-100 bg-white/85 px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
            >
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
              <option value="night">Night</option>
            </select>
            <button
              type="button"
              onClick={() => setShowPredicted((prev) => !prev)}
              className={`climate-button ${showPredicted ? "bg-slate-900 text-white dark:bg-teal-600" : "border border-emerald-100 bg-white/85 text-slate-800 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"}`}
            >
              {showPredicted ? "Predicted Heat Risk (+1 C)" : "Current Heat Risk"}
            </button>
            <button type="button" onClick={() => void refresh()} className="climate-button bg-primary text-white hover:bg-accent">
              {loading ? "Refreshing..." : "Refresh Heat Data"}
            </button>
          </div>
        </div>

        {hasHeatAlert ? (
          <div className="heat-alert-pulse mb-5 flex items-center gap-3 rounded-[24px] border border-red-200 bg-red-50/90 px-4 py-3 text-red-700 shadow-sm dark:border-red-900/70 dark:bg-red-950/50 dark:text-red-200">
            <AlertTriangle size={18} />
            <span className="font-medium">High Heat Risk Detected</span>
          </div>
        ) : null}

        <div className="grid w-full gap-6 lg:grid-cols-3 xl:grid-cols-4">
          <div className="space-y-4 lg:col-span-2 xl:col-span-3">
            <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[28px] border border-white/45 bg-white/58 p-4 shadow-panel backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/70">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Interactive Heat Zone Legend</div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    { key: "low", label: "Low Heat", tone: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900/70 dark:text-emerald-200" },
                    { key: "medium", label: "Medium Heat", tone: "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-950/40 dark:border-yellow-900/70 dark:text-yellow-200" },
                    { key: "high", label: "High Heat", tone: "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/40 dark:border-orange-900/70 dark:text-orange-200" },
                    { key: "very_high", label: "Very High Heat", tone: "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/50 dark:border-red-900/70 dark:text-red-200" }
                  ].map((item) => (
                    <label key={item.key} className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${item.tone}`}>
                      <input
                        type="checkbox"
                        checked={visibleRiskLevels[item.key as keyof typeof visibleRiskLevels]}
                        onChange={() =>
                          setVisibleRiskLevels((prev) => ({
                            ...prev,
                            [item.key]: !prev[item.key as keyof typeof prev]
                          }))
                        }
                        className="accent-emerald-700"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/45 bg-white/58 p-4 shadow-panel backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/70">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Layer Controls</div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    { key: "showPopulation", label: "Show Population Density" },
                    { key: "showGreenCover", label: "Show Green Cover" },
                    { key: "showTemperature", label: "Show Temperature" },
                    { key: "showHeatScore", label: "Show Heat Score" }
                  ].map((item) => (
                    <label key={item.key} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/50 bg-white/55 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={layerToggles[item.key as keyof typeof layerToggles]}
                        onChange={() =>
                          setLayerToggles((prev) => ({
                            ...prev,
                            [item.key]: !prev[item.key as keyof typeof prev]
                          }))
                        }
                        className="accent-emerald-700"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[32px] border border-white/55 bg-gradient-to-br from-white/82 via-white/68 to-emerald-50/68 p-5 shadow-[0_30px_80px_-40px_rgba(7,23,36,0.38)] dark:border-slate-700 dark:from-slate-900/85 dark:via-slate-900/70 dark:to-teal-950/35">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-950 dark:text-slate-100">
                    {showPredicted ? "Predicted Heat Risk" : "Interactive Heat Intelligence Map"}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Live temperature-adjusted grid overlay with hotspot detection, hover tooltips, and click-to-inspect cell intelligence.
                  </p>
                </div>
                <div className="rounded-full border border-white/50 bg-white/65 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
                  Data source: {liveWeather.source}
                </div>
              </div>
              <HeatIntelligenceMap
                cells={overlayCells}
                visibleRiskLevels={visibleRiskLevels}
                layerToggles={layerToggles}
                onCellSelect={setSelectedCell}
              />
            </div>
          </div>

          <div className="space-y-4 lg:col-span-1 xl:col-span-1">
            <div className="rounded-[30px] border border-white/45 bg-white/58 p-5 shadow-panel backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/70">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Mini Analytics Panel</div>
                  <div className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-100">{cityLabel}</div>
                </div>
                <div className="rounded-full border border-white/50 bg-white/60 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                  {timeSlot}
                </div>
              </div>
              <div className="grid gap-3">
                <CellMetric icon={<ThermometerSun size={16} />} label="Avg Temperature" value={`${avgTemperature} deg C`} />
                <CellMetric icon={<Flame size={16} />} label="Hottest Zone" value={hottestZone ? `Zone ${hottestZone.cell_id}` : "-"} />
                <CellMetric icon={<Leaf size={16} />} label="Coolest Zone" value={coolestZone ? `Zone ${coolestZone.cell_id}` : "-"} />
                <CellMetric icon={<Activity size={16} />} label="Heat Risk Index" value={`${heatRiskIndex}/100`} />
              </div>
            </div>

            <div className="rounded-[30px] border border-white/45 bg-white/58 p-5 shadow-panel backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/70">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Live City Layers</div>
              <div className="mt-4 flex items-center gap-3">
                {liveWeather.iconCode ? (
                  <Image src={`https://openweathermap.org/img/wn/${liveWeather.iconCode}@2x.png`} alt={liveWeather.condition} width={44} height={44} unoptimized />
                ) : (
                  <CloudSun size={24} className="text-primary" />
                )}
                <div>
                  <div className="text-lg font-semibold text-slate-950 dark:text-slate-100">{liveWeather.condition}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">Updates every 30 seconds</div>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <CellMetric icon={<ThermometerSun size={16} />} label="Current Temp" value={`${liveWeather.temperature} deg C`} />
                <CellMetric icon={<Droplets size={16} />} label="Humidity" value={`${liveWeather.humidity}%`} />
                <CellMetric icon={<Wind size={16} />} label="Wind Speed" value={`${liveWeather.windSpeed} m/s`} />
                <CellMetric icon={<CloudSun size={16} />} label="Feels Like" value={`${liveWeather.feelsLike} deg C`} />
                <CellMetric icon={<Activity size={16} />} label="Population Layer" value={(population?.density ?? cityData.summary.avg_population_density).toLocaleString()} />
                <CellMetric icon={<Flame size={16} />} label="AQI Layer" value={`${airQuality?.aqi ?? "--"}`} />
              </div>
              <div className="mt-4 rounded-2xl border border-white/50 bg-white/55 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                Global heat risk score: <span className="font-semibold text-slate-950 dark:text-slate-100">{heatRiskScore}/100</span>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/45 bg-white/58 p-5 shadow-panel backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/70">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Grid Cell Intelligence</div>
              {selectedCell ? (
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-white/50 bg-white/55 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                    <div className="text-lg font-semibold text-slate-950 dark:text-slate-100">Zone {selectedCell.cell_id}</div>
                    <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      Click a grid cell on the map to inspect temperature, density, green cover, and risk details.
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <CellMetric icon={<ThermometerSun size={16} />} label="Temperature" value={`${selectedCell.displayTemperature} deg C`} />
                    {layerToggles.showPopulation ? <CellMetric icon={<Activity size={16} />} label="Population Density" value={selectedCell.population_density.toLocaleString()} /> : null}
                    {layerToggles.showGreenCover ? <CellMetric icon={<Leaf size={16} />} label="Green Cover" value={`${Math.round(selectedCell.tree_cover * 100)}%`} /> : null}
                    {layerToggles.showHeatScore ? <CellMetric icon={<Flame size={16} />} label="Heat Score" value={`${selectedCell.heatScore}/100`} /> : null}
                  </div>
                  <div className="rounded-2xl border border-white/50 bg-white/55 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                    <div className="text-sm uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Risk Level</div>
                    <div className="mt-2 text-xl font-semibold capitalize text-slate-950 dark:text-slate-100">
                      {selectedCell.riskLevel.replace("_", " ")}
                    </div>
                    {selectedCell.isHotspot ? (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700 dark:bg-red-950/50 dark:text-red-200">
                        Hotspot detected
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white/55 p-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                  Select a grid cell to inspect intelligence details.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid w-full gap-6 lg:grid-cols-2">
        <div className="rounded-[30px] border border-white/45 bg-white/58 p-5 shadow-panel backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/70">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Hotspot Detection</div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[...overlayCells]
              .sort((a, b) => b.displayTemperature - a.displayTemperature)
              .slice(0, 3)
              .map((cell, index) => (
                <div key={cell.cell_id} className="rounded-2xl border border-red-100 bg-red-50/80 p-4 dark:border-red-900/70 dark:bg-red-950/40">
                  <div className="text-sm font-semibold text-red-700 dark:text-red-200">Hotspot {index + 1}</div>
                  <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">Zone {cell.cell_id}</div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{cell.displayTemperature} deg C</div>
                </div>
              ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/45 bg-white/58 p-5 shadow-panel backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/70">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Data Sources</div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-white/50 bg-white/55 p-4 dark:border-slate-700 dark:bg-slate-800/70">
              <div className="font-semibold text-slate-950 dark:text-slate-100">Weather API</div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{liveWeather.source}</div>
            </div>
            <div className="rounded-2xl border border-white/50 bg-white/55 p-4 dark:border-slate-700 dark:bg-slate-800/70">
              <div className="font-semibold text-slate-950 dark:text-slate-100">Population Dataset</div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{population?.source ?? "Live density loading"}</div>
            </div>
            <div className="rounded-2xl border border-white/50 bg-white/55 p-4 dark:border-slate-700 dark:bg-slate-800/70">
              <div className="font-semibold text-slate-950 dark:text-slate-100">Air Quality API</div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{airQuality?.source ?? "AQI loading"}</div>
            </div>
            <div className="rounded-2xl border border-white/50 bg-white/55 p-4 dark:border-slate-700 dark:bg-slate-800/70">
              <div className="font-semibold text-slate-950 dark:text-slate-100">Simulation Model</div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">Heat score, time-of-day, and prediction overlays.</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
