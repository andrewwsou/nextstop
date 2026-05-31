"use client";

import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";

export default function LiveMap() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [transitData, setTransitData] = useState<any>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => console.error("GPS error:", err)
    );
  }, []);

  useEffect(() => {
    if (!position) return;

    fetch(`/api/transit/nearby?lat=${position[0]}&lon=${position[1]}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Transit data:", data);
        setTransitData(data);
      })
      .catch((err) => console.error("Transit API error:", err));
  }, [position]);

  if (!position) {
    return <div>Getting your location...</div>;
  }

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={position}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <CircleMarker center={position} radius={10}>
          <Popup>You are here</Popup>
        </CircleMarker>

        {transitData?.nearby_routes?.map((route: any) => {
        const stop = route.merged_itineraries?.[0]?.closest_stop;
        if (!stop?.stop_lat || !stop?.stop_lon) return null;

        return (
            <CircleMarker
            key={route.global_route_id}
            center={[stop.stop_lat, stop.stop_lon]}
            radius={7}
            >
            <Popup>
                <strong>{stop.stop_name}</strong>
                <br />
                Route: {route.compact_display_short_name?.elements?.filter(Boolean).join(" ")}
            </Popup>
            </CircleMarker>
        );
        })}
      </MapContainer>

      <div className="absolute bottom-4 right-4 z-[1000] bg-white text-black px-3 py-2 rounded">
        Powered by Transit
      </div>
    </div>
  );
}