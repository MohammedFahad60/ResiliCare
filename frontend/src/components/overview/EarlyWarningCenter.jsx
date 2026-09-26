import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BellRing,
  ChevronRight,
  Clock3,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";

import {
  getNetworkWarnings,
  getInventoryIntelligence,
} from "../../api/resilicare";

function severityMeta(severity) {
  if (severity === "critical") {
    return {
      label: "CRITICAL",
      className: "warning-critical",
      icon: ShieldAlert,
    };
  }

  if (severity === "warning") {
    return {
      label: "WARNING",
      className: "warning-warning",
      icon: AlertTriangle,
    };
  }

  return {
    label: "WATCH",
    className: "warning-watch",
    icon: Clock3,
  };
}

export default function EarlyWarningCenter() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [selectedWarning, setSelectedWarning] = useState(null);

  const [medicineIntelligence, setMedicineIntelligence] =
    useState(null);

  const [medicineLoading, setMedicineLoading] =
    useState(false);

  const [medicineError, setMedicineError] =
    useState(null);

  useEffect(() => {
    async function loadWarnings() {
      try {
        setLoading(true);
        setError(null);

        const result = await getNetworkWarnings();

        setData(result);
      } catch (err) {
        console.error(
          "Failed to load warnings:",
          err
        );

        setError(
          err.message ||
            "Unable to load network warnings."
        );
      } finally {
        setLoading(false);
      }
    }

    loadWarnings();
  }, []);

  const summary = data?.summary || {
    total_warnings: 0,
    critical: 0,
    warning: 0,
    watch: 0,
  };

  const warnings = data?.warnings || [];

  const filteredWarnings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return warnings.filter((item) => {
      const matchesFilter =
        filter === "all" ||
        item.severity === filter;

      const searchableText = [
        item.facility_code,
        item.facility_name,
        item.facility_type,
        item.district,
        item.state,
        item.medicine,
        item.category,
        item.warning_type,
        item.message,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query ||
        searchableText.includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [warnings, search, filter]);

  function closeWarningPopout() {
    setSelectedWarning(null);
    setMedicineIntelligence(null);
    setMedicineError(null);
    setMedicineLoading(false);
  }

  async function openWarning(warning) {
    setSelectedWarning(warning);
    setMedicineIntelligence(null);
    setMedicineError(null);
    setMedicineLoading(true);

    try {
      const result =
        await getInventoryIntelligence(
          warning.facility_code,
          warning.medicine
        );

      setMedicineIntelligence(result);
    } catch (err) {
      console.error(
        "Failed to load medicine intelligence:",
        err
      );

      setMedicineError(
        err.message ||
          "Unable to load medicine intelligence."
      );
    } finally {
      setMedicineLoading(false);
    }
  }

  const intelligence =
    medicineIntelligence?.intelligence || {};

  const inventory =
    medicineIntelligence?.inventory || {};

  const forecast =
    intelligence.forecast || {};

  const futureRisk =
    intelligence.future_risk || {};

  const forecastPredictions =
    Array.isArray(forecast.predictions)
      ? forecast.predictions
      : [];

  const currentStock = Number(
    inventory.current_stock ??
      selectedWarning?.current_stock ??
      0
  );

  const dailyConsumption = Number(
    inventory.daily_consumption ??
      selectedWarning?.daily_consumption ??
      0
  );

  const safetyStock = Number(
    inventory.safety_stock ??
      selectedWarning?.safety_stock ??
      0
  );

  const leadTimeDays = Number(
    inventory.lead_time_days ??
      selectedWarning?.lead_time_days ??
      0
  );

  const averageDailyDemand = Number(
    forecast.average_daily_demand || 0
  );

  const warningCoverage = Number(
    selectedWarning?.days_of_coverage || 0
  );

  const intelligenceCoverage =
    averageDailyDemand > 0
      ? currentStock / averageDailyDemand
      : warningCoverage;

  const predictedDaysUntilStockout =
    Number(
      futureRisk.predicted_days_until_stockout
    );

  const riskScore = Number(
    futureRisk.risk_score ?? 0
  );

  const maxForecastDemand = Math.max(
    ...forecastPredictions.map((item) =>
      Number(item.predicted_demand || 0)
    ),
    1
  );

  return (
    <section className="early-warning-section">
      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="early-warning-header">
        <div>
          <span className="section-eyebrow">
            EARLY WARNING CENTER
          </span>

          <h2>
            Predictive signals
            <span> requiring attention.</span>
          </h2>

          <p>
            ResiliCare continuously evaluates inventory
            coverage, lead times, and safety-stock levels
            across the healthcare network.
          </p>
        </div>

        <div className="early-warning-total">
          <BellRing size={18} />

          <strong>
            {Number(
              summary.total_warnings || 0
            ).toLocaleString()}
          </strong>

          <span>active signals</span>
        </div>
      </div>

      {/* ======================================================
          SUMMARY CARDS
          ====================================================== */}

      <div className="warning-summary-grid">
        <button
          type="button"
          className={`warning-summary-card ${
            filter === "critical"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setFilter("critical")
          }
        >
          <span className="warning-summary-label">
            CRITICAL
          </span>

          <strong>
            {Number(
              summary.critical || 0
            ).toLocaleString()}
          </strong>

          <span>
            Immediate attention
          </span>
        </button>

        <button
          type="button"
          className={`warning-summary-card ${
            filter === "warning"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setFilter("warning")
          }
        >
          <span className="warning-summary-label">
            WARNING
          </span>

          <strong>
            {Number(
              summary.warning || 0
            ).toLocaleString()}
          </strong>

          <span>
            Replenishment required
          </span>
        </button>

        <button
          type="button"
          className={`warning-summary-card ${
            filter === "watch"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setFilter("watch")
          }
        >
          <span className="warning-summary-label">
            WATCH
          </span>

          <strong>
            {Number(
              summary.watch || 0
            ).toLocaleString()}
          </strong>

          <span>
            Monitor closely
          </span>
        </button>

        <button
          type="button"
          className={`warning-summary-card ${
            filter === "all"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setFilter("all")
          }
        >
          <span className="warning-summary-label">
            ALL SIGNALS
          </span>

          <strong>
            {Number(
              summary.total_warnings || 0
            ).toLocaleString()}
          </strong>

          <span>
            Across the network
          </span>
        </button>
      </div>

      {/* ======================================================
          SEARCH / FILTER
          ====================================================== */}

      <div className="warning-toolbar">
        <div className="warning-search">
          <Search size={16} />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search facility, medicine, district..."
          />

          {search && (
            <button
              type="button"
              onClick={() =>
                setSearch("")
              }
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="warning-filter-group">
          {[
            ["all", "All"],
            ["critical", "Critical"],
            ["warning", "Warning"],
            ["watch", "Watch"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={
                filter === value
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter(value)
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ======================================================
          LIST HEADER
          ====================================================== */}

      <div className="warning-list-header">
        <span>
          {filteredWarnings.length.toLocaleString()} signals
        </span>

        <span>
          Sorted by severity and coverage
        </span>
      </div>

      {/* ======================================================
          LOADING
          ====================================================== */}

      {loading && (
        <div className="warning-state">
          <div className="warning-spinner" />

          <span>
            Loading network intelligence...
          </span>
        </div>
      )}

      {/* ======================================================
          ERROR
          ====================================================== */}

      {!loading && error && (
        <div className="warning-state warning-state-error">
          <ShieldAlert size={20} />

          <span>
            {error}
          </span>
        </div>
      )}

      {/* ======================================================
          EMPTY
          ====================================================== */}

      {!loading &&
        !error &&
        filteredWarnings.length === 0 && (
          <div className="warning-state">
            <BellRing size={20} />

            <span>
              No warnings match your current filters.
            </span>
          </div>
        )}

      {/* ======================================================
          WARNING LIST
          ====================================================== */}

      {!loading &&
        !error &&
        filteredWarnings.length > 0 && (
          <div className="warning-list">
            {filteredWarnings
              .slice(0, 5)
              .map((warning, index) => {
                const meta =
                  severityMeta(
                    warning.severity
                  );

                const Icon =
                  meta.icon;

                return (
                  <button
                    type="button"
                    className={`warning-row ${meta.className}`}
                    key={`${warning.facility_code}-${warning.medicine_id}-${index}`}
                    onClick={() =>
                      openWarning(warning)
                    }
                  >
                    <div className="warning-row-severity">
                      <Icon size={17} />

                      <span>
                        {meta.label}
                      </span>
                    </div>

                    <div className="warning-row-main">
                      <strong>
                        {warning.medicine}
                      </strong>

                      <span>
                        {warning.facility_name}
                        {" · "}
                        {warning.district}
                      </span>
                    </div>

                    <div className="warning-row-metrics">
                      <div>
                        <span>
                          Coverage
                        </span>

                        <strong>
                          {Number(
                            warning.days_of_coverage ||
                              0
                          ).toFixed(1)}
                          d
                        </strong>
                      </div>

                      <div>
                        <span>
                          Lead time
                        </span>

                        <strong>
                          {Number(
                            warning.lead_time_days ||
                              0
                          ).toFixed(0)}
                          d
                        </strong>
                      </div>
                    </div>

                    <ChevronRight
                      className="warning-row-arrow"
                      size={18}
                    />
                  </button>
                );
              })}
          </div>
        )}

      {filteredWarnings.length > 5 && (
        <div className="warning-list-footer">
          Showing the first 5 highest-priority signals.
        </div>
      )}

      {/* ======================================================
          MEDICINE INTELLIGENCE POPOUT
          ====================================================== */}

      {selectedWarning && (
        <div
          className="warning-popout-backdrop"
          onClick={closeWarningPopout}
        >
          <div
            className="warning-popout"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* ------------------------------------------------
                HEADER
                ------------------------------------------------ */}

            <div className="warning-popout-header">
              <div>
                <span className="section-eyebrow">
                  MEDICINE INTELLIGENCE
                </span>

                <h3>
                  {selectedWarning.medicine}
                </h3>

                <p>
                  {selectedWarning.category ||
                    "Healthcare inventory"}

                  {" · "}

                  {selectedWarning.strength ||
                    "—"}

                  {" · "}

                  {selectedWarning.dosage_form ||
                    "—"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeWarningPopout}
                aria-label="Close intelligence"
              >
                <X size={18} />
              </button>
            </div>

            {/* ------------------------------------------------
                SEVERITY
                ------------------------------------------------ */}

            <div className="warning-popout-severity">
              {(() => {
                const meta =
                  severityMeta(
                    selectedWarning.severity
                  );

                const Icon =
                  meta.icon;

                return (
                  <>
                    <Icon size={18} />

                    <strong>
                      {meta.label}
                    </strong>
                  </>
                );
              })()}

              <span>
                {selectedWarning.warning_type}
              </span>
            </div>

            {/* ------------------------------------------------
                FACILITY
                ------------------------------------------------ */}

            <div className="warning-popout-facility">
              <span>
                FACILITY
              </span>

              <strong>
                {selectedWarning.facility_name}
              </strong>

              <p>
                {selectedWarning.facility_type}
                {" · "}
                {selectedWarning.district}
                {" · "}
                {selectedWarning.state}
              </p>
            </div>

            {/* ------------------------------------------------
                LOADING
                ------------------------------------------------ */}

            {medicineLoading && (
              <div className="warning-intelligence-loading">
                <div className="warning-spinner" />

                <span>
                  Loading predictive medicine intelligence...
                </span>
              </div>
            )}

            {/* ------------------------------------------------
                API ERROR
                ------------------------------------------------ */}

            {!medicineLoading &&
              medicineError && (
                <div className="warning-intelligence-error">
                  <ShieldAlert size={18} />

                  <span>
                    {medicineError}
                  </span>
                </div>
              )}

            {/* ------------------------------------------------
                INTELLIGENCE CONTENT
                ------------------------------------------------ */}

            {!medicineLoading &&
              !medicineError &&
              medicineIntelligence && (
                <>
                  {/* ------------------------------------------
                      KPI GRID
                      ------------------------------------------ */}

                  <div className="warning-popout-grid">
                    <div>
                      <span>
                        Current stock
                      </span>

                      <strong>
                        {currentStock.toLocaleString()}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Daily consumption
                      </span>

                      <strong>
                        {dailyConsumption.toFixed(2)}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Coverage
                      </span>

                      <strong>
                        {Number(
                          intelligenceCoverage
                        ).toFixed(1)}
                        d
                      </strong>
                    </div>

                    <div>
                      <span>
                        Lead time
                      </span>

                      <strong>
                        {leadTimeDays.toFixed(0)}
                        d
                      </strong>
                    </div>

                    <div>
                      <span>
                        Safety stock
                      </span>

                      <strong>
                        {safetyStock.toLocaleString()}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Days to stockout
                      </span>

                      <strong>
                        {Number.isFinite(
                          predictedDaysUntilStockout
                        )
                          ? predictedDaysUntilStockout.toFixed(
                              1
                            )
                          : "—"}
                        {Number.isFinite(
                          predictedDaysUntilStockout
                        ) && "d"}
                      </strong>
                    </div>
                  </div>

                  {/* ------------------------------------------
                      PREDICTIVE RISK
                      ------------------------------------------ */}

                  <div className="warning-predictive-risk">
                    <div>
                      <span>
                        PREDICTED RISK
                      </span>

                      <strong>
                        {riskScore.toFixed(0)}
                      </strong>
                    </div>

                    <div>
                      <span>
                        STATUS
                      </span>

                      <strong>
                        {futureRisk.status ||
                          selectedWarning.severity?.toUpperCase() ||
                          "UNKNOWN"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        STOCKOUT BEFORE REPLENISHMENT
                      </span>

                      <strong>
                        {futureRisk.stockout_before_replenishment
                          ? "YES"
                          : "NO"}
                      </strong>
                    </div>
                  </div>

                  {/* ------------------------------------------
                      SAFETY STOCK
                      ------------------------------------------ */}

                  <div className="warning-popout-message">
                    <span>
                      SAFETY STOCK STATUS
                    </span>

                    <p>
                      {futureRisk.safety_stock_breach
                        ? "Projected inventory is expected to breach the configured safety-stock threshold."
                        : "Projected inventory remains above the configured safety-stock threshold over the current forecast window."}
                    </p>
                  </div>

                  {/* ------------------------------------------
                      FORECAST
                      ------------------------------------------ */}

                  <div className="warning-forecast">
                    <div className="warning-forecast-heading">
                      <div>
                        <span>
                          7-DAY DEMAND FORECAST
                        </span>

                        <strong>
                          {Number(
                            forecast.total_predicted_demand ||
                              0
                          ).toFixed(1)}
                        </strong>
                      </div>

                      <small>
                        Total predicted demand
                      </small>
                    </div>

                    {forecastPredictions.length >
                    0 ? (
                      <div className="warning-forecast-bars">
                        {forecastPredictions.map(
                          (day) => {
                            const demand =
                              Number(
                                day.predicted_demand ||
                                  0
                              );

                            const height =
                              Math.max(
                                8,
                                (demand /
                                  maxForecastDemand) *
                                  100
                              );

                            return (
                              <div
                                className="warning-forecast-bar-wrap"
                                key={day.date}
                              >
                                <div
                                  className="warning-forecast-bar"
                                  style={{
                                    height: `${height}%`,
                                  }}
                                  title={`${day.date}: ${demand.toFixed(
                                    2
                                  )}`}
                                />

                                <span>
                                  {new Date(
                                    day.date
                                  ).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                    }
                                  )}
                                </span>
                              </div>
                            );
                          }
                        )}
                      </div>
                    ) : (
                      <div className="warning-forecast-empty">
                        Forecast data unavailable.
                      </div>
                    )}
                  </div>

                  {/* ------------------------------------------
                      WHY FLAGGED
                      ------------------------------------------ */}

                  <div className="warning-popout-message">
                    <span>
                      WHY RESILICARE FLAGGED THIS
                    </span>

                    <p>
                      {selectedWarning.message}
                    </p>
                  </div>
                </>
              )}

            {/* ------------------------------------------------
                FALLBACK
                ------------------------------------------------ */}

            {!medicineLoading &&
              !medicineError &&
              !medicineIntelligence && (
                <div className="warning-intelligence-error">
                  <ShieldAlert size={18} />

                  <span>
                    Medicine intelligence is not
                    available for this warning.
                  </span>
                </div>
              )}
          </div>
        </div>
      )}
    </section>
  );
}