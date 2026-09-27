import {
  MapContainer,
  TileLayer,
  ZoomControl,
  Polyline,
  CircleMarker,
  Popup,
} from "react-leaflet";
import { Activity } from "lucide-react";
import AnimatedNumber from "./AnimatedNumber";
import { riskColor } from "../../utils/risk";

function NetworkMap({
  facilities = [],
  simulationActive = false,
  avgRisk = 0,
}) {
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

  const networkRisk = Number(avgRisk || 0);

  const riskLabel =
    networkRisk >= 75
      ? "Critical operational risk"
      : networkRisk >= 50
      ? "Elevated operational risk"
      : networkRisk >= 25
      ? "Moderate operational risk"
      : "Stable operational risk";

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
          maxZoom={18}
          scrollWheelZoom={true}
          wheelPxPerZoomLevel={40}
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
                fillOpacity:
                  facility.risk === "critical" ? 0.8 : 0.65,
                weight: 2,
              }}
            >
              <Popup>
                <strong>{facility.name}</strong>
                <br />
                {facility.district}, {facility.state}
                <br />
                Risk: {Number(facility.riskScore || 0).toFixed(1)}/100
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
            <AnimatedNumber value={networkRisk} decimals={1} />
            <span>/100</span>
          </div>

          <div className="map-risk-label">
            {riskLabel}
          </div>

          <div className="map-progress">
            <span
              style={{
                width: `${Math.min(100, Math.max(0, networkRisk))}%`,
              }}
            />
          </div>
        </div>

        <div className="map-status">
          <span className="live-dot" />
          {simulationActive
            ? "Scenario overlay active"
            : "Operational network"}
        </div>
      </div>
    </div>
  );
}

export default NetworkMap;