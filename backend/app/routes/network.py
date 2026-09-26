from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Facility, Inventory, Medicine


router = APIRouter(
    prefix="/network",
    tags=["Network"]
)


def calculate_risk(item):
    """
    Calculate inventory risk using current stock,
    daily consumption and safety stock.
    """

    current_stock = float(item.current_stock or 0)
    daily_consumption = float(item.daily_consumption or 0)
    safety_stock = float(item.safety_stock or 0)
    lead_time = float(item.lead_time_days or 0)

    if daily_consumption <= 0:
        return {
            "risk_score": 0,
            "status": "HEALTHY",
            "days_of_coverage": 999,
            "stockout_risk": False,
        }

    days_of_coverage = current_stock / daily_consumption

    required_stock = (
        daily_consumption * lead_time
    ) + safety_stock

    if current_stock <= 0:
        risk_score = 100
        status = "CRITICAL"

    elif current_stock < daily_consumption * lead_time:
        shortage_ratio = (
            1 - current_stock /
            max(daily_consumption * lead_time, 1)
        )

        risk_score = min(
            100,
            70 + shortage_ratio * 30
        )

        status = "CRITICAL"

    elif current_stock < required_stock:
        shortage_ratio = (
            1 - current_stock /
            max(required_stock, 1)
        )

        risk_score = min(
            69,
            40 + shortage_ratio * 29
        )

        status = "AT_RISK"

    else:
        risk_score = max(
            0,
            30 - (days_of_coverage / 30) * 10
        )

        status = "HEALTHY"

    return {
        "risk_score": round(risk_score, 2),
        "status": status,
        "days_of_coverage": round(days_of_coverage, 2),
        "stockout_risk": days_of_coverage < lead_time,
    }


@router.get("/summary")
def network_summary(
    db: Session = Depends(get_db)
):
    """
    Network-level overview.
    """

    facilities = db.query(Facility).all()
    inventory = db.query(Inventory).all()

    if not facilities:
        raise HTTPException(
            status_code=404,
            detail="No facilities found"
        )

    facility_stats = {}

    for facility in facilities:
        facility_stats[facility.id] = {
            "facility_id": facility.id,
            "facility_code": facility.facility_code,
            "facility_name":  facility.name,
            "facility_type": facility.facility_type,
            "district": facility.district,
            "state": facility.state,
            "latitude": facility.latitude,
            "longitude": facility.longitude,
            "risk_scores": [],
            "critical_nodes": 0,
            "stockout_nodes": 0,
            "inventory_nodes": 0,
        }

    for item in inventory:

        if item.facility_id not in facility_stats:
            continue

        risk = calculate_risk(item)

        stats = facility_stats[item.facility_id]

        stats["risk_scores"].append(
            risk["risk_score"]
        )

        stats["inventory_nodes"] += 1

        if risk["status"] == "CRITICAL":
            stats["critical_nodes"] += 1

        if risk["stockout_risk"]:
            stats["stockout_nodes"] += 1

    network_facilities = []

    for stats in facility_stats.values():

        scores = stats["risk_scores"]

        average_risk = (
            sum(scores) / len(scores)
            if scores
            else 0
        )

        if average_risk >= 70:
            status = "CRITICAL"
        elif average_risk >= 40:
            status = "AT_RISK"
        else:
            status = "HEALTHY"

        network_facilities.append({
            "facility_id": stats["facility_id"],
            "facility_code": stats["facility_code"],
            "facility_name": stats["facility_name"],
            "facility_type": stats["facility_type"],
            "district": stats["district"],
            "state": stats["state"],
            "latitude": stats["latitude"],
            "longitude": stats["longitude"],
            "risk_score": round(
                average_risk,
                2
            ),
            "status": status,
            "critical_inventory_nodes": (
                stats["critical_nodes"]
            ),
            "stockout_nodes": (
                stats["stockout_nodes"]
            ),
            "inventory_nodes": (
                stats["inventory_nodes"]
            ),
        })

    healthy = sum(
        1
        for f in network_facilities
        if f["status"] == "HEALTHY"
    )

    at_risk = sum(
        1
        for f in network_facilities
        if f["status"] == "AT_RISK"
    )

    critical = sum(
        1
        for f in network_facilities
        if f["status"] == "CRITICAL"
    )

    risk_scores = [
        f["risk_score"]
        for f in network_facilities
    ]

    average_network_risk = (
        sum(risk_scores) / len(risk_scores)
        if risk_scores
        else 0
    )

    stockout_nodes = sum(
        f["stockout_nodes"]
        for f in network_facilities
    )

    critical_inventory_nodes = sum(
        f["critical_inventory_nodes"]
        for f in network_facilities
    )

    return {
        "network": {
            "total_facilities": len(network_facilities),
            "healthy": healthy,
            "at_risk": at_risk,
            "critical": critical,
            "average_risk_score": round(
                average_network_risk,
                2
            ),
            "stockout_nodes": stockout_nodes,
            "critical_inventory_nodes": (
                critical_inventory_nodes
            ),
        },
        "facilities": network_facilities,
    }


