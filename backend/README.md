# CoolCity Backend

FastAPI backend for the CoolCity urban heat intervention simulator.

## Implemented APIs

- `GET /heat-data`
  Returns seeded city grid cells plus a heat summary.
- `POST /simulate`
  Accepts intervention counts and returns before/after temperatures, climate score changes, cost, and chart-ready data.
- `POST /optimize`
  Accepts a budget and returns a diversified intervention recommendation mix.
- `GET /report`
  Generates a downloadable PDF report for a selected scenario.

## Sample Dataset

The sample city grid lives in [sample_heat_cells.csv](C:\Users\2005s\Downloads\Pixelpulse\coolcity\database\sample_heat_cells.csv) and is loaded into SQLite on startup.

## Run Locally

```powershell
cd C:\Users\2005s\Downloads\Pixelpulse\coolcity\backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python main.py
```

The API will start on `http://localhost:8000`.

## Test

```powershell
cd C:\Users\2005s\Downloads\Pixelpulse\coolcity\backend
.venv\Scripts\Activate.ps1
pytest
```
