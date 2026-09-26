from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from google import genai

router = APIRouter(prefix="/crisis", tags=["Crisis Intelligence"])


class CrisisBriefingRequest(BaseModel):
    scenario: dict
    network: dict
    impact: dict
    recommendations: list = []


@router.post("/briefing")
def generate_crisis_briefing(request: CrisisBriefingRequest):

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
    recommendations = request.recommendations or []

    before = impact.get("before", {})
    after = impact.get("after", {})
    impact_summary = impact.get("impact", {})

    prompt = f"""
You are the AI intelligence layer of ResiliCare,
a healthcare network resilience platform.

Generate an executive crisis briefing based ONLY on
the numerical evidence provided below.

Do not invent:
- patient numbers
- disease statistics
- facilities
- inventory quantities
- operational facts
- causes that are not supported by the data

SCENARIO
{scenario}

NETWORK CONDITION
{network}

BEFORE INTERVENTION
{before}

AFTER INTERVENTION
{after}

IMPACT
{impact_summary}

TOP RESOURCE REDISTRIBUTION RECOMMENDATIONS
{recommendations[:5]}

Write a concise executive briefing with exactly these sections:

SITUATION
Explain what the simulated crisis does to the healthcare network.

NETWORK PRESSURE
Describe the baseline inventory condition used for intervention impact analysis.
Clearly distinguish this inventory baseline from the facility-level crisis simulation
summary. Do not mix the two sets of metrics.

RESOURCE RESPONSE
Explain what the redistribution engine is doing.

INTERVENTION IMPACT
Compare the intervention baseline and post-redistribution state.
Use the exact before/after inventory and facility metrics supplied.
Do not compare the facility-level crisis simulation summary directly with the
intervention baseline because they represent different stages of the analysis.

PRIORITY ACTION
Give a concise operational recommendation based only
on the evidence provided.

Keep the response factual and concise.
Do not use markdown tables.
Do not invent missing information.
"""

    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt,
        )

        return {
            "success": True,
            "briefing": response.text,
            "generated_by": "Gemini",
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini briefing generation failed: {exc}"
        )