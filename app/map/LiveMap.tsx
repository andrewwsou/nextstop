"use client";

import { useEffect, useState } from "react";
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

export default function LiveMap() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [transitData, setTransitData] = useState<TransitResponse | null>(null);
  const [transitError, setTransitError] = useState("");
  const [destinationName, setDestinationName] = useState("");
  const [routeLoading, setRouteLoading] = useState(false);
  const [showTransitOptions, setShowTransitOptions] = useState(false);
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

  useEffect(() => {
    if (!destination) return;

    const [lat, lon] = destination;

    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
      .then((res) => res.json())
      .then((data) => {
        setDestinationName(data.display_name || "Unknown Location");
      })
      .catch((err) => {
        console.error("Reverse geocoding error:", err);
      });
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
    return <div>Getting your location...</div>;
  }

  const destinationMarker = destination ? (
    <CircleMarker
      center={destination}
      radius={10}
      pathOptions={{
        color: "#3ecfb2",
        fillColor: "#3ecfb2",
        fillOpacity: 0.7,
        weight: 3,
      }}
    >
      <Popup>
        <strong>Destination</strong>
        <br />
        {destinationName || "Loading..."}
      </Popup>
    </CircleMarker>
  ) : null;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={position}
        zoom={15}
        style={{
          height: "100%",
          width: "100%",
        }}
      >
        <DestinationSelector setDestination={setDestination} />

        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <CircleMarker center={position} radius={10}>
          <Popup>You are here</Popup>
        </CircleMarker>

        {destinationMarker}

        {nearbyRoutes.map((route) => {
          const stop = route.merged_itineraries?.[0]?.closest_stop;

          if (!stop?.stop_lat || !stop?.stop_lon) {
            return null;
          }

          const routeName =
            route.compact_display_short_name?.elements?.filter(Boolean).join(" ") ||
            "Transit Route";

          const routeLabel = routeName === "PS" ? "Pacific Surfliner" : routeName;

          return (
            <CircleMarker
              key={route.global_route_id}
              center={[stop.stop_lat, stop.stop_lon]}
              radius={7}
              pathOptions={{
                color: "#FFD700",
                fillColor: "#FFD700",
                fillOpacity: 0.35,
                weight: 3,
              }}
            >
              <Popup>
                <strong>{stop.stop_name}</strong>
                <br />
                Transit Route: {routeLabel}
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {destination && (
        <div
          className="absolute bottom-6 left-1/2 z-[1001] min-w-[320px] -translate-x-1/2 rounded-xl p-4 shadow-lg"
          style={{
            background: "#0d1a16",
            border: "1px solid #1a2e28",
            color: "white",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 14 }}>
            Destination
          </div>

          <div style={{ fontSize: 13, color: "#aaa", marginBottom: 16 }}>
            {destinationName || "Loading location..."}
          </div>

          <button
            onClick={handleRouteRequest}
            disabled={routeLoading}
            style={{
              width: "100%",
              background: "#3ecfb2",
              color: "#0d1a16",
              border: "none",
              borderRadius: 8,
              padding: "8px 0",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {routeLoading ? "Finding Route..." : "Get Transit Route"}
          </button>

          {showTransitOptions && nearbyRoutes.length > 0 && (
            <div style={{ marginTop: 16, borderTop: "1px solid #1a2e28", paddingTop: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 13 }}>
                Nearby Transit Routes
              </div>

              {nearbyRoutes.map((route) => {
                const routeName =
                  route.compact_display_short_name?.elements?.filter(Boolean).join(" ") ||
                  "Unknown Route";
                const itinerary = route.merged_itineraries?.[0];
                const direction =
                  itinerary?.itineraries?.[0]?.direction_headsign || "Unknown Direction";
                const stopName = itinerary?.closest_stop?.stop_name || "Unknown Stop";
                const arrival = itinerary?.schedule_items?.[0];

                return (
                  <div
                    key={`${route.global_route_id}-${direction}`}
                    style={{
                      background: "#1a2e28",
                      borderRadius: 8,
                      padding: "10px 12px",
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ fontWeight: 600, color: "#3ecfb2", fontSize: 13 }}>
                      Route {routeName}
                    </div>

                    <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
                      → {direction}
                    </div>

                    <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                      Stop: {stopName}
                    </div>

                    <div style={{ fontSize: 12, color: "#3ecfb2", marginTop: 2 }}>
                      {arrival ? "Arrival data available" : "No arrival data"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {showTransitOptions && nearbyRoutes.length === 0 && (
            <div
              style={{
                marginTop: 16,
                borderTop: "1px solid #1a2e28",
                paddingTop: 12,
                fontSize: 13,
                color: "#888",
              }}
            >
              No nearby transit routes found.
            </div>
          )}
        </div>
      )}

      <div className="absolute bottom-4 right-4 z-[1000] rounded bg-white px-3 py-2 text-black shadow">
        Powered by Transit
      </div>
      {transitError && (
        <div className="absolute top-4 left-1/2 z-[1000] max-w-[90vw] -translate-x-1/2 rounded bg-red-50 px-4 py-3 text-sm text-red-700 shadow">
          {transitError}
        </div>
      )}
    </div>
  );
}
