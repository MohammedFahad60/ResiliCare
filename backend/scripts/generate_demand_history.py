import os
import random
from datetime import date, timedelta

import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv

from app.models import Inventory, Facility, Medicine


# --------------------------------------------------
# Configuration
# --------------------------------------------------

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)

random.seed(42)

HISTORY_DAYS = 90


# --------------------------------------------------
# Load current inventory baseline
# --------------------------------------------------

query = """
SELECT
    f.facility_code,
    f.facility_type,
    f.state,
    f.district,
    m.name AS medicine,
    i.daily_consumption
FROM inventory i
JOIN facilities f
    ON i.facility_id = f.id
JOIN medicines m
    ON i.medicine_id = m.id
"""

inventory_df = pd.read_sql(query, engine)


# --------------------------------------------------
# Generate historical consumption
# --------------------------------------------------

records = []

start_date = date.today() - timedelta(days=HISTORY_DAYS)

for _, row in inventory_df.iterrows():

    baseline = float(row["daily_consumption"])

    facility_type = row["facility_type"]

    # Facility demand multiplier
    if facility_type == "PHC":
        facility_multiplier = 0.85

    elif facility_type == "CHC":
        facility_multiplier = 1.15

    else:
        facility_multiplier = 1.40

    for day_offset in range(HISTORY_DAYS):

        current_date = (
            start_date +
            timedelta(days=day_offset)
        )

        # -----------------------------
        # Weekly pattern
        # -----------------------------

        weekday = current_date.weekday()

        if weekday == 6:
            weekly_multiplier = 0.80

        elif weekday == 5:
            weekly_multiplier = 0.90

        else:
            weekly_multiplier = 1.00

        # -----------------------------
        # Gradual demand trend
        # -----------------------------

        trend_multiplier = (
            1 + (day_offset / HISTORY_DAYS) * 0.08
        )

        # -----------------------------
        # Random natural variation
        # -----------------------------

        noise = random.uniform(0.85, 1.15)

        # -----------------------------
        # Occasional demand surge
        # -----------------------------

        if random.random() < 0.04:
            surge_multiplier = random.uniform(1.30, 1.80)
        else:
            surge_multiplier = 1.0

        # -----------------------------
        # Final consumption
        # -----------------------------

        consumption = (
            baseline
            * facility_multiplier
            * weekly_multiplier
            * trend_multiplier
            * noise
            * surge_multiplier
        )

        consumption = max(
            1,
            round(consumption)
        )

        records.append({
            "date": current_date,
            "facility_code": row["facility_code"],
            "facility_type": facility_type,
            "state": row["state"],
            "district": row["district"],
            "medicine": row["medicine"],
            "consumption": consumption
        })


# --------------------------------------------------
# Save dataset
# --------------------------------------------------

df = pd.DataFrame(records)

output_directory = "data/generated"

os.makedirs(
    output_directory,
    exist_ok=True
)

output_file = (
    f"{output_directory}/"
    "demand_history.csv"
)

df.to_csv(
    output_file,
    index=False
)

print("\nRESILICARE DEMAND DATASET")
print("-------------------------")

print(f"Records generated: {len(df)}")
print(f"Facilities: {df['facility_code'].nunique()}")
print(f"Medicines: {df['medicine'].nunique()}")
print(f"Days: {df['date'].nunique()}")

print("\nSaved to:")
print(output_file)

print("\nSample:")
print(df.head(10).to_string(index=False))