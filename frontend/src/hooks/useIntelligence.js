import { useEffect, useState } from "react";
import { getInventoryIntelligence } from "../api/resilicare";

export function useIntelligence() {
  const [intelligenceResult, setIntelligenceResult] =
    useState(null);

  const [intelligenceLoading, setIntelligenceLoading] =
    useState(false);

  const [intelligenceError, setIntelligenceError] =
    useState(null);

  const loadIntelligence = async (
    facilityCode,
    medicineName
  ) => {
    try {
      setIntelligenceLoading(true);
      setIntelligenceError(null);

      const result = await getInventoryIntelligence(
        facilityCode,
        medicineName
      );

      console.log(
        "RESILICARE INTELLIGENCE RESULT:",
        result
      );

      setIntelligenceResult(result);

      return result;
    } catch (err) {
      console.error(
        "Failed to load intelligence:",
        err
      );

      setIntelligenceError(
        err?.message ||
          "Failed to load intelligence"
      );

      return null;
    } finally {
      setIntelligenceLoading(false);
    }
  };

  useEffect(() => {
    loadIntelligence(
      "FAC-0001",
      "Paracetamol"
    );
  }, []);

  return {
    intelligenceResult,
    intelligenceLoading,
    intelligenceError,
    loadIntelligence,
  };
}