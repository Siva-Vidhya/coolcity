import { HeatCell } from "@/lib/types";

export type AlertSeverity = "low" | "medium" | "high";
export type AlertType = "heat" | "health" | "pollution" | "rapid_rise";

export type HeatAlert = {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  severity: AlertSeverity;
  area: string;
  temperature: number;
  heatIndex: number;
  aqi: number;
  rapidIncrease: number;
  suggestedActions: string[];
  createdAt: string;
  cellIds: number[];
};

type TemperatureSample = {
  value: number;
  timestamp: number;
};

const ACTIONS: Record<AlertType, string[]> = {
  heat: ["Activate cooling crews", "Open water stations", "Increase shade deployment"],
  health: ["Open cooling centers", "Issue public health advisories", "Support vulnerable residents"],
  pollution: ["Reduce exposure outdoors", "Issue respiratory health guidance", "Monitor sensitive groups"],
  rapid_rise: ["Pre-stage response teams", "Prepare emergency cooling", "Increase live monitoring cadence"]
};

export function computeHeatIndex(temperature: number, humidity: number) {
  return Number((temperature + 0.33 * humidity / 10 - 0.7 * 4 - 4).toFixed(1));
}

export function computeHeatScore(cell: HeatCell) {
  return Math.round(
    Math.max(
      0,
      Math.min(100, cell.current_temperature * 1.65 + cell.population_density / 260 - cell.tree_cover * 60 + cell.built_density * 14)
    )
  );
}

export function pruneTemperatureSamples(samples: TemperatureSample[], maxAgeMs = 10 * 60 * 1000) {
  const cutoff = Date.now() - maxAgeMs;
  return samples.filter((sample) => sample.timestamp >= cutoff);
}

function severityForHeat(temperature: number, heatIndex: number) {
  if (temperature > 38 || heatIndex > 41) return "high";
  if (temperature > 35 || heatIndex > 38) return "medium";
  return "low";
}

function severityForPollution(aqi: number): AlertSeverity {
  if (aqi > 150) return "high";
  if (aqi > 100) return "medium";
  return "low";
}

function dedupeId(type: AlertType, area: string) {
  return `${type}:${area}`.toLowerCase().replace(/\s+/g, "-");
}

export function evaluateAlertEngine({
  cityLabel,
  weatherTemperature,
  humidity,
  aqi,
  cells,
  samples
}: {
  cityLabel: string;
  weatherTemperature: number;
  humidity: number;
  aqi: number;
  cells: HeatCell[];
  samples: TemperatureSample[];
}) {
  const heatIndex = computeHeatIndex(weatherTemperature, humidity);
  const oldestSample = samples[0];
  const rapidIncrease = oldestSample ? Number((weatherTemperature - oldestSample.value).toFixed(1)) : 0;
  const hotspotCells = [...cells]
    .map((cell) => ({
      cell,
      heatScore: computeHeatScore(cell)
    }))
    .filter((item) => item.cell.current_temperature > 35 || item.heatScore > 80)
    .sort((a, b) => b.heatScore - a.heatScore)
    .slice(0, 3);

  const now = new Date().toISOString();
  const alerts: HeatAlert[] = [];

  if (weatherTemperature > 35 || heatIndex > 38) {
    const severity = severityForHeat(weatherTemperature, heatIndex);
    alerts.push({
      id: dedupeId("heat", cityLabel),
      type: "heat",
      title: `${cityLabel} High Heat Alert`,
      message: `Temperature is ${weatherTemperature} deg C and heat index is ${heatIndex} deg C. Immediate cooling response is recommended.`,
      severity,
      area: cityLabel,
      temperature: weatherTemperature,
      heatIndex,
      aqi,
      rapidIncrease,
      suggestedActions: ACTIONS.heat,
      createdAt: now,
      cellIds: hotspotCells.map((item) => item.cell.cell_id)
    });
  }

  if (rapidIncrease > 2) {
    alerts.push({
      id: dedupeId("rapid_rise", cityLabel),
      type: "rapid_rise",
      title: `${cityLabel} Rapid Heat Rise Alert`,
      message: `Temperature increased by ${rapidIncrease} deg C within the last 10 minutes.`,
      severity: rapidIncrease > 3 ? "high" : "medium",
      area: cityLabel,
      temperature: weatherTemperature,
      heatIndex,
      aqi,
      rapidIncrease,
      suggestedActions: ACTIONS.rapid_rise,
      createdAt: now,
      cellIds: hotspotCells.map((item) => item.cell.cell_id)
    });
  }

  if (aqi > 100) {
    const severity = severityForPollution(aqi);
    alerts.push({
      id: dedupeId("pollution", cityLabel),
      type: "pollution",
      title: severity === "high" ? `${cityLabel} High Pollution Alert` : `${cityLabel} Pollution Watch`,
      message: `AQI is ${aqi}. Outdoor exposure risk is elevated${severity === "high" ? " and action is required" : ""}.`,
      severity,
      area: cityLabel,
      temperature: weatherTemperature,
      heatIndex,
      aqi,
      rapidIncrease,
      suggestedActions: ACTIONS.pollution,
      createdAt: now,
      cellIds: hotspotCells.map((item) => item.cell.cell_id)
    });
  }

  if (weatherTemperature > 35 && humidity > 60) {
    alerts.push({
      id: dedupeId("health", cityLabel),
      type: "health",
      title: `${cityLabel} Heat Stroke Risk Alert`,
      message: `High heat and humidity (${humidity}%) are increasing heat stroke risk for vulnerable residents.`,
      severity: heatIndex > 40 ? "high" : "medium",
      area: cityLabel,
      temperature: weatherTemperature,
      heatIndex,
      aqi,
      rapidIncrease,
      suggestedActions: ACTIONS.health,
      createdAt: now,
      cellIds: hotspotCells.map((item) => item.cell.cell_id)
    });
  }

  const activeAlerts = alerts.sort((a, b) => {
    const severityRank = { high: 3, medium: 2, low: 1 };
    return severityRank[b.severity] - severityRank[a.severity];
  });

  return {
    activeAlerts,
    hotspotCellIds: hotspotCells.map((item) => item.cell.cell_id),
    heatIndex,
    rapidIncrease
  };
}
