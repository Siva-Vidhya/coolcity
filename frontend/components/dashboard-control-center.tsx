"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  CloudSun,
  Clock3,
  Droplets,
  Flame,
  Leaf,
  RefreshCw,
  ThermometerSun,
  Wind,
  X
} from "lucide-react";

import { HeatMapCard } from "@/components/heat-map-card";
import { useHeatAlerts } from "@/components/heat-alert-provider";
import { ScoreGauge } from "@/components/score-gauge";
import { StatCard } from "@/components/stat-card";
import { useRealtimeCityData } from "@/components/realtime-city-provider";
import { HeatAlert } from "@/lib/alertEngine";
import { HeatDataResponse } from "@/lib/types";
import { CITY_COORDINATES } from "@/services/weather";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function riskTone(score: number) {
  if (score >= 80) return { label: "High", tone: "bg-red-50 text-red-700 border-red-200" };
  if (score >= 60) return { label: "Medium", tone: "bg-amber-50 text-amber-700 border-amber-200" };
  return { label: "Low", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" };
}

function coolingPotential(summary: HeatDataResponse["summary"]) {
  return Math.round(
    clamp(10 + summary.high_heat_cells * 3 + summary.medium_heat_cells * 1.4 - summary.avg_tree_cover * 0.18, 8, 30)
  );
}

function WeatherMetric({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/40 bg-white/45 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
      <div className="mb-2 inline-flex rounded-xl bg-emerald-50 p-2 text-primary dark:bg-slate-800">{icon}</div>
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">{value}</div>
    </div>
  );
}

function alertTone(severity: HeatAlert["severity"]) {
  if (severity === "high") return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/60 dark:text-red-200";
  if (severity === "medium") return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/50 dark:text-amber-200";
  return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200";
}

export function DashboardControlCenter({ initialData }: { initialData: HeatDataResponse }) {
  const {
    selectedCity,
    setSelectedCity,
    selectedLocation,
    location,
    weather,
    airQuality,
    population,
    liveHeatData,
    heatRiskScore,
    lastUpdated,
    loading,
    error,
    refresh
  } = useRealtimeCityData();
  const {
    activeAlerts,
    alertHistory,
    hotspotCellIds,
    bannerDismissed,
    setBannerDismissed,
    heatIndex
  } = useHeatAlerts();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [alertPanelOpen, setAlertPanelOpen] = useState(false);

  const cityData = liveHeatData ?? initialData;
  const liveWeather = weather ?? {
    temperature: cityData.summary.average_temperature,
    humidity: 58,
    windSpeed: 6.8,
    feelsLike: cityData.summary.average_temperature + 1.2,
    condition: "Live data pending",
    source: "Local fallback"
  };

  const heatRisk = useMemo(() => riskTone(heatRiskScore), [heatRiskScore]);
  const cityLabel = selectedLocation?.label ?? CITY_COORDINATES[selectedCity].label;
  const temperatureTrend =
    cityData.summary.average_temperature >= initialData.summary.average_temperature
      ? { direction: "up" as const, label: "Rising" }
      : { direction: "down" as const, label: "Cooling" };
  const greenCoverTrend =
    cityData.summary.avg_tree_cover >= initialData.summary.avg_tree_cover
      ? { direction: "up" as const, label: "Improving" }
      : { direction: "down" as const, label: "Decreasing" };
  const leadAlert = activeAlerts[0] ?? null;
  const rapidRiseAlert = activeAlerts.find((alert) => alert.type === "rapid_rise") ?? null;

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setBannerDismissed(false);
  }, [selectedCity, setBannerDismissed]);

  return (
    <div className="w-full min-w-0 space-y-8">
      <section className="dashboard-fade-up rounded-[34px] border border-white/50 bg-gradient-to-br from-white/55 via-white/35 to-emerald-50/50 p-4 shadow-[0_28px_80px_-40px_rgba(15,118,110,0.35)] dark:border-slate-800 dark:from-slate-900/85 dark:via-slate-900/70 dark:to-teal-950/40 md:p-5">
        {!bannerDismissed && leadAlert ? (
          <div className={`heat-alert-pulse sticky top-3 z-20 mb-5 flex flex-col gap-3 rounded-[24px] border px-4 py-4 shadow-sm md:flex-row md:items-center md:justify-between ${alertTone(leadAlert.severity)}`}>
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="mt-0.5" />
              <div>
                <div className="font-semibold">{leadAlert.title}</div>
                <div className="mt-1 text-sm">{leadAlert.message}</div>
                <div className="mt-2 text-xs uppercase tracking-[0.2em] opacity-80">
                  {leadAlert.area} · {leadAlert.temperature} deg C · Heat index {leadAlert.heatIndex} deg C
                </div>
              </div>
            </div>
            <button type="button" onClick={() => setBannerDismissed(true)} className="inline-flex items-center gap-2 text-sm font-medium">
              <X size={16} />
              Dismiss
            </button>
          </div>
        ) : null}

        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-emerald-100 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-primary dark:border-slate-700 dark:bg-slate-900/80">
              Real-Time Climate Intelligence
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100 md:text-[2rem]">
              Smart city climate intelligence for {cityLabel}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Live geolocation, weather, AQI, population density, and a data-driven alert engine are synchronized into one operational dashboard.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="glass-card rounded-[26px] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-50 p-2 text-primary dark:bg-slate-800">
                  <Clock3 size={18} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Live Clock</div>
                  <div className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">
                    {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </div>
                </div>
                <div className="ml-2 flex items-center gap-2 rounded-full border border-white/50 bg-white/55 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
                  {liveWeather.iconCode ? (
                    <Image
                      src={`https://openweathermap.org/img/wn/${liveWeather.iconCode}@2x.png`}
                      alt={liveWeather.condition}
                      width={36}
                      height={36}
                      className="h-9 w-9"
                      unoptimized
                    />
                  ) : (
                    <CloudSun size={18} className="text-primary" />
                  )}
                  <span>{liveWeather.condition}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAlertPanelOpen((prev) => !prev)}
                className="climate-button border border-emerald-100 bg-white/85 text-slate-800 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
              >
                <span className="relative">
                  <Bell size={16} />
                  {activeAlerts.length > 0 ? <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500" /> : null}
                </span>
                Alert Center
              </button>
              <select
                value={selectedCity}
                onChange={(event) => setSelectedCity(event.target.value as keyof typeof CITY_COORDINATES)}
                className="rounded-full border border-emerald-100 bg-white/85 px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
                aria-label="Quick climate profile"
              >
                {Object.entries(CITY_COORDINATES).map(([key, profile]) => (
                  <option key={key} value={key}>
                    {profile.label} profile
                  </option>
                ))}
              </select>
              <button type="button" onClick={() => void refresh()} className="climate-button bg-primary text-white hover:bg-accent">
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Avg Surface Temp" value={`${cityData.summary.average_temperature} deg C`} hint="Current urban heat baseline" accent={<ThermometerSun size={18} />} className="dashboard-fade-up bg-gradient-to-br from-white/82 via-white/70 to-emerald-50/80" href="/heat-map" trend={temperatureTrend} />
            <StatCard label="Green Cover" value={`${cityData.summary.avg_tree_cover}%`} hint="Average vegetative canopy" accent={<Leaf size={18} />} className="dashboard-fade-up bg-gradient-to-br from-white/82 via-white/70 to-green-50/80" href="/simulation" trend={greenCoverTrend} />
            <StatCard label="Population Density" value={cityData.summary.avg_population_density.toLocaleString()} hint="People per sq km estimate" accent={<Activity size={18} />} className="dashboard-fade-up bg-gradient-to-br from-white/82 via-white/70 to-teal-50/80" href="/heat-map?view=density" trend={{ direction: "up", label: "Live density" }} />
          </div>
          <ScoreGauge label="Area Climate Score" score={cityData.summary.climate_score} className="dashboard-fade-up-delay bg-gradient-to-br from-white/85 via-emerald-50/75 to-teal-50/75" />
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-4">
          <div className="glass-card-strong rounded-[30px] p-5 dashboard-fade-up-delay">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Live Weather Conditions</div>
                <h3 className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-100">{cityLabel}</h3>
              </div>
              <div className="rounded-full border border-white/50 bg-white/55 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                Updates every 30s
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <WeatherMetric icon={<ThermometerSun size={16} />} label="Temp" value={`${liveWeather.temperature} deg C`} />
              <WeatherMetric icon={<Droplets size={16} />} label="Humidity" value={`${liveWeather.humidity}%`} />
              <WeatherMetric icon={<Wind size={16} />} label="Wind" value={`${liveWeather.windSpeed} m/s`} />
              <WeatherMetric icon={<CloudSun size={16} />} label="Heat Index" value={`${heatIndex} deg C`} />
            </div>
          </div>

          <div className="glass-card-strong rounded-[30px] p-5 dashboard-fade-up-delay">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Current Heat Risk Level</div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-2xl font-semibold text-slate-950 dark:text-slate-100">{heatRisk.label}</div>
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Heat risk score {heatRiskScore}/100 using temperature, humidity, AQI, population, and green cover.
                </div>
              </div>
              <div className={`rounded-full border px-4 py-2 text-sm font-semibold ${heatRisk.tone}`}>{heatRisk.label} Risk</div>
            </div>
          </div>

          <div className="glass-card-strong rounded-[30px] p-5 dashboard-fade-up-delay">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Active Alert Status</div>
            {leadAlert ? (
              <div className="mt-3 space-y-3">
                <div className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${alertTone(leadAlert.severity)}`}>
                  {leadAlert.type.replace("_", " ").toUpperCase()}
                </div>
                <div className="text-lg font-semibold text-slate-950 dark:text-slate-100">{leadAlert.area}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Temperature: {leadAlert.temperature} deg C</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">AQI: {airQuality?.aqi ?? "--"}</div>
              </div>
            ) : (
              <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">No active data-driven warning right now. Monitoring every 30 seconds.</div>
            )}
          </div>

          <div className="glass-card-strong rounded-[30px] p-5 dashboard-fade-up-delay">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Cooling Potential</div>
            <div className="mt-3 text-2xl font-semibold text-slate-950 dark:text-slate-100">
              City Cooling Potential: {coolingPotential(cityData.summary)}% Reduction Possible
            </div>
            <div className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Potential combines heat concentration, green deficit, and climate-score opportunity across the current city profile.
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="glass-card-strong rounded-[30px] p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Municipality Alert Center</div>
                <div className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-100">Active Alerts and Actions</div>
              </div>
              <div className="rounded-full border border-white/50 bg-white/55 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                Updates every 30s
              </div>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
              <div className="space-y-3">
                {activeAlerts.length ? activeAlerts.map((alert) => (
                  <div key={alert.id} className="rounded-2xl border border-white/60 bg-white/55 p-4 dark:border-slate-700 dark:bg-slate-900/70">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-950 dark:text-slate-100">{alert.title}</div>
                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{alert.area} · {alert.temperature} deg C · AQI {alert.aqi || "--"}</div>
                      </div>
                      <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${alertTone(alert.severity)}`}>
                        {alert.severity}
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">{alert.message}</div>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                    No active alerts. The engine only raises warnings when live thresholds are crossed.
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/55 p-4 dark:border-slate-700 dark:bg-slate-900/70">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <Flame size={16} className="text-red-500" />
                  Recommended Immediate Actions
                </div>
                <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  {(leadAlert?.suggestedActions ?? ["Continue monitoring live city conditions"]).map((action) => (
                    <div key={action} className="rounded-2xl border border-white/60 bg-white/65 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/80">
                      {action}
                    </div>
                  ))}
                </div>
                {rapidRiseAlert ? (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/50 dark:text-amber-200">
                    Rapid warming detected in {rapidRiseAlert.area}. Increase field monitoring now.
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {alertPanelOpen ? (
            <div className="glass-card-strong rounded-[30px] p-5">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Alert History Panel</div>
                <button type="button" onClick={() => setAlertPanelOpen(false)} className="rounded-full border border-white/50 bg-white/55 p-2 text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
                  <X size={16} />
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {alertHistory.length ? alertHistory.map((alert) => (
                  <div key={`${alert.id}-${alert.createdAt}`} className="rounded-2xl border border-white/60 bg-white/55 p-4 dark:border-slate-700 dark:bg-slate-900/70">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-slate-950 dark:text-slate-100">{alert.title}</div>
                      <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${alertTone(alert.severity)}`}>
                        {alert.severity}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{alert.area} · {new Date(alert.createdAt).toLocaleTimeString()}</div>
                    <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{alert.message}</div>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                    No previous alerts recorded yet.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card-strong rounded-[30px] p-5">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Alert Engine Status</div>
              <div className="mt-3 text-xl font-semibold text-slate-950 dark:text-slate-100">
                {rapidRiseAlert ? "Rapid temperature rise detected" : "Stable trend"}
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {rapidRiseAlert
                  ? `${rapidRiseAlert.area} has warmed by ${rapidRiseAlert.rapidIncrease} deg C within the rolling 10-minute window.`
                  : "No rapid warming or threshold-triggered alert is active right now."}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-fade-up-delay">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-emerald-100 bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-primary dark:border-slate-700 dark:bg-slate-900/80">
              Spatial Heat Intelligence
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100 md:text-[2rem]">
              City Heat Zones
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Explore the live heat distribution across the selected city profile with real-time weather-adjusted temperature cells.
            </p>
          </div>
        </div>
        <HeatMapCard
          cells={cityData.cells}
          title={`${cityLabel} Heat Zones`}
          description="High, medium, and low heat zones from the synchronized real-time city profile."
          className="overflow-hidden border-white/55 bg-gradient-to-br from-white/82 via-white/68 to-emerald-50/68 shadow-[0_30px_80px_-40px_rgba(7,23,36,0.38)]"
          highlightedCellIds={hotspotCellIds}
        />
      </section>

      <section className="dashboard-fade-up-delay grid w-full gap-6 lg:grid-cols-3 xl:grid-cols-4">
        <div className="glass-card-strong rounded-[30px] p-5 lg:col-span-2 xl:col-span-3">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Data Sources</div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-white/50 bg-white/55 p-4 dark:border-slate-700 dark:bg-slate-900/70">
              <div className="font-semibold text-slate-950 dark:text-slate-100">Weather API</div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{liveWeather.source}</div>
            </div>
            <div className="rounded-2xl border border-white/50 bg-white/55 p-4 dark:border-slate-700 dark:bg-slate-900/70">
              <div className="font-semibold text-slate-950 dark:text-slate-100">Population Dataset</div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{population?.source ?? "Live density loading"}</div>
            </div>
            <div className="rounded-2xl border border-white/50 bg-white/55 p-4 dark:border-slate-700 dark:bg-slate-900/70">
              <div className="font-semibold text-slate-950 dark:text-slate-100">Air Quality</div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{airQuality?.source ?? "AQI loading"} · AQI {airQuality?.aqi ?? "--"}</div>
            </div>
            <div className="rounded-2xl border border-white/50 bg-white/55 p-4 dark:border-slate-700 dark:bg-slate-900/70">
              <div className="font-semibold text-slate-950 dark:text-slate-100">Location Sync</div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {location ? `${location.source} · ${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}` : "Locating user"}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card-strong rounded-[30px] p-5 lg:col-span-1 xl:col-span-1">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Live Status</div>
          <div className="mt-3 text-2xl font-semibold text-slate-950 dark:text-slate-100">{liveWeather.condition}</div>
          <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Current live status for {cityLabel}. Feels like {liveWeather.feelsLike} deg C with humidity at {liveWeather.humidity}%.
          </div>
          {lastUpdated ? (
            <div className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Last updated {new Date(lastUpdated).toLocaleTimeString()}
            </div>
          ) : null}
          {error ? <div className="mt-3 text-sm text-amber-700 dark:text-amber-300">{error}</div> : null}
        </div>
      </section>
    </div>
  );
}
