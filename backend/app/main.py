from contextlib import asynccontextmanager

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from .config import get_settings
from .data import fetch_heat_cells, init_db
from .models import HeatDataResponse, OptimizationRequest, OptimizationResponse, SimulationRequest, SimulationResponse
from .reporting import build_report_pdf
from .services.simulation import cell_from_row, optimize_budget, simulate_heat, summarize_cells


settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/heat-data", response_model=HeatDataResponse)
def get_heat_data(city: str = Query(default=settings.city_name)) -> HeatDataResponse:
    rows = fetch_heat_cells()
    cells = [cell_from_row(row) for row in rows]
    return HeatDataResponse(city=city, cells=cells, summary=summarize_cells(cells))


@app.post("/simulate", response_model=SimulationResponse)
def run_simulation(payload: SimulationRequest) -> SimulationResponse:
    rows = fetch_heat_cells()
    cells = [cell_from_row(row) for row in rows]
    result = simulate_heat(cells, payload.interventions.model_dump())
    return SimulationResponse(city=payload.city, **result)


@app.post("/optimize", response_model=OptimizationResponse)
def run_optimization(payload: OptimizationRequest) -> OptimizationResponse:
    optimized = optimize_budget(payload.budget)
    return OptimizationResponse(city=payload.city, budget=payload.budget, currency=payload.currency, **optimized)


@app.get("/report")
def download_report(
    city: str = Query(default=settings.city_name),
    budget: float = Query(default=500000),
    currency: str = Query(default="INR"),
    trees: int = Query(default=0),
    cool_roofs: int = Query(default=0),
    green_walls: int = Query(default=0),
    water_bodies: int = Query(default=0),
) -> Response:
    rows = fetch_heat_cells()
    cells = [cell_from_row(row) for row in rows]
    result = simulate_heat(
        cells,
        {
            "trees": trees,
            "cool_roofs": cool_roofs,
            "green_walls": green_walls,
            "water_bodies": water_bodies,
        },
    )
    pdf_bytes = build_report_pdf(city, result["after"], result["recommendations"], budget, currency)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{city.lower().replace(" ", "-")}-report.pdf"'},
    )
