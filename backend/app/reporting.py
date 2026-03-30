from __future__ import annotations

from io import BytesIO
from typing import Iterable

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from .models import HeatCell, Recommendation
from .services.simulation import compute_climate_score, summarize_cells


def build_report_pdf(
    city: str,
    cells: Iterable[HeatCell],
    recommendations: Iterable[Recommendation],
    budget: float,
    currency: str,
) -> bytes:
    buffer = BytesIO()
    document = SimpleDocTemplate(buffer, pagesize=A4, title=f"{city} Heat Intervention Report")
    styles = getSampleStyleSheet()

    cell_list = list(cells)
    recs = list(recommendations)
    summary = summarize_cells(cell_list)
    climate_score = compute_climate_score(cell_list)

    story = [
        Paragraph(f"{city} Urban Heat Intervention Report", styles["Title"]),
        Spacer(1, 12),
        Paragraph(
            "This report summarizes current heat intensity, recommended cooling interventions, and projected resilience indicators.",
            styles["BodyText"],
        ),
        Spacer(1, 12),
        Paragraph(f"Climate Score: {climate_score}/100", styles["Heading2"]),
        Paragraph(f"Average Temperature: {summary['average_temperature']} °C", styles["BodyText"]),
        Paragraph(f"Budget Scenario: {currency} {budget:,.0f}", styles["BodyText"]),
        Spacer(1, 12),
    ]

    heat_table = Table(
        [
            ["Metric", "Value"],
            ["High heat zones", int(summary["high_heat_cells"])],
            ["Medium heat zones", int(summary["medium_heat_cells"])],
            ["Low heat zones", int(summary["low_heat_cells"])],
            ["Average tree cover", f"{summary['avg_tree_cover']}%"],
            ["Avg population density", int(summary["avg_population_density"])],
        ],
        hAlign="LEFT",
    )
    heat_table.setStyle(_table_style())

    rec_table_rows = [["Strategy", "Units", "Spend", "Reduction (°C)", "Impact Score"]]
    for rec in recs:
        rec_table_rows.append(
            [
                rec.strategy,
                rec.units,
                f"{currency} {rec.spend:,.0f}",
                rec.estimated_reduction,
                rec.impact_score,
            ]
        )
    if len(rec_table_rows) == 1:
        rec_table_rows.append(["No interventions selected", "-", "-", "-", "-"])

    rec_table = Table(rec_table_rows, hAlign="LEFT")
    rec_table.setStyle(_table_style())

    story.extend(
        [
            Paragraph("Heat Zone Summary", styles["Heading2"]),
            heat_table,
            Spacer(1, 18),
            Paragraph("Recommended Cooling Actions", styles["Heading2"]),
            rec_table,
        ]
    )

    document.build(story)
    return buffer.getvalue()


def _table_style() -> TableStyle:
    return TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("PADDING", (0, 0), (-1, -1), 8),
        ]
    )
