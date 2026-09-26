from typing import Dict, List
from collections import defaultdict


class ImpactEngine:

    # ============================================================
    # APPLY REDISTRIBUTION
    # ============================================================

    def apply_redistribution(
        self,
        inventory_records: List[Dict],
        recommendations: List[Dict]
    ) -> tuple:

        inventory = []

        for item in inventory_records:

            copied_item = dict(item)

            copied_item["current_stock"] = float(
                item.get("current_stock", 0)
            )

            copied_item["daily_consumption"] = float(
                item.get("daily_consumption", 0)
            )

            copied_item["safety_stock"] = float(
                item.get("safety_stock", 0)
            )

            copied_item["lead_time_days"] = int(
                item.get("lead_time_days", 0)
            )

            inventory.append(copied_item)

        inventory_map = {
            (
                item["facility_code"],
                item["medicine"]
            ): item
            for item in inventory
        }

        applied_transfers = []

        for recommendation in recommendations:

            medicine = recommendation.get("medicine")

            quantity = float(
                recommendation.get(
                    "quantity",
                    0
                )
            )

            source = recommendation.get(
                "source",
                {}
            )

            destination = recommendation.get(
                "destination",
                {}
            )

            source_code = source.get(
                "facility_code"
            )

            destination_code = destination.get(
                "facility_code"
            )

            if not medicine:
                continue

            if not source_code or not destination_code:
                continue

            if source_code == destination_code:
                continue

            if quantity <= 0:
                continue

            source_item = inventory_map.get(
                (
                    source_code,
                    medicine
                )
            )

            destination_item = inventory_map.get(
                (
                    destination_code,
                    medicine
                )
            )

            if source_item is None:
                continue

            if destination_item is None:
                continue

            # ----------------------------------------------------
            # NEVER TRANSFER MORE THAN SOURCE HAS
            # ----------------------------------------------------

            actual_quantity = min(
                quantity,
                source_item["current_stock"]
            )

            if actual_quantity <= 0:
                continue

            source_item["current_stock"] -= (
                actual_quantity
            )

            destination_item["current_stock"] += (
                actual_quantity
            )

            applied_transfers.append({
                "medicine": medicine,
                "source_facility": source_code,
                "destination_facility": destination_code,
                "quantity": round(
                    actual_quantity,
                    2
                )
            })

        return inventory, applied_transfers

    # ============================================================
    # MEDICINE RISK
    # ============================================================

    def calculate_inventory_risk(
        self,
        inventory_records: List[Dict]
    ) -> List[Dict]:

        results = []

        for item in inventory_records:

            current_stock = max(
                0.0,
                float(
                    item.get(
                        "current_stock",
                        0
                    )
                )
            )

            daily_consumption = max(
                0.0,
                float(
                    item.get(
                        "daily_consumption",
                        0
                    )
                )
            )

            safety_stock = max(
                0.0,
                float(
                    item.get(
                        "safety_stock",
                        0
                    )
                )
            )

            lead_time_days = max(
                0,
                int(
                    item.get(
                        "lead_time_days",
                        0
                    )
                )
            )

            # ----------------------------------------------------
            # DAYS REMAINING
            # ----------------------------------------------------

            if daily_consumption > 0:

                days_remaining = (
                    current_stock /
                    daily_consumption
                )

            else:

                days_remaining = 999.0

            # ----------------------------------------------------
            # REQUIRED STOCK
            # ----------------------------------------------------

            required_stock = (
                daily_consumption *
                lead_time_days
                + safety_stock
            )

            # ----------------------------------------------------
            # PROJECTED STOCK AT REPLENISHMENT
            # ----------------------------------------------------

            projected_stock = (
                current_stock -
                (
                    daily_consumption *
                    lead_time_days
                )
            )

            # ----------------------------------------------------
            # STOCKOUT
            # ----------------------------------------------------

            stockout = (
                projected_stock <= 0
            )

            # ----------------------------------------------------
            # SAFETY STOCK
            # ----------------------------------------------------

            safety_breach = (
                current_stock < safety_stock
            )

            # ----------------------------------------------------
            # CONTINUOUS RISK SCORE
            #
            # Instead of only using 70/20/20 jumps, calculate
            # shortage severity continuously.
            # ----------------------------------------------------

            if required_stock > 0:

                coverage_ratio = (
                    current_stock /
                    required_stock
                )

            else:

                coverage_ratio = 1.0

            coverage_ratio = max(
                0.0,
                min(
                    coverage_ratio,
                    1.5
                )
            )

            # ----------------------------------------------------
            # BASE RISK
            # ----------------------------------------------------

            if coverage_ratio >= 1.0:

                risk_score = 0.0

            else:

                shortage_ratio = (
                    1.0 -
                    coverage_ratio
                )

                risk_score = (
                    shortage_ratio *
                    100
                )

            # ----------------------------------------------------
            # STOCKOUT PENALTY
            # ----------------------------------------------------

