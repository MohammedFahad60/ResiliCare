import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  getInventory,
  simulateCrisis,
  calculateRedistribution,
  calculateImpact,
  getInventoryIntelligence,
} from "./api/resilicare";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BrainCircuit,
  Building2,
  ChevronRight,
  CircleCheck,
  Clock3,
  Gauge,
  Layers3,
  MapPin,
  Menu,
  Network,
  PackageCheck,
  Play,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Truck,
  Users,
  X,
  Zap,
} from "lucide-react";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Polyline,
  ZoomControl,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import "./index.css";

/* ---------------------------------------------------------
   RESILICARE DEMO DATA
--------------------------------------------------------- */

const facilities = [
  {
    id: "FAC-0038",
    name: "Salem PHC",
    district: "Salem",
    state: "Tamil Nadu",
    lat: 11.6643,
    lng: 78.146,
    risk: "critical",
    riskScore: 93,
  },
  {
    id: "FAC-0033",
    name: "Mysuru PHC",
    district: "Mysuru",
    state: "Karnataka",
    lat: 12.2958,
    lng: 76.6394,
    risk: "critical",
    riskScore: 83,
  },
  {
    id: "FAC-0064",
    name: "Karimnagar CHC",
    district: "Karimnagar",
    state: "Telangana",
    lat: 18.4386,
    lng: 79.1288,
    risk: "critical",
    riskScore: 71,
  },
  {
    id: "FAC-0072",
    name: "Pune PHC",
    district: "Pune",
    state: "Maharashtra",
    lat: 18.5204,
    lng: 73.8567,
    risk: "critical",
    riskScore: 77,
  },
  {
    id: "FAC-0040",
    name: "Salem PHC",
    district: "Salem",
    state: "Tamil Nadu",
    lat: 11.691,
    lng: 78.167,
    risk: "healthy",
    riskScore: 3,
  },
  {
    id: "FAC-0080",
    name: "Karimnagar PHC",
    district: "Karimnagar",
    state: "Telangana",
    lat: 18.462,
    lng: 79.152,
    risk: "healthy",
    riskScore: 3,
  },
  {
    id: "FAC-0092",
    name: "Pune PHC",
    district: "Pune",
    state: "Maharashtra",
    lat: 18.547,
    lng: 73.88,
    risk: "healthy",
    riskScore: 3,
  },
  {
    id: "FAC-0091",
    name: "Mysuru CHC",
    district: "Mysuru",
    state: "Karnataka",
    lat: 12.323,
    lng: 76.67,
    risk: "healthy",
    riskScore: 3,
  },
  {
    id: "BLR-01",
    name: "Bengaluru District Hospital",
    district: "Bengaluru Urban",
    state: "Karnataka",
    lat: 12.9716,
    lng: 77.5946,
    risk: "at-risk",
    riskScore: 48,
  },
  {
    id: "MUM-01",
    name: "Mumbai Central Hospital",
    district: "Mumbai",
    state: "Maharashtra",
    lat: 19.076,
    lng: 72.8777,
    risk: "at-risk",
    riskScore: 44,
  },
  {
    id: "HYD-01",
    name: "Hyderabad District Hospital",
    district: "Hyderabad",
    state: "Telangana",
    lat: 17.385,
    lng: 78.4867,
    risk: "at-risk",
    riskScore: 53,
  },
  {
    id: "CHE-01",
    name: "Chennai District Hospital",
    district: "Chennai",
    state: "Tamil Nadu",
    lat: 13.0827,
    lng: 80.2707,
    risk: "at-risk",
    riskScore: 41,
  },
];

const transfers = [
  {
    medicine: "Azithromycin",
    from: "FAC-0040",
    fromName: "Salem PHC",
    to: "FAC-0038",
    toName: "Salem PHC",
    units: 117,
    distance: 3.08,
  },
  {
    medicine: "Azithromycin",
    from: "FAC-0080",
    fromName: "Karimnagar PHC",
    to: "FAC-0064",
    toName: "Karimnagar CHC",
    units: 74.5,
    distance: 3.27,
  },
  {
    medicine: "Azithromycin",
    from: "FAC-0092",
    fromName: "Pune PHC",
    to: "FAC-0072",
    toName: "Pune PHC",
    units: 23.5,
    distance: 5.16,
  },
  {
    medicine: "Salbutamol",
    from: "FAC-0091",
    fromName: "Mysuru CHC",
    to: "FAC-0033",
    toName: "Mysuru PHC",
    units: 17.5,
    distance: 7.36,
  },
];

