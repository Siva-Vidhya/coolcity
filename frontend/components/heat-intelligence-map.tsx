"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Marker, Popup, Rectangle, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";

import { useHeatAlerts } from "@/components/heat-alert-provider";
import { useRealtimeCityData } from "@/components/realtime-city-provider";
import { useTheme } from "@/components/theme-provider";
import { HeatCell } from "@/lib/types";

export type HeatOverlayCell = HeatCell & {
  displayTemperature: number;
  heatScore: number;
  riskLevel: "low" | "medium" | "high" | "very_high";
  isHotspot?: boolean;
};

export type VisibleRiskLevels = Record<HeatOverlayCell["riskLevel"], boolean>;
export type LayerToggles = {
  showPopulation: boolean;
  showGreenCover: boolean;
  showTemperature: boolean;
  showHeatScore: boolean;
};

function colorForRisk(riskLevel: HeatOverlayCell["riskLevel"]) {
  if (riskLevel === "very_high") return "#dc2626";
  if (riskLevel === "high") return "#f97316";
  if (riskLevel === "medium") return "#facc15";
  return "#22c55e";
}

function hotspotIcon(label: string) {
  return L.divIcon({
    className: "heat-hotspot-marker",
    html: `<div style="display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:6px 10px;background:rgba(239,68,68,0.94);color:#fff;font-weight:700;font-size:12px;box-shadow:0 14px 30px -18px rgba(220,38,38,0.9);">🔥 ${label}</div>`,
    iconAnchor: [42, 12]
  });
}

function radiusForZoom(zoom: number, populationDensity: number) {
  const base = zoom >= 15 ? 11 : zoom >= 13 ? 15 : 20;
  if (populationDensity >= 12000) return base + 4;
  if (populationDensity >= 9000) return base + 2;
  return base;
}

function ZoomTracker({ onZoom }: { onZoom: (zoom: number) => void }) {
  useMapEvents({
    zoomend(event) {
      onZoom(event.target.getZoom());
    }
  });
  return null;
}

function MapViewport({
  center,
  bounds
}: {
  center: [number, number];
  bounds?: [[number, number], [number, number]];
}) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [28, 28] });
      return;
    }
    map.setView(center, map.getZoom());
  }, [bounds, center, map]);

  return null;
}

export function HeatIntelligenceMap({
  cells,
  visibleRiskLevels,
  layerToggles,
  onCellSelect
}: {
  cells: HeatOverlayCell[];
  visibleRiskLevels: VisibleRiskLevels;
  layerToggles: LayerToggles;
  onCellSelect: (cell: HeatOverlayCell) => void;
}) {
  const { resolvedTheme } = useTheme();
  const { selectedLocation } = useRealtimeCityData();
  const { hotspotCellIds } = useHeatAlerts();
  const filteredCells = cells.filter((cell) => visibleRiskLevels[cell.riskLevel]);
  const center =
    filteredCells.length > 0
      ? ([filteredCells.reduce((sum, cell) => sum + cell.latitude, 0) / filteredCells.length, filteredCells.reduce((sum, cell) => sum + cell.longitude, 0) / filteredCells.length] as [number, number])
      : ([12.9637, 77.6028] as [number, number]);

  let zoomLevel = 13;

  return (
    <MapContainer center={center} zoom={13} scrollWheelZoom className="h-[560px] w-full rounded-[30px]">
      <MapViewport center={center} bounds={selectedLocation?.bounds} />
      <ZoomTracker onZoom={(zoom) => { zoomLevel = zoom; }} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url={
          resolvedTheme === "dark"
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        }
      />
      {selectedLocation?.bounds ? (
        <Rectangle bounds={selectedLocation.bounds} pathOptions={{ color: "#0EA5A4", weight: 2, fillOpacity: 0.03 }} />
      ) : null}
      {filteredCells.map((cell, index) => (
        <div key={cell.cell_id}>
          <CircleMarker
            center={[cell.latitude, cell.longitude]}
            radius={radiusForZoom(zoomLevel, cell.population_density)}
            eventHandlers={{ click: () => onCellSelect(cell) }}
            pathOptions={{
              color: colorForRisk(cell.riskLevel),
              fillColor: colorForRisk(cell.riskLevel),
              fillOpacity: cell.displayTemperature > 36 || hotspotCellIds.includes(cell.cell_id) ? 0.9 : 0.62,
              weight: cell.isHotspot || hotspotCellIds.includes(cell.cell_id) ? 3 : 1.5
            }}
            className={hotspotCellIds.includes(cell.cell_id) ? "animate-pulse" : undefined}
          >
            <Tooltip direction="top" sticky opacity={1}>
              <div className="space-y-1 text-xs">
                <div className="font-semibold">Zone {cell.cell_id}</div>
                <div>Temp: {cell.displayTemperature} deg C</div>
                <div>Heat score: {cell.heatScore}</div>
                <div>Risk: {cell.riskLevel.replace("_", " ")}</div>
              </div>
            </Tooltip>
            <Popup>
              <div className="space-y-1 text-sm">
                <div className="font-semibold">Zone {cell.cell_id}</div>
                <div>Temperature: {cell.displayTemperature} deg C</div>
                <div>Population density: {cell.population_density}</div>
                <div>Green cover: {Math.round(cell.tree_cover * 100)}%</div>
                <div>Heat score: {cell.heatScore}</div>
                <div>Risk level: {cell.riskLevel.replace("_", " ")}</div>
              </div>
            </Popup>
            {layerToggles.showTemperature && zoomLevel >= 13 ? (
              <Tooltip permanent direction="center" className="!border-0 !bg-transparent !p-0 !shadow-none">
                <span className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-slate-800 shadow-sm">
                  {cell.displayTemperature}°
                </span>
              </Tooltip>
            ) : null}
          </CircleMarker>
          {cell.isHotspot || hotspotCellIds.includes(cell.cell_id) ? (
            <Marker
              position={[cell.latitude + 0.0015 + index * 0.0002, cell.longitude]}
              icon={hotspotIcon(`Hotspot ${index + 1}`)}
            />
          ) : null}
        </div>
      ))}
    </MapContainer>
  );
}