# ----------------------------------------------------
# STOCKOUT SEVERITY
# ----------------------------------------------------
# Do not use a hard stockout floor.
# A facility that is deeply below replenishment
# requirement should have higher risk than one
# that is only slightly below it.
#
# This allows redistribution to produce a measurable
# reduction in risk even when both nodes remain
# technically in stockout status.

            if stockout and lead_time_days > 0:

                stockout_gap = max(
                    0.0,
                    lead_time_days - days_remaining
                )

                stockout_severity = (
                    stockout_gap /
                    lead_time_days
                )

                stockout_penalty = min(
                    20.0,
                    stockout_severity * 20.0
                )

                risk_score += stockout_penalty


            # ----------------------------------------------------
            # SAFETY STOCK PENALTY
            # ----------------------------------------------------

            if safety_breach:

                risk_score += 5.0


            # ----------------------------------------------------
            # LEAD-TIME PRESSURE
            # ----------------------------------------------------

            if lead_time_days > 0:

                if days_remaining <= lead_time_days:

                    lead_time_pressure = (
                        lead_time_days -
                        days_remaining
                    ) / lead_time_days

                    lead_time_penalty = min(
                        10.0,
                        max(0.0, lead_time_pressure * 10.0)
                    )

                    risk_score += lead_time_penalty

                elif days_remaining <= lead_time_days * 1.5:

                    risk_score += 2.5

            # ----------------------------------------------------
            # CAP
            # ----------------------------------------------------

            risk_score = min(
                100.0,
                risk_score
            )

            # ----------------------------------------------------
            # STATUS
            # ----------------------------------------------------

            if risk_score >= 70:

                status = "CRITICAL"

            elif risk_score >= 40:

                status = "AT_RISK"

            else:

                status = "HEALTHY"

            results.append({
                **item,

                "current_stock": round(
                    current_stock,
                    2
                ),

                "required_stock": round(
                    required_stock,
                    2
                ),

                "coverage_ratio": round(
                    coverage_ratio,
                    3
                ),

                "days_remaining": round(
                    days_remaining,
                    2
                ),

                "projected_stock": round(
                    projected_stock,
                    2
                ),

                "stockout_before_replenishment": bool(
                    stockout
                ),

                "safety_stock_breach": bool(
                    safety_breach
                ),

                "risk_score": round(
                    risk_score,
                    2
                ),

                "status": status
            })

        return results

    # ============================================================
    # FACILITY IMPACT
    # ============================================================
    
        # ============================================================
    # MEDICINE-LEVEL IMPACT
    # ============================================================

    def calculate_medicine_impact(
        self,
        before_risk: List[Dict],
        after_risk: List[Dict]
    ) -> List[Dict]:

        before_map = {
            (
                item["facility_code"],
                item["medicine"]
            ): item
            for item in before_risk
        }

        after_map = {
            (
                item["facility_code"],
                item["medicine"]
            ): item
            for item in after_risk
        }

        changes = []

        all_keys = set(before_map.keys()) | set(after_map.keys())

        for key in all_keys:

            before = before_map.get(key)
            after = after_map.get(key)

            if not before or not after:
                continue

            stock_before = float(
                before.get("current_stock", 0)
            )

            stock_after = float(
                after.get("current_stock", 0)
            )

            stock_change = stock_after - stock_before

            # Only include nodes whose inventory actually changed
            if abs(stock_change) < 0.0001:
                continue

            risk_before = float(
                before.get("risk_score", 0)
            )

            risk_after = float(
                after.get("risk_score", 0)
            )

            coverage_before = float(
                before.get("coverage_ratio", 0)
            )

            coverage_after = float(
                after.get("coverage_ratio", 0)
            )

            changes.append({
                "facility_code": key[0],
                "medicine": key[1],

                "stock_before": round(
                    stock_before, 2
                ),

                "stock_after": round(
                    stock_after, 2
                ),

                "stock_change": round(
                    stock_change, 2
                ),

                "coverage_before": round(
                    coverage_before, 3
                ),

                "coverage_after": round(
                    coverage_after, 3
                ),

                "coverage_improvement": round(
                    coverage_after - coverage_before,
                    3
                ),

                "risk_before": round(
                    risk_before, 2
                ),

                "risk_after": round(
                    risk_after, 2
                ),

                "risk_reduction": round(
                    risk_before - risk_after,
                    2
                ),

                "status_before": before.get(
                    "status"
                ),

                "status_after": after.get(
                    "status"
                ),

                "stockout_before": bool(
                    before.get(
                        "stockout_before_replenishment",
                        False
                    )
                ),

                "stockout_after": bool(
                    after.get(
                        "stockout_before_replenishment",
                        False
                    )
                )
            })

        changes.sort(
            key=lambda x: x["risk_reduction"],
            reverse=True
        )

        return changes

    def calculate_facility_impact(
        self,
        before_inventory: List[Dict],
        after_inventory: List[Dict]
    ) -> Dict:

        before_risk = self.calculate_inventory_risk(
            before_inventory
        )

        after_risk = self.calculate_inventory_risk(
            after_inventory
        )
        
        medicine_impact = self.calculate_medicine_impact(
            before_risk,
            after_risk
        )

        before_facilities = self._aggregate_facilities(
            before_risk
        )

        after_facilities = self._aggregate_facilities(
            after_risk
        )

        # --------------------------------------------------------
        # NODE COUNTS
        # --------------------------------------------------------

        before_critical_nodes = sum(
            1
            for item in before_risk
            if item["status"] == "CRITICAL"
        )

        after_critical_nodes = sum(
            1
            for item in after_risk
            if item["status"] == "CRITICAL"
        )

        before_at_risk_nodes = sum(
            1
            for item in before_risk
            if item["status"] == "AT_RISK"
        )

        after_at_risk_nodes = sum(
            1
            for item in after_risk
            if item["status"] == "AT_RISK"
        )

        # --------------------------------------------------------
        # STOCKOUT NODES
        # --------------------------------------------------------

        before_stockouts = sum(
            1
            for item in before_risk
            if item[
                "stockout_before_replenishment"
            ]
        )

        after_stockouts = sum(
            1
            for item in after_risk
            if item[
                "stockout_before_replenishment"
            ]
        )

        # --------------------------------------------------------
        # SAFETY STOCK BREACHES
        # --------------------------------------------------------

        before_safety = sum(
            1
            for item in before_risk
            if item[
                "safety_stock_breach"
            ]
        )

        after_safety = sum(
            1
            for item in after_risk
            if item[
                "safety_stock_breach"
            ]
        )

        # --------------------------------------------------------
        # AVERAGE RISK
        # --------------------------------------------------------

        before_average_risk = self._average_risk(
            before_risk
        )

        after_average_risk = self._average_risk(
            after_risk
        )

        # --------------------------------------------------------
        # AVERAGE STOCK COVERAGE
        # --------------------------------------------------------

        before_coverage = self._average_coverage(
            before_risk
        )

        after_coverage = self._average_coverage(
            after_risk
        )

        # --------------------------------------------------------
        # FACILITY IMPROVEMENT
        # --------------------------------------------------------

        improved_facilities = 0
        worsened_facilities = 0
        unchanged_facilities = 0

        facility_comparison = []

        all_facilities = set(
            before_facilities.keys()
        ) | set(
            after_facilities.keys()
        )

        for facility_code in all_facilities:

            before = before_facilities.get(
                facility_code
            )

            after = after_facilities.get(
                facility_code
            )

            before_risk_score = (
                before["average_risk_score"]
                if before
                else 0.0
            )

            after_risk_score = (
                after["average_risk_score"]
                if after
                else 0.0
            )

            change = (
                before_risk_score -
                after_risk_score
            )

            if change > 0.01:

                improved_facilities += 1

            elif change < -0.01:

                worsened_facilities += 1

            else:

                unchanged_facilities += 1

            facility_comparison.append({
                "facility_code": facility_code,

                "facility_name": (
                    after or before
                ).get(
                    "facility_name",
                    facility_code
                ),

                "district": (
                    after or before
                ).get(
                    "district",
                    ""
                ),

                "state": (
                    after or before
                ).get(
                    "state",
                    ""
                ),

                "risk_before": round(
                    before_risk_score,
                    2
                ),

                "risk_after": round(
                    after_risk_score,
                    2
                ),

                "risk_reduction": round(
                    change,
                    2
                )
            })

        # --------------------------------------------------------
        # SORT IMPROVEMENTS
        # --------------------------------------------------------

        facility_comparison.sort(
            key=lambda x: x["risk_reduction"],
            reverse=True
        )

        # --------------------------------------------------------
        # RISK IMPROVEMENT
        # --------------------------------------------------------

        risk_reduction = (
            before_average_risk -
            after_average_risk
        )

        if before_average_risk > 0:

            risk_improvement_percent = (
                risk_reduction /
                before_average_risk
            ) * 100

        else:

            risk_improvement_percent = 0.0

        # --------------------------------------------------------
        # COVERAGE IMPROVEMENT
        # --------------------------------------------------------

        coverage_improvement = (
            after_coverage -
            before_coverage
        )

        # --------------------------------------------------------
        # RESULT
        # --------------------------------------------------------

        return {
            "before": {
                "critical_facilities": sum(
                    1
                    for f in before_facilities.values()
                    if f["status"] == "CRITICAL"
                ),

                "at_risk_facilities": sum(
                    1
                    for f in before_facilities.values()
                    if f["status"] == "AT_RISK"
                ),

                "healthy_facilities": sum(
                    1
                    for f in before_facilities.values()
                    if f["status"] == "HEALTHY"
                ),

                "critical_inventory_nodes": (
                    before_critical_nodes
                ),

                "at_risk_inventory_nodes": (
                    before_at_risk_nodes
                ),

                "stockout_nodes": before_stockouts,

                "safety_stock_breaches": (
                    before_safety
                ),

                "average_risk_score": round(
                    before_average_risk,
                    2
                ),

                "average_stock_coverage": round(
                    before_coverage,
                    3
                )
            },

            "after": {
                "critical_facilities": sum(
                    1
                    for f in after_facilities.values()
                    if f["status"] == "CRITICAL"
                ),

                "at_risk_facilities": sum(
                    1
                    for f in after_facilities.values()
                    if f["status"] == "AT_RISK"
                ),

                "healthy_facilities": sum(
                    1
                    for f in after_facilities.values()
                    if f["status"] == "HEALTHY"
                ),

                "critical_inventory_nodes": (
                    after_critical_nodes
                ),

                "at_risk_inventory_nodes": (
                    after_at_risk_nodes
                ),

                "stockout_nodes": after_stockouts,

                "safety_stock_breaches": (
                    after_safety
                ),

                "average_risk_score": round(
                    after_average_risk,
                    2
                ),

                "average_stock_coverage": round(
                    after_coverage,
                    3
                )
            },

            "impact": {
                "critical_inventory_nodes_reduced": (
                    before_critical_nodes -
                    after_critical_nodes
                ),

                "at_risk_inventory_nodes_reduced": (
                    before_at_risk_nodes -
                    after_at_risk_nodes
                ),

                "stockout_nodes_reduced": (
                    before_stockouts -
                    after_stockouts
                ),

                "safety_stock_breaches_reduced": (
                    before_safety -
                    after_safety
                ),

                "average_risk_reduction": round(
                    risk_reduction,
                    2
                ),

                "risk_improvement_percent": round(
                    risk_improvement_percent,
                    2
                ),

                "average_stock_coverage_improvement": round(
                    coverage_improvement,
                    5
                ),

                "facilities_improved": (
                    improved_facilities
                ),

                "facilities_worsened": (
                    worsened_facilities
                ),

                "facilities_unchanged": (
                    unchanged_facilities
                ),
                
                "inventory_nodes_improved": sum(
                    1
                    for item in medicine_impact
                    if item["risk_reduction"] > 0
                ),

                "inventory_nodes_worsened": sum(
                    1
                    for item in medicine_impact
                    if item["risk_reduction"] < 0
                ),

                "medicines_improved": len({
                    item["medicine"]
                    for item in medicine_impact
                    if item["risk_reduction"] > 0
                }),

                "medicine_level_impact": medicine_impact
            },

            "top_improvements": (
                facility_comparison[:10]
            ),

            "facility_details": {
                "before": before_facilities,
                "after": after_facilities
            }
        }

    # ============================================================
    # FACILITY AGGREGATION
    # ============================================================

    def _aggregate_facilities(
        self,
        inventory_records: List[Dict]
    ) -> Dict:

        facilities = defaultdict(list)

        for item in inventory_records:

            facilities[
                item["facility_code"]
            ].append(item)

        result = {}

        for facility_code, medicines in facilities.items():

            risk_scores = [
                float(
                    item["risk_score"]
                )
                for item in medicines
            ]

            stockout_count = sum(
                1
                for item in medicines
                if item[
                    "stockout_before_replenishment"
                ]
            )

            critical_count = sum(
                1
                for item in medicines
                if item["status"] == "CRITICAL"
            )

            at_risk_count = sum(
                1
                for item in medicines
                if item["status"] == "AT_RISK"
            )

            average_risk = (
                sum(risk_scores) /
                len(risk_scores)
                if risk_scores
                else 0.0
            )

            maximum_risk = (
                max(risk_scores)
                if risk_scores
                else 0.0
            )

            # ----------------------------------------------------
            # FACILITY STATUS
            #
            # Do NOT automatically make a facility critical just
            # because one medicine is critical.
            #
            # Use the percentage of critical medicine nodes.
            # ----------------------------------------------------

            total_medicines = len(
                medicines
            )

            critical_ratio = (
                critical_count /
                total_medicines
                if total_medicines > 0
                else 0.0
            )

            if (
                critical_ratio >= 0.50
                or average_risk >= 70
            ):

                status = "CRITICAL"

            elif (
                critical_ratio >= 0.20
                or average_risk >= 40
            ):

                status = "AT_RISK"

            else:

                status = "HEALTHY"

            first = medicines[0]

            result[facility_code] = {

                "facility_code": facility_code,

                "facility_name": first.get(
                    "facility_name",
                    facility_code
                ),

                "district": first.get(
                    "district",
                    ""
                ),

                "state": first.get(
                    "state",
                    ""
                ),

                "status": status,

                "average_risk_score": round(
                    average_risk,
                    2
                ),

                "maximum_risk_score": round(
                    maximum_risk,
                    2
                ),

                "critical_medicines": (
                    critical_count
                ),

                "at_risk_medicines": (
                    at_risk_count
                ),

                "stockout_medicines": (
                    stockout_count
                ),

                "total_medicines": (
                    total_medicines
                )
            }

        return result

    # ============================================================
    # AVERAGE RISK
    # ============================================================

    def _average_risk(
        self,
        records: List[Dict]
    ) -> float:

        if not records:
            return 0.0

        return (
            sum(
                float(
                    item.get(
                        "risk_score",
                        0
                    )
                )
                for item in records
            )
            /
            len(records)
        )

    # ============================================================
    # AVERAGE COVERAGE
    # ============================================================

    def _average_coverage(
        self,
        records: List[Dict]
    ) -> float:

        if not records:
            return 0.0

        return (
            sum(
                float(
                    item.get(
                        "coverage_ratio",
                        0
                    )
                )
                for item in records
            )
            /
            len(records)
        )