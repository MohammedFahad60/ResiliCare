from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Facility, Medicine, Inventory
from app.services.crisis_simulator import CrisisSimulator
from app.services.bottleneck_detector import BottleneckDetector
from app.services.redistribution_engine import RedistributionEngine
from app.services.intervention_simulator import InterventionSimulator
from app.services.impact_engine import ImpactEngine

router = APIRouter(
    prefix="/api/crisis",
    tags=["Crisis Simulator"]
)


class CrisisScenario(BaseModel):

    demand_increase_percent: float = Field(
        default=0,
        ge=0,
        le=500
    )

    supply_disruption_days: int = Field(
        default=0,
        ge=0,
        le=30
    )

    staff_reduction_percent: float = Field(
        default=0,
        ge=0,
        le=100
    )

    bed_occupancy_increase_percent: float = Field(
        default=0,
        ge=0,
        le=200
    )


@router.post("/simulate")
def simulate_crisis(
    scenario: CrisisScenario,
    db: Session = Depends(get_db)
):

    records = (
        db.query(
            Facility,
            Medicine,
            Inventory
        )
        .join(
            Inventory,
            Inventory.facility_id == Facility.id
        )
        .join(
            Medicine,
            Inventory.medicine_id == Medicine.id
        )
        .all()
    )

    inventory_records = []

    facility_data = {}

    for facility, medicine, inventory in records:

        inventory_records.append({
            "facility_code": facility.facility_code,

            "facility_name":
                facility.name,

            "district":
                facility.district,

            "state":
                facility.state,

            "latitude":
                float(facility.latitude),

            "longitude":
                float(facility.longitude),

            "medicine":
                medicine.name,

            "current_stock":
                float(inventory.current_stock),

            "daily_consumption":
                float(inventory.daily_consumption),

            "safety_stock":
                float(inventory.safety_stock),

            "incoming_quantity":
                float(inventory.incoming_quantity),

            "lead_time_days":
                int(inventory.lead_time_days)
        })

        # Store facility information once
        if facility.facility_code not in facility_data:

            facility_data[facility.facility_code] = {
                "facility_code": facility.facility_code,
                "facility_name": facility.name,
                "district": facility.district,
                "state": facility.state,

                "total_beds": facility.total_beds,
                "occupied_beds": facility.occupied_beds,

                "doctors_total": facility.doctors_total,
                "doctors_available": facility.doctors_available,

                "nurses_total": facility.nurses_total,
                "nurses_available": facility.nurses_available
            }

    simulator = CrisisSimulator()

    # --------------------------------
    # MEDICINE CRISIS SIMULATION
    # --------------------------------

    medicine_simulation = simulator.simulate_inventory(
        inventory_records=inventory_records,

        demand_increase_percent=(
            scenario.demand_increase_percent
        ),

        supply_disruption_days=(
            scenario.supply_disruption_days
        )
    )

    # --------------------------------
    # FACILITY RESILIENCE
    # --------------------------------

    facility_results = []

    for facility_code, facility in facility_data.items():

        # Find all medicine risks for this facility
        facility_medicines = [
            item
            for item in medicine_simulation["results"]
            if item["facility_code"] == facility_code
        ]

        if facility_medicines:

            medicine_risk = max(
                item["risk_score"]
                for item in facility_medicines
            )

        else:
            medicine_risk = 0

        resilience = simulator.calculate_facility_resilience(
            total_beds=facility["total_beds"],
            occupied_beds=facility["occupied_beds"],

            doctors_total=facility["doctors_total"],
            doctors_available=facility["doctors_available"],

            nurses_total=facility["nurses_total"],
            nurses_available=facility["nurses_available"],

            bed_occupancy_increase_percent=(
                scenario.bed_occupancy_increase_percent
            ),

            staff_reduction_percent=(
                scenario.staff_reduction_percent
            ),

            medicine_risk_score=medicine_risk
        )

        facility_results.append({

            "facility_code": facility["facility_code"],
            "facility_name": facility["facility_name"],
            "district": facility["district"],
            "state": facility["state"],

            "medicine_risk": {
                "risk_score": int(medicine_risk)
            },

            "resilience": resilience
        })

    # --------------------------------
    # FACILITY SUMMARY
    # --------------------------------

    total_facilities = len(facility_results)

    healthy_facilities = sum(
        1
        for item in facility_results
        if item["resilience"]["status"] == "HEALTHY"
    )

    at_risk_facilities = sum(
        1
        for item in facility_results
        if item["resilience"]["status"] == "AT_RISK"
    )

    critical_facilities = sum(
        1
        for item in facility_results
        if item["resilience"]["status"] == "CRITICAL"
    )

    average_facility_risk = (
        sum(
            item["resilience"]["facility_risk_score"]
            for item in facility_results
        ) / total_facilities
        if total_facilities > 0
        else 0
    )

    return {

        "scenario": {

            "demand_increase_percent": float(
                scenario.demand_increase_percent
            ),

            "supply_disruption_days": int(
                scenario.supply_disruption_days
            ),

            "staff_reduction_percent": float(
                scenario.staff_reduction_percent
            ),

            "bed_occupancy_increase_percent": float(
                scenario.bed_occupancy_increase_percent
            )
        },

        "medicine_simulation": medicine_simulation,

        "facility_resilience": {

            "network_summary": {

                "total_facilities": int(
                    total_facilities
                ),

                "healthy": int(
                    healthy_facilities
                ),

                "at_risk": int(
                    at_risk_facilities
                ),

                "critical": int(
                    critical_facilities
                ),

                "average_facility_risk": float(
                    round(
                        average_facility_risk,
                        2
                    )
                )
            },

            "facilities": facility_results
        }
    }