@router.get("/facilities")
def network_facilities(
    db: Session = Depends(get_db)
):
    """
    Return facility-level network intelligence.
    """

    result = network_summary(db)

    return {
        "count": len(result["facilities"]),
        "data": result["facilities"],
    }


@router.get("/facilities/{facility_code}")
def facility_network_detail(
    facility_code: str,
    db: Session = Depends(get_db)
):
    """
    Detailed network intelligence for one facility.
    """

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

    inventory = (
        db.query(
            Inventory,
            Medicine
        )
        .join(
            Medicine,
            Inventory.medicine_id
            == Medicine.id
        )
        .filter(
            Inventory.facility_id
            == facility.id
        )
        .all()
    )

    medicines = []

    for item, medicine in inventory:

        risk = calculate_risk(item)

        medicines.append({
            "medicine_id": medicine.id,
            "medicine": medicine.name,
            "category": medicine.category,
            "dosage_form": medicine.dosage_form,
            "strength": medicine.strength,
            "unit": medicine.unit,

            "current_stock": float(
                item.current_stock or 0
            ),

            "daily_consumption": float(
                item.daily_consumption or 0
            ),

            "safety_stock": float(
                item.safety_stock or 0
            ),

            "incoming_quantity": float(
                item.incoming_quantity or 0
            ),

            "lead_time_days": float(
                item.lead_time_days or 0
            ),

            **risk,
        })

    risk_scores = [
        m["risk_score"]
        for m in medicines
    ]

    average_risk = (
        sum(risk_scores) /
        len(risk_scores)
        if risk_scores
        else 0
    )

    if average_risk >= 70:
        status = "CRITICAL"
    elif average_risk >= 40:
        status = "AT_RISK"
    else:
        status = "HEALTHY"

    return {
        "facility": {
            "id": facility.id,
            "facility_code": facility.facility_code,
            "facility_name":  facility.name,
            "facility_type": facility.facility_type,
            "district": facility.district,
            "state": facility.state,
            "latitude": facility.latitude,
            "longitude": facility.longitude,
        },

        "intelligence": {
            "risk_score": round(
                average_risk,
                2
            ),
            "status": status,
            "inventory_nodes": len(medicines),

            "critical_nodes": sum(
                1
                for m in medicines
                if m["status"] == "CRITICAL"
            ),

            "stockout_nodes": sum(
                1
                for m in medicines
                if m["stockout_risk"]
            ),
        },

        "medicines": medicines,
    }

# ============================================================
# EARLY WARNING CENTER
# ============================================================

