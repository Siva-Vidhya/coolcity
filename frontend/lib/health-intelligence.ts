import { HeatCell } from "@/lib/types";

const OPENWEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

export type HealthRiskLevel = "low" | "moderate" | "high" | "critical";

export type HealthRiskCell = HeatCell & {
  humidity: number;
  elderly_population: number;
  children_population: number;
  pollution_index: number;
  hospitals: number;
  hospital_capacity: "Low" | "Medium" | "High";
  heat_stroke_risk: HealthRiskLevel;
  respiratory_risk: HealthRiskLevel;
  elderly_risk: HealthRiskLevel;
  child_risk: HealthRiskLevel;
  overall_health_risk: HealthRiskLevel;
  risk_trend: "Increasing" | "Decreasing";
  elderlyRiskZone: boolean;
  childRiskZone: boolean;
  respiratoryRiskHigh: boolean;
  population_at_risk: number;
};

export type LiveHealthSignals = {
  temperature: number;
  humidity: number;
  aqi: number;
  source: string;
};

const riskRank: Record<HealthRiskLevel, number> = {
  low: 1,
  moderate: 2,
  high: 3,
  critical: 4
};

function levelFromScore(score: number): HealthRiskLevel {
  if (score >= 82) return "critical";
  if (score >= 67) return "high";
  if (score >= 48) return "moderate";
  return "low";
}

function maxRisk(...levels: HealthRiskLevel[]) {
  return levels.sort((a, b) => riskRank[b] - riskRank[a])[0];
}

export function healthRiskTone(level: HealthRiskLevel) {
  if (level === "critical") return "border-red-300 bg-red-50 text-red-700";
  if (level === "high") return "border-orange-300 bg-orange-50 text-orange-700";
  if (level === "moderate") return "border-amber-300 bg-amber-50 text-amber-700";
  return "border-emerald-300 bg-emerald-50 text-emerald-700";
}

export function healthRiskColor(level: HealthRiskLevel) {
  if (level === "critical") return "#dc2626";
  if (level === "high") return "#f97316";
  if (level === "moderate") return "#facc15";
  return "#22c55e";
}

export function calculateHealthRisk({
  temperature,
  humidity,
  aqi,
  populationDensity,
  elderlyPopulation,
  childrenPopulation,
  trendDelta
}: {
  temperature: number;
  humidity: number;
  aqi: number;
  populationDensity: number;
  elderlyPopulation: number;
  childrenPopulation: number;
  trendDelta: number;
}) {
  const heatStrokeRisk =
    temperature > 38 && humidity > 68
      ? ("critical" as HealthRiskLevel)
      : temperature > 35 && humidity > 60
        ? ("high" as HealthRiskLevel)
        : temperature >= 33
          ? ("moderate" as HealthRiskLevel)
          : ("low" as HealthRiskLevel);

  const respiratoryRisk =
    aqi > 140 && temperature > 35
      ? ("critical" as HealthRiskLevel)
      : aqi > 100 && temperature > 33
        ? ("high" as HealthRiskLevel)
        : aqi > 80
          ? ("moderate" as HealthRiskLevel)
          : ("low" as HealthRiskLevel);

  const elderlyScore = temperature * 1.4 + humidity * 0.3 + populationDensity / 260 + elderlyPopulation / 140;
  const childScore = temperature * 1.2 + humidity * 0.22 + childrenPopulation / 130;
  const elderlyRisk = levelFromScore(elderlyScore);
  const childRisk = levelFromScore(childScore);
  const overallRisk = maxRisk(heatStrokeRisk, respiratoryRisk, elderlyRisk, childRisk);

  return {
    heatStrokeRisk,
    respiratoryRisk,
    elderlyRisk,
    childRisk,
    overallRisk,
    riskTrend: (trendDelta > 0.4 ? "Increasing" : "Decreasing") as HealthRiskCell["risk_trend"]
  };
}

export async function fetchLiveHealthSignals(
  center: { latitude: number; longitude: number },
  fallback: { temperature: number; humidity: number; aqi: number }
): Promise<LiveHealthSignals> {
  if (!OPENWEATHER_API_KEY) {
    const now = Date.now();
    return {
      temperature: Number((fallback.temperature + Math.sin(now / 240000) * 0.9).toFixed(1)),
      humidity: Math.round(fallback.humidity + Math.cos(now / 260000) * 4),
      aqi: Math.round(fallback.aqi + Math.sin(now / 220000) * 10),
      source: "Simulation fallback"
    };
  }

  const query = new URLSearchParams({
    lat: String(center.latitude),
    lon: String(center.longitude),
    units: "metric",
    appid: OPENWEATHER_API_KEY
  });

  try {
    const [weatherResponse, aqiResponse] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?${query.toString()}`, { cache: "no-store" }),
      fetch(`https://api.openweathermap.org/data/2.5/air_pollution?${query.toString()}`, { cache: "no-store" })
    ]);

    if (!weatherResponse.ok || !aqiResponse.ok) {
      return { ...fallback, source: "Simulation fallback" };
    }

    const weather = await weatherResponse.json();
    const air = await aqiResponse.json();
    const pm25 = air.list?.[0]?.components?.pm2_5 ?? 30;

    return {
      temperature: Number(weather.main.temp.toFixed(1)),
      humidity: weather.main.humidity,
      aqi: Math.round(Math.max(30, Math.min(180, pm25 * 2.4))),
      source: "OpenWeather APIs"
    };
  } catch {
    return { ...fallback, source: "Simulation fallback" };
  }
}

