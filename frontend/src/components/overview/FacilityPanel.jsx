import { useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronRight, MapPin } from "lucide-react";

function FacilityPanel({ inventory }) {
  const priorityFacilities = useMemo(() => {
    const facilityMap = new Map();

    inventory.forEach((item) => {
      const riskScore = Number(item.risk_score || 0);

      const existing = facilityMap.get(item.facility_code);

      if (!existing || riskScore > existing.riskScore) {
        facilityMap.set(item.facility_code, {
          id: item.facility_code,
          name: item.facility_name,
          district: item.district,
          state: item.state,
          riskScore,
          status: item.status,
          medicine: item.medicine,
        });
      }
    });

    return Array.from(facilityMap.values())
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5);
  }, [inventory]);

  return (
    <section className="facility-section">
      <div className="section-heading-row">
        <div>
          <span className="section-eyebrow">FACILITY INTELLIGENCE</span>

          <h2>Priority facilities</h2>
        </div>

        <button className="small-action">
          View all facilities
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="facility-grid">
        {priorityFacilities.map((facility) => (
          <motion.div
            className="facility-card"
            key={facility.id}
            whileHover={{ y: -3 }}
          >
            <div className="facility-top">
              <div className="facility-status">
                <span
                  className={
                    facility.status === "CRITICAL"
                      ? "danger-dot"
                      : "warning-dot"
                  }
                />

                {facility.status === "CRITICAL" ? "Critical" : "At risk"}
              </div>

              <span className="facility-code">{facility.id}</span>
            </div>

            <h3>{facility.name}</h3>

            <p>
              <MapPin size={14} />
              {facility.district}, {facility.state}
            </p>

            <div className="facility-risk">
              <div>
                <span>Risk score</span>
                <strong>{facility.riskScore}</strong>
              </div>

              <div className="mini-bar">
                <span
                  style={{
                    width: `${Math.min(facility.riskScore, 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="facility-medicine">
              Highest-risk medicine: <strong>{facility.medicine}</strong>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default FacilityPanel;