@router.get("/warnings")
def get_network_warnings(
    db: Session = Depends(get_db),
):
    """
    Return prioritized early warnings across the healthcare
    network.

    Warning sources:
    - Critical facility risk
    - Stockout-risk inventory nodes
    - Critical inventory nodes
    """

    facilities = (
        db.query(Facility)
        .all()
    )

    warnings = []

    for facility in facilities:

        # --------------------------------------------------
        # FACILITY INVENTORY
        # --------------------------------------------------

        inventory_rows = (
            db.query(Inventory, Medicine)
            .join(
                Medicine,
                Inventory.medicine_id == Medicine.id,
            )
            .filter(
                Inventory.facility_id == facility.id
            )
            .all()
        )

        for inventory, medicine in inventory_rows:

            current_stock = float(
                inventory.current_stock or 0
            )

            daily_consumption = float(
                inventory.daily_consumption or 0
            )

            safety_stock = float(
                inventory.safety_stock or 0
            )

            lead_time_days = float(
                inventory.lead_time_days or 0
            )

            # --------------------------------------------------
            # COVERAGE
            # --------------------------------------------------

            if daily_consumption > 0:
                days_of_coverage = (
                    current_stock /
                    daily_consumption
                )
            else:
                days_of_coverage = 999.0

            # --------------------------------------------------
            # REQUIRED STOCK
            # --------------------------------------------------

            required_stock = (
                daily_consumption *
                lead_time_days
            ) + safety_stock

            # --------------------------------------------------
            # WARNING CLASSIFICATION
            # --------------------------------------------------

            warning_type = None
            severity = None
            message = None

            # CRITICAL:
            # Stock is insufficient for lead time +
            # safety stock.

            if current_stock <= 0:

                warning_type = "STOCKOUT"
                severity = "critical"

                message = (
                    "Medicine is currently out of stock."
                )

            elif days_of_coverage <= lead_time_days:

                warning_type = "STOCKOUT_RISK"
                severity = "critical"

                message = (
                    f"Projected coverage is "
                    f"{days_of_coverage:.1f} days, "
                    f"below the {lead_time_days:.0f}-day "
                    f"lead time."
                )

            elif current_stock < safety_stock:

                warning_type = "SAFETY_STOCK"
                severity = "warning"

                message = (
                    "Inventory has fallen below "
                    "the configured safety stock."
                )

            elif days_of_coverage <= (
                lead_time_days + 3
            ):

                warning_type = "REPLENISHMENT"
                severity = "watch"

                message = (
                    f"Only {days_of_coverage:.1f} days "
                    "of inventory coverage remain."
                )

            # --------------------------------------------------
            # ADD WARNING
            # --------------------------------------------------

            if warning_type:

                warnings.append(
                    {
                        "facility_code":
                            facility.facility_code,

                        "facility_name":
                            getattr(
                                facility,
                                "name",
                                facility.facility_code,
                            ),

                        "facility_type":
                            facility.facility_type,

                        "district":
                            facility.district,

                        "state":
                            facility.state,

                        "latitude":
                            float(
                                facility.latitude or 0
                            ),

                        "longitude":
                            float(
                                facility.longitude or 0
                            ),

                        "medicine_id":
                            medicine.id,

                        "medicine":
                            medicine.name,

                        "category":
                            medicine.category,

                        "dosage_form":
                            medicine.dosage_form,

                        "strength":
                            medicine.strength,

                        "unit":
                            medicine.unit,

                        "warning_type":
                            warning_type,

                        "severity":
                            severity,

                        "message":
                            message,

                        "current_stock":
                            round(
                                current_stock,
                                2,
                            ),

                        "daily_consumption":
                            round(
                                daily_consumption,
                                2,
                            ),

                        "safety_stock":
                            round(
                                safety_stock,
                                2,
                            ),

                        "lead_time_days":
                            round(
                                lead_time_days,
                                2,
                            ),

                        "days_of_coverage":
                            round(
                                days_of_coverage,
                                2,
                            ),

                        "required_stock":
                            round(
                                required_stock,
                                2,
                            ),
                    }
                )

    # ========================================================
    # PRIORITY ORDER
    # ========================================================

    severity_order = {
        "critical": 0,
        "warning": 1,
        "watch": 2,
    }

    warnings.sort(
        key=lambda item: (
            severity_order.get(
                item["severity"],
                99,
            ),
            item["days_of_coverage"],
        )
    )

    # ========================================================
    # SUMMARY
    # ========================================================

    critical = sum(
        1
        for item in warnings
        if item["severity"] == "critical"
    )

    warning = sum(
        1
        for item in warnings
        if item["severity"] == "warning"
    )

    watch = sum(
        1
        for item in warnings
        if item["severity"] == "watch"
    )

    return {
        "summary": {
            "total_warnings":
                len(warnings),

            "critical":
                critical,

            "warning":
                warning,

            "watch":
                watch,
        },

        "warnings":
            warnings,
    }