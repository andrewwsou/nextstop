"use client";

import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMapEvents,
} from "react-leaflet";

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
  const [destination, setDestination] = useState<
    [number, number] | null
  >(null);
  const [transitData, setTransitData] = useState<any>(null);
  const [destinationName, setDestinationName] =
    useState<string>("");
  const [routeLoading, setRouteLoading] =
    useState(false);
  const [showTransitOptions, setShowTransitOptions] =
    useState(false);

  // Get user GPS
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([
          pos.coords.latitude,
          pos.coords.longitude,
        ]);
      },
      (err) => console.error("GPS error:", err)
    );
  }, []);

  // Route button handler
  const handleRouteRequest = async () => {
    setRouteLoading(true);

    setTimeout(() => {
      setShowTransitOptions(true);
      setRouteLoading(false);
    }, 500);
  };

  // Reverse geocoding
  useEffect(() => {
    if (!destination) return;

    const [lat, lon] = destination;

    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
    )
      .then((res) => res.json())
      .then((data) => {
        setDestinationName(
          data.display_name || "Unknown Location"
        );
      })
      .catch((err) => {
        console.error(
          "Reverse geocoding error:",
          err
        );
      });
  }, [destination]);

  // Fetch nearby transit routes
  useEffect(() => {
    if (!position) return;

    const url = `/api/transit/nearby?lat=${position[0]}&lon=${position[1]}`;

    console.log("Fetching:", url);

    fetch(url)
      .then(async (res) => {
        console.log("Status:", res.status);
        console.log("Final URL:", res.url);

        const data = await res.json();
        return data;
      })
      .then((data) => {
        console.log(
          "FULL TRANSIT RESPONSE:",
          JSON.stringify(data, null, 2)
        );

        setTransitData(data);
      })
      .catch((err) =>
        console.error("Transit API error:", err)
      );
  }, [position]);

  if (!position) {
    return <div>Getting your location...</div>;
  }

  // Extracted because PyCharm was complaining about
  // inline conditional JSX with CircleMarker
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
        <DestinationSelector
          setDestination={setDestination}
        />

        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* User Location */}
        <CircleMarker center={position} radius={10}>
          <Popup>You are here</Popup>
        </CircleMarker>

        {/* Destination */}
        {destinationMarker}

        {/* Transit Stops */}
        {transitData?.nearby_routes?.map(
          (route: any) => {
            const stop =
              route.merged_itineraries?.[0]
                ?.closest_stop;

            if (
              !stop?.stop_lat ||
              !stop?.stop_lon
            ) {
              return null;
            }

            const routeName =
              route.compact_display_short_name?.elements
                ?.filter(Boolean)
                .join(" ") ||
              "Transit Route";

            const routeLabel =
              routeName === "PS"
                ? "Pacific Surfliner"
                : routeName;

            return (
              <CircleMarker
                key={route.global_route_id}
                center={[
                  stop.stop_lat,
                  stop.stop_lon,
                ]}
                radius={7}
                pathOptions={{
                  color: "#FFD700",
                  fillColor: "#FFD700",
                  fillOpacity: 0.35,
                  weight: 3,
                }}
              >
                <Popup>
                  <strong>
                    {stop.stop_name}
                  </strong>
                  <br />
                  Transit Route:{" "}
                  {routeLabel}
                </Popup>
              </CircleMarker>
            );
          }
        )}
      </MapContainer>

      {destination && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1001] rounded-xl shadow-lg p-4 min-w-[320px]"
          style={{
            background: "#0d1a16",
            border: "1px solid #1a2e28",
            color: "white",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              marginBottom: 6,
              fontSize: 14,
            }}
          >
            Destination
          </div>

          <div
            style={{
              fontSize: 13,
              color: "#aaa",
              marginBottom: 16,
            }}
          >
            {destinationName ||
              "Loading location..."}
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
            {routeLoading
              ? "Finding Route..."
              : "Get Transit Route"}
          </button>

          {showTransitOptions &&
            transitData?.nearby_routes
              ?.length > 0 && (
              <div
                style={{
                  marginTop: 16,
                  borderTop:
                    "1px solid #1a2e28",
                  paddingTop: 16,
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: 12,
                    fontSize: 13,
                  }}
                >
                  Nearby Transit Routes
                </div>

                {transitData.nearby_routes.map(
                  (route: any) => {
                    const routeName =
                      route.compact_display_short_name?.elements
                        ?.filter(Boolean)
                        .join(" ") ||
                      "Unknown Route";

                    const itinerary =
                      route.merged_itineraries?.[0];

                    const direction =
                      itinerary
                        ?.itineraries?.[0]
                        ?.direction_headsign ||
                      "Unknown Direction";

                    const stopName =
                      itinerary
                        ?.closest_stop
                        ?.stop_name ||
                      "Unknown Stop";

                    return (
                      <div
                        key={`${route.global_route_id}-${direction}`}
                        style={{
                          background:
                            "#1a2e28",
                          borderRadius: 8,
                          padding:
                            "10px 12px",
                          marginBottom: 10,
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            color: "#3ecfb2",
                            fontSize: 13,
                          }}
                        >
                          Route {routeName}
                        </div>

                        <div
                          style={{
                            fontSize: 12,
                            color: "#aaa",
                            marginTop: 2,
                          }}
                        >
                          → {direction}
                        </div>

                        <div
                          style={{
                            fontSize: 12,
                            color: "#888",
                            marginTop: 2,
                          }}
                        >
                          Stop: {stopName}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}

          {showTransitOptions &&
            transitData?.nearby_routes
              ?.length === 0 && (
              <div
                style={{
                  marginTop: 16,
                  borderTop:
                    "1px solid #1a2e28",
                  paddingTop: 12,
                  fontSize: 13,
                  color: "#888",
                }}
              >
                No nearby transit routes
                found.
              </div>
            )}
        </div>
      )}

      {/* Transit Attribution */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-white text-black px-3 py-2 rounded shadow">
        Powered by Transit
      </div>
    </div>
  );
}