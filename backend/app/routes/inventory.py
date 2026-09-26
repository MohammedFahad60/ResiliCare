from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Inventory, Facility, Medicine
from ..services.risk_engine import calculate_inventory_risk


router = APIRouter(
    prefix="/api/inventory",
    tags=["Inventory"]
)


@router.get("/")
def get_inventory(db: Session = Depends(get_db)):

    records = (
        db.query(Inventory, Facility, Medicine)
        .join(
            Facility,
            Inventory.facility_id == Facility.id
        )
        .join(
            Medicine,
            Inventory.medicine_id == Medicine.id
        )
        .all()
    )

    result = []

    for inventory, facility, medicine in records:

        risk = calculate_inventory_risk(
            current_stock=inventory.current_stock,
            daily_consumption=inventory.daily_consumption,
            safety_stock=inventory.safety_stock,
            incoming_quantity=inventory.incoming_quantity,
            lead_time_days=inventory.lead_time_days
        )

        result.append({
            "facility_code": facility.facility_code,
            "facility_name": facility.name,
            "facility_type": facility.facility_type,

            "district": facility.district,
            "state": facility.state,

            "latitude": float(facility.latitude),
            "longitude": float(facility.longitude),

            "medicine": medicine.name,

            "current_stock": inventory.current_stock,
            "daily_consumption": inventory.daily_consumption,
            "safety_stock": inventory.safety_stock,
            "incoming_quantity": inventory.incoming_quantity,
            "lead_time_days": inventory.lead_time_days,

            "days_remaining": risk["days_remaining"],
            "demand_during_lead_time":
                risk["demand_during_lead_time"],
            "projected_stock_at_replenishment":
                risk["projected_stock_at_replenishment"],
            "stockout_before_replenishment":
                risk["stockout_before_replenishment"],
            "safety_stock_breach":
                risk["safety_stock_breach"],
            "risk_score": risk["risk_score"],
            "status": risk["status"]
        })

    return {
        "count": len(result),
        "data": result
    }