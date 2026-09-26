from typing import Dict, List

from app.services.crisis_simulator import CrisisSimulator
from app.services.redistribution_engine import RedistributionEngine


class InterventionSimulator:

    def __init__(self):
        self.crisis_simulator = CrisisSimulator()
        self.redistribution_engine = RedistributionEngine()

    def run(
        self,
        inventory_records: List[Dict],
        demand_increase_percent: float,
        supply_disruption_days: int,
        staff_reduction_percent: float,
        bed_occupancy_increase_percent: float
    ) -> Dict:

        # ==========================================
        # STEP 1 — APPLY CRISIS CONDITIONS
        # ==========================================

        crisis_records = []

        for item in inventory_records:

            crisis_records.append({
                **item,

                "daily_consumption": (
                    float(item["daily_consumption"])
                    * (
                        1
                        + (
                            float(demand_increase_percent)
                            / 100
                        )
                    )
                ),

                "lead_time_days": (
                    int(item["lead_time_days"])
                    + int(supply_disruption_days)
                )
            })

        # ==========================================
        # STEP 2 — BASELINE / BEFORE INTERVENTION
        # ==========================================

        before_medicine = (
            self.crisis_simulator.simulate_inventory(
                inventory_records=crisis_records,
                demand_increase_percent=0,
                supply_disruption_days=0
            )
        )

        before_facilities = self._calculate_facilities(
            crisis_records,
            before_medicine["results"],
            staff_reduction_percent,
            bed_occupancy_increase_percent
        )

        before_summary = self._network_summary(
            before_medicine,
            before_facilities
        )

        # ==========================================
        # STEP 3 — FIND REDISTRIBUTION
        # ==========================================

        redistribution = (
            self.redistribution_engine
            .find_redistribution_opportunities(
                inventory_records=crisis_records
            )
        )

        # ==========================================
        # STEP 4 — APPLY TRANSFERS
        # ==========================================

        after_records = [
            dict(item)
            for item in crisis_records
        ]

        applied_transfers = []

        for recommendation in redistribution[
            "recommendations"
        ]:

            source_code = (
                recommendation["source"]["facility_code"]
            )

            destination_code = (
                recommendation[
                    "destination"
                ]["facility_code"]
            )

            medicine = recommendation["medicine"]

            quantity = float(
                recommendation["transfer_quantity"]
            )

            source_item = next(
                (
                    item
                    for item in after_records
                    if (
                        item["facility_code"]
                        == source_code
                        and item["medicine"]
                        == medicine
                    )
                ),
                None
            )

            destination_item = next(
                (
                    item
                    for item in after_records
                    if (
                        item["facility_code"]
                        == destination_code
                        and item["medicine"]
                        == medicine
                    )
                ),
                None
            )

            if (
                source_item is None
                or destination_item is None
            ):
                continue

            # Don't transfer more than the source actually has
            safe_quantity = min(
                quantity,
                max(
                    0,
                    float(source_item["current_stock"])
                    - float(source_item["safety_stock"])
                )
            )

            if safe_quantity <= 0:
                continue

            source_item["current_stock"] = (
                float(source_item["current_stock"])
                - safe_quantity
            )

            destination_item["current_stock"] = (
                float(destination_item["current_stock"])
                + safe_quantity
            )

            applied_transfers.append({

                "medicine": medicine,

                "source_facility":
                    source_code,

                "destination_facility":
                    destination_code,

                "quantity": float(
                    round(safe_quantity, 2)
                )
            })

        # ==========================================
        # STEP 5 — AFTER INTERVENTION
        # ==========================================

        after_medicine = (
            self.crisis_simulator.simulate_inventory(
                inventory_records=after_records,
                demand_increase_percent=0,
                supply_disruption_days=0
            )
        )

        after_facilities = self._calculate_facilities(
            after_records,
            after_medicine["results"],
            staff_reduction_percent,
            bed_occupancy_increase_percent
        )

        after_summary = self._network_summary(
            after_medicine,
            after_facilities
        )

        # ==========================================
        # STEP 6 — IMPACT
        # ==========================================

        critical_before = (
            before_summary["critical_facilities"]
        )

        critical_after = (
            after_summary["critical_facilities"]
        )

        at_risk_before = (
            before_summary["at_risk_facilities"]
        )

        at_risk_after = (
            after_summary["at_risk_facilities"]
        )

        stockout_before = (
            before_summary["stockout_risk_nodes"]
        )

        stockout_after = (
            after_summary["stockout_risk_nodes"]
        )

        return {

            "before_intervention": before_summary,

            "intervention": {

                "recommendations_generated":
                    int(
                        len(
                            redistribution[
                                "recommendations"
                            ]
                        )
                    ),

                "transfers_applied":
                    int(
                        len(applied_transfers)
                    ),

                "total_units_transferred":
                    float(
                        round(
                            sum(
                                item["quantity"]
                                for item in applied_transfers
                            ),
                            2
                        )
                    ),

                "transfers":
                    applied_transfers
            },

            "after_intervention": after_summary,

            "impact": {

                "critical_facilities_reduced":
                    int(
                        critical_before
                        - critical_after
                    ),

                "at_risk_facilities_reduced":
                    int(
                        at_risk_before
                        - at_risk_after
                    ),

                "stockout_nodes_reduced":
                    int(
                        stockout_before
                        - stockout_after
                    ),

                "critical_facilities_before":
                    int(critical_before),

                "critical_facilities_after":
                    int(critical_after),

                "stockout_nodes_before":
                    int(stockout_before),

                "stockout_nodes_after":
                    int(stockout_after)
            }
        }

    def _calculate_facilities(
        self,
        inventory_records,
        medicine_results,
        staff_reduction_percent,
        bed_occupancy_increase_percent
    ):

        facility_data = {}

        for item in inventory_records:

            code = item["facility_code"]

            if code not in facility_data:

                # Facility data is not present in the
                # inventory service records.
                #
                # For now we calculate medicine-level
                # resilience here.

                facility_data[code] = {
                    "facility_code": code,
                    "facility_name": item["facility_name"],
                    "district": item["district"],
                    "state": item["state"]
                }

        results = []

        for code, facility in facility_data.items():

            medicines = [
                item
                for item in medicine_results
                if item["facility_code"] == code
            ]

            if medicines:

                medicine_risk = max(
                    item["risk_score"]
                    for item in medicines
                )

            else:

                medicine_risk = 0

            # Since this layer doesn't have direct
            # facility bed/staff fields, medicine
            # resilience is used as the intervention
            # comparison signal.

            facility_risk = float(
                medicine_risk
            )

            if facility_risk >= 50:
                status = "CRITICAL"

            elif facility_risk >= 20:
                status = "AT_RISK"

            else:
                status = "HEALTHY"

            results.append({

                **facility,

                "facility_risk_score":
                    float(facility_risk),

                "status":
                    status
            })

        return results

    def _network_summary(
        self,
        medicine_simulation,
        facility_results
    ):

        critical_facilities = sum(
            1
            for item in facility_results
            if item["status"] == "CRITICAL"
        )

        at_risk_facilities = sum(
            1
            for item in facility_results
            if item["status"] == "AT_RISK"
        )

        healthy_facilities = sum(
            1
            for item in facility_results
            if item["status"] == "HEALTHY"
        )

        stockout_nodes = sum(
            1
            for item in medicine_simulation["results"]
            if item[
                "stockout_before_replenishment"
            ]
        )

        safety_breach_nodes = sum(
            1
            for item in medicine_simulation["results"]
            if item["safety_stock_breach"]
        )

        total_facilities = len(
            facility_results
        )

        average_risk = (
            sum(
                item["facility_risk_score"]
                for item in facility_results
            )
            / total_facilities
            if total_facilities > 0
            else 0
        )

        return {

            "total_facilities":
                int(total_facilities),

            "healthy_facilities":
                int(healthy_facilities),

            "at_risk_facilities":
                int(at_risk_facilities),

            "critical_facilities":
                int(critical_facilities),

            "stockout_risk_nodes":
                int(stockout_nodes),

            "safety_stock_breach_nodes":
                int(safety_breach_nodes),

            "average_facility_risk":
                float(
                    round(
                        average_risk,
                        2
                    )
                )
        }