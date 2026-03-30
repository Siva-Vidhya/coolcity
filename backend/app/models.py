from typing import Dict, List

from pydantic import BaseModel, Field


class HeatCell(BaseModel):
    cell_id: int
    latitude: float
    longitude: float
    baseline_temperature: float
    current_temperature: float
    tree_cover: float
    population_density: int
    built_density: float
    heat_zone: str


class HeatDataResponse(BaseModel):
    city: str
    cells: List[HeatCell]
    summary: Dict[str, float]


class InterventionSelection(BaseModel):
    trees: int = Field(default=0, ge=0)
    cool_roofs: int = Field(default=0, ge=0)
    green_walls: int = Field(default=0, ge=0)
    water_bodies: int = Field(default=0, ge=0)


class SimulationRequest(BaseModel):
    city: str = "CoolCity Demo"
    interventions: InterventionSelection


class OptimizationRequest(BaseModel):
    budget: float = Field(ge=0)
    currency: str = Field(default="INR")
    city: str = "CoolCity Demo"


class Recommendation(BaseModel):
    strategy: str
    units: int
    spend: float
    estimated_reduction: float
    impact_score: float


class SimulationResponse(BaseModel):
    city: str
    before: List[HeatCell]
    after: List[HeatCell]
    interventions: Dict[str, int]
    total_cost: float
    avg_temperature_drop: float
    max_temperature_drop: float
    impacted_population: int
    climate_score_before: float
    climate_score_after: float
    charts: Dict[str, List[Dict[str, float | str]]]
    recommendations: List[Recommendation]


class OptimizationResponse(BaseModel):
    city: str
    budget: float
    currency: str
    recommendations: List[Recommendation]
    total_spend: float
    remaining_budget: float
    projected_temperature_drop: float
    projected_climate_score_gain: float
