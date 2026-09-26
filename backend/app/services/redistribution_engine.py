from typing import Dict, List
from collections import defaultdict

from app.services.optimization_engine import ResourceOptimizer


class RedistributionEngine:

    def __init__(self):
        self.optimizer = ResourceOptimizer()

    # ============================================================
    # MAIN NETWORK PREPARATION
    # ============================================================

    def prepare_network(
        self,
        inventory_records: List[Dict],
        critical_threshold: int = 5
    ) -> Dict:

        medicines: Dict[str, List[Dict]] = defaultdict(list)

        # --------------------------------------------------------
        # GROUP INVENTORY BY MEDICINE
        # --------------------------------------------------------

        for item in inventory_records:
            medicine = item["medicine"]
            medicines[medicine].append(item)

        recommendations = []

        # --------------------------------------------------------
        # PROCESS EACH MEDICINE
        # --------------------------------------------------------

        for medicine, records in medicines.items():

            donors = []
            recipients = []

            for item in records:

                facility_code = item["facility_code"]

                current_stock = max(
                    0.0,
                    float(item.get("current_stock", 0))
                )

                safety_stock = max(
                    0.0,
                    float(item.get("safety_stock", 0))
                )

                daily_consumption = max(
                    0.0,
                    float(item.get("daily_consumption", 0))
                )

                lead_time_days = max(
                    0,
                    int(item.get("lead_time_days", 0))
                )

                incoming_quantity = max(
                    0.0,
                    float(item.get("incoming_quantity", 0))
                )

                latitude = float(
                    item.get("latitude", 0)
                )

                longitude = float(
                    item.get("longitude", 0)
                )

                # ------------------------------------------------
                # REQUIRED STOCK
                # ------------------------------------------------

                required_stock = (
                    daily_consumption * lead_time_days
                    + safety_stock
                )

                # ------------------------------------------------
                # DAYS REMAINING
                # ------------------------------------------------

                if daily_consumption > 0:
                    days_remaining = (
                        current_stock /
                        daily_consumption
                    )
                else:
                    days_remaining = 999.0

                # ------------------------------------------------
                # SURPLUS
                # ------------------------------------------------

                surplus = max(
                    0.0,
                    current_stock - required_stock
                )

                # ------------------------------------------------
                # SHORTAGE
                # ------------------------------------------------

                shortage = max(
                    0.0,
                    required_stock - current_stock
                )

                # ------------------------------------------------
                # COMMON FACILITY DATA
                # ------------------------------------------------

                facility_data = {
                    "facility_code": facility_code,
                    "facility_name": item.get(
                        "facility_name",
                        facility_code
                    ),
                    "district": item.get(
                        "district",
                        ""
                    ),
                    "state": item.get(
                        "state",
                        ""
                    ),
                    "latitude": latitude,
                    "longitude": longitude,
                    "medicine": medicine,
                    "current_stock": current_stock,
                    "safety_stock": safety_stock,
                    "daily_consumption": daily_consumption,
                    "lead_time_days": lead_time_days,
                    "required_stock": required_stock,
                    "days_remaining": days_remaining,
                    "incoming_quantity": incoming_quantity
                }

                # ------------------------------------------------
                # DONOR
                # ------------------------------------------------

                if surplus > 0:

                    donors.append({
                        **facility_data,
                        "surplus": surplus
                    })

                # ------------------------------------------------
                # RECIPIENT
                # ------------------------------------------------

                elif shortage > 0:

                    recipients.append({
                        **facility_data,
                        "shortage": shortage
                    })

            # ----------------------------------------------------
            # HARD SAFETY CHECK
            # ----------------------------------------------------

            donor_codes = {
                d["facility_code"]
                for d in donors
            }

            recipient_codes = {
                r["facility_code"]
                for r in recipients
            }

            overlap = donor_codes & recipient_codes

            if overlap:

                raise RuntimeError(
                    f"Classification error for {medicine}: "
                    f"{sorted(overlap)}"
                )

            # ----------------------------------------------------
            # NOTHING TO TRANSFER
            # ----------------------------------------------------

            if not donors or not recipients:
                continue

            # ----------------------------------------------------
            # OPTIMIZATION
            # ----------------------------------------------------

            result = self.optimizer.optimize(
                donors=donors,
                recipients=recipients
            )

            allocations = result.get(
                "allocations",
                []
            )

            # ----------------------------------------------------
            # VALIDATE ALLOCATIONS
            # ----------------------------------------------------

            validated = self._validate_allocations(
                allocations=allocations,
                donors=donors,
                recipients=recipients,
                medicine=medicine
            )

            recommendations.extend(
                validated
            )

        # --------------------------------------------------------
        # FINAL SUMMARY
        # --------------------------------------------------------

        return self._summarize(
            recommendations
        )

    # ============================================================
    # VALIDATE OPTIMIZER OUTPUT
    # ============================================================

    def _validate_allocations(
        self,
        allocations: List[Dict],
        donors: List[Dict],
        recipients: List[Dict],
        medicine: str
    ) -> List[Dict]:

        donor_map = {
            d["facility_code"]: d
            for d in donors
        }

        recipient_map = {
            r["facility_code"]: r
            for r in recipients
        }

        # Track remaining capacity after each allocation
        remaining_surplus = {
            code: float(data["surplus"])
            for code, data in donor_map.items()
        }

        remaining_shortage = {
            code: float(data["shortage"])
            for code, data in recipient_map.items()
        }

        validated = []

        seen_transfers = set()

        for allocation in allocations:

            source = allocation.get(
                "source",
                {}
            )

            destination = allocation.get(
                "destination",
                {}
            )

            source_code = source.get(
                "facility_code"
            )

            destination_code = destination.get(
                "facility_code"
            )

            quantity = float(
                allocation.get(
                    "quantity",
                    0
                )
            )

            # ----------------------------------------------------
            # BASIC VALIDATION
            # ----------------------------------------------------

            if not source_code:
                continue

            if not destination_code:
                continue

            if source_code == destination_code:
                continue

            if quantity <= 0:
                continue

            # ----------------------------------------------------
            # CHECK MEDICINE
            # ----------------------------------------------------

            allocation_medicine = allocation.get(
                "medicine",
                medicine
            )

            if allocation_medicine != medicine:
                continue

            # ----------------------------------------------------
            # CHECK SOURCE
            # ----------------------------------------------------

            if source_code not in donor_map:
                continue

            # ----------------------------------------------------
            # CHECK DESTINATION
            # ----------------------------------------------------

            if destination_code not in recipient_map:
                continue

            # ----------------------------------------------------
            # DUPLICATE TRANSFER CHECK
            # ----------------------------------------------------

            transfer_key = (
                medicine,
                source_code,
                destination_code
            )

            if transfer_key in seen_transfers:
                continue

            # ----------------------------------------------------
            # SOURCE SURPLUS CHECK
            # ----------------------------------------------------

            available_surplus = remaining_surplus[
                source_code
            ]

            if quantity > available_surplus:

                quantity = available_surplus

            # ----------------------------------------------------
            # DESTINATION SHORTAGE CHECK
            # ----------------------------------------------------

            available_shortage = remaining_shortage[
                destination_code
            ]

            if quantity > available_shortage:

                quantity = available_shortage

            # ----------------------------------------------------
            # FINAL QUANTITY CHECK
            # ----------------------------------------------------

            if quantity <= 0:
                continue

            # ----------------------------------------------------
            # UPDATE REMAINING CAPACITY
            # ----------------------------------------------------

            remaining_surplus[
                source_code
            ] -= quantity

            remaining_shortage[
                destination_code
            ] -= quantity

            # Prevent floating-point residue
            remaining_surplus[
                source_code
            ] = max(
                0.0,
                remaining_surplus[source_code]
            )

            remaining_shortage[
                destination_code
            ] = max(
                0.0,
                remaining_shortage[destination_code]
            )

            seen_transfers.add(
                transfer_key
            )

            # ----------------------------------------------------
            # NORMALIZE OUTPUT
            # ----------------------------------------------------

            allocation["medicine"] = medicine

            allocation["quantity"] = float(
                round(quantity, 2)
            )

            # ----------------------------------------------------
            # EXPLAINABILITY DATA
            # ----------------------------------------------------

            source_data = donor_map[source_code]
            destination_data = recipient_map[destination_code]

            allocation["reasoning"] = {
                "source": {
                    "current_stock": float(
                        source_data["current_stock"]
                    ),
                    "required_stock": float(
                        source_data["required_stock"]
                    ),
                    "surplus": float(
                        source_data["surplus"]
                    ),
                    "safety_stock": float(
                        source_data["safety_stock"]
                    ),
                    "daily_consumption": float(
                        source_data["daily_consumption"]
                    ),
                    "lead_time_days": int(
                        source_data["lead_time_days"]
                    ),
                    "days_remaining": float(
                        source_data["days_remaining"]
                    ),
                    "incoming_quantity": float(
                        source_data["incoming_quantity"]
                    ),
                },

                "destination": {
                    "current_stock": float(
                        destination_data["current_stock"]
                    ),
                    "required_stock": float(
                        destination_data["required_stock"]
                    ),
                    "shortage": float(
                        destination_data["shortage"]
                    ),
                    "safety_stock": float(
                        destination_data["safety_stock"]
                    ),
                    "daily_consumption": float(
                        destination_data["daily_consumption"]
                    ),
                    "lead_time_days": int(
                        destination_data["lead_time_days"]
                    ),
                    "days_remaining": float(
                        destination_data["days_remaining"]
                    ),
                    "incoming_quantity": float(
                        destination_data["incoming_quantity"]
                    ),
                },

                "transfer": {
                    "quantity": float(
                        round(quantity, 2)
                    ),
                    "distance_km": float(
                        round(
                            float(
                                allocation.get(
                                    "distance_km",
                                    0
                                )
                            ),
                            2
                        )
                    ),
                },
            }

            if "distance_km" in allocation:

                allocation["distance_km"] = float(
                    round(
                        float(
                            allocation["distance_km"]
                        ),
                        2
                    )
                )

            validated.append(
                allocation
            )

        return validated

    # ============================================================
    # SUMMARY
    # ============================================================

    def _summarize(
        self,
        recommendations: List[Dict]
    ) -> Dict:

        total_units = sum(
            float(
                item.get(
                    "quantity",
                    0
                )
            )
            for item in recommendations
        )

        source_facilities = len({
            item["source"]["facility_code"]
            for item in recommendations
            if item.get("source")
        })

        destination_facilities = len({
            item["destination"]["facility_code"]
            for item in recommendations
            if item.get("destination")
        })

        medicines = len({
            item["medicine"]
            for item in recommendations
            if item.get("medicine")
        })

        return {
            "summary": {

                "total_recommendations": int(
                    len(recommendations)
                ),

                "total_units_to_transfer": float(
                    round(
                        total_units,
                        2
                    )
                ),

                "source_facilities": int(
                    source_facilities
                ),

                "destination_facilities": int(
                    destination_facilities
                ),

                "medicines_covered": int(
                    medicines
                )
            },

            "recommendations": recommendations
        }

    # ============================================================
    # PUBLIC METHOD
    # ============================================================

    def find_redistribution_opportunities(
        self,
        inventory_records: List[Dict],
        critical_threshold: int = 5
    ) -> Dict:

        return self.prepare_network(
            inventory_records=inventory_records,
            critical_threshold=critical_threshold
        )