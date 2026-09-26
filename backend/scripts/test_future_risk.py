import pandas as pd

from app.services.forecast_service import ForecastService
from app.services.future_risk_engine import calculate_future_risk


CSV_PATH = "data/generated/demand_history.csv"


# --------------------------------------------------
# Load historical data
# --------------------------------------------------

df = pd.read_csv(
    CSV_PATH
)

df["date"] = pd.to_datetime(
    df["date"]
)


# --------------------------------------------------
# Select one facility + medicine
# --------------------------------------------------

facility_code = "FAC-0001"
medicine = "Paracetamol"

sample = df[
    (df["facility_code"] == facility_code)
    &
    (df["medicine"] == medicine)
].copy()


sample = sample.sort_values(
    "date"
)


# --------------------------------------------------
# Forecast
# --------------------------------------------------

forecast_service = ForecastService()

forecast = (
    forecast_service.forecast_7_days(
        sample
    )
)


# --------------------------------------------------
# Example inventory information
# --------------------------------------------------

current_stock = 349
incoming_quantity = 0
lead_time_days = 3
safety_stock = 224


# --------------------------------------------------
# Future risk
# --------------------------------------------------

risk = calculate_future_risk(
    current_stock=current_stock,

    predicted_7_day_demand=(
        forecast["total_predicted_demand"]
    ),

    incoming_quantity=incoming_quantity,

    lead_time_days=lead_time_days,

    safety_stock=safety_stock
)


# --------------------------------------------------
# Display
# --------------------------------------------------

print("\nRESILICARE FUTURE RISK ANALYSIS")
print("================================")

print(
    f"Facility: {facility_code}"
)

print(
    f"Medicine: {medicine}"
)

print(
    f"\nCurrent stock: {current_stock}"
)

print(
    "\n7-DAY FORECAST"
)

for prediction in forecast["predictions"]:

    print(
        f"{prediction['date']} → "
        f"{prediction['predicted_demand']} units"
    )


print(
    "\nTotal predicted demand:",
    forecast["total_predicted_demand"]
)

print(
    "Average daily demand:",
    forecast["average_daily_demand"]
)


print(
    "\nFUTURE RISK"
)

print(
    "Projected stock after 7 days:",
    risk["projected_stock_after_7_days"]
)

print(
    "Predicted days until stockout:",
    risk["predicted_days_until_stockout"]
)

print(
    "Stockout before replenishment:",
    risk["stockout_before_replenishment"]
)

print(
    "Safety stock breach:",
    risk["safety_stock_breach"]
)

print(
    "Risk score:",
    risk["risk_score"]
)

print(
    "Status:",
    risk["status"]
)