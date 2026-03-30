from app.models import HeatCell
from app.services.simulation import compute_climate_score, optimize_budget, simulate_heat


def sample_cells() -> list[HeatCell]:
    return [
        HeatCell(
            cell_id=1,
            latitude=12.0,
            longitude=77.0,
            baseline_temperature=38.0,
            current_temperature=38.0,
            tree_cover=0.08,
            population_density=10000,
            built_density=0.9,
            heat_zone="high",
        ),
        HeatCell(
            cell_id=2,
            latitude=12.1,
            longitude=77.1,
            baseline_temperature=35.5,
            current_temperature=35.5,
            tree_cover=0.12,
            population_density=8400,
            built_density=0.8,
            heat_zone="medium",
        ),
    ]


def test_simulation_reduces_temperature() -> None:
    before = sample_cells()
    result = simulate_heat(before, {"trees": 200, "cool_roofs": 50, "green_walls": 20, "water_bodies": 5})
    assert result["avg_temperature_drop"] > 0
    assert result["climate_score_after"] > result["climate_score_before"]


def test_budget_optimization_stays_within_budget() -> None:
    result = optimize_budget(100000)
    assert result["total_spend"] <= 100000
    assert result["remaining_budget"] >= 0


def test_climate_score_is_bounded() -> None:
    score = compute_climate_score(sample_cells())
    assert 0 <= score <= 100