@router.post("/bottlenecks")
def detect_bottlenecks(
    scenario: CrisisScenario,
    db: Session = Depends(get_db)
):

    records = (
        db.query(
            Facility,
            Medicine,
            Inventory
        )
        .join(
            Inventory,
            Inventory.facility_id == Facility.id
        )
        .join(
            Medicine,
            Inventory.medicine_id == Medicine.id
        )
        .all()
    )

    inventory_records = []

    facility_data = {}

    for facility, medicine, inventory in records:

        inventory_records.append({
            "facility_code": facility.facility_code,
            "facility_name": facility.name,
            "district": facility.district,
            "state": facility.state,

            "medicine": medicine.name,

            "current_stock": inventory.current_stock,
            "daily_consumption": inventory.daily_consumption,
            "safety_stock": inventory.safety_stock,
            "incoming_quantity": inventory.incoming_quantity,
            "lead_time_days": inventory.lead_time_days
        })

        if facility.facility_code not in facility_data:

            facility_data[facility.facility_code] = {
                "facility_code": facility.facility_code,
                "facility_name": facility.name,
                "district": facility.district,
                "state": facility.state,

                "total_beds": facility.total_beds,
                "occupied_beds": facility.occupied_beds,

                "doctors_total": facility.doctors_total,
                "doctors_available": facility.doctors_available,

                "nurses_total": facility.nurses_total,
                "nurses_available": facility.nurses_available
            }

    simulator = CrisisSimulator()

    medicine_simulation = simulator.simulate_inventory(
        inventory_records=inventory_records,
        demand_increase_percent=(
            scenario.demand_increase_percent
        ),
        supply_disruption_days=(
            scenario.supply_disruption_days
        )
    )

    facility_results = []

    for facility_code, facility in facility_data.items():

        facility_medicines = [
            item
            for item in medicine_simulation["results"]
            if item["facility_code"] == facility_code
        ]

        medicine_risk = (
            max(
                item["risk_score"]
                for item in facility_medicines
            )
            if facility_medicines
            else 0
        )

        resilience = simulator.calculate_facility_resilience(
            total_beds=facility["total_beds"],
            occupied_beds=facility["occupied_beds"],

            doctors_total=facility["doctors_total"],
            doctors_available=facility["doctors_available"],

            nurses_total=facility["nurses_total"],
            nurses_available=facility["nurses_available"],

            bed_occupancy_increase_percent=(
                scenario.bed_occupancy_increase_percent
            ),

            staff_reduction_percent=(
                scenario.staff_reduction_percent
            ),

            medicine_risk_score=medicine_risk
        )

        facility_results.append({

            "facility_code": facility["facility_code"],
            "facility_name": facility["facility_name"],
            "district": facility["district"],
            "state": facility["state"],

            "medicine_risk": {
                "risk_score": int(medicine_risk)
            },

            "resilience": resilience
        })

    detector = BottleneckDetector()

    result = detector.analyze(
        medicine_results=medicine_simulation["results"],
        facility_results=facility_results
    )

    return {
        "scenario": {
            "demand_increase_percent": float(
                scenario.demand_increase_percent
            ),

            "supply_disruption_days": int(
                scenario.supply_disruption_days
            ),

            "staff_reduction_percent": float(
                scenario.staff_reduction_percent
            ),

            "bed_occupancy_increase_percent": float(
                scenario.bed_occupancy_increase_percent
            )
        },

        "bottleneck_analysis": result
    }

