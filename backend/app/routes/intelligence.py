from datetime import date, timedelta

import pandas as pd

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Inventory, Facility, Medicine

from ..services.inventory_intelligence import (
    InventoryIntelligence
)


router = APIRouter(
    prefix="/api/intelligence",
    tags=["Healthcare Intelligence"]
)


def build_production_history(daily_consumption):
    """
    Build a lightweight historical demand series for production.

    The training CSV is intentionally not required by the
    production API. The operational inventory record provides
    the current baseline consumption rate.
    """

    base_demand = max(
        float(daily_consumption or 0),
        0.1
    )

    end_date = date.today() - timedelta(days=1)

    records = []

    # 30 days gives the forecasting model enough history
    # for lag and rolling features.
    for offset in range(30):
        current_date = (
            end_date -
            timedelta(days=29 - offset)
        )

        # Small deterministic weekly pattern.
        weekday = current_date.weekday()

        weekday_factor = {
            0: 1.04,  # Monday
            1: 1.02,
            2: 1.00,
            3: 1.01,
            4: 1.05,
            5: 0.96,
            6: 0.92,
        }.get(weekday, 1.0)

        # Very small deterministic trend.
        trend_factor = (
            1.0 +
            (offset / 29) * 0.03
        )

        consumption = (
            base_demand *
            weekday_factor *
            trend_factor
        )

        records.append({
            "date": current_date,
            "consumption": round(
                consumption,
                2
            )
        })

    return pd.DataFrame(records)


@router.get(
    "/{facility_code}/{medicine_name}"
)
def get_inventory_intelligence(
    facility_code: str,
    medicine_name: str,
    db: Session = Depends(get_db)
):

    # ------------------------------------------------
    # Find facility
    # ------------------------------------------------

    facility = (
        db.query(Facility)
        .filter(
            Facility.facility_code
            == facility_code
        )
        .first()
    )

    if not facility:
        raise HTTPException(
            status_code=404,
            detail="Facility not found"
        )

    # ------------------------------------------------
    # Find medicine inventory
    # ------------------------------------------------

    inventory = (
        db.query(Inventory)
        .join(
            Medicine,
            Inventory.medicine_id
            == Medicine.id
        )
        .filter(
            Inventory.facility_id
            == facility.id,
            Medicine.name
            == medicine_name
        )
        .first()
    )

    if not inventory:
        raise HTTPException(
            status_code=404,
            detail="Inventory record not found"
        )

    # ------------------------------------------------
    # Find medicine
    # ------------------------------------------------

    medicine = (
        db.query(Medicine)
        .filter(
            Medicine.id
            == inventory.medicine_id
        )
        .first()
    )

    if not medicine:
        raise HTTPException(
            status_code=404,
            detail="Medicine not found"
        )

    # ------------------------------------------------
    # Build production-safe historical demand
    # ------------------------------------------------

    historical_data = build_production_history(
        inventory.daily_consumption
    )

    # ------------------------------------------------
    # Run intelligence
    # ------------------------------------------------

    try:

        intelligence = InventoryIntelligence()

        analysis = intelligence.analyze(

            historical_data=historical_data,

            current_stock=(
                inventory.current_stock
            ),

            incoming_quantity=(
                inventory.incoming_quantity
            ),

            lead_time_days=(
                inventory.lead_time_days
            ),

            safety_stock=(
                inventory.safety_stock
            )
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )

    # ------------------------------------------------
    # Response
    # ------------------------------------------------

    return {

        "facility": {

            "facility_code":
                facility.facility_code,

            "facility_name":
                facility.name,

            "facility_type":
                facility.facility_type,

            "district":
                facility.district,

            "state":
                facility.state
        },

        "medicine": {

            "name":
                medicine.name,

            "unit":
                medicine.unit
        },

        "inventory": {

            "current_stock":
                inventory.current_stock,

            "daily_consumption":
                inventory.daily_consumption,

            "safety_stock":
                inventory.safety_stock,

            "incoming_quantity":
                inventory.incoming_quantity,

            "lead_time_days":
                inventory.lead_time_days
        },

        "intelligence": analysis
    }