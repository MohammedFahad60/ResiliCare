import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import Navbar from "./components/layout/Navbar";

import Hero from "./components/overview/Hero";
import StatCard from "./components/overview/StatCard";
import NetworkMap from "./components/overview/NetworkMap";
import ForecastPanel from "./components/overview/ForecastPanel";
import ResiliencePanel from "./components/overview/ResiliencePanel";
import FacilityPanel from "./components/overview/FacilityPanel";

import CrisisSimulator from "./components/crisis/CrisisSimulator";

import { useInventory } from "./hooks/useInventory";
import { useIntelligence } from "./hooks/useIntelligence";
import { useCrisis } from "./hooks/useCrisis";

import Network from "./pages/Network";
import Resources from "./pages/Resources";
import Forecasts from "./pages/Forecasts";
import EarlyWarningCenter from "./components/overview/EarlyWarningCenter";
import Federated from "./pages/Federated";

import {
  Activity,
  AlertTriangle,
  PackageCheck,
  ShieldCheck,
  Truck,
  Package,
} from "lucide-react";

import "leaflet/dist/leaflet.css";
import "./index.css";

function normalizeTransfers(redistributionResult) {
  const recommendations =
    redistributionResult?.redistribution?.recommendations || [];

  return recommendations.map((item, index) => ({
    id: `${item.source.facility_code}-${item.destination.facility_code}-${index}`,

    sourceCode: item.source.facility_code,
    sourceName: item.source.facility_name,

    destinationCode: item.destination.facility_code,
    destinationName: item.destination.facility_name,

    medicine: item.medicine,

    quantity: Number(item.quantity || 0),

    units: Number(item.quantity || 0),

    distanceKm: Number(item.distance_km || 0),

    distance: Number(item.distance_km || 0),
  }));
}

/* ---------------------------------------------------------
   APP
--------------------------------------------------------- */