export function buildHealthRiskCells(cells: HeatCell[], liveSignals: LiveHealthSignals, trendDelta = 0) {
  const averageTemperature = cells.reduce((sum, cell) => sum + cell.current_temperature, 0) / cells.length;

  return cells.map((cell, index) => {
    const localTemperature = Number((cell.current_temperature + (liveSignals.temperature - averageTemperature) * 0.6 + (index % 4 === 0 ? 0.4 : 0)).toFixed(1));
    const humidity = Math.round(Math.max(42, Math.min(82, liveSignals.humidity + (index % 4) * 3 - cell.tree_cover * 16)));
    const elderlyPopulation = Math.round(cell.population_density * (0.09 + (index % 5) * 0.012));
    const childrenPopulation = Math.round(cell.population_density * (0.13 + (index % 4) * 0.01));
    const pollutionIndex = Math.round(Math.max(28, Math.min(180, liveSignals.aqi + cell.built_density * 14 + (index % 5) * 6)));
    const hospitals = (index % 3) + 1;
    const hospitalCapacity: HealthRiskCell["hospital_capacity"] = hospitals >= 3 ? "High" : hospitals === 2 ? "Medium" : "Low";

    const risks = calculateHealthRisk({
      temperature: localTemperature,
      humidity,
      aqi: pollutionIndex,
      populationDensity: cell.population_density,
      elderlyPopulation,
      childrenPopulation,
      trendDelta
    });
    const elderlyRiskZone = cell.population_density > 9800 && localTemperature > 35;
    const childRiskZone = (index % 2 === 0 || index % 5 === 0) && localTemperature > 34.5;
    const respiratoryRiskHigh = localTemperature > 33 && pollutionIndex > 100;
    const populationAtRisk = elderlyPopulation + childrenPopulation + Math.round(cell.population_density * 0.18);

    return {
      ...cell,
      current_temperature: localTemperature,
      humidity,
      elderly_population: elderlyPopulation,
      children_population: childrenPopulation,
      pollution_index: pollutionIndex,
      hospitals,
      hospital_capacity: hospitalCapacity,
      heat_stroke_risk: risks.heatStrokeRisk,
      respiratory_risk: risks.respiratoryRisk,
      elderly_risk: risks.elderlyRisk,
      child_risk: risks.childRisk,
      overall_health_risk: risks.overallRisk,
      risk_trend: risks.riskTrend,
      elderlyRiskZone,
      childRiskZone,
      respiratoryRiskHigh,
      population_at_risk: populationAtRisk
    };
  });
}

export function summarizeHealthRisk(cells: HealthRiskCell[]) {
  const highestRiskCell = [...cells].sort((a, b) => riskRank[b.overall_health_risk] - riskRank[a.overall_health_risk])[0];
  const totalPopulationAtRisk = cells.reduce((sum, cell) => sum + cell.population_at_risk, 0);
  const totalElderlyAtRisk = cells.reduce((sum, cell) => sum + cell.elderly_population, 0);
  const totalChildrenAtRisk = cells.reduce((sum, cell) => sum + cell.children_population, 0);

  return {
    highestRiskCell,
    totalPopulationAtRisk,
    totalElderlyAtRisk,
    totalChildrenAtRisk,
    criticalZones: cells.filter((cell) => cell.overall_health_risk === "critical").length,
    highZones: cells.filter((cell) => cell.overall_health_risk === "high").length
  };
}

export function suggestedHealthActions(level: HealthRiskLevel) {
  if (level === "critical") {
    return ["Open Cooling Centers", "Provide Drinking Water", "Emergency Shade", "Medical Readiness", "Public Health Alerts"];
  }
  if (level === "high") {
    return ["Open Cooling Centers", "Deploy Water Stations", "Emergency Alerts", "Shade Corridors"];
  }
  if (level === "moderate") {
    return ["Hydration kiosks", "Targeted cooling outreach", "Heat awareness messaging"];
  }
  return ["Routine monitoring", "Community health awareness"];
}
