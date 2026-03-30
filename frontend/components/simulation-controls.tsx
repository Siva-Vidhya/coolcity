"use client";

import { Dispatch, SetStateAction } from "react";

export type Interventions = {
  trees: number;
  cool_roofs: number;
  green_walls: number;
  water_bodies: number;
};

const controls = [
  { key: "trees", label: "Plant Trees", step: 100, max: 1000, helper: "-1.5 deg C per 100 trees" },
  { key: "cool_roofs", label: "Cool Roofs", step: 50, max: 300, helper: "-2.0 deg C per 50 buildings" },
  { key: "green_walls", label: "Green Walls", step: 20, max: 120, helper: "-0.8 deg C per 20 corridors" },
  { key: "water_bodies", label: "Water Bodies", step: 5, max: 25, helper: "-2.5 deg C per 5 installations" }
] as const;

export function SimulationControls({
  interventions,
  setInterventions
}: {
  interventions: Interventions;
  setInterventions: Dispatch<SetStateAction<Interventions>>;
}) {
  return (
    <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-panel">
      <h3 className="text-lg font-semibold text-slate-950">Simulation Controls</h3>
      <p className="mt-2 text-sm text-slate-500">Tune intervention quantities and simulate city-wide temperature reduction.</p>
      <div className="mt-5 space-y-4">
        {controls.map((control) => (
          <div key={control.key} className="rounded-3xl bg-slate-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-900">{control.label}</div>
                <div className="text-sm text-slate-500">{control.helper}</div>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-sm text-slate-700">{interventions[control.key]}</div>
            </div>
            <input
              type="range"
              min={0}
              max={control.max}
              step={control.step}
              value={interventions[control.key]}
              className="w-full accent-emerald-700"
              onChange={(event) =>
                setInterventions((prev) => ({
                  ...prev,
                  [control.key]: Number(event.target.value)
                }))
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
