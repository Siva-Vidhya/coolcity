from __future__ import annotations

import csv
import sqlite3
from pathlib import Path
from typing import Iterable, List

from .config import get_settings


SAMPLE_DATA_PATH = Path(__file__).resolve().parents[2] / "database" / "sample_heat_cells.csv"


def connect() -> sqlite3.Connection:
    db_path = get_settings().resolved_db_path
    db_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(db_path)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    with connect() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS heat_cells (
                cell_id INTEGER PRIMARY KEY,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                baseline_temperature REAL NOT NULL,
                current_temperature REAL NOT NULL,
                tree_cover REAL NOT NULL,
                population_density INTEGER NOT NULL,
                built_density REAL NOT NULL,
                heat_zone TEXT NOT NULL
            )
            """
        )
        count = connection.execute("SELECT COUNT(*) AS total FROM heat_cells").fetchone()["total"]
        if count == 0:
            connection.executemany(
                """
                INSERT INTO heat_cells (
                    latitude,
                    longitude,
                    baseline_temperature,
                    current_temperature,
                    tree_cover,
                    population_density,
                    built_density,
                    heat_zone
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [_seed_row(row) for row in load_sample_grid()],
            )


def _seed_row(row: Iterable[float]) -> tuple[float, float, float, float, float, int, float, str]:
    latitude, longitude, temperature, tree_cover, population_density, built_density = row
    return (
        latitude,
        longitude,
        temperature,
        temperature,
        tree_cover,
        population_density,
        built_density,
        classify_heat_zone(temperature),
    )


def load_sample_grid() -> List[tuple[float, float, float, float, int, float]]:
    with SAMPLE_DATA_PATH.open("r", encoding="utf-8", newline="") as csv_file:
        reader = csv.DictReader(csv_file)
        return [
            (
                float(row["latitude"]),
                float(row["longitude"]),
                float(row["temperature"]),
                float(row["tree_cover"]),
                int(row["population_density"]),
                float(row["built_density"]),
            )
            for row in reader
        ]


def classify_heat_zone(temperature: float) -> str:
    if temperature >= 38:
        return "high"
    if temperature >= 35:
        return "medium"
    return "low"


def fetch_heat_cells() -> List[sqlite3.Row]:
    with connect() as connection:
        rows = connection.execute(
            """
            SELECT
                cell_id,
                latitude,
                longitude,
                baseline_temperature,
                current_temperature,
                tree_cover,
                population_density,
                built_density,
                heat_zone
            FROM heat_cells
            ORDER BY cell_id
            """
        ).fetchall()
    return list(rows)
