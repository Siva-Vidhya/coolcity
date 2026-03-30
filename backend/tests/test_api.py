from fastapi.testclient import TestClient

from app.data import init_db
from app.main import app


init_db()
client = TestClient(app)


def test_heat_data_endpoint() -> None:
    response = client.get("/heat-data")
    assert response.status_code == 200
    body = response.json()
    assert "cells" in body
    assert len(body["cells"]) >= 10
    assert "climate_score" in body["summary"]


def test_optimize_endpoint() -> None:
    response = client.post("/optimize", json={"budget": 250000, "currency": "INR", "city": "CoolCity Demo"})
    assert response.status_code == 200
    body = response.json()
    assert body["total_spend"] <= 250000


def test_report_endpoint() -> None:
    response = client.get("/report?trees=200&cool_roofs=50&green_walls=20&water_bodies=5")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
