import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  ZoomControl,
} from "react-leaflet";

import {
  getNetworkSummary,
  getNetworkFacility,
  getInventoryIntelligence,
} from "../api/resilicare";

function getRiskLevel(risk) {
  const value = Number(risk || 0);

  if (value >= 70) {
    return {
      label: "Critical",
      className: "risk-critical",
      icon: ShieldAlert,
    };
  }

  if (value >= 40) {
    return {
      label: "At Risk",
      className: "risk-warning",
      icon: AlertTriangle,
    };
  }

  return {
    label: "Healthy",
    className: "risk-healthy",
    icon: CheckCircle2,
  };
}

function riskColor(risk) {
  const value = Number(risk || 0);

  if (value >= 70) {
    return "#ff646c";
  }

  if (value >= 40) {
    return "#edbf61";
  }

  return "#4ddd9f";
}

function normalizeFacility(facility) {
  return {
    id: facility.facility_code,
    name: facility.facility_name,
    type: facility.facility_type,
    district: facility.district,
    state: facility.state,

    lat: Number(facility.latitude || 0),
    lng: Number(facility.longitude || 0),

    riskScore: Number(facility.risk_score || 0),

    status: facility.status || getRiskLevel(facility.risk_score).label,

    inventoryNodes: Number(facility.inventory_nodes || 0),

    criticalInventoryNodes: Number(facility.critical_inventory_nodes || 0),

    stockoutNodes: Number(facility.stockout_nodes || 0),
  };
}

