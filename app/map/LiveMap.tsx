"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Popup, TileLayer, useMapEvents } from "react-leaflet";

type TransitRoute = {
  global_route_id: string;
  compact_display_short_name?: { elements?: Array<string | null> };
  merged_itineraries?: {
    closest_stop?: { stop_lat?: number; stop_lon?: number; stop_name?: string };
    itineraries?: { direction_headsign?: string }[];
    schedule_items?: unknown[];
  }[];
};

type TransitResponse = { nearby_routes?: TransitRoute[] };

function DestinationSelector({ setDestination }: { setDestination: (pos: [number, number]) => void }) {
  useMapEvents({ click(e) { setDestination([e.latlng.lat, e.latlng.lng]); } });
  return null;
}

function shortenName(displayName: string) {
  return displayName.split(",")[0].trim();
}

export default function LiveMap() {
  const router = useRouter();
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [transitData, setTransitData] = useState<TransitResponse | null>(null);
  const [transitError, setTransitError] = useState("");
  const [transitLoading, setTransitLoading] = useState(true);
  const [destinationName, setDestinationName] = useState("");
  const nearbyRoutes = transitData?.nearby_routes || [];

  const transitSummary =
    transitLoading
      ? "Loading nearby transit routes."
      : transitError
        ? transitError
        : nearbyRoutes.length === 0
          ? "Based on your current location. No nearby transit routes found."
          : `Based on your current location. ${nearbyRoutes.length} nearby transit routes found.`;

  // Get user location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
      (err) => { console.error("GPS error:", err); setTransitLoading(false); setTransitError("Unable to get your location."); }
    );
  }, []);

  // Load nearby transit once we have location
  useEffect(() => {
    if (!position) return;
    setTransitLoading(true);
    fetch(`/api/transit/nearby?lat=${position[0]}&lon=${position[1]}`)
      .then(res => res.json())
      .then(data => { setTransitData(data); setTransitError(""); })
      .catch(() => setTransitError("Could not load transit data."))
      .finally(() => setTransitLoading(false));
  }, [position]);

  // Reverse geocode when destination is picked on map
  useEffect(() => {
    if (!destination) return;
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${destination[0]}&lon=${destination[1]}`)
      .then(res => res.json())
      .then(data => setDestinationName(data.display_name || "Unknown Location"))
      .catch(() => {});
  }, [destination]);

  // Hide Leaflet zoom buttons from screen readers
  useEffect(() => {
    const t = setTimeout(() => {
      document.querySelectorAll(".leaflet-control-zoom, .leaflet-control-zoom a, .leaflet-control-attribution").forEach(el => {
        el.setAttribute("aria-hidden", "true");
        el.setAttribute("tabindex", "-1");
      });
    }, 500);
    return () => clearTimeout(t);
  }, [position]);

  if (!position && !transitError) {
    return (
      <div role="status" aria-live="polite" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", background: "#0d1a16", color: "#aaa", fontSize: 14 }}>
        Getting your location...
      </div>
    );
  }

  return (
    <>
      {/* sr-only live region */}
      <div
        role="status"
        aria-live="assertive"
        aria-atomic="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)"
        }}
      >
        {transitSummary}
      </div>

      <div className="live-map-page relative h-full w-full">
        <style>{`
          .map-panel {
            position: absolute;
            top: 80px;
            right: 16px;
            width: 300px;
            max-height: calc(100vh - 120px);
            z-index: 1001;
            background: #0d1a16;
            border: 1px solid #1a2e28;
            border-radius: 14px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.4);
            color: white;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          @media (max-width: 640px) {
            .live-map-page {
              height: auto !important;
              min-height: 100%;
              overflow-y: auto;
              padding-bottom: 140px;
              background: #050806;
            }

            .live-map-page > div[aria-hidden="true"] {
              height: 55vh !important;
              min-height: 360px;
            }

            .map-panel {
              position: relative;
              top: auto;
              bottom: auto;
              left: auto;
              right: auto;
              width: calc(100% - 24px);
              max-height: none;
              margin: 12px auto 120px;
              border-radius: 18px;
            }

            .map-panel h2 {
              font-size: 20px !important;
            }
          }
          }
          button:focus-visible { outline: 2px solid #3ecfb2; outline-offset: 2px; border-radius: 6px; }
          a:focus-visible { outline: 2px solid #3ecfb2; outline-offset: 2px; border-radius: 6px; }
        `}</style>

        {/* Map — aria-hidden entirely, sighted-only visual */}
        <div
            aria-hidden="true"
            role="presentation"
            style={{ height: "100%", width: "100%" }}
          >
          {position && (
            <MapContainer
              center={position}
              zoom={15}
              style={{ height: "100%", width: "100%" }}
              attributionControl={false}
              zoomControl={false}
            >
              <DestinationSelector setDestination={setDestination} />
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <CircleMarker center={position} radius={10} pathOptions={{ color: "#3ecfb2", fillColor: "#3ecfb2", fillOpacity: 0.9, weight: 2 }}>
                <Popup>You are here</Popup>
              </CircleMarker>
              {destination && (
                <CircleMarker center={destination} radius={10} pathOptions={{ color: "#60a5fa", fillColor: "#60a5fa", fillOpacity: 0.7, weight: 3 }}>
                  <Popup>{shortenName(destinationName) || "Destination"}</Popup>
                </CircleMarker>
              )}
              {nearbyRoutes.map(route => {
                const stop = route.merged_itineraries?.[0]?.closest_stop;
                if (!stop?.stop_lat || !stop?.stop_lon) return null;
                const routeName = route.compact_display_short_name?.elements?.filter(Boolean).join(" ") || "Transit Route";
                const routeLabel = routeName === "PS" ? "Pacific Surfliner" : routeName;
                return (
                  <CircleMarker key={route.global_route_id} center={[stop.stop_lat, stop.stop_lon]} radius={7} pathOptions={{ color: "#FFD700", fillColor: "#FFD700", fillOpacity: 0.35, weight: 3 }}>
                    <Popup><strong>{stop.stop_name}</strong><br />Route: {routeLabel}</Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          )}
        </div>

        {/* Transit info panel — always open, no interaction required */}
        <div
          className="map-panel"
          role="region"
          aria-labelledby="panel-heading"
          aria-describedby="panel-content"
        >
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #1a2e28", flexShrink: 0 }}>
            <h2 id="panel-heading" style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#3ecfb2" }}>
              Nearby Transit
            </h2>
            {position && (
              <p style={{ margin: "4px 0 0", fontSize: 11, color: "#555" }}>
                Based on your current location
              </p>
            )}
          </div>

          <div
            id="panel-content"
            role="status"
            aria-live="polite"
            aria-atomic="false"
            style={{ overflowY: "auto", padding: "12px 16px", flexGrow: 1, display: "flex", flexDirection: "column", gap: 12 }}
          >

            {/* Status */}
            {transitLoading && (
              <p style={{ fontSize: 12, color: "#848d9a", margin: 0 }}>Loading routes...</p>
            )}
            {transitError && (
              <p style={{ fontSize: 12, color: "#f87171", margin: 0 }}>{transitError}</p>
            )}
            {!transitLoading && !transitError && nearbyRoutes.length === 0 && (
              <p style={{ fontSize: 12, color: "#555", margin: 0 }}>No transit routes found near your location.</p>
            )}

            {/* Route list */}
            {!transitLoading && nearbyRoutes.length > 0 && (
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {nearbyRoutes.map(route => {
                  const routeName = route.compact_display_short_name?.elements?.filter(Boolean).join(" ") || "Unknown";
                  const routeLabel = routeName === "PS" ? "Pacific Surfliner" : routeName;
                  const itinerary = route.merged_itineraries?.[0];
                  const direction = itinerary?.itineraries?.[0]?.direction_headsign || "Unknown direction";
                  const stopName = itinerary?.closest_stop?.stop_name || "Unknown stop";

                  return (
                    <li key={route.global_route_id}>
                      <button
                        onClick={() => router.push(`/trip?destination=${encodeURIComponent(stopName)}`)}
                        aria-label={`Route ${routeLabel}, direction ${direction}, nearest stop ${stopName}. Tap to plan this trip.`}
                        style={{ all: "unset", display: "block", width: "100%", background: "#1a2e28", borderRadius: 8, padding: "10px 12px", cursor: "pointer", boxSizing: "border-box" }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, color: "#3ecfb2", fontSize: 13 }}>Route {routeLabel}</span>
                          <span aria-hidden="true" style={{ fontSize: 10, color: "#3ecfb2" }}>Plan →</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#aaa" }}>Direction: {direction}</div>
                        <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>Stop: {stopName}</div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Trip planner link */}
            <a
              href="/trip"
              style={{ display: "block", background: "transparent", border: "1px solid #1a2e28", borderRadius: 8, padding: "10px 12px", color: "#3ecfb2", fontSize: 12, fontWeight: 600, textDecoration: "none", textAlign: "center", marginTop: 4 }}
            >
              Open Trip Planner
            </a>
          </div>
        </div>

        {/* Transit error toast */}
        {transitError && (
          <div role="alert" style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 1000, background: "#1a0a0a", border: "1px solid #f87171", borderRadius: 8, padding: "8px 16px", fontSize: 12, color: "#f87171", maxWidth: "90vw" }}>
            {transitError}
          </div>
        )}
      </div>
    </>
  );
}