const navItems = [
  { label: "Overview", icon: Gauge },
  { label: "Network", icon: Network },
  { label: "Resources", icon: PackageCheck },
  { label: "Forecasts", icon: Activity },
  { label: "Crisis Lab", icon: BrainCircuit },
];

/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

function riskColor(risk) {
  if (risk === "critical") return "#ff6b6b";
  if (risk === "at-risk") return "#f4b860";
  return "#5ee0a0";
}

function riskLabel(risk) {
  if (risk === "critical") return "Critical";
  if (risk === "at-risk") return "At risk";
  return "Healthy";
}

/* ---------------------------------------------------------
   COMPONENTS
--------------------------------------------------------- */

function AnimatedNumber({ value, decimals = 0 }) {
  const formatted = Number(value).toFixed(decimals);

  return (
    <motion.span
      key={formatted}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      {formatted}
    </motion.span>
  );
}

function Sidebar({ active, setActive, mobileOpen, setMobileOpen }) {
  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <ShieldCheck size={24} strokeWidth={2.2} />
          </div>

          <div>
            <div className="brand-name">ResiliCare</div>
            <div className="brand-subtitle">Healthcare resilience</div>
          </div>

          <button className="mobile-close" onClick={() => setMobileOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-section-label">COMMAND CENTER</div>

        <nav className="nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const selected = active === item.label;

            return (
              <button
                key={item.label}
                className={`nav-item ${selected ? "nav-active" : ""}`}
                onClick={() => {
                  setActive(item.label);
                  setMobileOpen(false);
                }}
              >
                <Icon size={19} strokeWidth={1.9} />
                <span>{item.label}</span>

                {selected && <span className="nav-indicator" />}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="system-card">
            <div className="system-status">
              <span className="status-dot" />
              Systems operational
            </div>

            <div className="system-text">Data refreshed 2 min ago</div>

            <div className="system-line">
              <span />
            </div>

            <div className="system-meta">
              <span>100 facilities</span>
              <span>1,000 nodes</span>
            </div>
          </div>

          <button className="settings-button">
            <SlidersHorizontal size={18} />
            <span>System settings</span>
          </button>
        </div>
      </aside>
    </>
  );
}

function TopBar({ setMobileOpen }) {
  return (
    <header className="topbar">
      <button className="mobile-menu" onClick={() => setMobileOpen(true)}>
        <Menu size={22} />
      </button>

      <div className="breadcrumb">
        <span>ResiliCare</span>
        <ChevronRight size={14} />
        <strong>Overview</strong>
      </div>

      <div className="topbar-actions">
        <div className="live-pill">
          <span className="live-dot" />
          Live network
        </div>

        <button className="icon-button">
          <Bell size={19} />
          <span className="notification-dot" />
        </button>

        <div className="user-avatar">MF</div>
      </div>
    </header>
  );
}

function Hero({ onRunSimulation }) {
  return (
    <section className="hero-section">
      <div className="hero-copy">
        <div className="eyebrow">
          <span />
          NATIONAL HEALTHCARE INTELLIGENCE
        </div>

        <h1>
          Predict.
          <br />
          Prepare.
          <br />
          <em>Protect.</em>
        </h1>

        <p>
          ResiliCare turns healthcare network data into early warnings, scenario
          intelligence, and actionable resource decisions.
        </p>

        <div className="hero-actions">
          <button className="primary-button" onClick={onRunSimulation}>
            <Play size={17} fill="currentColor" />
            Run crisis simulation
          </button>

          <button className="secondary-button">
            Explore network
            <ArrowUpRight size={17} />
          </button>
        </div>
      </div>

      <div className="hero-side">
        <div className="hero-insight">
          <div className="insight-icon">
            <Zap size={20} />
          </div>

          <div>
            <span>NETWORK SIGNAL</span>
            <strong>Supply pressure detected</strong>
            <p>
              930 inventory nodes require intervention under the current
              emergency scenario.
            </p>
          </div>
        </div>

        <div className="hero-location">
          <MapPin size={16} />
          <span>India healthcare network</span>
          <span className="location-separator">•</span>
          <span>100 facilities</span>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  description,
  tone = "neutral",
  trend,
}) {
  return (
    <motion.div
      className={`stat-card stat-${tone}`}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <div className="stat-top">
        <div className="stat-icon">
          <Icon size={20} />
        </div>

        {trend && (
          <div className="stat-trend">
            {trend.direction === "up" ? (
              <ArrowUpRight size={14} />
            ) : (
              <ArrowDownRight size={14} />
            )}
            {trend.text}
          </div>
        )}
      </div>

      <div className="stat-value">
        <AnimatedNumber value={value} decimals={suffix === "%" ? 1 : 0} />
        {suffix && <small>{suffix}</small>}
      </div>

      <div className="stat-label">{label}</div>
      <div className="stat-description">{description}</div>
    </motion.div>
  );
}

function NetworkMap({ facilities, simulationActive }) {
  const routeLines = [
    [
      [11.691, 78.167],
      [11.6643, 78.146],
    ],
    [
      [18.462, 79.152],
      [18.4386, 79.1288],
    ],
    [
      [18.547, 73.88],
      [18.5204, 73.8567],
    ],
    [
      [12.323, 76.67],
      [12.2958, 76.6394],
    ],
  ];

  return (
    <div className="map-shell">
      <div className="map-header">
        <div>
          <span className="section-eyebrow">NETWORK MAP</span>
          <h2>Healthcare system pressure</h2>
        </div>

        <div className="map-legend">
          <span>
            <i className="legend-dot healthy" />
            Healthy
          </span>
          <span>
            <i className="legend-dot warning" />
            At risk
          </span>
          <span>
            <i className="legend-dot danger" />
            Critical
          </span>
        </div>
      </div>

      <div className="map-container">
        <MapContainer
          center={[15.2, 77.5]}
          zoom={5}
          minZoom={4}
          maxZoom={9}
          scrollWheelZoom={false}
          zoomControl={false}
          className="resili-map"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ZoomControl position="bottomright" />

          {simulationActive &&
            routeLines.map((line, index) => (
              <Polyline
                key={index}
                positions={line}
                pathOptions={{
                  color: "#63d8ff",
                  weight: 3,
                  opacity: 0.85,
                  dashArray: "8 8",
                }}
              />
            ))}

          {facilities.map((facility) => (
            <CircleMarker
              key={facility.id}
              center={[facility.lat, facility.lng]}
              radius={facility.risk === "critical" ? 9 : 7}
              pathOptions={{
                color: riskColor(facility.risk),
                fillColor: riskColor(facility.risk),
                fillOpacity: facility.risk === "critical" ? 0.8 : 0.65,
                weight: 2,
              }}
            >
              <Popup>
                <strong>{facility.name}</strong>
                <br />
                {facility.district}, {facility.state}
                <br />
                Risk: {facility.riskScore}/100
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        <div className="map-overlay-card">
          <div className="map-overlay-title">
            <Activity size={17} />
            Network health
          </div>

          <div className="map-risk-number">
            <AnimatedNumber value={74.2} decimals={1} />
            <span>/100</span>
          </div>

          <div className="map-risk-label">Elevated operational risk</div>

          <div className="map-progress">
            <span style={{ width: "74%" }} />
          </div>
        </div>

        <div className="map-status">
          <span className="live-dot" />
          {simulationActive ? "Scenario overlay active" : "Operational network"}
        </div>
      </div>
    </div>
  );
}

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

              const day = date.toLocaleDateString("en-US", {
                weekday: "short",
              });

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
                {Number(futureRisk?.projected_stock_after_7_days || 0).toFixed(
                  2,
                )}
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
                {Number(futureRisk?.predicted_days_until_stockout || 0).toFixed(
                  1,
                )}
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

function ResiliencePanel({ simulationActive, impactResult }) {
  const beforeRisk = impactResult?.impact?.before?.average_risk_score ?? 74.2;

  const afterRisk = impactResult?.impact?.after?.average_risk_score ?? 74.18;

  const riskImprovement = beforeRisk - afterRisk;

  const improvementPercent =
    beforeRisk > 0 ? (riskImprovement / beforeRisk) * 100 : 0;
  return (
    <div className="resilience-card">
      <div className="card-heading">
        <div>
          <span className="section-eyebrow">SYSTEM RESILIENCE</span>
          <h2>Before & after</h2>
        </div>

        <div className="simulation-badge">
          {simulationActive ? "Scenario applied" : "Baseline"}
        </div>
      </div>

      <div className="resilience-score">
        <div className="score-ring">
          <svg viewBox="0 0 120 120">
            <circle className="score-track" cx="60" cy="60" r="49" />
            <motion.circle
              className="score-progress"
              cx="60"
              cy="60"
              r="49"
              initial={{ strokeDashoffset: 308 }}
              animate={{
                strokeDashoffset: 308 - 308 * (Number(afterRisk) / 100),
              }}
              transition={{ duration: 1.1 }}
            />
          </svg>

          <div className="score-center">
            <strong>{Number(beforeRisk).toFixed(2)}</strong>
            <span>risk</span>
          </div>
        </div>

        <div className="score-copy">
          <strong>High pressure</strong>
          <p>
            The network is experiencing significant inventory stress under the
            selected emergency conditions.
          </p>
        </div>
      </div>

      <div className="comparison">
        <div>
          <span>BEFORE</span>
          <strong>74.20</strong>
        </div>

        <div className="comparison-arrow">
          <ArrowDownRight size={20} />
        </div>

        <div className="after-score">
          <span>AFTER</span>
          <strong>{Number(afterRisk).toFixed(2)}</strong>
        </div>

        <div className="improvement">
          <span>CHANGE</span>
          <strong>
            {riskImprovement >= 0 ? "-" : "+"}
            {Math.abs(improvementPercent).toFixed(2)}%
          </strong>
        </div>
      </div>
    </div>
  );
}

function CrisisSimulator({ values, setValues, onSimulate, simulationActive }) {
  const controls = [
    {
      key: "demand",
      label: "Demand increase",
      value: values.demand,
      suffix: "%",
      min: 0,
      max: 100,
    },
    {
      key: "supply",
      label: "Supply disruption",
      value: values.supply,
      suffix: " days",
      min: 0,
      max: 14,
    },
    {
      key: "staff",
      label: "Staff reduction",
      value: values.staff,
      suffix: "%",
      min: 0,
      max: 50,
    },
    {
      key: "beds",
      label: "Bed occupancy increase",
      value: values.beds,
      suffix: "%",
      min: 0,
      max: 60,
    },
  ];

  return (
    <section className="crisis-section">
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

      <div className="crisis-controls">
        {controls.map((control) => (
          <div className="range-control" key={control.key}>
            <div className="range-top">
              <span>{control.label}</span>
              <strong>
                {control.value}
                {control.suffix}
              </strong>
            </div>

            <input
              type="range"
              min={control.min}
              max={control.max}
              value={control.value}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  [control.key]: Number(event.target.value),
                }))
              }
            />
          </div>
        ))}
      </div>

      <div className="crisis-footer">
        <div className="scenario-summary">
          <span>SCENARIO</span>
          <strong>
            {values.demand}% demand · {values.supply} day supply shock ·{" "}
            {values.staff}% staff · {values.beds}% occupancy
          </strong>
        </div>

        <button
          className={`simulate-button ${
            simulationActive ? "simulation-running" : ""
          }`}
          onClick={onSimulate}
        >
          {simulationActive ? (
            <>
              <RefreshCw size={17} className="spin" />
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
    </section>
  );
}

function TransferPanel() {
  return (
    <section className="transfer-section">
      <div className="section-heading-row">
        <div>
          <span className="section-eyebrow">RESOURCE OPTIMIZATION</span>
          <h2>Recommended interventions</h2>
        </div>

        <div className="recommendation-count">
          <Truck size={17} />4 recommendations
        </div>
      </div>

      <div className="transfer-list">
        {transfers.map((transfer, index) => (
          <motion.div
            className="transfer-row"
            key={`${transfer.from}-${transfer.to}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <div className="transfer-number">0{index + 1}</div>

            <div className="transfer-route">
              <div>
                <strong>{transfer.fromName}</strong>
                <span>{transfer.from}</span>
              </div>

              <div className="route-line">
                <span />
                <Truck size={15} />
                <span />
              </div>

              <div>
                <strong>{transfer.toName}</strong>
                <span>{transfer.to}</span>
              </div>
            </div>

            <div className="transfer-medicine">
              <span>MEDICINE</span>
              <strong>{transfer.medicine}</strong>
            </div>

            <div className="transfer-quantity">
              <span>TRANSFER</span>
              <strong>{transfer.units} units</strong>
            </div>

            <div className="transfer-distance">
              <span>DISTANCE</span>
              <strong>{transfer.distance} km</strong>
            </div>

            <button className="row-arrow">
              <ArrowUpRight size={17} />
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

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

/* ---------------------------------------------------------
   APP
--------------------------------------------------------- */

export default function App() {
  const [active, setActive] = useState("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [simulationActive, setSimulationActive] = useState(false);

  const [values, setValues] = useState({
    demand: 50,
    supply: 5,
    staff: 10,
    beds: 30,
  });

  // LIVE INVENTORY
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);
  const [redistributionResult, setRedistributionResult] = useState(null);
  const [impactResult, setImpactResult] = useState(null);
  const [intelligenceResult, setIntelligenceResult] = useState(null);
  const [intelligenceLoading, setIntelligenceLoading] = useState(false);

  const loadIntelligence = async (facilityCode, medicineName) => {
    try {
      setIntelligenceLoading(true);

      const result = await getInventoryIntelligence(facilityCode, medicineName);

      console.log("INTELLIGENCE:", result);

      setIntelligenceResult(result);
    } catch (err) {
      console.error("Failed to load intelligence:", err);
    } finally {
      setIntelligenceLoading(false);
    }
  };

  // inventory loading
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

  // intelligence loading
  useEffect(() => {
    loadIntelligence("FAC-0001", "Paracetamol");
  }, []);

  // LIVE MAP FACILITIES
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

  // LIVE DASHBOARD STATS
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
      (item) => item.status === "CRITICAL",
    ).length;

    const stockoutNodes = inventory.filter(
      (item) => item.stockout_before_replenishment === true,
    ).length;

    const avgRisk =
      inventory.reduce((sum, item) => sum + Number(item.risk_score || 0), 0) /
      inventory.length;

    return {
      criticalFacilities,
      stockoutNodes,
      avgRisk: Number(avgRisk.toFixed(1)),
    };
  }, [inventory]);

  const totalTransferUnits = useMemo(
    () => transfers.reduce((sum, item) => sum + item.units, 0),
    [],
  );

  const runSimulation = async () => {
    setSimulationActive(true);
    setLoading(true);
    setError("");

    try {
      const scenario = {
        demand_increase_percent: Number(values.demand),
        supply_disruption_days: Number(values.supply),
        staff_reduction_percent: Number(values.staff),
        bed_occupancy_increase_percent: Number(values.beds),
      };

      const [simulation, redistribution, impact] = await Promise.all([
        simulateCrisis(scenario),
        calculateRedistribution(scenario),
        calculateImpact(scenario),
      ]);

      console.log("CRISIS SIMULATION:", simulation);
      console.log("REDISTRIBUTION:", redistribution);
      console.log("IMPACT:", impact);

      setSimulationResult(simulation);
      setRedistributionResult(redistribution);
      setImpactResult(impact);
    } catch (err) {
      console.error("Crisis simulation failed:", err);
      setError(err.message || "Failed to recalculate crisis scenario.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="app-shell">
      <Sidebar
        active={active}
        setActive={setActive}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <main className="main-content">
        <TopBar setMobileOpen={setMobileOpen} />

        <div className="page-content">
          {/* Loading state */}
          {loading && (
            <div className="loading-overlay">
              <div className="loading-card">
                <div className="loading-spinner" />
                <span>Loading healthcare network...</span>
              </div>
            </div>
          )}

          {/* Backend error */}
          {error && (
            <div className="backend-error">
              Unable to connect to ResiliCare backend: {error}
            </div>
          )}

          <Hero onRunSimulation={runSimulation} />

          {/* ==========================
              LIVE KPI CARDS
          ========================== */}

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
              icon={Truck}
              label="Optimized transfers"
              value={
                redistributionResult?.redistribution?.summary
                  ?.total_recommendations ?? transfers.length
              }
              description={`${
                redistributionResult?.redistribution?.summary
                  ?.total_units_to_transfer ?? totalTransferUnits
              } units identified for redistribution`}
              tone="positive"
            />
          </section>

          {/* ==========================
              LIVE NETWORK MAP
          ========================== */}

          <NetworkMap
            facilities={mapFacilities}
            simulationActive={simulationActive}
          />

          {/* ==========================
              INSIGHTS
          ========================== */}

          <section className="insight-grid">
            <ForecastPanel
              intelligenceResult={intelligenceResult}
              intelligenceLoading={intelligenceLoading}
            />

            <ResiliencePanel
              simulationActive={simulationActive}
              impactResult={impactResult}
            />
          </section>

          {/* ==========================
              CRISIS SIMULATOR
          ========================== */}

          <CrisisSimulator
            values={values}
            setValues={setValues}
            onSimulate={runSimulation}
            simulationActive={simulationActive}
          />

          {/* ==========================
              REDISTRIBUTION
          ========================== */}

          <TransferPanel />

          {/* ==========================
              FACILITY INTELLIGENCE
          ========================== */}

          <FacilityPanel inventory={inventory} />

          {/* ==========================
              FOOTER
          ========================== */}

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