@router.post("/redistribution")
def calculate_redistribution(
    scenario: CrisisScenario,
    db: Session = Depends(get_db)
):

    records = (
        db.query(
            Facility,
            Medicine,
            Inventory
        )
        .join(
            Inventory,
            Inventory.facility_id == Facility.id
        )
        .join(
            Medicine,
            Inventory.medicine_id == Medicine.id
        )
        .all()
    )

    inventory_records = []

    for facility, medicine, inventory in records:

       inventory_records.append({
        "facility_code": facility.facility_code,

        "facility_name": facility.name,

        "district": facility.district,

        "state": facility.state,

        "latitude": float(facility.latitude),

        "longitude": float(facility.longitude),

        "medicine": medicine.name,

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
            inventory.incoming_quantity
        ),

        "lead_time_days": int(
            inventory.lead_time_days
        )
    })

    # Apply crisis demand to redistribution calculations
    for item in inventory_records:

        item["daily_consumption"] = (
            float(item["daily_consumption"])
            * (
                1
                + (
                    float(
                        scenario.demand_increase_percent
                    )
                    / 100
                )
            )
        )

        item["lead_time_days"] = (
            int(item["lead_time_days"])
            + int(
                scenario.supply_disruption_days
            )
        )

    engine = RedistributionEngine()

    result = engine.find_redistribution_opportunities(
        inventory_records=inventory_records
    )

    return {

        "scenario": {

            "demand_increase_percent":
                float(
                    scenario.demand_increase_percent
                ),

            "supply_disruption_days":
                int(
                    scenario.supply_disruption_days
                ),

            "staff_reduction_percent":
                float(
                    scenario.staff_reduction_percent
                ),

            "bed_occupancy_increase_percent":
                float(
                    scenario.bed_occupancy_increase_percent
                )
        },

        "redistribution": result
    }

@router.post("/intervention")
def simulate_intervention(
    scenario: CrisisScenario,
    db: Session = Depends(get_db)
):

    records = (
        db.query(
            Facility,
            Medicine,
            Inventory
        )
        .join(
            Inventory,
            Inventory.facility_id == Facility.id
        )
        .join(
            Medicine,
            Inventory.medicine_id == Medicine.id
        )
        .all()
    )

    inventory_records = []

    for facility, medicine, inventory in records:

        inventory_records.append({

            "facility_code":
                facility.facility_code,

            "facility_name":
                facility.name,

            "district":
                facility.district,

            "state":
                facility.state,

            "medicine":
                medicine.name,

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
        })

    simulator = InterventionSimulator()

    result = simulator.run(

        inventory_records=inventory_records,

        demand_increase_percent=(
            scenario.demand_increase_percent
        ),

        supply_disruption_days=(
            scenario.supply_disruption_days
        ),

        staff_reduction_percent=(
            scenario.staff_reduction_percent
        ),

        bed_occupancy_increase_percent=(
            scenario.bed_occupancy_increase_percent
        )
    )

    return {

        "scenario": {

            "demand_increase_percent":
                float(
                    scenario.demand_increase_percent
                ),

            "supply_disruption_days":
                int(
                    scenario.supply_disruption_days
                ),

            "staff_reduction_percent":
                float(
                    scenario.staff_reduction_percent
                ),

            "bed_occupancy_increase_percent":
                float(
                    scenario.bed_occupancy_increase_percent
                )
        },

        "intervention_analysis":
            result
    }
    
