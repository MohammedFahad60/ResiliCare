import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";

import { useEffect } from "react";

import "leaflet/dist/leaflet.css";


function getMarkerStyle(risk) {
  const value = Number(risk || 0);

  if (value >= 70) {
    return {
      color: "#ff646c",
      fillColor: "#ff646c",
    };
  }

  if (value >= 40) {
    return {
      color: "#edbf61",
      fillColor: "#edbf61",
    };
  }

  return {
    color: "#4ddd9f",
    fillColor: "#4ddd9f",
  };
}


function MapController({ facilities }) {
  const map = useMap();

  useEffect(() => {
    if (!facilities.length) return;

    const validFacilities = facilities.filter(
      (facility) =>
        Number.isFinite(Number(facility.lat)) &&
        Number.isFinite(Number(facility.lng))
    );

    if (!validFacilities.length) return;

    const bounds = validFacilities.map(
      (facility) => [
        Number(facility.lat),
        Number(facility.lng),
      ]
    );

    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 7,
    });
  }, [facilities, map]);

  return null;
}


export default function NetworkMap({
  facilities = [],
  onSelectFacility,
}) {
  return (
    <div className="network-map-card">

      <div className="network-map-header">

        <div>
          <span className="section-eyebrow">
            NETWORK TOPOLOGY
          </span>

          <h2>
            Healthcare Facility Network
          </h2>

          <p>
            Live geographic distribution of monitored
            healthcare facilities and operational risk.
          </p>
        </div>


        <div className="network-map-legend">

          <div>
            <span className="legend-dot healthy" />
            Healthy
          </div>

          <div>
            <span className="legend-dot warning" />
            At Risk
          </div>

          <div>
            <span className="legend-dot critical" />
            Critical
          </div>

        </div>

      </div>


      <div className="network-map">

        <MapContainer
          center={[17.5, 78.5]}
          zoom={5}
          scrollWheelZoom={true}
          zoomControl={true}
          attributionControl={true}
          style={{
            width: "100%",
            height: "100%",
          }}
        >

          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />


          <MapController
            facilities={facilities}
          />


          {facilities.map((facility) => {

            const risk =
              Number(
                facility.riskScore || 0
              );

            const marker =
              getMarkerStyle(risk);

            const radius =
              risk >= 70
                ? 9
                : risk >= 40
                  ? 8
                  : 6;


            return (
              <CircleMarker
                key={facility.id}
                center={[
                  Number(facility.lat),
                  Number(facility.lng),
                ]}
                radius={radius}
                pathOptions={{
                  color: marker.color,
                  fillColor: marker.fillColor,
                  fillOpacity: 0.85,
                  weight: 2,
                }}
                eventHandlers={{
                  click: () => {
                    if (onSelectFacility) {
                      onSelectFacility(facility);
                    }
                  },
                }}
              >

                <Popup>

                  <div className="network-popup">

                    <strong>
                      {facility.name}
                    </strong>

                    <span>
                      {facility.id}
                    </span>

                    <span>
                      {facility.type}
                      {" · "}
                      {facility.district}
                    </span>

                    <div className="popup-risk">

                      <span>
                        Risk
                      </span>

                      <strong>
                        {risk.toFixed(1)}
                      </strong>

                    </div>

                    <div className="popup-stats">

                      <div>
                        <span>
                          Inventory
                        </span>

                        <strong>
                          {facility.inventoryNodes}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Stockout
                        </span>

                        <strong>
                          {facility.stockoutNodes}
                        </strong>
                      </div>

                    </div>

                  </div>

                </Popup>

              </CircleMarker>
            );
          })}

        </MapContainer>

      </div>

    </div>
  );
}