export default function Network() {
  const [facilities, setFacilities] = useState([]);
  const [networkSummary, setNetworkSummary] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [selectedFacility, setSelectedFacility] = useState(null);

  const [facilityDetail, setFacilityDetail] = useState(null);

  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [medicineSearch, setMedicineSearch] = useState("");
  const [medicineFilter, setMedicineFilter] = useState("all");

  const [medicineIntelligence, setMedicineIntelligence] = useState(null);

  const [medicineLoading, setMedicineLoading] = useState(false);

  const [medicineError, setMedicineError] = useState(null);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const [error, setError] = useState(null);

  // --------------------------------------------------
  // LOAD LIVE NETWORK
  // --------------------------------------------------

  useEffect(() => {
    async function loadNetwork() {
      try {
        setLoading(true);
        setError(null);

        const data = await getNetworkSummary();

        const rawFacilities = data?.facilities || [];

        setNetworkSummary(data?.network || {});

        setFacilities(rawFacilities.map(normalizeFacility));
      } catch (err) {
        console.error("Failed to load network:", err);

        setError(err.message || "Unable to load network data.");
      } finally {
        setLoading(false);
      }
    }

    loadNetwork();
  }, []);

  // --------------------------------------------------
  // FILTER FACILITIES
  // --------------------------------------------------

  const filteredFacilities = useMemo(() => {
    return facilities.filter((facility) => {
      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        facility.id?.toLowerCase().includes(searchText) ||
        facility.name?.toLowerCase().includes(searchText) ||
        facility.district?.toLowerCase().includes(searchText) ||
        facility.state?.toLowerCase().includes(searchText);

      const risk = Number(facility.riskScore) || 0;

      let matchesFilter = true;

      if (filter === "critical") {
        matchesFilter = risk >= 70;
      }

      if (filter === "risk") {
        matchesFilter = risk >= 40 && risk < 70;
      }

      if (filter === "healthy") {
        matchesFilter = risk < 40;
      }

      return matchesSearch && matchesFilter;
    });
  }, [facilities, search, filter]);

  // --------------------------------------------------
  // FACILITY DETAIL
  // --------------------------------------------------

  async function openFacility(facility) {
    setSelectedFacility(facility);
    setFacilityDetail(null);
    setSelectedMedicine(null);
    setMedicineIntelligence(null);
    setMedicineError(null);

    try {
      setDetailLoading(true);

      const data = await getNetworkFacility(facility.id);

      setFacilityDetail(data);
    } catch (err) {
      console.error("Failed to load facility:", err);

      setFacilityDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function openMedicine(medicine) {
    if (!selectedFacility || !medicine?.name) {
      return;
    }

    setSelectedMedicine(medicine);
    setMedicineIntelligence(null);
    setMedicineError(null);

    try {
      setMedicineLoading(true);

      const data = await getInventoryIntelligence(
        selectedFacility.id,
        medicine.name,
      );

      setMedicineIntelligence(data);
    } catch (err) {
      console.error("Failed to load medicine intelligence:", err);

      setMedicineError(err.message || "Unable to load medicine intelligence.");
    } finally {
      setMedicineLoading(false);
    }
  }

  // --------------------------------------------------
  // SUMMARY VALUES
  // --------------------------------------------------

  const totalFacilities = Number(
    networkSummary?.total_facilities ?? facilities.length,
  );

  const healthy = Number(
    networkSummary?.healthy ??
      facilities.filter((item) => item.riskScore < 40).length,
  );

  const atRisk = Number(
    networkSummary?.at_risk ??
      facilities.filter((item) => item.riskScore >= 40 && item.riskScore < 70)
        .length,
  );

  const critical = Number(
    networkSummary?.critical ??
      facilities.filter((item) => item.riskScore >= 70).length,
  );

  const stockoutNodes = Number(networkSummary?.stockout_nodes ?? 0);

  const averageRisk = Number(networkSummary?.average_risk_score ?? 0);
  const filteredMedicines = useMemo(() => {
    const medicines = facilityDetail?.medicines || [];

    const query = medicineSearch.trim().toLowerCase();

    return medicines.filter((medicine) => {
      const name = String(
        medicine.medicine || medicine.name || medicine.medicine_name || "",
      ).toLowerCase();

      const category = String(medicine.category || "").toLowerCase();

      const matchesSearch =
        !query || name.includes(query) || category.includes(query);

      const risk = Number(medicine.risk_score || 0);

      const matchesFilter =
        medicineFilter === "all" ||
        (medicineFilter === "critical" && risk >= 70) ||
        (medicineFilter === "risk" && risk >= 40 && risk < 70) ||
        (medicineFilter === "healthy" && risk < 40);

      return matchesSearch && matchesFilter;
    });
  }, [facilityDetail, medicineSearch, medicineFilter]);

  return (
    <div className="network-page">
      {/* ==================================================
          HEADER
      ================================================== */}

      <section className="page-header">
        <div>
          <div className="eyebrow">
            <Activity size={15} />
            NETWORK INTELLIGENCE
          </div>

          <h1>Healthcare Network</h1>

          <p>
            Monitor facility resilience, identify vulnerable nodes, and inspect
            operational risk across the healthcare network.
          </p>
        </div>

        <div className="network-status">
          <span className="status-dot" />
          Live network data
        </div>
      </section>

      {/* ==================================================
          SUMMARY
      ================================================== */}

      <section className="network-summary">
        <div className="network-summary-card">
          <span>Total Facilities</span>

          <strong>{totalFacilities}</strong>

          <small>Connected facilities</small>
        </div>

        <div className="network-summary-card danger">
          <span>Critical</span>

          <strong>{critical}</strong>

          <small>Immediate attention</small>
        </div>

        <div className="network-summary-card warning">
          <span>At Risk</span>

          <strong>{atRisk}</strong>

          <small>Facilities under pressure</small>
        </div>

        <div className="network-summary-card">
          <span>Average Risk</span>

          <strong>{averageRisk.toFixed(1)}</strong>

          <small>Composite risk score</small>
        </div>
      </section>

      {/* ==================================================
          NETWORK MAP
      ================================================== */}

      <section className="network-map-section">
        <div className="network-map-header">
          <div>
            <span className="section-eyebrow">LIVE NETWORK MAP</span>

            <h2>Healthcare system pressure</h2>

            <p>
              Facility locations and current operational risk across the
              network.
            </p>
          </div>

          <div className="network-map-legend">
            <span>
              <i className="legend-dot healthy" />
              Healthy
              <strong>{healthy}</strong>
            </span>

            <span>
              <i className="legend-dot warning" />
              At Risk
              <strong>{atRisk}</strong>
            </span>

            <span>
              <i className="legend-dot danger" />
              Critical
              <strong>{critical}</strong>
            </span>
          </div>
        </div>

        <div className="network-map-container">
          {loading && (
            <div className="network-map-loading">
              <div className="loading-spinner" />
              <span>Loading healthcare network...</span>
            </div>
          )}

          {!loading && error && (
            <div className="network-map-error">
              <AlertTriangle size={22} />

              <strong>Unable to load network</strong>

              <span>{error}</span>
            </div>
          )}

          {!loading && !error && (
            <MapContainer
              center={[15.2, 77.5]}
              zoom={5}
              minZoom={4}
              maxZoom={9}
              scrollWheelZoom={true}
              zoomControl={false}
              className="network-leaflet-map"
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <ZoomControl position="bottomright" />

              {filteredFacilities.map((facility) => {
                if (!facility.lat || !facility.lng) {
                  return null;
                }

                const risk = Number(facility.riskScore);

                return (
                  <CircleMarker
                    key={facility.id}
                    center={[facility.lat, facility.lng]}
                    radius={risk >= 70 ? 9 : risk >= 40 ? 8 : 7}
                    pathOptions={{
                      color: riskColor(risk),

                      fillColor: riskColor(risk),

                      fillOpacity: risk >= 70 ? 0.9 : 0.7,

                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="network-popup">
                        <span>{facility.id}</span>

                        <strong>{facility.name}</strong>

                        <p>
                          {facility.district}, {facility.state}
                        </p>

                        <div className="popup-risk">
                          <span>Risk</span>

                          <strong>
                            {risk.toFixed(1)}
                            /100
                          </strong>
                        </div>

                        <button onClick={() => openFacility(facility)}>
                          View facility
                        </button>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          )}

          {!loading && !error && (
            <div className="network-map-overlay">
              <span>NETWORK STATUS</span>

              <strong>{totalFacilities}</strong>

              <small>facilities connected</small>
            </div>
          )}
        </div>
      </section>

      {/* ==================================================
          SEARCH + FILTER
      ================================================== */}

      <section className="network-controls">
        <div className="network-search">
          <Search size={17} />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search facility, district or state..."
          />

          {search && (
            <button
              className="network-search-clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="network-filters">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All
          </button>

          <button
            className={filter === "critical" ? "active danger" : ""}
            onClick={() => setFilter("critical")}
          >
            Critical
          </button>

          <button
            className={filter === "risk" ? "active warning" : ""}
            onClick={() => setFilter("risk")}
          >
            At Risk
          </button>

          <button
            className={filter === "healthy" ? "active success" : ""}
            onClick={() => setFilter("healthy")}
          >
            Healthy
          </button>
        </div>
      </section>

      <div className="network-result-count">
        Showing <strong>{filteredFacilities.length}</strong> of{" "}
        <strong>{facilities.length}</strong> facilities
      </div>

      {/* ==================================================
          FACILITY GRID
      ================================================== */}

      <section className="facility-grid">
        {filteredFacilities.map((facility) => {
          const risk = Number(facility.riskScore);

          const riskInfo = getRiskLevel(risk);

          const RiskIcon = riskInfo.icon;

          return (
            <button
              key={facility.id}
              className="facility-card"
              onClick={() => openFacility(facility)}
            >
              <div className="facility-card-top">
                <div className="facility-icon">
                  <MapPin size={17} />
                </div>

                <span className={`risk-badge ${riskInfo.className}`}>
                  <RiskIcon size={13} />
                  {riskInfo.label}
                </span>
              </div>

              <div className="facility-card-body">
                <span className="facility-code">{facility.id}</span>

                <h3>{facility.name || "Unknown Facility"}</h3>

                <p>{facility.district || "Unknown District"}</p>
              </div>

              <div className="facility-card-bottom">
                <div>
                  <span>State</span>

                  <strong>{facility.state || "—"}</strong>
                </div>

                <div className="facility-risk">
                  <span>Risk</span>

                  <strong>{risk.toFixed(1)}</strong>
                </div>
              </div>
            </button>
          );
        })}
      </section>

      {/* ==================================================
          EMPTY STATE
      ================================================== */}

      {!loading && filteredFacilities.length === 0 && (
        <div className="empty-network">
          <Search size={24} />

          <h3>No facilities found</h3>

          <p>Try another facility code, district, state or risk filter.</p>
        </div>
      )}

      {/* ==================================================
          FACILITY DETAIL MODAL
      ================================================== */}

      {selectedFacility && (
        <div
          className="facility-modal-backdrop"
          onClick={() => setSelectedFacility(null)}
        >
          <div
            className="facility-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="facility-modal-header">
              <div>
                <span className="facility-code">{selectedFacility.id}</span>

                <h2>{selectedFacility.name}</h2>

                <p>
                  {selectedFacility.district}
                  {" · "}
                  {selectedFacility.state}
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() => setSelectedFacility(null)}
              >
                ×
              </button>
            </div>

            {detailLoading && (
              <div className="facility-detail-loading">
                <div className="loading-spinner" />
                Loading facility intelligence...
              </div>
            )}

            {!detailLoading && (
              <>
                <div className="facility-detail-grid">
                  <div>
                    <span>Risk Score</span>

                    <strong>
                      {Number(selectedFacility.riskScore || 0).toFixed(1)}
                    </strong>
                  </div>

                  <div>
                    <span>Status</span>

                    <strong>
                      {getRiskLevel(selectedFacility.riskScore).label}
                    </strong>
                  </div>

                  <div>
                    <span>Inventory Nodes</span>

                    <strong>{selectedFacility.inventoryNodes}</strong>
                  </div>

                  <div>
                    <span>Critical Nodes</span>

                    <strong>{selectedFacility.criticalInventoryNodes}</strong>
                  </div>

                  <div>
                    <span>Stockout Nodes</span>

                    <strong>{selectedFacility.stockoutNodes}</strong>
                  </div>

                  <div>
                    <span>Facility Type</span>

                    <strong>{selectedFacility.type || "—"}</strong>
                  </div>
                </div>

                {facilityDetail && (
                  <div className="facility-live-detail">
                    <div className="facility-live-detail-header">
                      <span>LIVE FACILITY INTELLIGENCE</span>

                      <span>
                        {facilityDetail.medicines?.length || 0} medicines
                      </span>
                    </div>

                    <div className="facility-live-detail-grid">
                      <div>
                        <span>Latitude</span>

                        <strong>{selectedFacility.lat.toFixed(4)}</strong>
                      </div>

                      <div>
                        <span>Longitude</span>

                        <strong>{selectedFacility.lng.toFixed(4)}</strong>
                      </div>

                      <div>
                        <span>Critical inventory</span>

                        <strong>
                          {facilityDetail.intelligence?.critical_nodes ??
                            selectedFacility.criticalInventoryNodes}
                        </strong>
                      </div>

                      <div>
                        <span>Stockout risk</span>

                        <strong>
                          {facilityDetail.intelligence?.stockout_nodes ??
                            selectedFacility.stockoutNodes}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {facilityDetail && (
                  <div className="facility-medicine-section">
                    <div className="facility-medicine-header">
                      <div>
                        <span className="section-eyebrow">
                          MEDICINE INTELLIGENCE
                        </span>
                        <h3>Inventory risk by medicine</h3>
                      </div>

                      <span>{facilityDetail.medicines?.length || 0} SKUs</span>
                    </div>
                    <div className="medicine-list-controls">
                      <div className="medicine-search">
                        <Search size={15} />

                        <input
                          value={medicineSearch}
                          onChange={(event) =>
                            setMedicineSearch(event.target.value)
                          }
                          placeholder="Search medicine or category..."
                        />

                        {medicineSearch && (
                          <button
                            type="button"
                            onClick={() => setMedicineSearch("")}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      <div className="medicine-filter-group">
                        <button
                          type="button"
                          className={medicineFilter === "all" ? "active" : ""}
                          onClick={() => setMedicineFilter("all")}
                        >
                          All
                        </button>

                        <button
                          type="button"
                          className={
                            medicineFilter === "critical" ? "active" : ""
                          }
                          onClick={() => setMedicineFilter("critical")}
                        >
                          Critical
                        </button>

                        <button
                          type="button"
                          className={medicineFilter === "risk" ? "active" : ""}
                          onClick={() => setMedicineFilter("risk")}
                        >
                          At Risk
                        </button>

                        <button
                          type="button"
                          className={
                            medicineFilter === "healthy" ? "active" : ""
                          }
                          onClick={() => setMedicineFilter("healthy")}
                        >
                          Healthy
                        </button>
                      </div>
                    </div>

                    <div className="facility-medicine-list">
                      {filteredMedicines.map((medicine, index) => {
                        const medicineName =
                          medicine.name ||
                          medicine.medicine_name ||
                          medicine.medicine ||
                          medicine.medicineName ||
                          `Medicine ${index + 1}`;

                        const medicineUnit =
                          medicine.unit ||
                          medicine.medicine_unit ||
                          medicine.dosage_form ||
                          "units";

                        const coverage =
                          medicine.days_of_coverage ??
                          medicine.days_coverage ??
                          medicine.days_remaining ??
                          medicine.days_until_stockout ??
                          0;

                        const riskInfo = getRiskLevel(
                          Number(medicine.risk_score || 0),
                        );

                        const RiskIcon = riskInfo.icon;

                        return (
                          <button
                            key={`${medicineName}-${index}`}
                            type="button"
                            className={`facility-medicine-row ${
                              selectedMedicine?.name === medicineName
                                ? "selected"
                                : ""
                            }`}
                            onClick={() =>
                              openMedicine({
                                ...medicine,
                                name: medicineName,
                              })
                            }
                          >
                            <div className="medicine-row-main">
                              <strong>{medicineName}</strong>

                              <span>{medicineUnit}</span>
                            </div>

                            <div className="medicine-row-coverage">
                              <span>{Number(coverage).toFixed(1)}d</span>

                              <small>coverage</small>
                            </div>

                            <div className={`risk-badge ${riskInfo.className}`}>
                              <RiskIcon size={12} />
                              {riskInfo.label}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ==================================================
    MEDICINE INTELLIGENCE POP-OUT
================================================== */}

                {selectedMedicine && (
                  <div
                    className="medicine-popout-backdrop"
                    onClick={() => {
                      setSelectedMedicine(null);
                      setMedicineIntelligence(null);
                      setMedicineError(null);
                    }}
                  >
                    <div
                      className="medicine-popout"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {/* HEADER */}
                      <div className="medicine-popout-header">
                        <div>
                          <span className="medicine-popout-eyebrow">
                            MEDICINE INTELLIGENCE
                          </span>

                          <h3>
                            {selectedMedicine.medicine ||
                              selectedMedicine.name ||
                              selectedMedicine.medicine_name ||
                              "Medicine"}
                          </h3>

                          <p>
                            {selectedMedicine.category ||
                              "Healthcare inventory"}
                            {" · "}
                            {selectedMedicine.strength || "—"}
                            {" · "}
                            {selectedMedicine.dosage_form || "—"}
                          </p>
                        </div>

                        <button
                          type="button"
                          className="medicine-popout-close"
                          onClick={() => {
                            setSelectedMedicine(null);
                            setMedicineIntelligence(null);
                            setMedicineError(null);
                          }}
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {/* LOADING */}
                      {medicineLoading && (
                        <div className="medicine-popout-loading">
                          <div className="loading-spinner" />
                          Loading medicine intelligence...
                        </div>
                      )}

                      {/* ERROR */}
                      {!medicineLoading && medicineError && (
                        <div className="medicine-popout-error">
                          <AlertTriangle size={18} />

                          <div>
                            <strong>Unable to load intelligence</strong>

                            <span>{medicineError}</span>
                          </div>
                        </div>
                      )}

                      {/* INTELLIGENCE */}
                      {!medicineLoading &&
                        !medicineError &&
                        medicineIntelligence && (
                          <>
                            {/* RISK SUMMARY */}
                            <div className="medicine-popout-risk">
                              <div>
                                <span>RISK SCORE</span>

                                <strong>
                                  {Number(
                                    medicineIntelligence.intelligence
                                      ?.future_risk?.risk_score ??
                                      medicineIntelligence.intelligence
                                        ?.risk_score ??
                                      selectedMedicine.risk_score ??
                                      0,
                                  ).toFixed(1)}
                                </strong>
                              </div>

                              <div>
                                <span>STATUS</span>

                                <strong>
                                  {medicineIntelligence.intelligence
                                    ?.future_risk?.status ||
                                    medicineIntelligence.intelligence?.status ||
                                    selectedMedicine.status ||
                                    "—"}
                                </strong>
                              </div>

                              <div>
                                <span>STOCKOUT RISK</span>

                                <strong>
                                  {medicineIntelligence.intelligence
                                    ?.future_risk?.stockout_before_replenishment
                                    ? "YES"
                                    : "NO"}
                                </strong>
                              </div>
                            </div>

                            {/* KPI GRID */}
                            <div className="medicine-popout-kpis">
                              <div className="medicine-popout-kpi">
                                <span>Current Stock</span>

                                <strong>
                                  {Number(
                                    medicineIntelligence.inventory
                                      ?.current_stock ??
                                      selectedMedicine.current_stock ??
                                      0,
                                  ).toLocaleString()}
                                </strong>
                              </div>

                              <div className="medicine-popout-kpi">
                                <span>Days of Coverage</span>

                                <strong>
                                  {Number(
                                    selectedMedicine.days_of_coverage ??
                                      medicineIntelligence.intelligence
                                        ?.future_risk
                                        ?.predicted_days_until_stockout ??
                                      0,
                                  ).toFixed(1)}
                                  <small> days</small>
                                </strong>
                              </div>

                              <div className="medicine-popout-kpi">
                                <span>Daily Consumption</span>

                                <strong>
                                  {Number(
                                    medicineIntelligence.inventory
                                      ?.daily_consumption ??
                                      selectedMedicine.daily_consumption ??
                                      0,
                                  ).toFixed(2)}
                                </strong>
                              </div>

                              <div className="medicine-popout-kpi">
                                <span>Safety Stock</span>

                                <strong>
                                  {Number(
                                    medicineIntelligence.inventory
                                      ?.safety_stock ??
                                      selectedMedicine.safety_stock ??
                                      0,
                                  ).toLocaleString()}
                                </strong>
                              </div>

                              <div className="medicine-popout-kpi">
                                <span>Incoming</span>

                                <strong>
                                  {Number(
                                    medicineIntelligence.inventory
                                      ?.incoming_quantity ??
                                      selectedMedicine.incoming_quantity ??
                                      0,
                                  ).toLocaleString()}
                                </strong>
                              </div>

                              <div className="medicine-popout-kpi">
                                <span>Lead Time</span>

                                <strong>
                                  {Number(
                                    medicineIntelligence.inventory
                                      ?.lead_time_days ??
                                      selectedMedicine.lead_time_days ??
                                      0,
                                  )}
                                  <small> days</small>
                                </strong>
                              </div>
                            </div>

                            {/* FUTURE RISK */}
                            <div className="medicine-popout-section">
                              <div className="medicine-popout-section-title">
                                <span>PROJECTED RISK</span>

                                <span>7-DAY HORIZON</span>
                              </div>

                              <div className="medicine-popout-projection">
                                <div>
                                  <span>Projected stock</span>

                                  <strong>
                                    {Number(
                                      medicineIntelligence.intelligence
                                        ?.future_risk
                                        ?.projected_stock_after_7_days ?? 0,
                                    ).toFixed(1)}
                                  </strong>
                                </div>

                                <div>
                                  <span>Days until stockout</span>

                                  <strong>
                                    {Number(
                                      medicineIntelligence.intelligence
                                        ?.future_risk
                                        ?.predicted_days_until_stockout ?? 0,
                                    ).toFixed(1)}
                                  </strong>
                                </div>

                                <div>
                                  <span>Safety breach</span>

                                  <strong>
                                    {medicineIntelligence.intelligence
                                      ?.future_risk?.safety_stock_breach
                                      ? "YES"
                                      : "NO"}
                                  </strong>
                                </div>
                              </div>
                            </div>

                            {/* FORECAST */}
                            <div className="medicine-popout-section">
                              <div className="medicine-popout-section-title">
                                <span>DEMAND FORECAST</span>

                                <span>NEXT 7 DAYS</span>
                              </div>

                              <div className="medicine-popout-forecast">
                                {(
                                  medicineIntelligence.intelligence?.forecast
                                    ?.predictions || []
                                ).map((day) => (
                                  <div
                                    className="medicine-forecast-row"
                                    key={day.date}
                                  >
                                    <span>{day.date}</span>

                                    <div className="medicine-forecast-bar">
                                      <div
                                        style={{
                                          width: `${Math.min(
                                            100,
                                            (Number(day.predicted_demand || 0) /
                                              Math.max(
                                                1,
                                                Number(
                                                  medicineIntelligence
                                                    .intelligence?.forecast
                                                    ?.average_daily_demand || 1,
                                                ),
                                              )) *
                                              100,
                                          )}%`,
                                        }}
                                      />
                                    </div>

                                    <strong>
                                      {Number(
                                        day.predicted_demand || 0,
                                      ).toFixed(1)}
                                    </strong>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
