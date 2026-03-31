"use client";

import "leaflet/dist/leaflet.css";

import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, Rectangle, TileLayer, useMap } from "react-leaflet";

import { useHeatAlerts } from "@/components/heat-alert-provider";
import { useRealtimeCityData } from "@/components/realtime-city-provider";
import { useTheme } from "@/components/theme-provider";
import { HeatCell } from "@/lib/types";

function colorForZone(zone: HeatCell["heat_zone"]) {
  if (zone === "high") return "#ef4444";
  if (zone === "medium") return "#f59e0b";
  return "#16a34a";
}

function densityRadius(populationDensity: number) {
  if (populationDensity >= 12000) return 20;
  if (populationDensity >= 9000) return 17;
  return 14;
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

export function LeafletMap({
  cells,
  mode = "heat",
  highlightedCellIds = [],
  adoptedCellIds = []
}: {
  cells: HeatCell[];
  mode?: "heat" | "density";
  highlightedCellIds?: number[];
  adoptedCellIds?: number[];
}) {
  const { resolvedTheme } = useTheme();
  const { selectedLocation } = useRealtimeCityData();
  const { hotspotCellIds: globalHotspotCellIds } = useHeatAlerts();
  const activeHotspots = highlightedCellIds.length ? highlightedCellIds : globalHotspotCellIds;
  const center =
    cells.length > 0
      ? ([cells.reduce((sum, cell) => sum + cell.latitude, 0) / cells.length, cells.reduce((sum, cell) => sum + cell.longitude, 0) / cells.length] as [number, number])
      : ([12.9637, 77.6028] as [number, number]);

  return (
    <MapContainer center={center} zoom={13} scrollWheelZoom className="h-[430px] w-full rounded-[28px]">
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
        <Rectangle bounds={selectedLocation.bounds} pathOptions={{ color: "#0EA5A4", weight: 2, fillOpacity: 0.04 }} />
      ) : null}
      {cells.map((cell) => (
        <CircleMarker
          key={cell.cell_id}
          center={[cell.latitude, cell.longitude]}
          radius={(mode === "density" ? densityRadius(cell.population_density) : 16) + (activeHotspots.includes(cell.cell_id) ? 4 : 0)}
          pathOptions={{
            color: adoptedCellIds.includes(cell.cell_id) ? "#22c55e" : colorForZone(cell.heat_zone),
            fillColor: adoptedCellIds.includes(cell.cell_id) ? "#22c55e" : colorForZone(cell.heat_zone),
            fillOpacity: adoptedCellIds.includes(cell.cell_id) ? 0.78 : activeHotspots.includes(cell.cell_id) ? 0.9 : mode === "density" ? 0.58 : 0.45,
            weight: adoptedCellIds.includes(cell.cell_id) ? 4 : activeHotspots.includes(cell.cell_id) ? 3 : 1
          }}
          className={activeHotspots.includes(cell.cell_id) ? "animate-pulse" : undefined}
        >
          <Popup>
            <div className="space-y-1 text-sm">
              <div className="font-semibold">Zone {cell.cell_id}</div>
              {adoptedCellIds.includes(cell.cell_id) ? <div className="font-medium text-emerald-600">Citizen adopted zone</div> : null}
              {activeHotspots.includes(cell.cell_id) ? <div className="font-medium text-red-600">Hotspot detected</div> : null}
              <div>Temperature: {cell.current_temperature} deg C</div>
              <div>Tree cover: {Math.round(cell.tree_cover * 100)}%</div>
              <div>Population density: {cell.population_density}</div>
              <div>View: {mode === "density" ? "Density map" : "Heat map"}</div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
