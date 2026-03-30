"use client";

import "leaflet/dist/leaflet.css";

import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

import { HeatCell } from "@/lib/types";

function colorForZone(zone: HeatCell["heat_zone"]) {
  if (zone === "high") return "#ef4444";
  if (zone === "medium") return "#f59e0b";
  return "#16a34a";
}

export function LeafletMap({ cells }: { cells: HeatCell[] }) {
  return (
    <MapContainer center={[12.9637, 77.6028]} zoom={13} scrollWheelZoom className="h-[430px] w-full rounded-[28px]">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {cells.map((cell) => (
        <CircleMarker
          key={cell.cell_id}
          center={[cell.latitude, cell.longitude]}
          radius={16}
          pathOptions={{
            color: colorForZone(cell.heat_zone),
            fillColor: colorForZone(cell.heat_zone),
            fillOpacity: 0.45,
            weight: 1
          }}
        >
          <Popup>
            <div className="space-y-1 text-sm">
              <div className="font-semibold">Zone {cell.cell_id}</div>
              <div>Temperature: {cell.current_temperature} deg C</div>
              <div>Tree cover: {Math.round(cell.tree_cover * 100)}%</div>
              <div>Population density: {cell.population_density}</div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
