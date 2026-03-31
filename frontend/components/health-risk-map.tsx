"use client";

import "leaflet/dist/leaflet.css";

import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, Rectangle, TileLayer, Tooltip, useMap } from "react-leaflet";

import { useRealtimeCityData } from "@/components/realtime-city-provider";
import { useTheme } from "@/components/theme-provider";
import { healthRiskColor, HealthRiskCell } from "@/lib/health-intelligence";

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

export function HealthRiskMap({ cells }: { cells: HealthRiskCell[] }) {
  const { resolvedTheme } = useTheme();
  const { selectedLocation } = useRealtimeCityData();
  const center =
    cells.length > 0
      ? ([cells.reduce((sum, cell) => sum + cell.latitude, 0) / cells.length, cells.reduce((sum, cell) => sum + cell.longitude, 0) / cells.length] as [number, number])
      : ([12.9637, 77.6028] as [number, number]);

  return (
    <MapContainer center={center} zoom={13} scrollWheelZoom className="h-[480px] w-full rounded-[28px]">
      <MapViewport center={center} bounds={selectedLocation?.bounds} />
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
      {cells.map((cell) => (
        <CircleMarker
          key={cell.cell_id}
          center={[cell.latitude, cell.longitude]}
          radius={cell.overall_health_risk === "critical" ? 20 : cell.overall_health_risk === "high" ? 18 : 15}
          pathOptions={{
            color: cell.elderlyRiskZone ? "#b91c1c" : healthRiskColor(cell.overall_health_risk),
            fillColor: healthRiskColor(cell.overall_health_risk),
            fillOpacity: 0.72,
            weight: cell.elderlyRiskZone ? 4 : cell.childRiskZone ? 3 : 1.5
          }}
          className={cell.overall_health_risk === "critical" ? "animate-pulse" : undefined}
        >
          <Tooltip direction="top" sticky>
            <div className="space-y-1 text-xs">
              <div className="font-semibold">Zone {cell.cell_id}</div>
              <div>Health risk: {cell.overall_health_risk}</div>
              <div>Heat stroke: {cell.heat_stroke_risk}</div>
            </div>
          </Tooltip>
          <Popup>
            <div className="space-y-1 text-sm">
              <div className="font-semibold">Zone {cell.cell_id}</div>
              <div>Overall health risk: {cell.overall_health_risk}</div>
              <div>Heat stroke risk: {cell.heat_stroke_risk}</div>
              <div>Respiratory risk: {cell.respiratory_risk}</div>
              <div>Elderly risk: {cell.elderly_risk}</div>
              <div>Child risk: {cell.child_risk}</div>
              <div>Hospitals: {cell.hospitals}</div>
              <div>Capacity: {cell.hospital_capacity}</div>
              {cell.elderlyRiskZone ? <div className="font-medium text-red-600">Elderly Risk Zone</div> : null}
              {cell.childRiskZone ? <div className="font-medium text-orange-600">Child Heat Risk Zone</div> : null}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
