import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Package,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";

import {
  getInventory,
  getInventoryIntelligence,
} from "../api/resilicare";


function riskInfo(score) {
  const value = Number(score || 0);

  if (value >= 70) {
    return {
      label: "Critical",
      className: "forecast-risk-critical",
    };
  }

  if (value >= 40) {
    return {
      label: "At Risk",
      className: "forecast-risk-warning",
    };
  }

  return {
    label: "Healthy",
    className: "forecast-risk-healthy",
  };
}


function formatNumber(value, decimals = 1) {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function getRecommendedAction(
  futureRisk,
  inventory
) {
  if (!futureRisk) {
    return {
      type: "neutral",
      title: "Awaiting forecast",
      message:
        "Run the demand forecast to determine the recommended intervention.",
    };
  }

  const stockout =
    futureRisk.stockout_before_replenishment;

  const safetyBreach =
    futureRisk.safety_stock_breach;

  const days =
    Number(
      futureRisk.predicted_days_until_stockout
    );

  const leadTime =
    Number(
      inventory?.lead_time_days || 0
    );

  if (stockout) {
    return {
      type: "critical",
      title: "Immediate replenishment required",
      message:
        `Projected demand may exhaust available stock before the ${leadTime}-day replenishment window. Prioritize an emergency replenishment or resource transfer.`,
    };
  }

  if (safetyBreach) {
    return {
      type: "warning",
      title: "Replenishment should be prioritized",
      message:
        `Projected stock is expected to fall below the safety-stock threshold. Consider replenishment or redistribution before demand pressure increases.`,
    };
  }

  if (days <= leadTime + 3) {
    return {
      type: "warning",
      title: "Monitor closely",
      message:
        `Projected stockout is approximately ${days.toFixed(
          1
        )} days away. Review incoming supply and nearby redistribution options.`,
    };
  }

  return {
    type: "healthy",
    title: "Stock position is stable",
    message:
      "Projected demand remains within the available inventory and replenishment position. Continue normal monitoring.",
  };
}
export default function Forecasts() {

  const [inventory, setInventory] = useState([]);

  const [selectedFacility, setSelectedFacility] =
    useState("");

  const [selectedMedicine, setSelectedMedicine] =
    useState("");

  const [intelligence, setIntelligence] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [forecastLoading, setForecastLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  /* -------------------------------------------------------
     LOAD INVENTORY
  ------------------------------------------------------- */

  useEffect(() => {

    async function loadInventory() {

      try {

        setLoading(true);
        setError("");

        const result =
          await getInventory();

        const data =
          Array.isArray(result)
            ? result
            : result?.data || [];

        setInventory(data);

        if (data.length > 0) {

          setSelectedFacility(
            data[0].facility_code
          );

          setSelectedMedicine(
            data[0].medicine_name ||
            data[0].medicine ||
            data[0].name ||
            ""
        );
        }

      } catch (err) {

        console.error(
          "Failed to load forecast inventory:",
          err
        );

        setError(
          err.message ||
          "Unable to load forecast data."
        );

      } finally {

        setLoading(false);

      }

    }

    loadInventory();

  }, []);


  /* -------------------------------------------------------
     FACILITIES
  ------------------------------------------------------- */

  const facilities = useMemo(() => {

    const map = new Map();

    inventory.forEach((item) => {

      if (!map.has(item.facility_code)) {

        map.set(
          item.facility_code,
          {
            code: item.facility_code,
            name: item.facility_name,
            district: item.district,
            state: item.state,
          }
        );

      }

    });

    return Array.from(map.values());

  }, [inventory]);


  /* -------------------------------------------------------
     MEDICINES FOR SELECTED FACILITY
  ------------------------------------------------------- */

    const medicines = useMemo(() => {
    const medicineMap = new Map();

    inventory
        .filter(
        (item) =>
            item.facility_code === selectedFacility
        )
        .forEach((item) => {
        const name =
            item.medicine_name ||
            item.medicine ||
            item.name;

        if (!name) return;

        medicineMap.set(name, {
            name,
            unit:
            item.unit ||
            item.medicine_unit ||
            "units",
        });
        });

    return Array.from(medicineMap.values()).sort(
        (a, b) =>
        String(a.name).localeCompare(
            String(b.name)
        )
    );
    }, [inventory, selectedFacility]);


  /* -------------------------------------------------------
     LOAD FORECAST
  ------------------------------------------------------- */

  useEffect(() => {

    if (
      !selectedFacility ||
      !selectedMedicine
    ) {
      return;
    }

    async function loadForecast() {

      try {

        setForecastLoading(true);
        setError("");

        const result =
          await getInventoryIntelligence(
            selectedFacility,
            selectedMedicine
          );

        setIntelligence(result);

      } catch (err) {

        console.error(
          "Failed to load forecast:",
          err
        );

        setIntelligence(null);

        setError(
          err.message ||
          "Unable to generate demand forecast."
        );

      } finally {

        setForecastLoading(false);

      }

    }

    loadForecast();

  }, [
    selectedFacility,
    selectedMedicine,
  ]);


  /* -------------------------------------------------------
     CHANGE FACILITY
  ------------------------------------------------------- */

  function handleFacilityChange(event) {

    const facility =
      event.target.value;

    setSelectedFacility(facility);

    const firstMedicine =
      inventory.find(
        (item) =>
          item.facility_code === facility
      );

    setSelectedMedicine(
        firstMedicine?.medicine_name ||
        firstMedicine?.medicine ||
        firstMedicine?.name ||
        ""
    );

  }


  const forecast =
    intelligence?.intelligence?.forecast;

  const futureRisk =
    intelligence?.intelligence?.future_risk;

  const predictions =
    forecast?.predictions || [];


  const maximumDemand = Math.max(
    ...predictions.map(
      (item) =>
        Number(item.predicted_demand || 0)
    ),
    1
  );


  const selectedFacilityInfo =
    facilities.find(
      (facility) =>
        facility.code === selectedFacility
    );


  const risk =
    riskInfo(
      futureRisk?.risk_score
    );
  const recommendedAction =
    getRecommendedAction(
      futureRisk,
      intelligence?.inventory
    );  


  return (
    <div className="forecasts-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <section className="forecasts-header">

        <div>

          <div className="forecasts-eyebrow">

            <TrendingUp size={15} />

            DEMAND INTELLIGENCE

          </div>

          <h1>
            Forecast Intelligence
          </h1>

          <p>
            Predict medicine demand, estimate future
            stock position, and identify stockout risk
            before replenishment becomes critical.
          </p>

        </div>

        <div className="forecast-model-status">

          <span />

          Random Forest demand model

        </div>

      </section>


      {/* =================================================
          SELECTORS
      ================================================= */}

      <section className="forecast-selector-card">

        <div className="forecast-selector-heading">

          <div>

            <span>
              FORECAST CONFIGURATION
            </span>

            <h2>
              Select a facility and medicine
            </h2>

          </div>

        </div>


        <div className="forecast-select-grid">

          <label>

            <span>
              FACILITY
            </span>

            <div className="forecast-select-wrapper">

              <select
                value={selectedFacility}
                onChange={handleFacilityChange}
              >

                {facilities.map(
                  (facility) => (
                    <option
                      key={facility.code}
                      value={facility.code}
                    >
                      {facility.code}
                      {" — "}
                      {facility.name}
                    </option>
                  )
                )}

              </select>

              <ChevronDown size={15} />

            </div>

          </label>


          <label>

            <span>
              MEDICINE
            </span>

            <div className="forecast-select-wrapper">

              <select
                value={selectedMedicine}
                onChange={(event) =>
                  setSelectedMedicine(
                    event.target.value
                  )
                }
              >

                {medicines.map(
                  (medicine) => (
                    <option
                      key={medicine.name}
                      value={medicine.name}
                    >
                      {medicine.name}
                    </option>
                  )
                )}

              </select>

              <ChevronDown size={15} />

            </div>

          </label>

        </div>


        {selectedFacilityInfo && (
          <div className="forecast-selected-location">

            <CalendarDays size={14} />

            <span>
              {selectedFacilityInfo.name}
            </span>

            <span>
              ·
            </span>

            <span>
              {selectedFacilityInfo.district}
            </span>

            <span>
              ·
            </span>

            <span>
              {selectedFacilityInfo.state}
            </span>

          </div>
        )}

      </section>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="forecast-error">

          <AlertTriangle size={16} />

          {error}

        </div>
      )}


      {/* =================================================
          LOADING
      ================================================= */}

      {(loading || forecastLoading) && (
        <div className="forecast-loading">

          <div className="forecast-spinner" />

          <span>
            Generating demand intelligence...
          </span>

        </div>
      )}


      {/* =================================================
          FORECAST DATA
      ================================================= */}

      {!loading &&
        !forecastLoading &&
        intelligence && (

        <>

          {/* -----------------------------------------------
              KPI CARDS
          ----------------------------------------------- */}

          <section className="forecast-kpi-grid">

            <div className="forecast-kpi">

              <div className="forecast-kpi-icon">
                <TrendingUp size={18} />
              </div>

              <span>
                7-DAY PREDICTED DEMAND
              </span>

              <strong>
                {formatNumber(
                  forecast?.total_predicted_demand,
                  1
                )}
              </strong>

              <small>
                Total forecasted consumption
              </small>

            </div>


            <div className="forecast-kpi">

              <div className="forecast-kpi-icon">
                <Activity size={18} />
              </div>

              <span>
                AVERAGE DAILY DEMAND
              </span>

              <strong>
                {formatNumber(
                  forecast?.average_daily_demand,
                  1
                )}
              </strong>

              <small>
                Expected units per day
              </small>

            </div>


            <div className="forecast-kpi">

              <div className="forecast-kpi-icon">
                <Package size={18} />
              </div>

              <span>
                CURRENT STOCK
              </span>

              <strong>
                {formatNumber(
                  intelligence.inventory
                    ?.current_stock,
                  0
                )}
              </strong>

              <small>
                {intelligence.medicine?.unit ||
                  "units"}
              </small>

            </div>


            <div className="forecast-kpi">

              <div className="forecast-kpi-icon">
                <ShieldAlert size={18} />
              </div>

              <span>
                PROJECTED RISK
              </span>

              <strong
                className={risk.className}
              >
                {formatNumber(
                  futureRisk?.risk_score,
                  1
                )}
              </strong>

              <small>
                {risk.label}
              </small>

            </div>

          </section>


          {/* =================================================
              MAIN FORECAST AREA
          ================================================= */}

          <section className="forecast-main-grid">

            {/* ---------------------------------------------
                CHART
            --------------------------------------------- */}

            <div className="forecast-chart-card">

              <div className="forecast-card-header">

                <div>

                  <span>
                    DEMAND PROJECTION
                  </span>

                  <h2>
                    Next 7 days
                  </h2>

                </div>

                <div className="forecast-period">
                  7 DAYS
                </div>

              </div>


              <div className="forecast-bars">

                {predictions.map(
                  (item, index) => {

                    const demand =
                      Number(
                        item.predicted_demand ||
                        0
                      );

                    const height =
                      Math.max(
                        8,
                        (demand /
                          maximumDemand) *
                          100
                      );

                    const date =
                      new Date(
                        item.date
                      );

                    return (
                      <div
                        className="forecast-bar-column"
                        key={`${item.date}-${index}`}
                      >

                        <div className="forecast-bar-value">
                          {demand.toFixed(1)}
                        </div>

                        <div className="forecast-bar-track">

                          <div
                            className="forecast-bar"
                            style={{
                              height:
                                `${height}%`,
                            }}
                          />

                        </div>

                        <span>
                          {date.toLocaleDateString(
                            "en-US",
                            {
                              weekday: "short",
                            }
                          )}
                        </span>

                        <small>
                          {date.getDate()}
                        </small>

                      </div>
                    );

                  }
                )}

              </div>

            </div>


            {/* ---------------------------------------------
                FUTURE RISK
            --------------------------------------------- */}

            <div className="future-risk-card">

              <div className="forecast-card-header">

                <div>

                  <span>
                    FUTURE RISK
                  </span>

                  <h2>
                    Stock position
                  </h2>

                </div>

                <div
                  className={`future-risk-badge ${risk.className}`}
                >
                  {risk.label}
                </div>

              </div>


              <div className="future-risk-number">

                <strong>
                  {formatNumber(
                    futureRisk?.projected_stock_after_7_days,
                    1
                  )}
                </strong>

                <span>
                  projected stock after 7 days
                </span>

              </div>


              <div className="future-risk-details">

                <div>

                  <span>
                    SAFETY STOCK
                  </span>

                  <strong>
                    {formatNumber(
                      intelligence.inventory
                        ?.safety_stock,
                      0
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    DAYS UNTIL STOCKOUT
                  </span>

                  <strong>
                    {formatNumber(
                      futureRisk?.predicted_days_until_stockout,
                      1
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    LEAD TIME
                  </span>

                  <strong>
                    {formatNumber(
                      intelligence.inventory
                        ?.lead_time_days,
                      0
                    )}
                    {" days"}
                  </strong>

                </div>

              </div>


              <div className="forecast-risk-flags">

                <div>

                  {futureRisk?.stockout_before_replenishment ? (
                    <AlertTriangle
                      size={16}
                    />
                  ) : (
                    <CheckCircle2
                      size={16}
                    />
                  )}

                  <span>
                    Stockout before replenishment
                  </span>

                  <strong>
                    {futureRisk?.stockout_before_replenishment
                      ? "YES"
                      : "NO"}
                  </strong>

                </div>


                <div>

                  {futureRisk?.safety_stock_breach ? (
                    <AlertTriangle
                      size={16}
                    />
                  ) : (
                    <CheckCircle2
                      size={16}
                    />
                  )}

                  <span>
                    Safety stock breach
                  </span>

                  <strong>
                    {futureRisk?.safety_stock_breach
                      ? "YES"
                      : "NO"}
                  </strong>

                </div>

              </div>

            </div>

          </section>
          {/* =================================================
    RECOMMENDED ACTION
================================================= */}

<section
  className={`forecast-action-card ${recommendedAction.type}`}
>
  <div className="forecast-action-icon">
    {recommendedAction.type === "critical" ? (
      <AlertTriangle size={21} />
    ) : recommendedAction.type === "warning" ? (
      <ShieldAlert size={21} />
    ) : (
      <CheckCircle2 size={21} />
    )}
  </div>

  <div className="forecast-action-content">
    <span>
      RECOMMENDED ACTION
    </span>

    <h2>
      {recommendedAction.title}
    </h2>

    <p>
      {recommendedAction.message}
    </p>
  </div>

  <div className="forecast-action-meta">
    <small>
      DAYS UNTIL STOCKOUT
    </small>

    <strong>
      {futureRisk?.predicted_days_until_stockout != null
        ? formatNumber(
            futureRisk.predicted_days_until_stockout,
            1
          )
        : "—"}
    </strong>

    <span>
      days
    </span>
  </div>
</section>


          {/* =================================================
              DAILY TABLE
          ================================================= */}

          <section className="forecast-daily-card">

            <div className="forecast-section-title">

              <div>

                <span>
                  DAILY FORECAST
                </span>

                <h2>
                  Predicted demand by day
                </h2>

              </div>

              <span>
                {selectedMedicine}
              </span>

            </div>


            <div className="forecast-daily-table">

              <div className="forecast-daily-head">

                <span>
                  DATE
                </span>

                <span>
                  DAY
                </span>

                <span>
                  PREDICTED DEMAND
                </span>

              </div>


              {predictions.map(
                (item) => {

                  const date =
                    new Date(
                      item.date
                    );

                  return (
                    <div
                      className="forecast-daily-row"
                      key={item.date}
                    >

                      <span>
                        {item.date}
                      </span>

                      <span>
                        {date.toLocaleDateString(
                          "en-US",
                          {
                            weekday: "long",
                          }
                        )}
                      </span>

                      <strong>
                        {formatNumber(
                          item.predicted_demand,
                          2
                        )}
                        {" "}
                        {intelligence.medicine?.unit ||
                          "units"}
                      </strong>

                    </div>
                  );

                }
              )}

            </div>

          </section>

        </>
      )}

    </div>
  );
}