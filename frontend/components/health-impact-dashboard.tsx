"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, AlertTriangle, HeartPulse, ShieldPlus, Stethoscope, Users, X } from "lucide-react";

import { useRealtimeCityData } from "@/components/realtime-city-provider";
import { StatCard } from "@/components/stat-card";
import {
  buildHealthRiskCells,
  healthRiskTone,
  suggestedHealthActions,
  summarizeHealthRisk
} from "@/lib/health-intelligence";
import { HeatDataResponse } from "@/lib/types";

const DynamicHealthMap = dynamic(() => import("@/components/health-risk-map").then((mod) => mod.HealthRiskMap), {
  ssr: false,
  loading: () => <div className="climate-skeleton h-[480px] rounded-[28px]" />
});

type HealthToast = {
  id: string;
  title: string;
  message: string;
};

export function HealthImpactDashboard({ initialData }: { initialData: HeatDataResponse }) {
  const { weather, airQuality, liveHeatData, refresh } = useRealtimeCityData();
  const [healthAlert, setHealthAlert] = useState<string | null>(null);
  const [toasts, setToasts] = useState<HealthToast[]>([]);

  const liveData = liveHeatData ?? initialData;
  const liveSignals = useMemo(
    () => ({
      temperature: weather?.temperature ?? liveData.summary.average_temperature,
      humidity: weather?.humidity ?? 64,
      aqi: airQuality?.aqi ?? 92,
      source: weather?.source ?? airQuality?.source ?? "Realtime provider"
    }),
    [airQuality?.aqi, airQuality?.source, liveData.summary.average_temperature, weather?.humidity, weather?.source, weather?.temperature]
  );

  const previousTemperatureRef = useRef(liveSignals.temperature);
  const lastAlertSignatureRef = useRef("");

  const center = useMemo(
    () => ({
      latitude: liveData.cells.reduce((sum, cell) => sum + cell.latitude, 0) / liveData.cells.length,
      longitude: liveData.cells.reduce((sum, cell) => sum + cell.longitude, 0) / liveData.cells.length
    }),
    [liveData.cells]
  );

  const trendDelta = Number((liveSignals.temperature - previousTemperatureRef.current).toFixed(1));
  const healthCells = useMemo(
    () => buildHealthRiskCells(liveData.cells, liveSignals, trendDelta),
    [liveData.cells, liveSignals, trendDelta]
  );
  const summary = useMemo(() => summarizeHealthRisk(healthCells), [healthCells]);
  const leadCell = summary.highestRiskCell;
  const leadTone = leadCell ? healthRiskTone(leadCell.overall_health_risk) : healthRiskTone("low");
  const actions = leadCell ? suggestedHealthActions(leadCell.overall_health_risk) : suggestedHealthActions("low");
  const highRiskPopulation = useMemo(
    () =>
      healthCells
        .filter((cell) => cell.overall_health_risk === "high" || cell.overall_health_risk === "critical")
        .reduce((sum, cell) => sum + cell.population_at_risk, 0),
    [healthCells]
  );

  useEffect(() => {
    previousTemperatureRef.current = liveSignals.temperature;
    const interval = window.setInterval(() => {
      void refresh();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [liveSignals.temperature, refresh]);

  useEffect(() => {
    if (!leadCell) return;
    const signature = `${leadCell.cell_id}-${leadCell.overall_health_risk}-${leadCell.risk_trend}`;
    const isHighRisk = leadCell.overall_health_risk === "high" || leadCell.overall_health_risk === "critical";

    if (isHighRisk && signature !== lastAlertSignatureRef.current) {
      lastAlertSignatureRef.current = signature;
      const message = `Heat Stroke Risk ${leadCell.heat_stroke_risk.toUpperCase()} in Zone ${leadCell.cell_id}`;
      setHealthAlert(message);
      setToasts((prev) => [
        { id: crypto.randomUUID(), title: "Health Risk Rising", message: `${message}. Elderly population at risk.` },
        ...prev
      ].slice(0, 3));

      const audio = new Audio("/sounds/health-alert.mp3");
      audio.play().catch(() => {
        const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextCtor) return;
        const context = new AudioContextCtor();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.frequency.value = 760;
        gain.gain.value = 0.03;
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.18);
        oscillator.onended = () => {
          context.close().catch(() => undefined);
        };
      });
    }
  }, [leadCell]);

  useEffect(() => {
    if (!toasts.length) return;
    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== toast.id));
      }, 4200)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [toasts]);

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="pointer-events-none fixed right-5 top-20 z-50 space-y-3">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto alert-slide-in w-[min(92vw,22rem)] rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 shadow-panel">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{toast.title}</div>
                <div className="mt-1 text-sm">{toast.message}</div>
              </div>
              <button type="button" onClick={() => setToasts((prev) => prev.filter((item) => item.id !== toast.id))} className="rounded-full p-1">
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {healthAlert ? (
        <div className={`heat-alert-pulse sticky top-3 z-20 rounded-[24px] border px-4 py-4 shadow-sm ${leadTone}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="mt-0.5" />
              <div>
                <div className="font-semibold">Public Health Alert</div>
                <div className="mt-1 text-sm">{healthAlert}</div>
              </div>
            </div>
            <button type="button" onClick={() => setHealthAlert(null)} className="rounded-full p-1">
              <X size={14} />
            </button>
          </div>
        </div>
      ) : null}

      {leadCell && (leadCell.overall_health_risk === "high" || leadCell.overall_health_risk === "critical") ? (
        <div className={`heat-alert-pulse rounded-[24px] border px-4 py-4 shadow-sm ${leadTone}`}>
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5" />
            <div>
              <div className="font-semibold">Public Health Alert</div>
              <div className="mt-1 text-sm">
                Heat Stroke Risk {leadCell.heat_stroke_risk.toUpperCase()} in Zone {leadCell.cell_id}. Elderly population at risk.
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Heat Stroke Risk" value={leadCell ? leadCell.heat_stroke_risk.toUpperCase() : "LOW"} hint="Temperature + humidity driven risk" accent={<HeartPulse size={18} />} />
        <StatCard label="Respiratory Risk" value={leadCell ? leadCell.respiratory_risk.toUpperCase() : "LOW"} hint="Heat + pollution exposure" accent={<Stethoscope size={18} />} />
        <StatCard label="Elderly Risk" value={leadCell ? leadCell.elderly_risk.toUpperCase() : "LOW"} hint="Dense + hot elderly exposure" accent={<Users size={18} />} />
        <StatCard label="Child Risk" value={leadCell ? leadCell.child_risk.toUpperCase() : "LOW"} hint="School and residential heat stress" accent={<ShieldPlus size={18} />} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="glass-card rounded-[28px] p-5">
          <div className="text-sm text-slate-500">Live Temperature</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950">{liveSignals.temperature} deg C</div>
          <div className="mt-2 text-sm text-slate-600">Updated every 30 seconds from {liveSignals.source}</div>
        </div>
        <div className="glass-card rounded-[28px] p-5">
          <div className="text-sm text-slate-500">Humidity</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950">{liveSignals.humidity}%</div>
          <div className="mt-2 text-sm text-slate-600">Heat stroke model input</div>
        </div>
        <div className="glass-card rounded-[28px] p-5">
          <div className="text-sm text-slate-500">Air Quality Index</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950">{liveSignals.aqi}</div>
          <div className="mt-2 text-sm text-slate-600">Respiratory risk driver</div>
        </div>
        <div className="glass-card rounded-[28px] p-5">
          <div className="text-sm text-slate-500">Risk Trend</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950">{trendDelta > 0.4 ? "Increasing" : "Decreasing"}</div>
          <div className="mt-2 text-sm text-slate-600">Temperature delta {trendDelta >= 0 ? "+" : ""}{trendDelta} deg C</div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-card-strong rounded-[32px] p-6">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Health Risk Map Overlay</div>
          <div className="mt-2 text-xl font-semibold text-slate-950">Climate + Health Risk Zones</div>
          <p className="mt-2 text-sm text-slate-600">
            Green indicates safer conditions, yellow moderate risk, orange high concern, and red critical public health exposure.
          </p>
          <div className="mt-5 overflow-hidden rounded-[28px] border border-white/80 shadow-float">
            <DynamicHealthMap cells={healthCells} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card-strong rounded-[32px] p-6">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Health Impact Metrics</div>
            <div className="mt-4 grid gap-4 md:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-[24px] border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="text-sm text-slate-500">Population at Risk</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">{highRiskPopulation.toLocaleString()}</div>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="text-sm text-slate-500">Elderly at Risk</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">{summary.totalElderlyAtRisk.toLocaleString()}</div>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="text-sm text-slate-500">Children at Risk</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">{summary.totalChildrenAtRisk.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="glass-card-strong rounded-[32px] p-6">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Smart Government Actions</div>
            <div className="mt-4 space-y-3">
              {actions.map((action) => (
                <div key={action} className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  {action}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="glass-card-strong rounded-[32px] p-6">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Health Intelligence Summary</div>
          <div className="mt-4 space-y-4">
            {healthCells
              .slice()
              .sort((a, b) => (b.overall_health_risk > a.overall_health_risk ? 1 : -1))
              .slice(0, 5)
              .map((cell) => (
                <div key={cell.cell_id} className="rounded-[24px] border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-950">Zone {cell.cell_id}</div>
                      <div className="mt-1 text-sm text-slate-600">
                        Heat Stroke Risk: {cell.heat_stroke_risk.toUpperCase()} · Respiratory Risk: {cell.respiratory_risk.toUpperCase()}
                      </div>
                    </div>
                    <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${healthRiskTone(cell.overall_health_risk)}`}>
                      {cell.overall_health_risk}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                    <div>Elderly population: {cell.elderly_population.toLocaleString()}</div>
                    <div>Children population: {cell.children_population.toLocaleString()}</div>
                    <div>Hospitals: {cell.hospitals}</div>
                    <div>Capacity: {cell.hospital_capacity}</div>
                    <div>Risk trend: {cell.risk_trend}</div>
                    <div>Respiratory risk high: {cell.respiratoryRiskHigh ? "Yes" : "No"}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="glass-card-strong rounded-[32px] p-6">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Health Alert Center</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Activity size={16} className="text-primary" />
                Heat Stroke Model
              </div>
              <div className="text-sm text-slate-600">
                {leadCell && leadCell.current_temperature > 35 && leadCell.humidity > 60
                  ? `Heat Stroke Risk: ${leadCell.heat_stroke_risk.toUpperCase()}`
                  : "Heat stroke risk is currently stable."}
              </div>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Users size={16} className="text-primary" />
                Vulnerable Zone Flags
              </div>
              <div className="text-sm text-slate-600">
                {leadCell?.elderlyRiskZone ? "Elderly Risk Zone detected" : "No severe elderly risk flag."}
                <br />
                {leadCell?.childRiskZone ? "Child Heat Risk Zone detected" : "Child zones stable."}
              </div>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Stethoscope size={16} className="text-primary" />
                Respiratory Threat
              </div>
              <div className="text-sm text-slate-600">
                {leadCell?.respiratoryRiskHigh ? "High Heat + High Pollution = Respiratory Risk High" : "Respiratory exposure currently manageable."}
              </div>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <ShieldPlus size={16} className="text-primary" />
                Hospital Readiness
              </div>
              <div className="text-sm text-slate-600">
                Zone {leadCell?.cell_id ?? "-"} · Hospitals: {leadCell?.hospitals ?? 0} · Capacity: {leadCell?.hospital_capacity ?? "Low"}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
