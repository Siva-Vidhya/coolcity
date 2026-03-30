from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Dict, Iterable, List

from ..data import classify_heat_zone
from ..models import HeatCell, Recommendation


@dataclass(frozen=True)
class StrategyConfig:
    label: str
    unit_name: str
    bundle_size: int
    temp_reduction: float
    cost: float
    area_coverage: float
    impact_weight: float


STRATEGIES: Dict[str, StrategyConfig] = {
    "trees": StrategyConfig("Plant Trees", "trees", 100, 1.5, 12000, 0.18, 1.00),
    "cool_roofs": StrategyConfig("Cool Roofs", "buildings", 50, 2.0, 45000, 0.16, 1.30),
    "green_walls": StrategyConfig("Green Walls", "corridors", 20, 0.8, 30000, 0.10, 0.75),
    "water_bodies": StrategyConfig("Water Bodies", "installations", 5, 2.5, 80000, 0.22, 1.60),
}


def cell_from_row(row: dict) -> HeatCell:
    return HeatCell(**dict(row))


def summarize_cells(cells: Iterable[HeatCell]) -> Dict[str, float]:
    cell_list = list(cells)
    avg_temp = sum(cell.current_temperature for cell in cell_list) / len(cell_list)
    high_heat = sum(1 for cell in cell_list if cell.heat_zone == "high")
    medium_heat = sum(1 for cell in cell_list if cell.heat_zone == "medium")
    low_heat = sum(1 for cell in cell_list if cell.heat_zone == "low")
    avg_tree_cover = sum(cell.tree_cover for cell in cell_list) / len(cell_list)
    avg_population = sum(cell.population_density for cell in cell_list) / len(cell_list)
    climate_score = compute_climate_score(cell_list)
    return {
        "average_temperature": round(avg_temp, 2),
        "high_heat_cells": high_heat,
        "medium_heat_cells": medium_heat,
        "low_heat_cells": low_heat,
        "avg_tree_cover": round(avg_tree_cover * 100, 1),
        "avg_population_density": round(avg_population, 0),
        "climate_score": climate_score,
    }


def compute_climate_score(cells: Iterable[HeatCell]) -> float:
    cell_list = list(cells)
    avg_temp = sum(cell.current_temperature for cell in cell_list) / len(cell_list)
    avg_tree_cover = sum(cell.tree_cover for cell in cell_list) / len(cell_list)
    avg_population = sum(cell.population_density for cell in cell_list) / len(cell_list)
    avg_built_density = sum(cell.built_density for cell in cell_list) / len(cell_list)

    temp_component = max(0.0, 100 - ((avg_temp - 28) * 7.5))
    green_component = min(100.0, avg_tree_cover * 160)
    density_penalty = min(35.0, (avg_population / 14000) * 25 + avg_built_density * 10)
    score = (temp_component * 0.45) + (green_component * 0.35) + ((100 - density_penalty) * 0.20)
    return round(max(0.0, min(100.0, score)), 1)


def calculate_total_cost(interventions: Dict[str, int]) -> float:
    total = 0.0
    for name, units in interventions.items():
        config = STRATEGIES[name]
        bundles = units / config.bundle_size
        total += bundles * config.cost
    return round(total, 2)


def calculate_reduction_by_strategy(interventions: Dict[str, int]) -> Dict[str, float]:
    result: Dict[str, float] = {}
    for name, units in interventions.items():
        config = STRATEGIES[name]
        if units <= 0:
            result[name] = 0.0
            continue
        bundles = units / config.bundle_size
        result[name] = round(bundles * config.temp_reduction, 2)
    return result


