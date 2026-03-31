import { HeatCell } from "@/lib/types";

export type AlertSeverity = "low" | "medium" | "high";

export type HeatAlert = {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  area: string;
  temperature: number;
  heatScore: number;
  rapidIncrease: number;
  predicted: boolean;
  suggestedActions: string[];
  createdAt: string;
  cellIds: number[];
};

const ACTIONS_BY_SEVERITY: Record<AlertSeverity, string[]> = {
  low: ["Increase shade coverage", "Monitor local heat pockets", "Prepare mobile cooling teams"],
  medium: ["Deploy temporary shade structures", "Activate water sprinklers", "Prioritize hotspot cooling patrols"],
  high: ["Deploy temporary shade structures", "Activate water sprinklers", "Emergency tree plantation", "Cool roof deployment"]
};

export function computeHeatScore(cell: HeatCell, liveTemperature: number) {
  return Math.round(
    Math.max(
      0,
      Math.min(100, liveTemperature * 1.65 + cell.population_density / 260 - cell.tree_cover * 60 + cell.built_density * 14)
    )
  );
}

function severityFromSignals(temperature: number, heatScore: number, rapidIncrease: number): AlertSeverity {
  if (temperature > 36 || heatScore > 88 || rapidIncrease > 2.5) return "high";
  if (temperature >= 33 || heatScore > 80 || rapidIncrease > 2) return "medium";
  return "low";
}

export function detectHeatAlerts({
  city,
  weatherTemperature,
  cells,
  previousTemperatures
}: {
  city: string;
  weatherTemperature: number;
  cells: HeatCell[];
  previousTemperatures: number[];
}) {
  const lastTemperature = previousTemperatures.at(-1) ?? weatherTemperature;
  const previousAverage = previousTemperatures.length
    ? previousTemperatures.reduce((sum, value) => sum + value, 0) / previousTemperatures.length
    : weatherTemperature;
  const rapidIncrease = Number((weatherTemperature - lastTemperature).toFixed(1));
  const predictedIncrease = Number((weatherTemperature - previousAverage).toFixed(1));
  const hottestCells = [...cells]
    .map((cell) => ({
      cell,
      liveTemperature: Number((cell.current_temperature + (weatherTemperature - 34) * 0.22).toFixed(1)),
      heatScore: computeHeatScore(cell, Number((cell.current_temperature + (weatherTemperature - 34) * 0.22).toFixed(1)))
    }))
    .sort((a, b) => b.heatScore - a.heatScore);

  const hotspot = hottestCells[0];
  const hotspotCells = hottestCells.filter((item) => item.heatScore >= 80 || item.liveTemperature > 35).slice(0, 3);
  const severity = severityFromSignals(hotspot?.liveTemperature ?? weatherTemperature, hotspot?.heatScore ?? 0, rapidIncrease);
  const shouldTrigger =
    weatherTemperature > 35 || (hotspot?.heatScore ?? 0) > 80 || rapidIncrease > 2;
  const predictive = predictedIncrease > 1.2;

  if (!shouldTrigger && !predictive) {
    return { activeAlerts: [] as HeatAlert[], hotspotCellIds: [] as number[] };
  }

  const now = new Date().toISOString();
  const alerts: HeatAlert[] = [];

  if (hotspot) {
    alerts.push({
      id: `${city.toLowerCase()}-hotspot-${hotspot.cell.cell_id}-${now}`,
      title: severity === "high" ? "High Heat Alert" : severity === "medium" ? "Heat Watch" : "Heat Advisory",
      message: `Temperature rising in ${city} Zone ${hotspot.cell.cell_id}. Immediate cooling recommended.`,
      severity,
      area: `Zone ${hotspot.cell.cell_id}`,
      temperature: hotspot.liveTemperature,
      heatScore: hotspot.heatScore,
      rapidIncrease,
      predicted: false,
      suggestedActions: ACTIONS_BY_SEVERITY[severity],
      createdAt: now,
      cellIds: hotspotCells.map((item) => item.cell.cell_id)
    });
  }

  if (predictive) {
    alerts.push({
      id: `${city.toLowerCase()}-predictive-${now}`,
      title: "Predictive Heat Alert",
      message: `Heat risk expected in 2 hours across ${city}. Prepare cooling response teams now.`,
      severity: severity === "high" ? "high" : "medium",
      area: hotspot ? `Zone ${hotspot.cell.cell_id}` : city,
      temperature: Number((weatherTemperature + 1.2).toFixed(1)),
      heatScore: Math.min(100, (hotspot?.heatScore ?? 72) + 6),
      rapidIncrease: predictedIncrease,
      predicted: true,
      suggestedActions: ACTIONS_BY_SEVERITY[severity === "low" ? "medium" : severity],
      createdAt: now,
      cellIds: hotspotCells.map((item) => item.cell.cell_id)
    });
  }

  return {
    activeAlerts: alerts,
    hotspotCellIds: hotspotCells.map((item) => item.cell.cell_id)
  };
}
