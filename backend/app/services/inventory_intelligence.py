import pandas as pd

from .forecast_service import ForecastService
from .future_risk_engine import calculate_future_risk


class InventoryIntelligence:

    def __init__(self):

        self.forecast_service = ForecastService()

    def analyze(
        self,
        historical_data,
        current_stock,
        incoming_quantity,
        lead_time_days,
        safety_stock
    ):

        # ---------------------------------------------
        # Generate 7-day demand forecast
        # ---------------------------------------------

        forecast = (
            self.forecast_service.forecast_7_days(
                historical_data
            )
        )

        # ---------------------------------------------
        # Calculate future risk
        # ---------------------------------------------

        future_risk = calculate_future_risk(

            current_stock=current_stock,

            predicted_7_day_demand=(
                forecast["total_predicted_demand"]
            ),

            incoming_quantity=incoming_quantity,

            lead_time_days=lead_time_days,

            safety_stock=safety_stock
        )

        # ---------------------------------------------
        # Return combined intelligence
        # ---------------------------------------------

        return {
            "forecast": forecast,
            "future_risk": future_risk
        }