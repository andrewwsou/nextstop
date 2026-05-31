"use client";

import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
} from "react-leaflet";

export default function LiveMap() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [transitData, setTransitData] = useState<any>(null);

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

  // Fetch nearby transit routes
  useEffect(() => {
    if (!position) return;

    fetch(
      `/api/transit/nearby?lat=${position[0]}&lon=${position[1]}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("Transit data:", data);
        setTransitData(data);
      })
      .catch((err) =>
        console.error("Transit API error:", err)
      );
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
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Location */}
        <CircleMarker
          center={position}
          radius={10}
        >
          <Popup>You are here</Popup>
        </CircleMarker>

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
                    fillOpacity: 1,
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

      {/* Transit Attribution */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-white text-black px-3 py-2 rounded shadow">
        Powered by Transit
      </div>
    </div>
  );
}