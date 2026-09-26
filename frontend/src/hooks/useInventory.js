import { useEffect, useMemo, useState } from "react";
import { getInventory } from "../api/resilicare";

export function useInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadInventory() {
      try {
        setLoading(true);
        setError(null);

        const response = await getInventory();

        setInventory(response.data || []);
      } catch (err) {
        console.error("Failed to load inventory:", err);
        setError(err.message || "Unable to connect to backend");
      } finally {
        setLoading(false);
      }
    }

    loadInventory();
  }, []);

  const mapFacilities = useMemo(() => {
    const facilities = new Map();

    inventory.forEach((item) => {
      const riskScore = Number(item.risk_score || 0);
      const existing = facilities.get(item.facility_code);

      if (!existing || riskScore > existing.riskScore) {
        facilities.set(item.facility_code, {
          id: item.facility_code,
          name: item.facility_name,
          district: item.district,
          state: item.state,
          lat: Number(item.latitude),
          lng: Number(item.longitude),
          riskScore,
          risk:
            item.status === "CRITICAL"
              ? "critical"
              : item.status === "AT_RISK"
              ? "at-risk"
              : "healthy",
        });
      }
    });

    return Array.from(facilities.values());
  }, [inventory]);

  const dashboardStats = useMemo(() => {
    if (!inventory.length) {
      return {
        criticalFacilities: 0,
        stockoutNodes: 0,
        avgRisk: 0,
      };
    }

    const facilities = new Map();

    inventory.forEach((item) => {
      const riskScore = Number(item.risk_score || 0);
      const existing = facilities.get(item.facility_code);

      if (!existing || riskScore > Number(existing.risk_score || 0)) {
        facilities.set(item.facility_code, item);
      }
    });

    const criticalFacilities = [...facilities.values()].filter(
      (item) => item.status === "CRITICAL"
    ).length;

    const stockoutNodes = inventory.filter(
      (item) => item.stockout_before_replenishment === true
    ).length;

    const avgRisk =
      inventory.reduce(
        (sum, item) => sum + Number(item.risk_score || 0),
        0
      ) / inventory.length;

    return {
      criticalFacilities,
      stockoutNodes,
      avgRisk: Number(avgRisk.toFixed(1)),
    };
  }, [inventory]);

  return {
    inventory,
    loading,
    error,
    mapFacilities,
    dashboardStats,
  };
}