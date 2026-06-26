import { HeatDataResponse, OptimizationResponse, SimulationResponse } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`API request failed for ${path}`);
  }

  return response.json() as Promise<T>;
}

export function getHeatData() {
  return request<HeatDataResponse>("/heat-data");
}

export function runSimulation(interventions: Record<string, number>) {
  return request<SimulationResponse>("/simulate", {
    method: "POST",
    body: JSON.stringify({
      city: "CoolCity Demo",
      interventions
    })
  });
}

export function optimizeBudget(budget: number, currency: string) {
  return request<OptimizationResponse>("/optimize", {
    method: "POST",
    body: JSON.stringify({
      budget,
      currency,
      city: "CoolCity Demo"
    })
  });
}

export function reportUrl(interventions: Record<string, number>, budget: number, currency: string) {
  const query = new URLSearchParams({
    city: "CoolCity Demo",
    budget: String(budget),
    currency,
    trees: String(interventions.trees ?? 0),
    cool_roofs: String(interventions.cool_roofs ?? 0),
    green_walls: String(interventions.green_walls ?? 0),
    water_bodies: String(interventions.water_bodies ?? 0)
  });

  return `${API_URL}/report?${query.toString()}`;
}