export default function App() {
  const [active, setActive] = useState("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showOverviewInterventions, setShowOverviewInterventions] = useState(false);

  const [values, setValues] = useState({
    demand: 50,
    supply: 5,
    staff: 10,
    beds: 30,
  });

  /* -------------------------------------------------------
     INVENTORY
  ------------------------------------------------------- */

  const {
    inventory,
    loading: inventoryLoading,
    error: inventoryError,
    mapFacilities,
    dashboardStats,
  } = useInventory();

  /* -------------------------------------------------------
     DEMAND INTELLIGENCE
  ------------------------------------------------------- */

  const { intelligenceResult, intelligenceLoading, intelligenceError } =
    useIntelligence();

  /* -------------------------------------------------------
     CRISIS INTELLIGENCE
  ------------------------------------------------------- */

  const {
    simulationActive,
    simulationResult,
    redistributionResult,
    impactResult,
    crisisLoading,
    crisisError,
    runSimulation: runCrisisSimulation,
  } = useCrisis();

  const redistributionSummary = redistributionResult?.redistribution?.summary;

  const transferCount = redistributionSummary?.total_recommendations ?? 0;

  const transferUnits = redistributionSummary?.total_units_to_transfer ?? 0;

  const transfers = normalizeTransfers(redistributionResult);

  /* -------------------------------------------------------
     COMBINED UI STATE
  ------------------------------------------------------- */

  const loading = inventoryLoading || crisisLoading;

  const error = inventoryError || intelligenceError || crisisError || null;

  /* -------------------------------------------------------
     CRISIS SIMULATION
  ------------------------------------------------------- */

  const runSimulation = () => {
    setActive("Crisis Lab");

    return runCrisisSimulation(values);
  };

  /* -------------------------------------------------------
     TRANSFER SUMMARY
  ------------------------------------------------------- */

  const totalTransferUnits = transfers.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <div className="app-shell">
      <Navbar
        active={active}
        setActive={setActive}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <main className="main-content">
        <div className="page-content">
          {/* -------------------------------------------------
             LOADING STATE
          ------------------------------------------------- */}

          {loading && (
            <div className="loading-overlay">
              <div className="loading-card">
                <div className="loading-spinner" />
                <span>
                  {crisisLoading
                    ? "Running resilience analysis..."
                    : "Loading healthcare network..."}
                </span>
              </div>
            </div>
          )}

          {/* -------------------------------------------------
             BACKEND ERROR
          ------------------------------------------------- */}

          {error && (
            <div className="backend-error">
              Unable to load ResiliCare intelligence: {error}
            </div>
          )}

          {/* -------------------------------------------------
             HERO
          ------------------------------------------------- */}

          {active === "Overview" && (
            <>
              <Hero
                onRunSimulation={runSimulation}
                onExploreNetwork={() => setActive("Network")}
                stockoutNodes={dashboardStats.stockoutNodes}
                facilityCount={mapFacilities.length}
              />

              <section className="stats-grid">
                <StatCard
                  icon={AlertTriangle}
                  label="Critical facilities"
                  value={dashboardStats.criticalFacilities}
                  description="Facilities requiring immediate operational attention"
                  tone="danger"
                  trend={{
                    direction: "up",
                    text: "Network pressure",
                  }}
                />

                <StatCard
                  icon={PackageCheck}
                  label="Stockout-risk nodes"
                  value={dashboardStats.stockoutNodes}
                  description="Inventory nodes projected to run short"
                  tone="warning"
                />

                <StatCard
                  icon={Activity}
                  label="Average network risk"
                  value={dashboardStats.avgRisk}
                  suffix="/100"
                  description="Composite healthcare resilience score"
                  tone="neutral"
                />

                <StatCard
                  icon={Package}
                  label="Recommended transfers"
                  value={transferCount}
                  description={`${Number(transferUnits).toFixed(1)} units recommended for redistribution`}
                  tone="success"
                />
              </section>
              <div className="network-context-strip">
                <div className="network-context-label">
                  <span className="network-context-dot" />
                  NETWORK INTELLIGENCE
                </div>

                <div className="network-context-item">
                  <strong>
                    {Number(mapFacilities.length).toLocaleString()}
                  </strong>
                  <span>Healthcare facilities</span>
                </div>

                <div className="network-context-divider" />

                <div className="network-context-item">
                  <strong>{Number(inventory.length).toLocaleString()}</strong>
                  <span>Inventory nodes</span>
                </div>

                <div className="network-context-divider" />

                <div className="network-context-item">
                  <strong>7-day</strong>
                  <span>Predictive monitoring</span>
                </div>

                <div className="network-context-status">
                  <span />
                  Intelligence active
                </div>
              </div>

              <EarlyWarningCenter />

              <NetworkMap
                facilities={mapFacilities}
                simulationActive={simulationActive}
                avgRisk={dashboardStats.avgRisk}
              />

              <section className="insight-grid">
                <ForecastPanel
                  intelligenceResult={intelligenceResult}
                  intelligenceLoading={intelligenceLoading}
                />

                <ResiliencePanel
                  simulationActive={simulationActive}
                  impactResult={impactResult}
                  currentRisk={dashboardStats.avgRisk}
                />
              </section>

              <CrisisSimulator
                values={values}
                setValues={setValues}
                onSimulate={runSimulation}
                simulationActive={simulationActive}
                simulationResult={simulationResult}
                impactResult={impactResult}
                loading={crisisLoading}
              />

              <section className="transfer-section overview-transfer-section">
                <div className="section-heading-row">
                  <div>
                    <span className="section-eyebrow">RESOURCE OPTIMIZATION</span>
                    <h2>Recommended interventions</h2>
                  </div>

                  <div className="recommendation-count">
                    <Truck size={17} />
                    {transferCount} recommendations
                  </div>
                </div>

                {crisisLoading ? (
                  <div className="overview-interventions-loading">
                    Loading recommended interventions...
                  </div>
                ) : transfers.length === 0 ? (
                  <div className="overview-interventions-empty">
                    No redistribution recommendations available yet.
                  </div>
                ) : (
                  <>
                    <div className="transfer-list">
                      {transfers.slice(0, 10).map((transfer, index) => (
                        <motion.div
                          className="transfer-row"
                          key={transfer.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04 }}
                        >
                          <div className="transfer-number">
                            {String(index + 1).padStart(2, "0")}
                          </div>

                          <div className="transfer-route">
                            <div className="route-line">
                              <strong>{transfer.sourceCode}</strong>
                              <span />
                              <Truck size={19} />
                              <span />
                              <strong>{transfer.destinationCode}</strong>
                            </div>

                            <span>
                              {transfer.sourceName} → {transfer.destinationName}
                            </span>
                          </div>

                          <div className="transfer-medicine">
                            <span>MEDICINE</span>
                            <strong>{transfer.medicine}</strong>
                          </div>

                          <div className="transfer-quantity">
                            <span>TRANSFER</span>
                            <strong>{Number(transfer.quantity || 0).toFixed(1)}</strong>
                            <small>units</small>
                          </div>

                          <div className="transfer-distance">
                            <span>DISTANCE</span>
                            <strong>{Number(transfer.distanceKm || 0).toFixed(1)}</strong>
                            <small>km</small>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {transfers.length > 10 && (
                      <button
                        type="button"
                        className="interventions-view-all"
                        onClick={() => setShowOverviewInterventions(true)}
                      >
                        <span>View all {transfers.length} interventions</span>
                        <Truck size={15} />
                      </button>
                    )}
                  </>
                )}
              </section>

              <AnimatePresence>
                {showOverviewInterventions && (
                  <motion.div
                    className="interventions-modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onMouseDown={(event) => {
                      if (event.target === event.currentTarget) {
                        setShowOverviewInterventions(false);
                      }
                    }}
                  >
                    <motion.div
                      className="interventions-modal"
                      initial={{ opacity: 0, y: 24, scale: 0.985 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 18, scale: 0.985 }}
                      transition={{ duration: 0.22 }}
                    >
                      <div className="interventions-modal-header">
                        <div>
                          <span className="section-eyebrow">RESOURCE OPTIMIZATION</span>
                          <h2>All recommended interventions</h2>
                          <p>
                            {transfers.length} redistribution recommendations identified
                            by the optimization engine.
                          </p>
                        </div>

                        <button
                          type="button"
                          className="interventions-modal-close"
                          aria-label="Close interventions"
                          onClick={() => setShowOverviewInterventions(false)}
                        >
                          ×
                        </button>
                      </div>

                      <div className="interventions-modal-summary">
                        <span>
                          <Truck size={16} />
                          {transfers.length} interventions
                        </span>
                        <span>
                          {Number(totalTransferUnits).toFixed(1)} total units
                        </span>
                      </div>

                      <div className="interventions-modal-list">
                        {transfers.map((transfer, index) => (
                          <div
                            className="transfer-row"
                            key={transfer.id}
                          >
                            <div className="transfer-number">
                              {String(index + 1).padStart(2, "0")}
                            </div>

                            <div className="transfer-route">
                              <div className="route-line">
                                <strong>{transfer.sourceCode}</strong>
                                <span />
                                <Truck size={19} />
                                <span />
                                <strong>{transfer.destinationCode}</strong>
                              </div>

                              <span>
                                {transfer.sourceName} → {transfer.destinationName}
                              </span>
                            </div>

                            <div className="transfer-medicine">
                              <span>MEDICINE</span>
                              <strong>{transfer.medicine}</strong>
                            </div>

                            <div className="transfer-quantity">
                              <span>TRANSFER</span>
                              <strong>{Number(transfer.quantity || 0).toFixed(1)}</strong>
                              <small>units</small>
                            </div>

                            <div className="transfer-distance">
                              <span>DISTANCE</span>
                              <strong>{Number(transfer.distanceKm || 0).toFixed(1)}</strong>
                              <small>km</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <FacilityPanel inventory={inventory} />
              <section className="provenance-section">
                <div className="provenance-header">
                  <div>
                    <span className="section-eyebrow">
                      DATA & MODEL PROVENANCE
                    </span>

                    <h2>Transparent intelligence infrastructure</h2>

                    <p>
                      ResiliCare combines contextual healthcare data with
                      simulated operational signals to demonstrate predictive
                      resilience at network scale.
                    </p>
                  </div>
                </div>

                <div className="provenance-grid">
                  <div className="provenance-card">
                    <span className="provenance-number">01</span>

                    <strong>Healthcare context</strong>

                    <p>
                      Facility, geographic and healthcare-system context
                      provides the foundation for network modelling.
                    </p>

                    <small>PUBLIC / CONTEXTUAL DATA</small>
                  </div>

                  <div className="provenance-card">
                    <span className="provenance-number">02</span>

                    <strong>Operational layer</strong>

                    <p>
                      Inventory, consumption, safety stock, lead time and demand
                      histories are realistically simulated for the prototype
                      environment.
                    </p>

                    <small>SYNTHETIC OPERATIONAL DATA</small>
                  </div>

                  <div className="provenance-card">
                    <span className="provenance-number">03</span>

                    <strong>Predictive models</strong>

                    <p>
                      Historical demand signals are used to forecast future
                      medicine requirements and identify emerging stockout risk.
                    </p>

                    <small>MACHINE LEARNING</small>
                  </div>

                  <div className="provenance-card">
                    <span className="provenance-number">04</span>

                    <strong>Decision intelligence</strong>

                    <p>
                      Crisis simulation and optimization translate predicted
                      risk into recommended interventions.
                    </p>

                    <small>SIMULATION + OPTIMIZATION</small>
                  </div>
                </div>

                <div className="provenance-note">
                  <span className="provenance-note-dot" />

                  <p>
                    Prototype environment — no confidential or live government
                    inventory data is assumed.
                  </p>
                </div>
              </section>
            </>
          )}
          {active === "Network" && (
            <Network
              facilities={mapFacilities}
              dashboardStats={dashboardStats}
            />
          )}
          {active === "Resources" && (
            <Resources
              redistributionResult={redistributionResult}
              loading={crisisLoading}
            />
          )}
          {active === "Forecasts" && (
            <Forecasts
              intelligenceResult={intelligenceResult}
              intelligenceLoading={intelligenceLoading}
            />
          )}

          {active === "Crisis Lab" && (
            <CrisisSimulator
              values={values}
              setValues={setValues}
              onSimulate={runSimulation}
              simulationActive={simulationActive}
              simulationResult={simulationResult}
              redistributionResult={redistributionResult}
              impactResult={impactResult}
              loading={crisisLoading}
            />
          )}

          {active === "Federated Intelligence" && <Federated />}

          {/* -------------------------------------------------
             FOOTER
          ------------------------------------------------- */}

          <footer className="footer">
            <div className="footer-brand">
              <ShieldCheck size={17} />
              ResiliCare
            </div>

            <span>Predictive healthcare resilience intelligence</span>

            <div className="footer-right">
              <span>
                <span className="status-dot" />
                All systems operational
              </span>

              <span>v0.1.0</span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}