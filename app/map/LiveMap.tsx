"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";

export default function LiveMap() {
  const start: [number, number] = [33.6405, -117.8443];
  const stop: [number, number] = [33.6587, -117.8265];
  const destination: [number, number] = [33.6846, -117.8265];

  const route: [number, number][] = [start, stop, destination];

  return (
    <main className="h-screen w-screen">
      <MapContainer
        center={start}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "100vh", width: "100vw" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={start}>
          <Popup>Start: UCI</Popup>
        </Marker>

        <Marker position={stop}>
          <Popup>Transit Stop</Popup>
        </Marker>

        <Marker position={destination}>
          <Popup>Destination</Popup>
        </Marker>

        <Polyline positions={route} />
      </MapContainer>
    </main>
  );
}