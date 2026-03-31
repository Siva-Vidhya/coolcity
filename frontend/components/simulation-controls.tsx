"use client";

import { Dispatch, SetStateAction } from "react";

export type Interventions = {
  trees: number;
  cool_roofs: number;
  green_walls: number;
  urban_parks: number;
  water_bodies: number;
};

const controls = [
  { key: "trees", label: "Plant Trees", step: 100, max: 1000, helper: "-1.5 deg C per 100 trees" },
  { key: "cool_roofs", label: "Cool Roofs", step: 50, max: 500, helper: "-2.0 deg C per 50 buildings" },
  { key: "green_walls", label: "Green Walls", step: 20, max: 200, helper: "-0.8 deg C per 20 corridors" },
  { key: "urban_parks", label: "Urban Parks", step: 5, max: 50, helper: "-1.1 deg C per 5 park zones" },
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
    <div className="glass-card-strong rounded-[28px] bg-gradient-to-br from-white/92 via-white/80 to-cyan-50/72 p-5 dark:from-slate-900/92 dark:via-slate-900/82 dark:to-slate-800/75">
      <h3 className="text-lg font-semibold text-slate-950">Simulation Controls</h3>
      <p className="mt-2 text-sm text-slate-500">Tune intervention quantities and simulate city-wide temperature reduction.</p>
      <div className="mt-5 space-y-4">
        {controls.map((control) => (
          <div key={control.key} className="rounded-3xl border border-white/80 bg-white/72 p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-float">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-900">{control.label}</div>
                <div className="text-sm text-slate-500">{control.helper}</div>
              </div>
              <div className="rounded-full border border-cyan-100 bg-cyan-50/80 px-3 py-1 text-sm font-medium text-slate-700">{interventions[control.key]}</div>
            </div>
            <input
              type="range"
              min={0}
              max={control.max}
              step={control.step}
              value={interventions[control.key]}
              className="w-full accent-primary drop-shadow-[0_0_6px_rgba(14,165,164,0.3)]"
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
