from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from google import genai

router = APIRouter(prefix="/crisis", tags=["Crisis Intelligence"])


class CrisisChatRequest(BaseModel):
    question: str
    scenario: dict
    network: dict
    impact: dict
    recommendations: list = []


@router.post("/ask")
def ask_resilicare(request: CrisisChatRequest):

    if not request.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty."
        )

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured."
        )

    client = genai.Client(api_key=api_key)

    scenario = request.scenario or {}
    network = request.network or {}
    impact = request.impact or {}

    before = impact.get("before", {})
    after = impact.get("after", {})
    impact_summary = impact.get("impact", {})

    # Only send compact recommendation evidence.
    compact_recommendations = []

    for item in request.recommendations[:5]:
        compact_recommendations.append({
            "medicine": item.get("medicine"),
            "quantity": item.get("quantity"),
            "distance_km": item.get("distance_km"),
            "source": item.get("source", {}).get("facility_code"),
            "destination": item.get("destination", {}).get("facility_code"),
        })

    prompt = f"""
You are Ask ResiliCare, an AI analyst for a healthcare
network resilience platform.

Answer the user's question using ONLY the supplied evidence.

USER QUESTION:
{request.question}

CRISIS SCENARIO:
Demand increase: {scenario.get("demand_increase_percent", 0)}%
Supply disruption: {scenario.get("supply_disruption_days", 0)} days
Staff reduction: {scenario.get("staff_reduction_percent", 0)}%
Bed occupancy increase: {scenario.get("bed_occupancy_increase_percent", 0)}%

NETWORK:
Total facilities: {network.get("total_facilities", network.get("total", 0))}
Healthy facilities: {network.get("healthy", 0)}
At-risk facilities: {network.get("at_risk", 0)}
Critical facilities: {network.get("critical", 0)}
Average risk score: {network.get("average_facility_risk", network.get("average_risk_score", 0))}
Stockout nodes: {network.get("stockout_nodes", network.get("stockout_risk_nodes", 0))}

INTERVENTION BASELINE:
Stockout nodes: {before.get("stockout_nodes", 0)}
Critical inventory nodes: {before.get("critical_inventory_nodes", 0)}
At-risk inventory nodes: {before.get("at_risk_inventory_nodes", 0)}
Safety stock breaches: {before.get("safety_stock_breaches", 0)}
Average risk score: {before.get("average_risk_score", 0)}
Average stock coverage: {before.get("average_stock_coverage", 0)}

POST-INTERVENTION:
Stockout nodes: {after.get("stockout_nodes", 0)}
Critical inventory nodes: {after.get("critical_inventory_nodes", 0)}
At-risk inventory nodes: {after.get("at_risk_inventory_nodes", 0)}
Safety stock breaches: {after.get("safety_stock_breaches", 0)}
Average risk score: {after.get("average_risk_score", 0)}
Average stock coverage: {after.get("average_stock_coverage", 0)}

IMPACT:
Stockout nodes reduced:
{impact_summary.get("stockout_nodes_reduced", 0)}

Critical inventory nodes reduced:
{impact_summary.get("critical_inventory_nodes_reduced", 0)}

At-risk inventory nodes reduced:
{impact_summary.get("at_risk_inventory_nodes_reduced", 0)}

Facilities improved:
{impact_summary.get("facilities_improved", 0)}

Average risk reduction:
{impact_summary.get("average_risk_reduction", 0)}

Risk improvement percentage:
{impact_summary.get("risk_improvement_percent", 0)}%

TOP RECOMMENDATIONS:
{compact_recommendations}

RULES:

- Use only the supplied evidence.
- Never invent numbers.
- Never invent facilities.
- Never invent medicines.
- Never invent patient or disease statistics.
- Distinguish crisis simulation results from intervention results.
- If the data cannot answer the question, say so.
- Keep the answer concise and operational.
- Do not use tables.

Answer the user's question directly.
"""

    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt,
        )

        return {
            "success": True,
            "question": request.question,
            "answer": response.text,
            "generated_by": "Gemini",
        }

    except Exception as exc:

        error_text = str(exc)

        if "429" in error_text or "RESOURCE_EXHAUSTED" in error_text:
            raise HTTPException(
                status_code=429,
                detail=(
                    "Gemini quota is temporarily exhausted. "
                    "Please wait and try again, or enable a higher "
                    "Gemini API billing tier."
                ),
            )

        raise HTTPException(
            status_code=500,
            detail=f"ResiliCare AI failed: {exc}"
        )