@router.post("/impact")
def crisis_impact(
    scenario: dict,
    db: Session = Depends(get_db)
):
    """
    Run a crisis scenario, apply optimized redistribution,
    and calculate before-vs-after resilience impact.
    """

    demand_increase_percent = float(
        scenario.get(
            "demand_increase_percent",
            0
        )
    )

    supply_disruption_days = int(
        scenario.get(
            "supply_disruption_days",
            0
        )
    )

    # ------------------------------------------------------------
    # LOAD INVENTORY
    # ------------------------------------------------------------

    inventory_records = []

    inventory_rows = (
        db.query(
            Inventory,
            Facility,
            Medicine
        )
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

    # ------------------------------------------------------------
    # BUILD CRISIS INVENTORY
    # ------------------------------------------------------------

    for inventory, facility, medicine in inventory_rows:

        daily_consumption = float(
            inventory.daily_consumption
        )

        crisis_daily_consumption = (
            daily_consumption *
            (
                1 +
                demand_increase_percent / 100
            )
        )

        crisis_lead_time = (
            int(inventory.lead_time_days)
            +
            supply_disruption_days
        )

        inventory_records.append({
            "facility_code": facility.facility_code,
            "facility_name": facility.name,
            "district": facility.district,
            "state": facility.state,

            "latitude": float(
                facility.latitude
            ),

            "longitude": float(
                facility.longitude
            ),

            "medicine": medicine.name,

            "current_stock": float(
                inventory.current_stock
            ),

            "daily_consumption": (
                crisis_daily_consumption
            ),

            "safety_stock": float(
                inventory.safety_stock
            ),

            "incoming_quantity": float(
                inventory.incoming_quantity
            ),

            "lead_time_days": (
                crisis_lead_time
            )
        })

    # ------------------------------------------------------------
    # REDISTRIBUTION
    # ------------------------------------------------------------

    redistribution_engine = RedistributionEngine()

    redistribution = (
        redistribution_engine
        .find_redistribution_opportunities(
            inventory_records
        )
    )

    recommendations = redistribution.get(
        "recommendations",
        []
    )

    # ------------------------------------------------------------
    # BEFORE / AFTER
    # ------------------------------------------------------------

    impact_engine = ImpactEngine()

    after_inventory, applied_transfers = (
        impact_engine.apply_redistribution(
            inventory_records=inventory_records,
            recommendations=recommendations
        )
    )
    

    
    # ... existing code that creates after_inventory ...

    # DEBUG: Verify redistribution actually changed inventory
    before_map = {
        (x["facility_code"], x["medicine"]): float(x.get("current_stock", 0))
        for x in inventory_records
    }

    after_map = {
        (x["facility_code"], x["medicine"]): float(x.get("current_stock", 0))
        for x in after_inventory
    }

    changed_nodes = []

    for key in before_map:
        before_stock = before_map[key]
        after_stock = after_map.get(key, before_stock)

        if abs(before_stock - after_stock) > 0.0001:
            changed_nodes.append({
                "facility_code": key[0],
                "medicine": key[1],
                "before": before_stock,
                "after": after_stock,
                "change": after_stock - before_stock
            })

    total_before = sum(before_map.values())
    total_after = sum(after_map.values())

    print("\n========== IMPACT DEBUG ==========")
    print("Total stock BEFORE:", total_before)
    print("Total stock AFTER :", total_after)
    print("Stock difference  :", total_after - total_before)
    print("Changed inventory nodes:", len(changed_nodes))

    for item in changed_nodes:
        print(item)

    print("==================================\n")


    impact = impact_engine.calculate_facility_impact(
        before_inventory=inventory_records,
        after_inventory=after_inventory
    )

    # ------------------------------------------------------------
    # RESPONSE
    # ------------------------------------------------------------

    return {
        "scenario": scenario,

        "redistribution": redistribution,

        "transfers_applied": {
            "count": len(applied_transfers),

            "total_units": round(
                sum(
                    transfer["quantity"]
                    for transfer in applied_transfers
                ),
                2
            ),

            "transfers": applied_transfers
        },

        "impact": impact
    }