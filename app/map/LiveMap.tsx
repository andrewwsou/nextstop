"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMapEvents,
} from "react-leaflet";

type TransitRoute = {
  global_route_id: string;
  compact_display_short_name?: {
    elements?: Array<string | null>;
  };
  merged_itineraries?: {
    closest_stop?: {
      stop_lat?: number;
      stop_lon?: number;
      stop_name?: string;
    };
    itineraries?: {
      direction_headsign?: string;
    }[];
    schedule_items?: unknown[];
  }[];
};

type TransitResponse = {
  nearby_routes?: TransitRoute[];
};

function DestinationSelector({
  setDestination,
}: {
  setDestination: (position: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      setDestination([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function shortenName(displayName: string) {
  // Just return the first part before the first comma
  return displayName.split(",")[0].trim();
}

export default function LiveMap() {
  const router = useRouter();
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [transitData, setTransitData] = useState<TransitResponse | null>(null);
  const [transitError, setTransitError] = useState("");
  const [destinationName, setDestinationName] = useState("");
  const [routeLoading, setRouteLoading] = useState(false);
  const [showTransitOptions, setShowTransitOptions] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const nearbyRoutes = transitData?.nearby_routes || [];

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => console.error("GPS error:", err)
    );
  }, []);

  const handleRouteRequest = async () => {
    setRouteLoading(true);
    setTimeout(() => {
      setShowTransitOptions(true);
      setRouteLoading(false);
    }, 500);
  };

  // Reset panel when destination changes
  useEffect(() => {
    setShowTransitOptions(false);
    setPanelOpen(true);
  }, [destination]);

  useEffect(() => {
    if (!destination) return;
    const [lat, lon] = destination;
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
      .then((res) => res.json())
      .then((data) => {
        setDestinationName(data.display_name || "Unknown Location");
      })
      .catch((err) => console.error("Reverse geocoding error:", err));
  }, [destination]);

  useEffect(() => {
    if (!position) return;
    const url = `/api/transit/nearby?lat=${position[0]}&lon=${position[1]}`;

    async function loadTransitData() {
      try {
        const res = await fetch(url);
        const text = await res.text();
        let data: TransitResponse & { error?: string } = {};

        if (text) {
          try {
            data = JSON.parse(text);
          } catch {
            setTransitData(null);
            setTransitError(
              text === "Internal Server Error"
                ? "Backend is not running on port 5001."
                : text
            );
            return;
          }
        }

        if (!res.ok) {
          setTransitData(null);
          setTransitError(data.error || "Transit data could not be loaded.");
          return;
        }

        setTransitError("");
        setTransitData(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Transit data could not be loaded.";
        setTransitData(null);
        setTransitError(message);
      }
    }

    loadTransitData();
  }, [position]);

  if (!position) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", background: "#0d1a16", color: "#aaa", fontSize: 14 }}>
        Getting your location...
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* ── RESPONSIVE PANEL STYLES ── */}
      <style>{`
        .map-panel {
          position: absolute;
          bottom: 80px;
          right: 16px;
          left: 16px;
          top: auto;
          z-index: 1001;
          width: auto;
          max-height: 60vh;
          background: #0d1a16;
          border: 1px solid #1a2e28;
          border-radius: 14px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.4);
          color: white;
          display: flex;
          flex-direction: column;
        }
        @media (min-width: 640px) {
          .map-panel {
            top: 80px !important;
            bottom: auto !important;
            left: auto !important;
            right: 16px !important;
            width: 426px !important;
          }
        }
      `}</style>

      <MapContainer
        center={position}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        aria-label="Interactive transit map. Use the nearby routes list below for screen reader access."
      >
        <DestinationSelector setDestination={setDestination} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* User location */}
        <CircleMarker center={position} radius={10} pathOptions={{ color: "#3ecfb2", fillColor: "#3ecfb2", fillOpacity: 0.9, weight: 2 }}>
          <Popup>You are here</Popup>
        </CircleMarker>

        {/* Destination marker */}
        {destination && (
          <CircleMarker
            center={destination}
            radius={10}
            pathOptions={{ color: "#60a5fa", fillColor: "#60a5fa", fillOpacity: 0.7, weight: 3 }}
          >
            <Popup>{shortenName(destinationName) || "Destination"}</Popup>
          </CircleMarker>
        )}

        {/* Transit stop markers */}
        {nearbyRoutes.map((route) => {
          const stop = route.merged_itineraries?.[0]?.closest_stop;
          if (!stop?.stop_lat || !stop?.stop_lon) return null;

          const routeName =
            route.compact_display_short_name?.elements?.filter(Boolean).join(" ") || "Transit Route";
          const routeLabel = routeName === "PS" ? "Pacific Surfliner" : routeName;

          return (
            <CircleMarker
              key={route.global_route_id}
              center={[stop.stop_lat, stop.stop_lon]}
              radius={7}
              pathOptions={{ color: "#FFD700", fillColor: "#FFD700", fillOpacity: 0.35, weight: 3 }}
            >
              <Popup>
                <strong>{stop.stop_name}</strong>
                <br />
                Route: {routeLabel}
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Destination panel */}
      {destination && panelOpen && (
        <div
          role="region"
          aria-label="Destination details"
          aria-live="polite"
          className="map-panel"
        >
          {/* Panel header */}
          <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid #1a2e28", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>
                {shortenName(destinationName) || "Loading..."}
              </div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                {destination[0].toFixed(4)}, {destination[1].toFixed(4)}
              </div>
            </div>
            <button
              onClick={() => setPanelOpen(false)}
              aria-label="Close destination panel"
              style={{
                background: "none",
                border: "none",
                color: "#555",
                cursor: "pointer",
                fontSize: 16,
                lineHeight: 1,
                padding: 0,
                marginLeft: 8,
                flexShrink: 0
              }}
            >
              ✕
            </button>
          </div>

          {/* Get routes button */}
          <div style={{ padding: "10px 14px", flexShrink: 0 }}>
            <button
              onClick={handleRouteRequest}
              disabled={routeLoading}
              aria-label="Get nearby transit routes"
              style={{
                width: "100%", background: "#3ecfb2", color: "#0d1a16",
                border: "none", borderRadius: 8, padding: "7px 0",
                fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}
            >
              {routeLoading ? "Finding Routes..." : "Get Transit Routes"}
            </button>
          </div>

          {/* Route list — scrollable */}
          {showTransitOptions && (
            <div style={{ overflowY: "auto", padding: "0 14px 14px", flexGrow: 1 }}>
              {nearbyRoutes.length === 0 ? (
                <div style={{ fontSize: 12, color: "#555", textAlign: "center", paddingTop: 8 }}>
                  No nearby routes found.
                </div>
              ) : (
                nearbyRoutes.map((route) => {
                  const routeName =
                    route.compact_display_short_name?.elements?.filter(Boolean).join(" ") || "Unknown";
                  const routeLabel = routeName === "PS" ? "Pacific Surfliner" : routeName;
                  const itinerary = route.merged_itineraries?.[0];
                  const direction = itinerary?.itineraries?.[0]?.direction_headsign || "Unknown direction";
                  const stopName = itinerary?.closest_stop?.stop_name || "Unknown stop";

                  return (
                    <div
                      key={`${route.global_route_id}-${direction}`}
                      style={{
                        background: "#1a2e28", borderRadius: 8,
                        padding: "8px 10px", marginBottom: 8,
                        cursor: "pointer",
                      }}
                      onClick={() => router.push(`/trip?destination=${encodeURIComponent(shortenName(destinationName))}`)}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = "#3ecfb2")}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "transparent")}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontWeight: 600, color: "#3ecfb2", fontSize: 12 }}>
                          Route {routeLabel}
                        </div>
                        <span style={{ fontSize: 10, color: "#3ecfb2" }}>Plan →</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>→ {direction}</div>
                      <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>Stop: {stopName}</div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* Show panel button when dismissed */}
      {destination && !panelOpen && (
        <button
          onClick={() => setPanelOpen(true)}
          aria-label={`Show destination panel for ${shortenName(destinationName) || "selected destination"}`}
          style={{
            position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
            zIndex: 1001, background: "#0d1a16", border: "1px solid #1a2e28",
            borderRadius: 20, padding: "8px 20px", color: "#3ecfb2",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          {shortenName(destinationName) || "Show destination"}
        </button>
      )}

      {/* Accessible route list for screen readers */}
      <div
        aria-label="Nearby transit routes"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
        }}
      >
        <h2>Nearby Transit Routes</h2>

        {nearbyRoutes.length === 0 ? (
          <p>No nearby transit routes found.</p>
        ) : (
          <ul>
            {nearbyRoutes.map((route) => {
              const routeName =
                route.compact_display_short_name?.elements?.filter(Boolean).join(" ") ||
                "Unknown";

              const itinerary = route.merged_itineraries?.[0];
              const direction =
                itinerary?.itineraries?.[0]?.direction_headsign ||
                "Unknown direction";

              const stopName =
                itinerary?.closest_stop?.stop_name ||
                "Unknown stop";

              return (
                <li key={route.global_route_id}>
                  Route {routeName}, direction {direction}, stop {stopName}
                </li>
              );
            })}
          </ul>
        )}

        {destination && (
          <p>Selected destination: {destinationName}</p>
        )}
      </div>

      {/* Attribution */}
      <div style={{
        position: "absolute", bottom: 16, right: 16, zIndex: 1000,
        background: "white", color: "black", padding: "4px 10px",
        borderRadius: 6, fontSize: 11,
      }}>
        Powered by Transit
      </div>

      {/* Transit error */}
      {transitError && (
        <div style={{
          position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)",
          zIndex: 1000, background: "#1a0a0a", border: "1px solid #f87171",
          borderRadius: 8, padding: "8px 16px", fontSize: 12, color: "#f87171",
          maxWidth: "90vw",
        }}>
          {transitError}
        </div>
      )}
    </div>
  );
}