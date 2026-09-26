import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  MapPin,
  Package,
  RefreshCw,
  Route,
  Truck,
} from "lucide-react";

import { calculateRedistribution, explainTransfer, } from "../api/resilicare";

const DEFAULT_SCENARIO = {
  demand_increase_percent: 50,
  supply_disruption_days: 5,
  staff_reduction_percent: 10,
  bed_occupancy_increase_percent: 30,
};

function normalizeTransfers(result) {
  const recommendations =
    result?.redistribution?.recommendations || [];

  return recommendations
    .map((item, index) => ({
      id: `${item.source?.facility_code}-${item.destination?.facility_code}-${index}`,

      sourceCode: item.source?.facility_code || "—",
      sourceName: item.source?.facility_name || "Unknown source",

      destinationCode:
        item.destination?.facility_code || "—",
      destinationName:
        item.destination?.facility_name || "Unknown destination",

      medicine: item.medicine || "Unknown medicine",

      quantity: Number(item.quantity || 0),

      distanceKm: Number(item.distance_km || 0),
      reasoning: item.reasoning || null,
    }))
    .filter(
      (item) =>
        item.quantity > 0 &&
        item.sourceCode !== item.destinationCode
    );
}

function formatNumber(value, decimals = 0) {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function Resources({
  redistributionResult: externalResult = null,
  loading: externalLoading = false,
}) {
  const [localResult, setLocalResult] = useState(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [medicineFilter, setMedicineFilter] = useState("all");
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [aiExplanation, setAiExplanation] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  /*
   * If the parent already has a crisis result,
   * use that. Otherwise load the default scenario.
   */
  useEffect(() => {
    if (externalResult) {
      setLocalLoading(false);
      return;
    }

    async function loadResources() {
      try {
        setLocalLoading(true);
        setError("");

        const result =
          await calculateRedistribution(
            DEFAULT_SCENARIO
          );

        setLocalResult(result);
      } catch (err) {
        console.error(
          "Failed to load redistribution intelligence:",
          err
        );

        setError(
          err.message ||
            "Unable to load redistribution intelligence."
        );
      } finally {
        setLocalLoading(false);
      }
    }

    loadResources();
  }, [externalResult]);

  const result = externalResult || localResult;

  const transfers = useMemo(
    () => normalizeTransfers(result),
    [result]
  );

  const summary =
    result?.redistribution?.summary || {};

  const medicines = useMemo(() => {
    const values = [
      ...new Set(
        transfers
          .map((item) => item.medicine)
          .filter(Boolean)
      ),
    ];

    return values.sort();
  }, [transfers]);

  const filteredTransfers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transfers.filter((transfer) => {
      const matchesSearch =
        !query ||
        transfer.sourceCode
          .toLowerCase()
          .includes(query) ||
        transfer.sourceName
          .toLowerCase()
          .includes(query) ||
        transfer.destinationCode
          .toLowerCase()
          .includes(query) ||
        transfer.destinationName
          .toLowerCase()
          .includes(query) ||
        transfer.medicine
          .toLowerCase()
          .includes(query);

      const matchesMedicine =
        medicineFilter === "all" ||
        transfer.medicine === medicineFilter;

      return matchesSearch && matchesMedicine;
    });
  }, [transfers, search, medicineFilter]);

  const totalUnits = Number(
    summary.total_units_to_transfer ??
      transfers.reduce(
        (sum, item) => sum + item.quantity,
        0
      )
  );

  const sourceFacilities = Number(
    summary.source_facilities ??
      new Set(
        transfers.map((item) => item.sourceCode)
      ).size
  );

  const destinationFacilities = Number(
    summary.destination_facilities ??
      new Set(
        transfers.map(
          (item) => item.destinationCode
        )
      ).size
  );

  const medicineCount = Number(
    summary.medicines_covered ??
      medicines.length
  );

  async function refreshResources() {
    try {
      setLocalLoading(true);
      setError("");

      const result =
        await calculateRedistribution(
          DEFAULT_SCENARIO
        );

      setLocalResult(result);
    } catch (err) {
      setError(
        err.message ||
          "Unable to refresh resource intelligence."
      );
    } finally {
      setLocalLoading(false);
    }
  }
  async function handleExplainTransfer() {
  if (!selectedTransfer) return;

  try {
    setAiLoading(true);
    setAiError("");
    setAiExplanation("");

    const scenario = {
      demand_increase_percent:
        DEFAULT_SCENARIO.demand_increase_percent,

      supply_disruption_days:
        DEFAULT_SCENARIO.supply_disruption_days,

      staff_reduction_percent:
        DEFAULT_SCENARIO.staff_reduction_percent,

      bed_occupancy_increase_percent:
        DEFAULT_SCENARIO.bed_occupancy_increase_percent,
    };

    const result = await explainTransfer(
      selectedTransfer,
      scenario
    );

    setAiExplanation(
      result?.explanation ||
        "No explanation was generated."
    );
  } catch (err) {
    console.error(
      "Gemini explanation failed:",
      err
    );

    setAiError(
      err.message ||
        "Unable to generate AI explanation."
    );
  } finally {
    setAiLoading(false);
  }
}

  const loading =
    externalLoading || localLoading;

  return (
    <div className="resources-page">

      {/* ==================================================
          HEADER
      ================================================== */}

      <section className="resources-header">

        <div>

          <div className="resources-eyebrow">
            <Truck size={15} />
            RESOURCE INTELLIGENCE
          </div>

          <h1>
            Resource Command Center
          </h1>

          <p>
            Optimize movement of medicines across
            healthcare facilities before shortages
            become failures.
          </p>

        </div>

        <button
          className="resources-refresh"
          onClick={refreshResources}
          disabled={loading}
        >
          <RefreshCw
            size={15}
            className={
              loading
                ? "resources-spin"
                : ""
            }
          />

          {loading
            ? "Analyzing..."
            : "Refresh optimization"}
        </button>

      </section>


      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (
        <div className="resources-error">
          <CircleAlert size={17} />

          <span>
            {error}
          </span>
        </div>
      )}


      {/* ==================================================
          KPI SUMMARY
      ================================================== */}

      <section className="resource-kpi-grid">

        <div className="resource-kpi">

          <div className="resource-kpi-icon">
            <Route size={18} />
          </div>

          <span>
            TRANSFER RECOMMENDATIONS
          </span>

          <strong>
            {formatNumber(
              summary.total_recommendations ??
                transfers.length
            )}
          </strong>

          <small>
            Optimized resource movements
          </small>

        </div>


        <div className="resource-kpi">

          <div className="resource-kpi-icon">
            <Package size={18} />
          </div>

          <span>
            UNITS TO REDISTRIBUTE
          </span>

          <strong>
            {formatNumber(totalUnits, 1)}
          </strong>

          <small>
            Across the simulated network
          </small>

        </div>


        <div className="resource-kpi">

          <div className="resource-kpi-icon">
            <ArrowUpRight size={18} />
          </div>

          <span>
            SOURCE FACILITIES
          </span>

          <strong>
            {formatNumber(sourceFacilities)}
          </strong>

          <small>
            Facilities with usable surplus
          </small>

        </div>


        <div className="resource-kpi">

          <div className="resource-kpi-icon">
            <ArrowDownToLine size={18} />
          </div>

          <span>
            DESTINATION FACILITIES
          </span>

          <strong>
            {formatNumber(destinationFacilities)}
          </strong>

          <small>
            Facilities requiring resources
          </small>

        </div>

      </section>


      {/* ==================================================
          OPTIMIZATION SIGNAL
      ================================================== */}

      <section className="resource-signal">

        <div className="resource-signal-icon">
          <CheckCircle2 size={20} />
        </div>

        <div className="resource-signal-copy">

          <span>
            OPTIMIZATION ENGINE
          </span>

          <strong>
            Network redistribution plan generated
          </strong>

          <p>
            The optimizer matched facilities with
            projected surplus to facilities with
            projected shortages while accounting
            for transport distance.
          </p>

        </div>

        <div className="resource-signal-stat">

          <strong>
            {formatNumber(medicineCount)}
          </strong>

          <span>
            medicines covered
          </span>

        </div>

      </section>


      {/* ==================================================
          TRANSFER TABLE
      ================================================== */}

      <section className="resource-transfers">

        <div className="resource-section-header">

          <div>

            <span>
              PRIORITY TRANSFERS
            </span>

            <h2>
              Recommended Resource Movements
            </h2>

            <p>
              Recommended source-to-destination
              movements generated by the optimization
              engine.
            </p>

          </div>

          <div className="resource-result-count">
            {filteredTransfers.length}
            {" "}
            shown
          </div>

        </div>


        {/* CONTROLS */}

        <div className="resource-controls">

          <div className="resource-search">

            <Route size={16} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search facility or medicine..."
            />

          </div>


          <select
            value={medicineFilter}
            onChange={(event) =>
              setMedicineFilter(event.target.value)
            }
            className="resource-select"
          >

            <option value="all">
              All medicines
            </option>

            {medicines.map((medicine) => (
              <option
                key={medicine}
                value={medicine}
              >
                {medicine}
              </option>
            ))}

          </select>

        </div>


        {/* TABLE */}

        <div className="transfer-table">

          <div className="transfer-table-head">

            <span>
              SOURCE
            </span>

            <span>
              DESTINATION
            </span>

            <span>
              MEDICINE
            </span>

            <span>
              QUANTITY
            </span>

            <span>
              DISTANCE
            </span>

            <span />

          </div>


          {loading && !transfers.length ? (

            <div className="resource-empty">
              <div className="resources-loader" />

              <span>
                Calculating optimal resource
                movements...
              </span>
            </div>

          ) : filteredTransfers.length === 0 ? (

            <div className="resource-empty">

              <Package size={22} />

              <span>
                No transfers match your filters.
              </span>

            </div>

          ) : (

            filteredTransfers
              .slice(0, 100)
              .map((transfer, index) => (

                <button
                  key={transfer.id}
                  className="transfer-table-row"
                  onClick={() =>
                    setSelectedTransfer(transfer)
                  }
                >

                  <div className="transfer-location">

                    <span>
                      {transfer.sourceCode}
                    </span>

                    <strong>
                      {transfer.sourceName}
                    </strong>

                  </div>


                  <div className="transfer-destination">

                    <ArrowRight size={16} />

                    <div>

                      <span>
                        {transfer.destinationCode}
                      </span>

                      <strong>
                        {transfer.destinationName}
                      </strong>

                    </div>

                  </div>


                  <div className="transfer-medicine">

                    <Package size={15} />

                    <span>
                      {transfer.medicine}
                    </span>

                  </div>


                  <div className="transfer-quantity">

                    <strong>
                      {formatNumber(
                        transfer.quantity,
                        1
                      )}
                    </strong>

                    <span>
                      units
                    </span>

                  </div>


                  <div className="transfer-distance">

                    <MapPin size={14} />

                    <span>
                      {formatNumber(
                        transfer.distanceKm,
                        1
                      )}
                      {" km"}
                    </span>

                  </div>


                  <div className="transfer-open">

                    <ArrowUpRight size={16} />

                  </div>

                </button>

              ))

          )}

        </div>


        {filteredTransfers.length > 100 && (
          <div className="resource-table-note">
            Showing the first 100 recommendations.
            Use search or medicine filters to inspect
            the remaining transfer plan.
          </div>
        )}

      </section>


      {/* ==================================================
          TRANSFER DETAIL
      ================================================== */}

      {selectedTransfer && (
        <div
          className="resource-detail-backdrop"
          onClick={() =>
            setSelectedTransfer(null)
          }
        >

          <div
            className="resource-detail"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="resource-detail-header">

              <div>

                <span>
                  TRANSFER INTELLIGENCE
                </span>

                <h2>
                  Resource movement
                </h2>

              </div>

              <button
                onClick={() =>
                  setSelectedTransfer(null)
                }
              >
                ×
              </button>

            </div>


            <div className="resource-route">

              <div>

                <span>
                  SOURCE
                </span>

                <strong>
                  {selectedTransfer.sourceName}
                </strong>

                <small>
                  {selectedTransfer.sourceCode}
                </small>

              </div>


              <div className="resource-route-arrow">

                <ArrowRight size={21} />

                <span>
                  {formatNumber(
                    selectedTransfer.distanceKm,
                    1
                  )}
                  {" km"}
                </span>

              </div>


              <div>

                <span>
                  DESTINATION
                </span>

                <strong>
                  {selectedTransfer.destinationName}
                </strong>

                <small>
                  {selectedTransfer.destinationCode}
                </small>

              </div>

            </div>


            <div className="resource-detail-grid">

              <div>

                <span>
                  MEDICINE
                </span>

                <strong>
                  {selectedTransfer.medicine}
                </strong>

              </div>


              <div>

                <span>
                  TRANSFER QUANTITY
                </span>

                <strong>
                  {formatNumber(
                    selectedTransfer.quantity,
                    1
                  )}
                  {" units"}
                </strong>

              </div>


              <div>

                <span>
                  TRANSPORT DISTANCE
                </span>

                <strong>
                  {formatNumber(
                    selectedTransfer.distanceKm,
                    1
                  )}
                  {" km"}
                </strong>

              </div>

            </div>


            <div className="resource-detail-explanation">

              <div>
                <CheckCircle2 size={18} />
              </div>

              <div>

                <span>
                  WHY THIS TRANSFER?
                </span>

                <p>
                  ResiliCare identified this facility
                  as a suitable source and matched it
                  with a destination requiring the same
                  resource. The optimization considers
                  available surplus and transport
                  distance when generating the movement
                  plan.
                </p>

              </div>

            </div>
            <div className="gemini-explanation-section">

  {!aiExplanation && !aiLoading && (
    <button
      className="gemini-explain-button"
      onClick={handleExplainTransfer}
    >
      ✦ Explain this decision with Gemini
    </button>
  )}

  {aiLoading && (
    <div className="gemini-loading">
      <div className="gemini-spinner" />
      <div>
        <span>AI DECISION EXPLANATION</span>
        <p>
          Gemini is analyzing this resource movement...
        </p>
      </div>
    </div>
  )}

  {aiError && (
    <div className="gemini-error">
      {aiError}
    </div>
  )}

  {aiExplanation && (
    <div className="gemini-result">

      <div className="gemini-result-header">
        <span>GEMINI EXPLANATION</span>

        <button
          onClick={handleExplainTransfer}
          disabled={aiLoading}
        >
          Regenerate
        </button>
      </div>

      <p>
        {aiExplanation}
      </p>

    </div>
  )}

</div>


            <div className="resource-detail-footer">

              <Clock3 size={14} />

              <span>
                Recommendation generated by the
                ResiliCare optimization engine.
              </span>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}