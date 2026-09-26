import { useState } from "react";

import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Play,
  RefreshCw,
  ShieldAlert,
  Siren,
  Users,
} from "lucide-react";

import { askResiliCare, generateCrisisBriefing } from "../../api/resilicare";

function CrisisSimulator({
  values,
  setValues,
  onSimulate,
  simulationActive,
  simulationResult,
  impactResult,
  redistributionResult,
  loading = false,
}) {
  const controls = [
    {
      key: "demand",
      label: "Demand increase",
      description: "Expected surge in medicine demand",
      value: values.demand,
      suffix: "%",
      min: 0,
      max: 100,
      step: 5,
    },
    {
      key: "supply",
      label: "Supply disruption",
      description: "Days of interrupted supply",
      value: values.supply,
      suffix: " days",
      min: 0,
      max: 14,
      step: 1,
    },
    {
      key: "staff",
      label: "Staff reduction",
      description: "Reduction in available personnel",
      value: values.staff,
      suffix: "%",
      min: 0,
      max: 50,
      step: 5,
    },
    {
      key: "beds",
      label: "Bed occupancy increase",
      description: "Additional pressure on beds",
      value: values.beds,
      suffix: "%",
      min: 0,
      max: 60,
      step: 5,
    },
  ];

  const scenarioPresets = [
    {
      id: "normal",
      label: "Normal",
      description: "Baseline network conditions",
      values: {
        demand: 0,
        supply: 0,
        staff: 0,
        beds: 0,
      },
    },
    {
      id: "moderate",
      label: "Moderate outbreak",
      description: "Early healthcare pressure",
      values: {
        demand: 25,
        supply: 3,
        staff: 5,
        beds: 15,
      },
    },
    {
      id: "severe",
      label: "Severe crisis",
      description: "High network stress",
      values: {
        demand: 50,
        supply: 5,
        staff: 10,
        beds: 30,
      },
    },
  ];

  const applyScenarioPreset = (preset) => {
    setValues({
      ...preset.values,
    });
  };

  const recommendations =
    redistributionResult?.redistribution?.recommendations || [];

  const topInterventions = [...recommendations].sort(
    (a, b) => Number(b.quantity || 0) - Number(a.quantity || 0),
  );

  const [showAllInterventions, setShowAllInterventions] = useState(false);

  const visibleInterventions = showAllInterventions
    ? topInterventions
    : topInterventions.slice(0, 10);

  const handleGenerateBriefing = async () => {
    if (!simulationResult || !impactResult) {
      return;
    }

    setBriefingLoading(true);
    setBriefingError(null);
    setBriefingError(null);

    try {
      const scenario = {
        demand_increase_percent: Number(values.demand),
        supply_disruption_days: Number(values.supply),
        staff_reduction_percent: Number(values.staff),
        bed_occupancy_increase_percent: Number(values.beds),
      };

      const result = await generateCrisisBriefing(
        scenario,
        network,
        impact,
        topInterventions,
      );

      setBriefing(result);
    } catch (error) {
      setBriefingError(error.message || "Failed to generate crisis briefing.");
    } finally {
      setBriefingLoading(false);
    }
  };

  const handleAskResiliCare = async (customQuestion = null) => {
    const userQuestion = (customQuestion ?? question).trim();

    if (!userQuestion || !simulationResult || !impactResult) {
      return;
    }

    setChatLoading(true);
    setChatError(null);

    try {
      const scenario = {
        demand_increase_percent: Number(values.demand),
        supply_disruption_days: Number(values.supply),
        staff_reduction_percent: Number(values.staff),
        bed_occupancy_increase_percent: Number(values.beds),
      };

      const result = await askResiliCare(
        userQuestion,
        scenario,
        network,
        impact,
        topInterventions,
      );

      setChatAnswer(result);
      setQuestion("");
    } catch (error) {
      setChatError(error.message || "Failed to get an answer from ResiliCare.");
    } finally {
      setChatLoading(false);
    }
  };

  const network =
    simulationResult?.facility_resilience?.network_summary ||
    simulationResult?.simulation?.network_summary ||
    simulationResult?.network_summary ||
    {};

  const impact =
    impactResult?.impact || impactResult?.results || impactResult || {};

  const healthy = Number(network.healthy ?? network.healthy_facilities ?? 0);

  const atRisk = Number(network.at_risk ?? network.at_risk_facilities ?? 0);

  const critical = Number(network.critical ?? network.critical_facilities ?? 0);

  const averageRisk = Number(
    network.average_facility_risk ?? network.average_risk_score ?? 0,
  );

  const stockoutNodes = Number(
    impactResult?.impact?.before?.stockout_nodes ??
      impactResult?.before?.stockout_nodes ??
      network.stockout_risk_nodes ??
      network.stockout_nodes ??
      0,
  );

  const impactData = impactResult?.impact || {};

  const beforeData = impactData.before || {};

  const afterData = impactData.after || {};

  const impactSummary = impactData.impact || {};

  const beforeRisk = Number(beforeData.average_risk_score ?? 0);

  const afterRisk = Number(afterData.average_risk_score ?? 0);

  const riskReduction = Number(impactSummary.risk_improvement_percent ?? 0);

  const stockoutReduction = Number(impactSummary.stockout_nodes_reduced ?? 0);

  const facilitiesImproved = Number(impactSummary.facilities_improved ?? 0);

  const [briefing, setBriefing] = useState(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [briefingError, setBriefingError] = useState(null);
  const [question, setQuestion] = useState("");
  const [chatAnswer, setChatAnswer] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);

  return (
    <section className="crisis-section">
      {/* HEADER */}
      <div className="crisis-heading">
        <div>
          <span className="section-eyebrow">CRISIS LAB</span>

          <h2>Stress-test the healthcare network</h2>

          <p>
            Change the conditions. See where the system breaks. Then determine
            where resources should move.
          </p>
        </div>

        <div className="crisis-icon">
          <BrainCircuit size={27} />
        </div>
      </div>

      {/* SCENARIO PRESETS */}
      <div className="crisis-controls">
        {controls.map((control) => (
          <div className="range-control" key={control.key}>
            <div className="range-top">
              <div>
                <span>{control.label}</span>

                <small>{control.description}</small>
              </div>

              <strong>
                {control.value}
                {control.suffix}
              </strong>
            </div>

            <input
              type="range"
              min={control.min}
              max={control.max}
              step={control.step}
              value={control.value}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  [control.key]: Number(event.target.value),
                }))
              }
            />

            <div className="range-scale">
              <span>
                {control.min}
                {control.suffix}
              </span>

              <span>
                {control.max}
                {control.suffix}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* SCENARIO FOOTER */}
      <div className="crisis-footer">
        <div className="scenario-summary">
          <span>ACTIVE SCENARIO</span>

          <strong>
            {values.demand}% demand · {values.supply} day supply shock ·{" "}
            {values.staff}% staff · {values.beds}% occupancy
          </strong>
        </div>

        <button
          className={`simulate-button ${
            loading || simulationActive ? "simulation-running" : ""
          }`}
          onClick={() => {
            setShowAllInterventions(false);
            onSimulate();
          }}
          disabled={loading}
        >
          {loading ? (
            <>
              <RefreshCw size={17} className="spin" />
              Running simulation
            </>
          ) : simulationActive ? (
            <>
              <RefreshCw size={17} />
              Recalculate scenario
            </>
          ) : (
            <>
              <Play size={17} fill="currentColor" />
              Simulate scenario
            </>
          )}
        </button>
      </div>

      {/* RESULTS */}
      {simulationResult && (
        <div className="crisis-results">
          <div className="crisis-results-header">
            <div>
              <span className="section-eyebrow">SIMULATION OUTPUT</span>

              <h3>Network resilience under stress</h3>
            </div>

            <div className="simulation-status">
              <span className="status-dot" />
              Scenario applied
            </div>
          </div>

          {/* KPI GRID */}
          <div className="crisis-kpi-grid">
            <div className="crisis-kpi">
              <div className="crisis-kpi-icon healthy">
                <CheckCircle2 size={19} />
              </div>

              <div>
                <span>Healthy</span>
                <strong>{healthy}</strong>
                <small>facilities</small>
              </div>
            </div>

            <div className="crisis-kpi">
              <div className="crisis-kpi-icon warning">
                <AlertTriangle size={19} />
              </div>

              <div>
                <span>At risk</span>
                <strong>{atRisk}</strong>
                <small>facilities</small>
              </div>
            </div>

            <div className="crisis-kpi">
              <div className="crisis-kpi-icon critical">
                <Siren size={19} />
              </div>

              <div>
                <span>Critical</span>
                <strong>{critical}</strong>
                <small>facilities</small>
              </div>
            </div>

            <div className="crisis-kpi">
              <div className="crisis-kpi-icon neutral">
                <ShieldAlert size={19} />
              </div>

              <div>
                <span>Average risk</span>
                <strong>{averageRisk.toFixed(2)}</strong>
                <small>/100</small>
              </div>
            </div>

            <div className="crisis-kpi">
              <div className="crisis-kpi-icon critical">
                <Siren size={19} />
              </div>

              <div>
                <span>Stockout risk</span>
                <strong>{stockoutNodes.toLocaleString()}</strong>
                <small>inventory nodes</small>
              </div>
            </div>

            <div className="crisis-kpi">
              <div className="crisis-kpi-icon neutral">
                <Users size={19} />
              </div>

              <div>
                <span>Facilities</span>
                <strong>{healthy + atRisk + critical}</strong>
                <small>simulated</small>
              </div>
            </div>
          </div>

          {/* FACILITY DISTRIBUTION */}
          <div className="crisis-distribution">
            <div className="distribution-heading">
              <div>
                <span>NETWORK CONDITION</span>
                <strong>Facility risk distribution</strong>
              </div>

              <span>{healthy + atRisk + critical} facilities</span>
            </div>

            <div className="distribution-bar">
              {healthy > 0 && (
                <div
                  className="distribution-healthy"
                  style={{
                    width: `${
                      (healthy / Math.max(healthy + atRisk + critical, 1)) * 100
                    }%`,
                  }}
                />
              )}

              {atRisk > 0 && (
                <div
                  className="distribution-risk"
                  style={{
                    width: `${
                      (atRisk / Math.max(healthy + atRisk + critical, 1)) * 100
                    }%`,
                  }}
                />
              )}

              {critical > 0 && (
                <div
                  className="distribution-critical"
                  style={{
                    width: `${
                      (critical / Math.max(healthy + atRisk + critical, 1)) *
                      100
                    }%`,
                  }}
                />
              )}
            </div>

            <div className="distribution-legend">
              <span>
                <i className="legend-healthy" />
                Healthy {healthy}
              </span>

              <span>
                <i className="legend-risk" />
                At risk {atRisk}
              </span>

              <span>
                <i className="legend-critical" />
                Critical {critical}
              </span>
            </div>
          </div>

          {/* IMPACT */}
          {impactResult && (
            <div className="crisis-impact">
              <div className="impact-heading">
                <div>
                  <span className="section-eyebrow">INTERVENTION IMPACT</span>

                  <h3>Did ResiliCare prevent the projected failures?</h3>
                </div>
              </div>

              <div className="impact-grid">
                <div className="impact-card">
                  <span>Average risk</span>

                  <div className="impact-values">
                    <strong>{beforeRisk.toFixed(2)}</strong>

                    <span>→</span>

                    <strong>{afterRisk.toFixed(2)}</strong>
                  </div>

                  <small>
                    {riskReduction >= 0
                      ? `${riskReduction.toFixed(2)}% reduction`
                      : `${Math.abs(riskReduction).toFixed(2)}% increase`}
                  </small>
                </div>

                <div className="impact-card">
                  <span>Stockout nodes reduced</span>

                  <strong className="impact-big">
                    {stockoutReduction.toLocaleString()}
                  </strong>

                  <small>projected inventory nodes</small>
                </div>

                <div className="impact-card">
                  <span>Facilities improved</span>

                  <strong className="impact-big">{facilitiesImproved}</strong>

                  <small>facilities with improved resilience</small>
                </div>
              </div>

              {/* BEFORE VS AFTER */}
              <div className="crisis-before-after">
                <div className="before-after-header">
                  <div>
                    <span className="section-eyebrow">RESILIENCE DELTA</span>

                    <h3>Before intervention vs after ResiliCare</h3>

                    <p>
                      Compare the projected network condition before resource
                      redistribution with the simulated post-intervention state.
                    </p>
                  </div>

                  <div className="delta-badge">
                    <CheckCircle2 size={15} />
                    Intervention evaluated
                  </div>
                </div>

                <div className="before-after-grid">
                  {/* BEFORE */}
                  <div className="comparison-panel before">
                    <div className="comparison-panel-header">
                      <span>BEFORE INTERVENTION</span>
                      <AlertTriangle size={17} />
                    </div>

                    <div className="comparison-metric">
                      <span>AVERAGE RISK</span>
                      <strong>{beforeRisk.toFixed(2)}</strong>
                      <small>/100</small>
                    </div>

                    <div className="comparison-metric">
                      <span>STOCKOUT NODES</span>
                      <strong>
                        {Number(
                          beforeData.stockout_nodes ?? 0,
                        ).toLocaleString()}
                      </strong>
                      <small>projected</small>
                    </div>

                    <div className="comparison-metric">
                      <span>AT-RISK NODES</span>
                      <strong>
                        {Number(
                          beforeData.at_risk_inventory_nodes ?? 0,
                        ).toLocaleString()}
                      </strong>
                      <small>inventory nodes</small>
                    </div>
                  </div>

                  {/* TRANSFORMATION */}
                  <div className="comparison-transform">
                    <div className="transform-line" />

                    <div className="transform-icon">
                      <ArrowRight size={20} />
                    </div>

                    <span>
                      RESOURCE
                      <br />
                      REDISTRIBUTION
                    </span>

                    <div className="transform-line" />
                  </div>

                  {/* AFTER */}
                  <div className="comparison-panel after">
                    <div className="comparison-panel-header">
                      <span>AFTER RESILICARE</span>
                      <CheckCircle2 size={17} />
                    </div>

                    <div className="comparison-metric">
                      <span>AVERAGE RISK</span>
                      <strong>{afterRisk.toFixed(2)}</strong>
                      <small>/100</small>
                    </div>

                    <div className="comparison-metric">
                      <span>STOCKOUT NODES</span>
                      <strong>
                        {Number(afterData.stockout_nodes ?? 0).toLocaleString()}
                      </strong>
                      <small>projected</small>
                    </div>

                    <div className="comparison-metric">
                      <span>AT-RISK NODES</span>
                      <strong>
                        {Number(
                          afterData.at_risk_inventory_nodes ?? 0,
                        ).toLocaleString()}
                      </strong>
                      <small>inventory nodes</small>
                    </div>
                  </div>
                </div>

                {/* OUTCOME */}
                <div className="comparison-outcome">
                  <div>
                    <span>PROJECTED STOCKOUTS REDUCED</span>

                    <strong>{stockoutReduction.toLocaleString()}</strong>

                    <p>
                      stockout nodes reduced through optimized resource
                      redistribution
                    </p>
                  </div>

                  <div>
                    <span>FACILITIES IMPROVED</span>

                    <strong>{facilitiesImproved}</strong>

                    <p>facilities showing improved resilience</p>
                  </div>

                  <div>
                    <span>RISK CHANGE</span>

                    <strong>
                      {beforeRisk > afterRisk ? "↓" : "↑"}{" "}
                      {Math.abs(beforeRisk - afterRisk).toFixed(2)}
                    </strong>

                    <p>average risk points</p>
                  </div>
                </div>
              </div>

              {/* AI CRISIS BRIEFING */}
              <div className="ai-briefing-section">
                <div className="ai-briefing-header">
                  <div>
                    <span className="section-eyebrow">
                      AI CRISIS INTELLIGENCE
                    </span>

                    <h3>Generate executive crisis briefing</h3>

                    <p>
                      Gemini analyzes the simulated network condition,
                      redistribution response, and intervention impact.
                    </p>
                  </div>

                  <button
                    className="ai-briefing-button"
                    type="button"
                    onClick={handleGenerateBriefing}
                    disabled={briefingLoading}
                  >
                    {briefingLoading ? (
                      <>
                        <RefreshCw size={16} className="spin" />
                        Analyzing network
                      </>
                    ) : (
                      <>
                        <BrainCircuit size={16} />
                        Generate briefing
                      </>
                    )}
                  </button>
                </div>

                {briefingError && (
                  <div className="ai-briefing-error">
                    <AlertTriangle size={16} />
                    <span>{briefingError}</span>
                  </div>
                )}

                {briefing?.briefing && (
                  <div className="ai-briefing-result">
                    <div className="ai-briefing-result-header">
                      <div className="ai-status">
                        <span className="ai-status-dot" />
                        GEMINI INTELLIGENCE
                      </div>

                      <span className="ai-generated">
                        Generated from current simulation
                      </span>
                    </div>

                    <div className="ai-briefing-content">
                      {briefing.briefing}
                    </div>
                  </div>
                )}
              </div>
              {/* ASK RESILICARE */}
              <div className="ask-resilicare">
                <div className="ask-resilicare-header">
                  <div>
                    <span className="section-eyebrow">ASK RESILICARE</span>

                    <h3>Explore the simulation</h3>

                    <p>
                      Ask questions about network pressure, resource allocation,
                      and intervention impact.
                    </p>
                  </div>

                  <div className="ask-ai-icon">
                    <BrainCircuit size={19} />
                  </div>
                </div>

                <div className="suggested-questions">
                  {[
                    "Why is the network under pressure?",
                    "Which resources should move first?",
                    "What changed after redistribution?",
                    "Why did safety-stock breaches remain unchanged?",
                  ].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleAskResiliCare(item)}
                      disabled={chatLoading}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <div className="ask-input-row">
                  <input
                    type="text"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        handleAskResiliCare();
                      }
                    }}
                    placeholder="Ask ResiliCare about this simulation..."
                    disabled={chatLoading}
                  />

                  <button
                    type="button"
                    className="ask-submit"
                    onClick={() => handleAskResiliCare()}
                    disabled={chatLoading || !question.trim()}
                  >
                    {chatLoading ? (
                      <>
                        <RefreshCw size={15} className="spin" />
                        Thinking
                      </>
                    ) : (
                      <>
                        <BrainCircuit size={15} />
                        Ask
                      </>
                    )}
                  </button>
                </div>

                {chatError && (
                  <div className="ask-error">
                    <AlertTriangle size={15} />
                    {chatError}
                  </div>
                )}

                {chatAnswer?.answer && (
                  <div className="ask-answer">
                    <div className="ask-answer-header">
                      <div>
                        <span className="ai-status-dot" />
                        RESILICARE AI
                      </div>

                      <span>Evidence-grounded response</span>
                    </div>

                    <div className="ask-question">
                      <span>QUESTION</span>
                      <strong>{chatAnswer.question}</strong>
                    </div>

                    <div className="ask-answer-content">
                      {chatAnswer.answer}
                    </div>
                  </div>
                )}
              </div>
              {/* TOP INTERVENTIONS */}
              {redistributionResult && topInterventions.length > 0 && (
                <div className="top-interventions">
                  <div className="top-interventions-header">
                    <div>
                      <span className="section-eyebrow">PRIORITY ACTIONS</span>

                      <h3>Top recommended interventions</h3>

                      <p>
                        Highest-volume resource movements identified by the
                        optimization engine.
                      </p>
                    </div>

                    <div className="intervention-count">
                      {recommendations.length} recommendations
                    </div>
                  </div>

                  <div className="intervention-list">
                    {visibleInterventions.map((item, index) => (
                      <div
                        className="intervention-row"
                        key={`${item.source?.facility_code}-${item.destination?.facility_code}-${item.medicine}-${index}`}
                      >
                        <div className="intervention-rank">
                          {String(index + 1).padStart(2, "0")}
                        </div>

                        <div className="intervention-route">
                          <strong>{item.source?.facility_code}</strong>

                          <span>→</span>

                          <strong>{item.destination?.facility_code}</strong>

                          <small>
                            {item.source?.facility_name}
                            {" → "}
                            {item.destination?.facility_name}
                          </small>
                        </div>

                        <div className="intervention-medicine">
                          <span>MEDICINE</span>

                          <strong>{item.medicine}</strong>
                        </div>

                        <div className="intervention-quantity">
                          <span>RECOMMENDED TRANSFER</span>

                          <strong>
                            {Number(item.quantity || 0).toFixed(1)}
                          </strong>

                          <small>units</small>
                        </div>

                        <div className="intervention-distance">
                          <span>DISTANCE</span>

                          <strong>
                            {Number(item.distance_km || 0).toFixed(1)}
                          </strong>

                          <small>km</small>
                        </div>
                      </div>
                    ))}
                    {topInterventions.length > 10 && (
                      <button
                        type="button"
                        className="interventions-view-all"
                        onClick={() =>
                          setShowAllInterventions((current) => !current)
                        }
                      >
                        <span>
                          {showAllInterventions
                            ? "Show less"
                            : `View all ${topInterventions.length} interventions`}
                        </span>

                        <ArrowRight
                          size={15}
                          className={
                            showAllInterventions
                              ? "interventions-view-all-icon open"
                              : "interventions-view-all-icon"
                          }
                        />
                      </button>
                    )}
                    {showAllInterventions && (
                      <div
                        className="interventions-modal-backdrop"
                        onClick={() => setShowAllInterventions(false)}
                      >
                        <div
                          className="interventions-modal"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className="interventions-modal-header">
                            <div>
                              <span className="section-eyebrow">
                                RESOURCE OPTIMIZATION
                              </span>

                              <h3>All recommended interventions</h3>

                              <p>
                                Complete redistribution plan generated by the
                                optimization engine.
                              </p>
                            </div>

                            <button
                              type="button"
                              className="interventions-modal-close"
                              onClick={() => setShowAllInterventions(false)}
                              aria-label="Close interventions"
                            >
                              ×
                            </button>
                          </div>

                          <div className="interventions-modal-summary">
                            <div>
                              <span>TOTAL RECOMMENDATIONS</span>
                              <strong>
                                {topInterventions.length.toLocaleString()}
                              </strong>
                            </div>

                            <div>
                              <span>TOTAL TRANSFER</span>
                              <strong>
                                {topInterventions
                                  .reduce(
                                    (sum, item) =>
                                      sum + Number(item.quantity || 0),
                                    0,
                                  )
                                  .toFixed(1)}
                                <small> units</small>
                              </strong>
                            </div>
                          </div>

                          <div className="interventions-modal-list">
                            {topInterventions.map((item, index) => (
                              <div
                                className="intervention-row"
                                key={`modal-${item.source?.facility_code}-${item.destination?.facility_code}-${item.medicine}-${index}`}
                              >
                                <div className="intervention-rank">
                                  {String(index + 1).padStart(2, "0")}
                                </div>

                                <div className="intervention-route">
                                  <strong>{item.source?.facility_code}</strong>

                                  <span>→</span>

                                  <strong>
                                    {item.destination?.facility_code}
                                  </strong>

                                  <small>
                                    {item.source?.facility_name}
                                    {" → "}
                                    {item.destination?.facility_name}
                                  </small>
                                </div>

                                <div className="intervention-medicine">
                                  <span>MEDICINE</span>

                                  <strong>{item.medicine}</strong>
                                </div>

                                <div className="intervention-quantity">
                                  <span>RECOMMENDED TRANSFER</span>

                                  <strong>
                                    {Number(item.quantity || 0).toFixed(1)}
                                  </strong>

                                  <small>units</small>
                                </div>

                                <div className="intervention-distance">
                                  <span>DISTANCE</span>

                                  <strong>
                                    {Number(item.distance_km || 0).toFixed(1)}
                                  </strong>

                                  <small>km</small>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default CrisisSimulator;
