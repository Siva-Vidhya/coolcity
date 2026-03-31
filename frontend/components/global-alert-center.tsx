"use client";

import { AlertTriangle, Bell, Clock3, Flame, X } from "lucide-react";

import { useHeatAlerts } from "@/components/heat-alert-provider";
import { useRealtimeCityData } from "@/components/realtime-city-provider";

function toneClasses(severity: "low" | "medium" | "high") {
  if (severity === "high") return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300";
  if (severity === "medium") return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300";
  return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300";
}

export function GlobalAlertCenter() {
  const {
    activeAlerts,
    alertHistory,
    lastUpdated,
    alertCenterOpen,
    bannerDismissed,
    notifications,
    latestTemperature,
    heatIndex,
    setAlertCenterOpen,
    setBannerDismissed,
    dismissNotification
  } = useHeatAlerts();
  const { selectedLocation, airQuality } = useRealtimeCityData();

  const leadAlert = activeAlerts[0] ?? null;

  return (
    <>
      {!bannerDismissed && leadAlert ? (
        <div className={`heat-alert-pulse sticky top-3 z-30 mb-6 flex flex-col gap-3 rounded-[24px] border px-4 py-4 shadow-sm md:flex-row md:items-center md:justify-between ${toneClasses(leadAlert.severity)}`}>
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5" />
            <div>
              <div className="font-semibold">{leadAlert.title}</div>
              <div className="mt-1 text-sm">{leadAlert.message}</div>
              <div className="mt-2 text-xs uppercase tracking-[0.2em] opacity-80">
                {leadAlert.area} · {leadAlert.temperature} deg C · Updated {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "just now"}
              </div>
            </div>
          </div>
          <button type="button" onClick={() => setBannerDismissed(true)} className="inline-flex items-center gap-2 text-sm font-medium">
            <X size={16} />
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="relative">
        <button
          type="button"
          onClick={() => setAlertCenterOpen(!alertCenterOpen)}
          className="climate-button border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <span className="relative">
            <Bell size={16} />
            {activeAlerts.length > 0 ? <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500" /> : null}
          </span>
          {activeAlerts.length} Alerts
        </button>

        {alertCenterOpen ? (
          <div className="absolute right-0 top-14 z-40 w-[min(92vw,28rem)] rounded-[28px] border border-slate-200 bg-white/95 p-5 shadow-panel backdrop-blur-xl dark:border-slate-700 dark:bg-slate-950/95">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Alert Center</div>
                <div className="mt-2 text-xl font-semibold text-slate-950">Real-Time Climate Alert Engine</div>
              </div>
              <button type="button" onClick={() => setAlertCenterOpen(false)} className="rounded-full border border-slate-200 p-2 text-slate-600 dark:border-slate-700 dark:text-slate-300">
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-950">Emergency Action Panel</div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {selectedLocation?.label ?? "Selected city"} · {latestTemperature} deg C · Heat index {heatIndex} deg C · AQI {airQuality?.aqi ?? "--"}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {activeAlerts.length ? activeAlerts.map((alert) => (
                <div key={alert.id} className="rounded-2xl border border-slate-200 bg-slate-50/85 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-950">{alert.title}</div>
                      <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{alert.area} · {alert.temperature} deg C</div>
                    </div>
                    <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneClasses(alert.severity)}`}>
                      {alert.severity}
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">{alert.message}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {alert.suggestedActions.map((action) => (
                      <span key={action} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/85 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                  No active alerts. Monitoring real temperature, humidity, AQI, and rapid-rise signals every 30 seconds.
                </div>
              )}
            </div>

            <div className="mt-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <Clock3 size={16} />
                Alert History
              </div>
              <div className="space-y-2">
                {alertHistory.slice(0, 5).map((alert) => (
                  <div key={`${alert.id}-${alert.createdAt}`} className="rounded-2xl border border-slate-200 bg-white/85 p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-slate-950">{alert.area}</span>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses(alert.severity)}`}>{alert.severity}</span>
                    </div>
                    <div className="mt-1 text-slate-600 dark:text-slate-400">{new Date(alert.createdAt).toLocaleTimeString()}</div>
                    <div className="mt-1 text-slate-600 dark:text-slate-400">{alert.title}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="pointer-events-none fixed right-5 top-5 z-50 space-y-3">
        {notifications.map((alert) => (
          <div key={alert.toastId} className={`pointer-events-auto w-[min(92vw,22rem)] rounded-2xl border px-4 py-3 shadow-panel alert-slide-in ${toneClasses(alert.severity)}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Flame size={18} className="mt-0.5" />
                <div>
                  <div className="font-semibold">{alert.title}</div>
                  <div className="mt-1 text-sm">{alert.area}</div>
                  <div className="mt-1 text-sm">{alert.message}</div>
                </div>
              </div>
              <button type="button" onClick={() => dismissNotification(alert.toastId)} className="rounded-full p-1">
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
