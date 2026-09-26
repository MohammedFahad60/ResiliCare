import { motion } from "framer-motion";
import { Activity, AlertTriangle, ArrowUpRight } from "lucide-react";

function ForecastPanel({ intelligenceResult, intelligenceLoading }) {
  const forecast = intelligenceResult?.intelligence?.forecast;
  const futureRisk = intelligenceResult?.intelligence?.future_risk;
  const predictions = forecast?.predictions || [];

  const maxDemand = Math.max(
    ...predictions.map((item) => Number(item.predicted_demand || 0)),
    1,
  );

  return (
    <div className="forecast-card">
      <div className="card-heading">
        <div>
          <span className="section-eyebrow">DEMAND INTELLIGENCE</span>

          <h2>7-day demand outlook</h2>

          {intelligenceResult?.facility && (
            <p
              style={{
                marginTop: "6px",
                fontSize: "13px",
                opacity: 0.65,
              }}
            >
              {intelligenceResult.facility.facility_code} ·{" "}
              {intelligenceResult.medicine?.name}
            </p>
          )}
        </div>

        <button className="small-action">
          View forecast
          <ArrowUpRight size={15} />
        </button>
      </div>

      {intelligenceLoading ? (
        <div
          style={{
            minHeight: "240px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.65,
          }}
        >
          Loading demand intelligence...
        </div>
      ) : predictions.length === 0 ? (
        <div
          style={{
            minHeight: "240px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.65,
          }}
        >
          No forecast data available.
        </div>
      ) : (
        <>
          <div className="forecast-summary">
            <div>
              <span>7-day predicted demand</span>

              <strong>
                {Number(forecast?.total_predicted_demand || 0).toFixed(2)}
              </strong>
            </div>

            <div className="forecast-positive">
              <Activity size={16} />
              {Number(forecast?.average_daily_demand || 0).toFixed(2)} units/day
            </div>
          </div>

          <div className="forecast-chart">
            {predictions.map((item, index) => {
              const demand = Number(item.predicted_demand || 0);
              const height = Math.max(8, (demand / maxDemand) * 100);
              const date = new Date(item.date);

              return (
                <motion.div
                  key={`${item.date}-${index}`}
                  className="forecast-column"
                  initial={{ height: 0 }}
                  animate={{
                    height: `${height}%`,
                  }}
                  transition={{
                    duration: 0.7,
                    delay: index * 0.08,
                    ease: "easeOut",
                  }}
                  title={`${item.date}: ${demand.toFixed(2)} units`}
                >
                  <span />
                </motion.div>
              );
            })}
          </div>

          <div className="forecast-days">
            {predictions.map((item, index) => {
              const date = new Date(item.date);

              return (
                <span key={`${item.date}-label-${index}`}>
                  {date
                    .toLocaleDateString("en-US", {
                      weekday: "short",
                    })
                    .slice(0, 1)}
                </span>
              );
            })}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "12px",
              marginTop: "20px",
            }}
          >
            <div>
              <span className="section-eyebrow">PROJECTED STOCK</span>

              <strong
                style={{
                  display: "block",
                  marginTop: "6px",
                  fontSize: "20px",
                }}
              >
                {Number(
                  futureRisk?.projected_stock_after_7_days || 0,
                ).toFixed(2)}
              </strong>
            </div>

            <div>
              <span className="section-eyebrow">STOCKOUT</span>

              <strong
                style={{
                  display: "block",
                  marginTop: "6px",
                  fontSize: "20px",
                }}
              >
                {Number(
                  futureRisk?.predicted_days_until_stockout || 0,
                ).toFixed(1)}
                d
              </strong>
            </div>

            <div>
              <span className="section-eyebrow">RISK</span>

              <strong
                style={{
                  display: "block",
                  marginTop: "6px",
                  fontSize: "20px",
                }}
              >
                {Number(futureRisk?.risk_score || 0).toFixed(0)}
              </strong>
            </div>
          </div>

          {futureRisk?.safety_stock_breach && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px 14px",
                borderRadius: "12px",
                background: "rgba(244, 184, 96, 0.08)",
                border: "1px solid rgba(244, 184, 96, 0.18)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                }}
              >
                <AlertTriangle size={15} />

                <strong>Safety stock breach predicted</strong>
              </div>

              <div
                style={{
                  marginTop: "5px",
                  fontSize: "12px",
                  opacity: 0.65,
                }}
              >
                Forecast demand is expected to push inventory below the
                configured safety stock level.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ForecastPanel;