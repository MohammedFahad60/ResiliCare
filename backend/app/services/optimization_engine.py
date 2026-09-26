from typing import Dict, List
from ortools.linear_solver import pywraplp
import math


# ============================================================
# HAVERSINE DISTANCE
# ============================================================

def calculate_distance(
    lat1,
    lon1,
    lat2,
    lon2
):
    """
    Calculate the distance between two geographic coordinates
    using the Haversine formula.

    Returns:
        Distance in kilometers.
    """

    lat1 = math.radians(float(lat1))
    lon1 = math.radians(float(lon1))

    lat2 = math.radians(float(lat2))
    lon2 = math.radians(float(lon2))

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1)
        * math.cos(lat2)
        * math.sin(dlon / 2) ** 2
    )

    # Protect against tiny floating-point errors.
    a = max(0.0, min(1.0, a))

    c = 2 * math.atan2(
        math.sqrt(a),
        math.sqrt(1 - a)
    )

    earth_radius = 6371.0

    return earth_radius * c


# ============================================================
# RESOURCE OPTIMIZER
# ============================================================

class ResourceOptimizer:

    def optimize(
        self,
        donors: List[Dict],
        recipients: List[Dict]
    ) -> Dict:

        # ========================================================
        # EMPTY INPUT
        # ========================================================

        if not donors or not recipients:
            return {
                "summary": {
                    "transfers": 0,
                    "units_transferred": 0.0
                },
                "allocations": []
            }

        # ========================================================
        # CREATE SOLVER
        # ========================================================

        solver = pywraplp.Solver.CreateSolver("SCIP")

        if solver is None:
            raise RuntimeError(
                "OR-Tools SCIP solver is unavailable."
            )

        # ========================================================
        # DECISION VARIABLES
        # ========================================================
        #
        # x[d, r] = quantity transferred from donor d
        #           to recipient r.
        #
        # A variable is created only when:
        #
        # 1. Donor and recipient are different facilities.
        # 2. They have the same medicine.
        # 3. Donor has positive surplus.
        # 4. Recipient has positive shortage.
        #
        # ========================================================

        variables = {}

        for d_index, donor in enumerate(donors):

            donor_code = donor.get("facility_code")
            donor_medicine = donor.get("medicine")

            donor_surplus = float(
                donor.get("surplus", 0)
            )

            # ----------------------------------------------------
            # Donor has nothing available.
            # ----------------------------------------------------

            if donor_surplus <= 0:
                continue

            for r_index, recipient in enumerate(recipients):

                recipient_code = recipient.get(
                    "facility_code"
                )

                recipient_medicine = recipient.get(
                    "medicine"
                )

                recipient_shortage = float(
                    recipient.get("shortage", 0)
                )

                # ------------------------------------------------
                # NEVER TRANSFER TO THE SAME FACILITY
                # ------------------------------------------------

                if donor_code == recipient_code:
                    continue

                # ------------------------------------------------
                # MEDICINES MUST MATCH
                # ------------------------------------------------

                if donor_medicine != recipient_medicine:
                    continue

                # ------------------------------------------------
                # Recipient has no shortage.
                # ------------------------------------------------

                if recipient_shortage <= 0:
                    continue

                # ------------------------------------------------
                # Maximum possible transfer for this pair.
                # ------------------------------------------------

                max_transfer = min(
                    donor_surplus,
                    recipient_shortage
                )

                if max_transfer <= 0:
                    continue

                # ------------------------------------------------
                # Create decision variable.
                # ------------------------------------------------

                variables[
                    (d_index, r_index)
                ] = solver.NumVar(
                    0.0,
                    max_transfer,
                    f"x_{d_index}_{r_index}"
                )

        # ========================================================
        # NO VALID TRANSFER PAIRS
        # ========================================================

        if not variables:
            return {
                "summary": {
                    "transfers": 0,
                    "units_transferred": 0.0
                },
                "allocations": []
            }

        # ========================================================
        # DONOR CONSTRAINTS
        # ========================================================
        #
        # Total quantity sent by a donor cannot exceed
        # the donor's surplus.
        #
        # ========================================================

        for d_index, donor in enumerate(donors):

            donor_variables = [
                variable
                for (
                    variable_d_index,
                    variable_r_index
                ), variable in variables.items()
                if variable_d_index == d_index
            ]

            if donor_variables:

                solver.Add(
                    sum(donor_variables)
                    <= float(
                        donor.get("surplus", 0)
                    )
                )

        # ========================================================
        # RECIPIENT CONSTRAINTS
        # ========================================================
        #
        # Total quantity received by a recipient cannot exceed
        # its shortage.
        #
        # ========================================================

        for r_index, recipient in enumerate(recipients):

            recipient_variables = [
                variable
                for (
                    variable_d_index,
                    variable_r_index
                ), variable in variables.items()
                if variable_r_index == r_index
            ]

            if recipient_variables:

                solver.Add(
                    sum(recipient_variables)
                    <= float(
                        recipient.get("shortage", 0)
                    )
                )

        # ========================================================
        # OBJECTIVE
        # ========================================================
        #
        # We want:
        #
        #   1. MAXIMUM shortage coverage
        #   2. MINIMUM geographical distance
        #
        # We therefore use a very large transfer coefficient
        # compared with the maximum possible distance penalty.
        #
        # Since distance is capped at 500 km:
        #
        #   transfer score = 1,000,000
        #   distance penalty = 0 ... 500
        #
        # This makes shortage coverage overwhelmingly more
        # important than distance.
        #
        # ========================================================

        objective = solver.Objective()

        TRANSFER_WEIGHT = 1_000_000.0
        MAX_DISTANCE_PENALTY = 500.0

        for (
            d_index,
            r_index
        ), variable in variables.items():

            donor = donors[d_index]
            recipient = recipients[r_index]

            distance = calculate_distance(
                donor["latitude"],
                donor["longitude"],
                recipient["latitude"],
                recipient["longitude"]
            )

            distance_penalty = min(
                distance,
                MAX_DISTANCE_PENALTY
            )

            coefficient = (
                TRANSFER_WEIGHT
                - distance_penalty
            )

            objective.SetCoefficient(
                variable,
                coefficient
            )

        objective.SetMaximization()

        # ========================================================
        # SOLVE
        # ========================================================

        status = solver.Solve()

        if status not in (
            pywraplp.Solver.OPTIMAL,
            pywraplp.Solver.FEASIBLE
        ):
            return {
                "summary": {
                    "transfers": 0,
                    "units_transferred": 0.0
                },
                "allocations": []
            }

        # ========================================================
        # BUILD ALLOCATIONS
        # ========================================================

        allocations = []

        for (
            d_index,
            r_index
        ), variable in variables.items():

            quantity = variable.solution_value()

            # ----------------------------------------------------
            # Ignore numerical noise.
            # ----------------------------------------------------

            if quantity <= 0.01:
                continue

            donor = donors[d_index]
            recipient = recipients[r_index]

            # ----------------------------------------------------
            # Safety checks.
            # ----------------------------------------------------

            if (
                donor["facility_code"]
                == recipient["facility_code"]
            ):
                continue

            if donor["medicine"] != recipient["medicine"]:
                continue

            # ----------------------------------------------------
            # Calculate actual transfer distance.
            # ----------------------------------------------------

            distance = calculate_distance(
                donor["latitude"],
                donor["longitude"],
                recipient["latitude"],
                recipient["longitude"]
            )

            allocations.append({

                "medicine":
                    donor["medicine"],

                "source": {

                    "facility_code":
                        donor["facility_code"],

                    "facility_name":
                        donor["facility_name"],

                    "district":
                        donor["district"],

                    "state":
                        donor["state"]
                },

                "destination": {

                    "facility_code":
                        recipient["facility_code"],

                    "facility_name":
                        recipient["facility_name"],

                    "district":
                        recipient["district"],

                    "state":
                        recipient["state"]
                },

                "quantity":
                    float(
                        round(
                            quantity,
                            2
                        )
                    ),

                "distance_km":
                    float(
                        round(
                            distance,
                            2
                        )
                    )
            })

        # ========================================================
        # TOTAL TRANSFERRED
        # ========================================================

        total_units = sum(
            float(
                allocation["quantity"]
            )
            for allocation in allocations
        )

        # ========================================================
        # RETURN RESULT
        # ========================================================

        return {

            "summary": {

                "transfers":
                    int(
                        len(allocations)
                    ),

                "units_transferred":
                    float(
                        round(
                            total_units,
                            2
                        )
                    )
            },

            "allocations":
                allocations
        }