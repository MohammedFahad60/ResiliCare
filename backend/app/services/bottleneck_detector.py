from collections import defaultdict
from typing import Dict, List


class BottleneckDetector:

    def analyze(
        self,
        medicine_results: List[Dict],
        facility_results: List[Dict]
    ) -> Dict:

        # --------------------------------
        # FACILITY ANALYSIS
        # --------------------------------

        critical_facilities = [
            item
            for item in facility_results
            if item["resilience"]["status"] == "CRITICAL"
        ]

        at_risk_facilities = [
            item
            for item in facility_results
            if item["resilience"]["status"] == "AT_RISK"
        ]

        # --------------------------------
        # FACILITY PRESSURE
        # --------------------------------

        facility_pressure = []

        for item in facility_results:

            resilience = item["resilience"]

            medicine_risk = item["medicine_risk"]["risk_score"]
            bed_risk = resilience["bed_risk_score"]
            staff_risk = resilience["staff_risk_score"]

            # Count simultaneous pressure sources
            pressure_sources = 0

            if medicine_risk >= 50:
                pressure_sources += 1

            if bed_risk >= 50:
                pressure_sources += 1

            if staff_risk >= 50:
                pressure_sources += 1

            facility_pressure.append({
                "facility_code": item["facility_code"],
                "facility_name": item["facility_name"],
                "district": item["district"],
                "state": item["state"],

                "facility_risk_score": float(
                    resilience["facility_risk_score"]
                ),

                "medicine_risk_score": int(
                    medicine_risk
                ),

                "bed_risk_score": int(
                    bed_risk
                ),

                "staff_risk_score": int(
                    staff_risk
                ),

                "pressure_sources": int(
                    pressure_sources
                )
            })

        # Highest overall facility pressure
        facility_pressure.sort(
            key=lambda x: (
                x["pressure_sources"],
                x["facility_risk_score"]
            ),
            reverse=True
        )

        # --------------------------------
        # MEDICINE ANALYSIS
        # --------------------------------

        medicine_stats = defaultdict(
            lambda: {
                "total": 0,
                "critical": 0,
                "at_risk": 0,
                "stockout_risk": 0
            }
        )

        for item in medicine_results:

            medicine = item["medicine"]

            medicine_stats[medicine]["total"] += 1

            if item["status"] == "CRITICAL":
                medicine_stats[medicine]["critical"] += 1

            elif item["status"] == "AT_RISK":
                medicine_stats[medicine]["at_risk"] += 1

            if item["stockout_before_replenishment"]:
                medicine_stats[medicine]["stockout_risk"] += 1

        medicine_pressure = []

        for medicine, stats in medicine_stats.items():

            total = stats["total"]

            critical_rate = (
                stats["critical"] / total * 100
                if total > 0
                else 0
            )

            stockout_rate = (
                stats["stockout_risk"] / total * 100
                if total > 0
                else 0
            )

            pressure_score = (
                critical_rate * 0.6
                + stockout_rate * 0.4
            )

            medicine_pressure.append({

                "medicine": medicine,

                "facilities_affected": int(
                    total
                ),

                "critical_facilities": int(
                    stats["critical"]
                ),

                "at_risk_facilities": int(
                    stats["at_risk"]
                ),

                "stockout_risk_facilities": int(
                    stats["stockout_risk"]
                ),

                "critical_rate_percent": float(
                    round(critical_rate, 2)
                ),

                "stockout_rate_percent": float(
                    round(stockout_rate, 2)
                ),

                "pressure_score": float(
                    round(pressure_score, 2)
                )
            })

        medicine_pressure.sort(
            key=lambda x: x["pressure_score"],
            reverse=True
        )

        # --------------------------------
        # DISTRICT ANALYSIS
        # --------------------------------

        district_stats = defaultdict(
            lambda: {
                "facilities": 0,
                "critical": 0,
                "at_risk": 0,
                "risk_scores": []
            }
        )

        for item in facility_results:

            district = item["district"]

            district_stats[district]["facilities"] += 1

            status = item["resilience"]["status"]

            if status == "CRITICAL":
                district_stats[district]["critical"] += 1

            elif status == "AT_RISK":
                district_stats[district]["at_risk"] += 1

            district_stats[district]["risk_scores"].append(
                item["resilience"]["facility_risk_score"]
            )

        district_pressure = []

        for district, stats in district_stats.items():

            total = stats["facilities"]

            average_risk = (
                sum(stats["risk_scores"]) / total
                if total > 0
                else 0
            )

            critical_rate = (
                stats["critical"] / total * 100
                if total > 0
                else 0
            )

            district_pressure.append({

                "district": district,

                "facilities": int(
                    total
                ),

                "critical_facilities": int(
                    stats["critical"]
                ),

                "at_risk_facilities": int(
                    stats["at_risk"]
                ),

                "critical_rate_percent": float(
                    round(critical_rate, 2)
                ),

                "average_risk_score": float(
                    round(average_risk, 2)
                )
            })

        district_pressure.sort(
            key=lambda x: (
                x["critical_rate_percent"],
                x["average_risk_score"]
            ),
            reverse=True
        )

        # --------------------------------
        # OVERALL BOTTLENECKS
        # --------------------------------

        high_pressure_facilities = [
            item
            for item in facility_pressure
            if item["pressure_sources"] >= 2
        ]

        return {

            "summary": {

                "critical_facilities": int(
                    len(critical_facilities)
                ),

                "at_risk_facilities": int(
                    len(at_risk_facilities)
                ),

                "high_pressure_facilities": int(
                    len(high_pressure_facilities)
                ),

                "critical_medicines": int(
                    sum(
                        1
                        for item in medicine_pressure
                        if item["critical_rate_percent"] >= 50
                    )
                ),

                "districts_analyzed": int(
                    len(district_pressure)
                )
            },

            "top_facility_bottlenecks":
                facility_pressure[:10],

            "medicine_bottlenecks":
                medicine_pressure,

            "district_pressure":
                district_pressure
        }