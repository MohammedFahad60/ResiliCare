import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  ZoomControl,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

function riskColor(risk) {
  const value = Number(risk || 0);

  if (value >= 70) return "#ff646c";
  if (value >= 40) return "#edbf61";
  return "#4ddd9f";
}

function riskLabel(risk) {
  const value = Number(risk || 0);

  if (value >= 70) return "Critical";
  if (value >= 40) return "At Risk";
  return "Healthy";
}

/* ---------------------------------------------------------
   Automatically fit map to visible facilities
--------------------------------------------------------- */

function MapBounds({ facilities }) {
  const map = useMap();

  useEffect(() => {
    const validFacilities = facilities.filter(
      (facility) =>
        Number.isFinite(Number(facility.lat)) &&
        Number.isFinite(Number(facility.lng))
    );

    if (!validFacilities.length) return;

    if (validFacilities.length === 1) {
      map.setView(
        [
          Number(validFacilities[0].lat),
          Number(validFacilities[0].lng),
        ],
        8
      );

      return;
    }

    const bounds = validFacilities.map((facility) => [
      Number(facility.lat),
      Number(facility.lng),
    ]);

    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 7,
      animate: true,
    });
  }, [facilities, map]);

  return null;
}

/* ---------------------------------------------------------
   Network topology map
--------------------------------------------------------- */

export default function NetworkTopologyMap({
  facilities = [],
  onFacilitySelect,
}) {
  const validFacilities = facilities.filter(
    (facility) =>
      Number.isFinite(Number(facility.lat)) &&
      Number.isFinite(Number(facility.lng))
  );

  return (
    <section className="network-topology-card">

      {/* HEADER */}

      <div className="network-topology-header">

        <div>
          <span className="network-map-eyebrow">
            NETWORK TOPOLOGY
          </span>

          <h2>
            Healthcare Facility Network
          </h2>

          <p>
            Geographic distribution of monitored facilities
            and operational risk across the network.
          </p>
        </div>

        <div className="network-map-legend">

          <span>
            <i className="map-legend-dot healthy" />
            Healthy
          </span>

          <span>
            <i className="map-legend-dot warning" />
            At Risk
          </span>

          <span>
            <i className="map-legend-dot critical" />
            Critical
          </span>

        </div>

      </div>

      {/* MAP */}

      <div className="network-topology-map">

        <MapContainer
          center={[17.5, 78.5]}
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

          <MapBounds
            facilities={validFacilities}
          />

          {validFacilities.map((facility) => {

            const risk = Number(
              facility.riskScore || 0
            );

            const color = riskColor(risk);

            return (
              <CircleMarker
                key={facility.id}
                center={[
                  Number(facility.lat),
                  Number(facility.lng),
                ]}
                radius={
                  risk >= 70
                    ? 9
                    : risk >= 40
                    ? 7
                    : 6
                }
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.78,
                  weight: 2,
                }}
                eventHandlers={{
                  click: () => {
                    if (onFacilitySelect) {
                      onFacilitySelect(facility);
                    }
                  },
                }}
              >

                <Popup>

                  <div className="network-map-popup">

                    <strong>
                      {facility.name}
                    </strong>

                    <span>
                      {facility.id}
                    </span>

                    <span>
                      {facility.district},{" "}
                      {facility.state}
                    </span>

                    <div className="popup-risk">

                      <b>
                        {risk.toFixed(1)}
                      </b>

                      <span>
                        {riskLabel(risk)}
                      </span>

                    </div>

                  </div>

                </Popup>

              </CircleMarker>
            );
          })}

        </MapContainer>

        {/* MAP STATUS */}

        <div className="network-map-status">

          <span className="network-map-live-dot" />

          <span>
            {validFacilities.length} facilities mapped
          </span>

        </div>

        {/* MAP DATA */}

        <div className="network-map-data">

          <span>
            LIVE NETWORK
          </span>

          <strong>
            {validFacilities.length}
          </strong>

          <small>
            monitored nodes
          </small>

        </div>

      </div>

    </section>
  );
}