def simulate_heat(cells: List[HeatCell], interventions: Dict[str, int]) -> dict:
    reduction_map = calculate_reduction_by_strategy(interventions)
    total_reduction = sum(reduction_map.values())
    adjusted_cells: List[HeatCell] = []

    for index, cell in enumerate(cells):
        susceptibility = 0.85 + (cell.built_density * 0.15) + ((1 - cell.tree_cover) * 0.12)
        local_bonus = 1 - min(0.25, index / (len(cells) * 12))
        cooling = min(5.5, total_reduction * susceptibility * local_bonus / 4.2)
        new_temp = round(max(29.0, cell.current_temperature - cooling), 2)
        adjusted_cells.append(
            cell.model_copy(
                update={
                    "current_temperature": new_temp,
                    "heat_zone": classify_heat_zone(new_temp),
                }
            )
        )

    avg_drop = round(
        sum(before.current_temperature - after.current_temperature for before, after in zip(cells, adjusted_cells))
        / len(cells),
        2,
    )
    max_drop = round(
        max(before.current_temperature - after.current_temperature for before, after in zip(cells, adjusted_cells)),
        2,
    )
    impacted_population = sum(cell.population_density for cell in adjusted_cells if cell.heat_zone != "high")
    before_score = compute_climate_score(cells)
    after_score = compute_climate_score(adjusted_cells)

    recommendations = [
        Recommendation(
            strategy=STRATEGIES[name].label,
            units=units,
            spend=round((units / STRATEGIES[name].bundle_size) * STRATEGIES[name].cost, 2),
            estimated_reduction=reduction_map[name],
            impact_score=round(reduction_map[name] * STRATEGIES[name].impact_weight * 10, 1),
        )
        for name, units in interventions.items()
        if units > 0
    ]

    chart_data = {
        "temperature_reduction": [
            {"name": STRATEGIES[name].label, "reduction": reduction_map[name]}
            for name in STRATEGIES
        ],
        "budget_allocation": [
            {
                "name": STRATEGIES[name].label,
                "value": round((interventions[name] / STRATEGIES[name].bundle_size) * STRATEGIES[name].cost, 2),
            }
            for name in STRATEGIES
            if interventions[name] > 0
        ],
        "impact_comparison": [
            {"name": "Before", "score": before_score},
            {"name": "After", "score": after_score},
        ],
    }

    return {
        "before": cells,
        "after": adjusted_cells,
        "interventions": interventions,
        "total_cost": calculate_total_cost(interventions),
        "avg_temperature_drop": avg_drop,
        "max_temperature_drop": max_drop,
        "impacted_population": impacted_population,
        "climate_score_before": before_score,
        "climate_score_after": after_score,
        "charts": chart_data,
        "recommendations": recommendations,
    }


def optimize_budget(budget: float) -> dict:
    remaining = budget
    recommendations: List[Recommendation] = []
    temperature_gain = 0.0
    climate_gain = 0.0

    ranked_strategies = sorted(
        STRATEGIES.items(),
        key=lambda item: (item[1].temp_reduction * item[1].impact_weight) / item[1].cost,
        reverse=True,
    )

    diversified: Dict[str, int] = {name: 0 for name in STRATEGIES}

    for name, config in ranked_strategies[:3]:
        if remaining >= config.cost:
            diversified[name] += config.bundle_size
            remaining -= config.cost

    while True:
        candidate_name = None
        candidate_score = 0.0
        for name, config in ranked_strategies:
            if remaining < config.cost:
                continue
            already_spend = (diversified[name] / config.bundle_size) * config.cost
            if already_spend > budget * 0.55:
                continue
            marginal_score = (config.temp_reduction * config.impact_weight) / config.cost
            if marginal_score > candidate_score:
                candidate_name = name
                candidate_score = marginal_score
        if not candidate_name:
            break
        diversified[candidate_name] += STRATEGIES[candidate_name].bundle_size
        remaining -= STRATEGIES[candidate_name].cost

    for name, config in ranked_strategies:
        units = diversified[name]
        if units <= 0:
            continue
        bundles = math.floor(units / config.bundle_size)
        spend = round(bundles * config.cost, 2)
        reduction = round(bundles * config.temp_reduction, 2)
        impact_score = round(reduction * config.impact_weight * 10, 1)
        recommendations.append(
            Recommendation(
                strategy=config.label,
                units=units,
                spend=spend,
                estimated_reduction=reduction,
                impact_score=impact_score,
            )
        )
        temperature_gain += reduction / 3.5
        climate_gain += reduction * config.impact_weight * 2.1

    return {
        "recommendations": recommendations,
        "total_spend": round(budget - remaining, 2),
        "remaining_budget": round(remaining, 2),
        "projected_temperature_drop": round(temperature_gain, 2),
        "projected_climate_score_gain": round(min(28.0, climate_gain), 1),
    }
