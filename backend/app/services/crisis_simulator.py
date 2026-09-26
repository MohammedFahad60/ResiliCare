from typing import Dict, List


class CrisisSimulator:

    def simulate_inventory(
        self,
        inventory_records: List[Dict],
        demand_increase_percent: float = 0,
        supply_disruption_days: int = 0
    ) -> Dict:

        results = []

        for item in inventory_records:

            current_stock = float(item["current_stock"])
            daily_consumption = float(item["daily_consumption"])
            safety_stock = float(item["safety_stock"])
            incoming_quantity = float(item["incoming_quantity"])
            lead_time_days = int(item["lead_time_days"])

            # Apply crisis demand multiplier
            demand_multiplier = 1 + (
                float(demand_increase_percent) / 100
            )

            crisis_daily_consumption = (
                daily_consumption * demand_multiplier
            )

            # Crisis increases supply lead time
            crisis_lead_time = (
                lead_time_days + int(supply_disruption_days)
            )

            # Demand during crisis lead time
            crisis_demand_during_lead_time = (
                crisis_daily_consumption * crisis_lead_time
            )

            # Projected stock when replenishment arrives
            projected_stock = (
                current_stock
                - crisis_demand_during_lead_time
                + incoming_quantity
            )

            # Days until stockout under crisis
            if crisis_daily_consumption > 0:
                days_until_stockout = (
                    current_stock / crisis_daily_consumption
                )
            else:
                days_until_stockout = None

            stockout_before_replenishment = bool(
                days_until_stockout is not None
                and days_until_stockout < crisis_lead_time
            )

            safety_stock_breach = bool(
                projected_stock < safety_stock
            )

            # Crisis risk score
            risk_score = 0

            if stockout_before_replenishment:
                risk_score += 60

            if safety_stock_breach:
                risk_score += 20

            if (
                days_until_stockout is not None
                and days_until_stockout <= 2
            ):
                risk_score += 20

            elif (
                days_until_stockout is not None
                and days_until_stockout <= 5
            ):
                risk_score += 10

            risk_score = int(min(risk_score, 100))

            if risk_score >= 50:
                status = "CRITICAL"

            elif risk_score >= 20:
                status = "AT_RISK"

            else:
                status = "HEALTHY"

            results.append({
                "facility_code": str(item["facility_code"]),
                "facility_name": str(item["facility_name"]),
                "district": str(item["district"]),
                "state": str(item["state"]),
                "medicine": str(item["medicine"]),

                "current_stock": float(current_stock),

                "normal_daily_consumption": float(
                    daily_consumption
                ),

                "crisis_daily_consumption": float(
                    round(crisis_daily_consumption, 2)
                ),

                "crisis_lead_time_days": int(
                    crisis_lead_time
                ),

                "projected_stock": float(
                    round(projected_stock, 2)
                ),

                "days_until_stockout": (
                    float(round(days_until_stockout, 2))
                    if days_until_stockout is not None
                    else None
                ),

                "stockout_before_replenishment": bool(
                    stockout_before_replenishment
                ),

                "safety_stock_breach": bool(
                    safety_stock_breach
                ),

                "risk_score": int(risk_score),

                "status": str(status)
            })

        return self._summarize(results)

    def _summarize(self, results: List[Dict]) -> Dict:

        total = len(results)

        healthy = sum(
            1 for item in results
            if item["status"] == "HEALTHY"
        )

        at_risk = sum(
            1 for item in results
            if item["status"] == "AT_RISK"
        )

        critical = sum(
            1 for item in results
            if item["status"] == "CRITICAL"
        )

        stockout_risk = sum(
            1 for item in results
            if item["stockout_before_replenishment"]
        )

        safety_breach = sum(
            1 for item in results
            if item["safety_stock_breach"]
        )

        average_risk = (
            sum(item["risk_score"] for item in results) / total
            if total > 0
            else 0
        )

        return {
            "network_summary": {
                "total_inventory_nodes": int(total),
                "healthy": int(healthy),
                "at_risk": int(at_risk),
                "critical": int(critical),
                "stockout_risk_nodes": int(stockout_risk),
                "safety_stock_breach_nodes": int(safety_breach),
                "average_risk_score": float(
                    round(average_risk, 2)
                )
            },

            "results": results
        }
    
    def calculate_facility_resilience(
        self,
        total_beds,
        occupied_beds,
        doctors_total,
        doctors_available,
        nurses_total,
        nurses_available,
        bed_occupancy_increase_percent,
        staff_reduction_percent,
        medicine_risk_score
    ):

        total_beds = max(int(total_beds), 1)
        occupied_beds = max(int(occupied_beds), 0)

        doctors_total = max(int(doctors_total), 1)
        doctors_available = max(int(doctors_available), 0)

        nurses_total = max(int(nurses_total), 1)
        nurses_available = max(int(nurses_available), 0)

        # -------------------------
        # BED PRESSURE
        # -------------------------

        occupancy_multiplier = (
            1 + (
                float(bed_occupancy_increase_percent) / 100
            )
        )

        projected_occupied_beds = (
            occupied_beds * occupancy_multiplier
        )

        projected_occupancy = (
            projected_occupied_beds / total_beds
        ) * 100

        if projected_occupancy >= 100:
            bed_risk = 100

        elif projected_occupancy >= 90:
            bed_risk = 80

        elif projected_occupancy >= 75:
            bed_risk = 50

        elif projected_occupancy >= 60:
            bed_risk = 25

        else:
            bed_risk = 10

        # -------------------------
        # STAFF PRESSURE
        # -------------------------

        doctor_availability = (
            doctors_available / doctors_total
        )

        nurse_availability = (
            nurses_available / nurses_total
        )

        current_staff_availability = (
            doctor_availability * 0.5
            + nurse_availability * 0.5
        )

        crisis_staff_availability = (
            current_staff_availability
            * (
                1 - (
                    float(staff_reduction_percent) / 100
                )
            )
        )

        staff_risk = (
            (1 - crisis_staff_availability) * 100
        )

        staff_risk = min(
            max(staff_risk, 0),
            100
        )

        # -------------------------
        # OVERALL FACILITY RISK
        # -------------------------

        facility_risk = (
            medicine_risk_score * 0.5
            + bed_risk * 0.3
            + staff_risk * 0.2
        )

        facility_risk = min(
            max(facility_risk, 0),
            100
        )

        facility_risk = round(
            facility_risk,
            2
        )

        if facility_risk >= 70:
            status = "CRITICAL"

        elif facility_risk >= 40:
            status = "AT_RISK"

        else:
            status = "HEALTHY"

        return {
            "projected_occupied_beds": float(
                round(projected_occupied_beds, 2)
            ),

            "projected_occupancy_percent": float(
                round(projected_occupancy, 2)
            ),

            "bed_risk_score": int(
                round(bed_risk)
            ),

            "crisis_staff_availability_percent": float(
                round(
                    crisis_staff_availability * 100,
                    2
                )
            ),

            "staff_risk_score": int(
                round(staff_risk)
            ),

            "medicine_risk_score": int(
                medicine_risk_score
            ),

            "facility_risk_score": float(
                facility_risk
            ),

            "status": str(status)
        }   
    
        
        