from typing import Dict


def calculate_inventory_risk(
    current_stock: float,
    daily_consumption: float,
    safety_stock: float,
    incoming_quantity: float,
    lead_time_days: int
) -> Dict:

    # Prevent division by zero
    if daily_consumption <= 0:
        return {
            "days_remaining": None,
            "stockout_before_replenishment": False,
            "projected_stock_at_replenishment": current_stock + incoming_quantity,
            "safety_stock_breach": current_stock < safety_stock,
            "risk_score": 0,
            "status": "HEALTHY"
        }

    # How many days current inventory can support demand
    days_remaining = current_stock / daily_consumption

    # Expected consumption before new shipment arrives
    demand_during_lead_time = daily_consumption * lead_time_days

    # Stock remaining when replenishment arrives
    projected_stock_at_replenishment = (
        current_stock
        - demand_during_lead_time
        + incoming_quantity
    )

    # Will the facility run out before shipment arrives?
    stockout_before_replenishment = (
        current_stock < demand_during_lead_time
    )

    # Is current stock already below the desired safety stock?
    safety_stock_breach = current_stock < safety_stock

    # ------------------------------------------------
    # Risk Score
    # ------------------------------------------------

    risk_score = 0

    # Stockout risk
    if stockout_before_replenishment:
        risk_score += 60

    # Safety stock risk
    if safety_stock_breach:
        risk_score += 20

    # Very low number of days remaining
    if days_remaining <= 2:
        risk_score += 20
    elif days_remaining <= 5:
        risk_score += 10

    # If projected stock after replenishment is still
    # below safety stock, additional risk
    if stockout_before_replenishment:
        risk_score += 60

    if safety_stock_breach:
        risk_score += 20

    if projected_stock_at_replenishment < safety_stock:
        risk_score += 15

    if days_remaining <= 2:
        risk_score += 20
    elif days_remaining <= 5:
        risk_score += 10


    # Cap score
    risk_score = min(risk_score, 100)

    # ------------------------------------------------
    # Risk Classification
    # ------------------------------------------------

    if risk_score >= 60:
        status = "CRITICAL"

    elif risk_score >= 30:
        status = "AT_RISK"

    else:
        status = "HEALTHY"

    return {
        "days_remaining": round(days_remaining, 2),
        "demand_during_lead_time": round(
            demand_during_lead_time, 2
        ),
        "projected_stock_at_replenishment": round(
            projected_stock_at_replenishment, 2
        ),
        "stockout_before_replenishment": stockout_before_replenishment,
        "safety_stock_breach": safety_stock_breach,
        "risk_score": risk_score,
        "status": status
    }