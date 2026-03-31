"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react";

import { evaluateAlertEngine, HeatAlert, pruneTemperatureSamples } from "@/lib/alertEngine";
import { HeatCell } from "@/lib/types";
import { useRealtimeCityData } from "@/components/realtime-city-provider";

type ToastAlert = HeatAlert & { toastId: string };
type TemperatureSample = { value: number; timestamp: number };

type HeatAlertContextValue = {
  activeAlerts: HeatAlert[];
  alertHistory: HeatAlert[];
  hotspotCellIds: number[];
  highlightedCells: HeatCell[];
  latestTemperature: number;
  heatIndex: number;
  lastUpdated: string | null;
  alertCenterOpen: boolean;
  bannerDismissed: boolean;
  notifications: ToastAlert[];
  setAlertCenterOpen: (open: boolean) => void;
  setBannerDismissed: (dismissed: boolean) => void;
  dismissNotification: (toastId: string) => void;
};

const HeatAlertContext = createContext<HeatAlertContextValue | undefined>(undefined);

function playAlertTone(severity: HeatAlert["severity"]) {
  if (typeof window === "undefined") return;
  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return;

  const context = new AudioContextCtor();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = severity === "high" ? "sawtooth" : "sine";
  oscillator.frequency.value = severity === "high" ? 880 : 520;
  gain.gain.value = severity === "high" ? 0.04 : 0.022;

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + (severity === "high" ? 0.22 : 0.14));
  oscillator.onended = () => {
    context.close().catch(() => undefined);
  };
}

export function HeatAlertProvider({ children }: { children: ReactNode }) {
  const { selectedLocation, weather, airQuality, liveHeatData, lastUpdated } = useRealtimeCityData();
  const [activeAlerts, setActiveAlerts] = useState<HeatAlert[]>([]);
  const [alertHistory, setAlertHistory] = useState<HeatAlert[]>([]);
  const [hotspotCellIds, setHotspotCellIds] = useState<number[]>([]);
  const [highlightedCells, setHighlightedCells] = useState<HeatCell[]>([]);
  const [latestTemperature, setLatestTemperature] = useState(0);
  const [heatIndex, setHeatIndex] = useState(0);
  const [alertCenterOpen, setAlertCenterOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [notifications, setNotifications] = useState<ToastAlert[]>([]);
  const activeAlertIdsRef = useRef<string[]>([]);
  const temperatureSamplesRef = useRef<TemperatureSample[]>([]);

  useEffect(() => {
    const storedHistory = window.localStorage.getItem("coolcity-global-alert-history");
    if (storedHistory) {
      setAlertHistory(JSON.parse(storedHistory));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("coolcity-global-alert-history", JSON.stringify(alertHistory));
  }, [alertHistory]);

  useEffect(() => {
    if (!weather || !liveHeatData) {
      return;
    }

    const runMonitor = () => {
      const nextSamples = pruneTemperatureSamples([
        ...temperatureSamplesRef.current,
        { value: weather.temperature, timestamp: Date.now() }
      ]);
      temperatureSamplesRef.current = nextSamples;

      const result = evaluateAlertEngine({
        cityLabel: selectedLocation?.label ?? liveHeatData.city,
        weatherTemperature: weather.temperature,
        humidity: weather.humidity,
        aqi: airQuality?.aqi ?? 0,
        cells: liveHeatData.cells,
        samples: nextSamples
      });

      setLatestTemperature(weather.temperature);
      setHeatIndex(result.heatIndex);
      setHotspotCellIds(result.hotspotCellIds);
      setHighlightedCells(liveHeatData.cells.filter((cell) => result.hotspotCellIds.includes(cell.cell_id)));
      setActiveAlerts(result.activeAlerts);

      const nextIds = result.activeAlerts.map((alert) => alert.id).sort();
      const previousIds = [...activeAlertIdsRef.current].sort();
      const hasNewAlert =
        nextIds.length !== previousIds.length ||
        nextIds.some((id, index) => id !== previousIds[index]);

      if (hasNewAlert && result.activeAlerts.length > 0) {
        const newAlerts = result.activeAlerts.filter((alert) => !activeAlertIdsRef.current.includes(alert.id));
        if (newAlerts.length > 0) {
          setAlertHistory((prev) => [...newAlerts, ...prev].slice(0, 5));
          setNotifications((prev) => [
            ...newAlerts.slice(0, 2).map((alert, index) => ({ ...alert, toastId: `${alert.id}-${Date.now()}-${index}` })),
            ...prev
          ].slice(0, 4));
          setBannerDismissed(false);
          playAlertTone(newAlerts[0].severity);
        }
      }

      activeAlertIdsRef.current = nextIds;
    };

    runMonitor();
    const interval = window.setInterval(runMonitor, 30000);
    return () => window.clearInterval(interval);
  }, [airQuality?.aqi, liveHeatData, selectedLocation?.label, weather]);

  useEffect(() => {
    if (!notifications.length) return;
    const timers = notifications.map((toast) =>
      window.setTimeout(() => {
        setNotifications((prev) => prev.filter((item) => item.toastId !== toast.toastId));
      }, 4500)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [notifications]);

  const value = useMemo(
    () => ({
      activeAlerts,
      alertHistory,
      hotspotCellIds,
      highlightedCells,
      latestTemperature,
      heatIndex,
      lastUpdated,
      alertCenterOpen,
      bannerDismissed,
      notifications,
      setAlertCenterOpen,
      setBannerDismissed,
      dismissNotification: (toastId: string) => {
        setNotifications((prev) => prev.filter((item) => item.toastId !== toastId));
      }
    }),
    [activeAlerts, alertCenterOpen, alertHistory, bannerDismissed, heatIndex, highlightedCells, hotspotCellIds, lastUpdated, latestTemperature, notifications]
  );

  return <HeatAlertContext.Provider value={value}>{children}</HeatAlertContext.Provider>;
}

export function useHeatAlerts() {
  const context = useContext(HeatAlertContext);
  if (!context) {
    throw new Error("useHeatAlerts must be used within HeatAlertProvider");
  }

  return context;
}
