from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pathlib import Path

import pandas as pd

from ..database import get_db
from ..models import Inventory, Facility, Medicine

from ..services.inventory_intelligence import (
    InventoryIntelligence
)


router = APIRouter(
    prefix="/api/intelligence",
    tags=["Healthcare Intelligence"]
)


@router.get("/{facility_code}/{medicine_name}")
def get_inventory_intelligence(
    facility_code: str,
    medicine_name: str,
    db: Session = Depends(get_db)
):

    # --------------------------------------------------
    # 1. Find facility
    # --------------------------------------------------

    facility = (
        db.query(Facility)
        .filter(
            Facility.facility_code == facility_code
        )
        .first()
    )

    if not facility:
        raise HTTPException(
            status_code=404,
            detail="Facility not found"
        )

    # --------------------------------------------------
    # 2. Find inventory using facility + medicine name
    #
    # IMPORTANT:
    # We do NOT independently query Medicine first.
    # This avoids stale/duplicate Medicine IDs.
    # --------------------------------------------------

    inventory = (
        db.query(Inventory)
        .join(
            Medicine,
            Inventory.medicine_id == Medicine.id
        )
        .filter(
            Inventory.facility_id == facility.id,
            Medicine.name == medicine_name
        )
        .first()
    )

    if not inventory:
        raise HTTPException(
            status_code=404,
            detail="Inventory record not found"
        )

    # --------------------------------------------------
    # 3. Get the exact medicine referenced by inventory
    # --------------------------------------------------

    medicine = (
        db.query(Medicine)
        .filter(
            Medicine.id == inventory.medicine_id
        )
        .first()
    )

    if not medicine:
        raise HTTPException(
            status_code=404,
            detail="Medicine not found"
        )

    # --------------------------------------------------
    # 4. Load historical demand data
    # --------------------------------------------------

    csv_path = (
        Path(__file__).resolve()
        .parents[2]
        / "data"
        / "generated"
        / "demand_history.csv"
    )

    if not csv_path.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Demand history dataset not found: {csv_path}"
        )

    try:
        demand_df = pd.read_csv(csv_path)

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load demand history: {str(error)}"
        )

    # --------------------------------------------------
    # 5. Validate required columns
    # --------------------------------------------------

    required_columns = {
        "facility_code",
        "medicine",
        "date"
    }

    missing_columns = required_columns - set(
        demand_df.columns
    )

    if missing_columns:
        raise HTTPException(
            status_code=500,
            detail=(
                "Demand history dataset is missing columns: "
                + ", ".join(sorted(missing_columns))
            )
        )

    # --------------------------------------------------
    # 6. Filter historical demand
    # --------------------------------------------------

    historical_data = demand_df[
        (
            demand_df["facility_code"].astype(str)
            == str(facility_code)
        )
        &
        (
            demand_df["medicine"].astype(str)
            == str(medicine.name)
        )
    ].copy()

    if len(historical_data) < 14:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Insufficient historical data for "
                f"{facility_code} / {medicine.name}. "
                f"Found {len(historical_data)} records; "
                f"at least 14 are required."
            )
        )

    historical_data = historical_data.sort_values(
        "date"
    )

    # --------------------------------------------------
    # 7. Run inventory intelligence
    # --------------------------------------------------

    try:

        intelligence = InventoryIntelligence()

        analysis = intelligence.analyze(
            historical_data=historical_data,
            current_stock=float(
                inventory.current_stock
            ),
            incoming_quantity=float(
                inventory.incoming_quantity or 0
            ),
            lead_time_days=float(
                inventory.lead_time_days
            ),
            safety_stock=float(
                inventory.safety_stock
            )
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Intelligence analysis failed: {str(error)}"
        )

    # --------------------------------------------------
    # 8. Make response JSON-safe
    #
    # Handles numpy/pandas scalar values returned by
    # the intelligence model.
    # --------------------------------------------------

    def make_json_safe(value):

        if hasattr(value, "item"):
            try:
                return value.item()
            except Exception:
                pass

        if isinstance(value, dict):
            return {
                str(key): make_json_safe(val)
                for key, val in value.items()
            }

        if isinstance(value, (list, tuple)):
            return [
                make_json_safe(item)
                for item in value
            ]

        return value

    analysis = make_json_safe(analysis)

    # --------------------------------------------------
    # 9. Return intelligence response
    # --------------------------------------------------

    return {
        "facility": {
            "facility_code": facility.facility_code,
            "facility_name": facility.name,
            "facility_type": facility.facility_type,
            "district": facility.district,
            "state": facility.state
        },

        "medicine": {
            "name": medicine.name,
            "unit": medicine.unit
        },

        "inventory": {
            "current_stock": float(
                inventory.current_stock
            ),
            "daily_consumption": float(
                inventory.daily_consumption
            ),
            "safety_stock": float(
                inventory.safety_stock
            ),
            "incoming_quantity": float(
                inventory.incoming_quantity or 0
            ),
            "lead_time_days": float(
                inventory.lead_time_days
            )
        },

        "intelligence": analysis
    }