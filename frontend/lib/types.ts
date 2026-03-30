export type HeatCell = {
  cell_id: number;
  latitude: number;
  longitude: number;
  baseline_temperature: number;
  current_temperature: number;
  tree_cover: number;
  population_density: number;
  built_density: number;
  heat_zone: "high" | "medium" | "low";
};

export type HeatDataResponse = {
  city: string;
  cells: HeatCell[];
  summary: {
    average_temperature: number;
    high_heat_cells: number;
    medium_heat_cells: number;
    low_heat_cells: number;
    avg_tree_cover: number;
    avg_population_density: number;
    climate_score: number;
  };
};

export type Recommendation = {
  strategy: string;
  units: number;
  spend: number;
  estimated_reduction: number;
  impact_score: number;
};

export type SimulationResponse = {
  city: string;
  before: HeatCell[];
  after: HeatCell[];
  interventions: Record<string, number>;
  total_cost: number;
  avg_temperature_drop: number;
  max_temperature_drop: number;
  impacted_population: number;
  climate_score_before: number;
  climate_score_after: number;
  charts: {
    temperature_reduction: { name: string; reduction: number }[];
    budget_allocation: { name: string; value: number }[];
    impact_comparison: { name: string; score: number }[];
  };
  recommendations: Recommendation[];
};

export type OptimizationResponse = {
  city: string;
  budget: number;
  currency: string;
  recommendations: Recommendation[];
  total_spend: number;
  remaining_budget: number;
  projected_temperature_drop: number;
  projected_climate_score_gain: number;
};
