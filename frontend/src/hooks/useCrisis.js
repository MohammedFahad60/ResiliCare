import { useState } from "react";

import {
  simulateCrisis,
  calculateRedistribution,
  calculateImpact,
} from "../api/resilicare";

export function useCrisis() {
  const [simulationActive, setSimulationActive] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [redistributionResult, setRedistributionResult] = useState(null);
  const [impactResult, setImpactResult] = useState(null);
  const [crisisLoading, setCrisisLoading] = useState(false);
  const [crisisError, setCrisisError] = useState(null);

  const runSimulation = async (values) => {
    setSimulationActive(true);
    setCrisisLoading(true);
    setCrisisError(null);

    const scenario = {
      demand_increase_percent: Number(values.demand),
      supply_disruption_days: Number(values.supply),
      staff_reduction_percent: Number(values.staff),
      bed_occupancy_increase_percent: Number(values.beds),
    };

    console.log("========== RESILICARE CRISIS ==========");
    console.log("Scenario:", scenario);

    try {
      const results = await Promise.allSettled([
        simulateCrisis(scenario),
        calculateRedistribution(scenario),
        calculateImpact(scenario),
      ]);

      const [
        simulationResponse,
        redistributionResponse,
        impactResponse,
      ] = results;

      // SIMULATION
      if (simulationResponse.status === "fulfilled") {
        console.log(
          "CRISIS SIMULATION:",
          simulationResponse.value
        );

        setSimulationResult(simulationResponse.value);
      } else {
        console.error(
          "CRISIS SIMULATION FAILED:",
          simulationResponse.reason
        );
      }

      // REDISTRIBUTION
      if (redistributionResponse.status === "fulfilled") {
        console.log(
          "REDISTRIBUTION:",
          redistributionResponse.value
        );

        setRedistributionResult(
          redistributionResponse.value
        );
      } else {
        console.error(
          "REDISTRIBUTION FAILED:",
          redistributionResponse.reason
        );
      }

      // IMPACT
      if (impactResponse.status === "fulfilled") {
        console.log(
          "IMPACT:",
          impactResponse.value
        );

        setImpactResult(impactResponse.value);
      } else {
        console.error(
          "IMPACT FAILED:",
          impactResponse.reason
        );
      }

      // ERROR HANDLING
      const failedResults = results.filter(
        (result) => result.status === "rejected"
      );

      if (failedResults.length > 0) {
        setCrisisError(
          `${failedResults.length} crisis analysis request${
            failedResults.length > 1 ? "s" : ""
          } failed. Check the browser console.`
        );
      }

      return {
        simulation:
          simulationResponse.status === "fulfilled"
            ? simulationResponse.value
            : null,

        redistribution:
          redistributionResponse.status === "fulfilled"
            ? redistributionResponse.value
            : null,

        impact:
          impactResponse.status === "fulfilled"
            ? impactResponse.value
            : null,
      };
    } catch (err) {
      console.error(
        "CRISIS LAB FAILED:",
        err
      );

      setCrisisError(
        err.message ||
          "Failed to run crisis analysis."
      );

      return null;
    } finally {
      setCrisisLoading(false);
    }
  };

  return {
    simulationActive,
    simulationResult,
    redistributionResult,
    impactResult,
    crisisLoading,
    crisisError,
    runSimulation,
  };
}