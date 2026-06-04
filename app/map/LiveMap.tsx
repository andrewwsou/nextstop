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

type TransitRoute = {
  global_route_id: string;
  compact_display_short_name?: {
    elements?: string[];
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
  setDestination: (
    position: [number, number]
  ) => void;
}) {
  useMapEvents({
    click(e) {
      setDestination([
        e.latlng.lat,
        e.latlng.lng,
      ]);
    },
  });

  return null;
}

export default function LiveMap() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [transitData, setTransitData] = useState<TransitResponse | null>(null);
  const [transitError, setTransitError] = useState("");
  const [destinationName, setDestinationName] = useState<string>("");
  const [routeLoading, setRouteLoading] = useState(false);
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

  // route button handler
    const handleRouteRequest = async () => {
      setRouteLoading(true);

      setTimeout(() => {
        setShowTransitOptions(true);
        setRouteLoading(false);
      }, 500);
    };
  // add revserse geocoding
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

    // fetch(
    //   `/api/transit/nearby?lat=${position[0]}&lon=${position[1]}`
    // )
    const url = `/api/transit/nearby?lat=${position[0]}&lon=${position[1]}`;

console.log("Fetching:", url);

async function loadTransitData() {
  try {
    const res = await fetch(url);
    console.log("Status:", res.status);
    console.log("Final URL:", res.url);

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
      const message = data.error || "Transit data could not be loaded.";
      setTransitData(null);
      setTransitError(message);
      return;
    }

    console.log(
      "FULL TRANSIT RESPONSE:",
      JSON.stringify(data, null, 2)
    );

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

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Location */}
        <CircleMarker
          center={position}
          radius={10}
        >
          <Popup>You are here</Popup>
            {destination && (
              <CircleMarker
                center={destination}
                radius={10}
                pathOptions={{
                  color: "#FF0000",
                  fillColor: "#FF0000",
                  fillOpacity: 0.7,
                  weight: 3,
                }}
              >
                <Popup>
                  <strong>Destination</strong>
                  <br />
                  {destinationName || "Loading..."}
                  <br />
                  Lat: {destination[0].toFixed(6)}
                  <br />
                  Lng: {destination[1].toFixed(6)}
                </Popup>
              </CircleMarker>
            )}
        </CircleMarker>



        {/* Transit Stops */}
        {transitData?.nearby_routes?.map(
          (route) => {
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
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1001] bg-white text-black rounded-xl shadow-lg p-4 min-w-[320px]">
        <div className="font-semibold mb-2">
          Destination
        </div>

        <div className="text-sm mb-4">
          {destinationName || "Loading location..."}
        </div>

        <button
          onClick={handleRouteRequest}
          disabled={routeLoading}
          className="w-full bg-blue-600 text-white rounded px-4 py-2"
        >
          {routeLoading
            ? "Finding Route..."
            : "Get Transit Route"}
        </button>
      {showTransitOptions &&
  transitData?.nearby_routes?.length > 0 && (
    <div className="mt-4 border-t pt-4">
      <h3 className="font-semibold mb-3">
        Nearby Transit Routes
      </h3>

      {transitData.nearby_routes.map(
        (route) => {
          const routeName =
            route.compact_display_short_name?.elements
              ?.filter(Boolean)
              .join(" ") || "Unknown Route";

          const itinerary =
            route.merged_itineraries?.[0];

          const direction =
            itinerary?.itineraries?.[0]
              ?.direction_headsign ||
            "Unknown Direction";

          const stopName =
            itinerary?.closest_stop
              ?.stop_name ||
            "Unknown Stop";

          const arrival =
            itinerary?.schedule_items?.[0];

          return (
            <div
              key={`${route.global_route_id}-${direction}`}
              className="border rounded-lg p-3 mb-3 bg-gray-50"
            >
              <div className="font-medium">
                Route {routeName}
              </div>

              <div className="text-sm text-gray-600">
                → {direction}
              </div>

              <div className="text-sm text-gray-500">
                Stop: {stopName}
              </div>

              <div className="text-sm text-green-600 mt-1">
                {arrival
                  ? "Arrival data available"
                  : "No arrival data"}
              </div>
            </div>
          );
        }
      )}
    </div>
)}
          {showTransitOptions &&
  transitData?.nearby_routes?.length === 0 && (
    <div className="mt-4 border-t pt-4 text-sm text-gray-500">
      No nearby transit routes found.
    </div>
)}
      </div>
    )}
      {/* Transit Attribution */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-white text-black px-3 py-2 rounded shadow">
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
