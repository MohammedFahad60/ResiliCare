def calculate_future_risk(
    current_stock,
    predicted_7_day_demand,
    incoming_quantity,
    lead_time_days,
    safety_stock
):

    # Convert all numeric inputs to native Python types
    current_stock = float(current_stock)
    predicted_7_day_demand = float(predicted_7_day_demand)
    incoming_quantity = float(incoming_quantity)
    lead_time_days = int(lead_time_days)
    safety_stock = float(safety_stock)

    # ---------------------------------------------
    # Projected stock after 7 days
    # ---------------------------------------------

    projected_stock_after_7_days = (
        current_stock
        - predicted_7_day_demand
        + incoming_quantity
    )

    # ---------------------------------------------
    # Average predicted daily demand
    # ---------------------------------------------

    average_daily_demand = (
        predicted_7_day_demand / 7
    )

    # ---------------------------------------------
    # Predicted days until stockout
    # ---------------------------------------------

    if average_daily_demand > 0:

        predicted_days_until_stockout = (
            current_stock /
            average_daily_demand
        )

    else:

        predicted_days_until_stockout = None

    # ---------------------------------------------
    # Stockout before replenishment
    # ---------------------------------------------

    if predicted_days_until_stockout is not None:

        stockout_before_replenishment = bool(
            predicted_days_until_stockout
            < lead_time_days
        )

    else:

        stockout_before_replenishment = False

    # ---------------------------------------------
    # Safety stock breach
    # ---------------------------------------------

    safety_stock_breach = bool(
        projected_stock_after_7_days
        < safety_stock
    )

    # ---------------------------------------------
    # Risk score
    # ---------------------------------------------

    risk_score = 0

    if stockout_before_replenishment:
        risk_score += 60

    if safety_stock_breach:
        risk_score += 20

    if (
        predicted_days_until_stockout is not None
        and predicted_days_until_stockout <= 2
    ):
        risk_score += 20

    elif (
        predicted_days_until_stockout is not None
        and predicted_days_until_stockout <= 5
    ):
        risk_score += 10

    risk_score = int(
        min(risk_score, 100)
    )

    # ---------------------------------------------
    # Status
    # ---------------------------------------------

    if risk_score >= 60:

        status = "CRITICAL"

    elif risk_score >= 30:

        status = "AT_RISK"

    else:

        status = "HEALTHY"

    # ---------------------------------------------
    # Return only JSON-safe Python types
    # ---------------------------------------------

    return {

        "projected_stock_after_7_days":
            float(
                round(
                    projected_stock_after_7_days,
                    2
                )
            ),

        "predicted_days_until_stockout":
            (
                float(
                    round(
                        predicted_days_until_stockout,
                        2
                    )
                )
                if predicted_days_until_stockout
                is not None
                else None
            ),

        "stockout_before_replenishment":
            bool(
                stockout_before_replenishment
            ),

        "safety_stock_breach":
            bool(
                safety_stock_breach
            ),

        "risk_score":
            int(
                risk_score
            ),

        "status":
            str(
                status
            )
    }