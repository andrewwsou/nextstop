"use client";

import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";

export default function LiveMap() {
  const [position, setPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([
          pos.coords.latitude,
          pos.coords.longitude,
        ]);
      },
      (err) => console.error(err)
    );
  }, []);

  if (!position) {
    return <div>Getting your location...</div>;
  }

    return (
    <div className="h-full w-full">
        <MapContainer
        center={position}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <CircleMarker center={position} radius={10}>
            <Popup>You are here</Popup>
        </CircleMarker>
        </MapContainer>
    </div>
    );
}