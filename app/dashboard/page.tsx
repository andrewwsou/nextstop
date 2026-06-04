"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth, getUser } from "../lib/auth";
import { getLocations, getTrips } from "../lib/api";

type DashboardUser = {
  first_name?: string;
};

type Trip = {
  id: string | number;
  origin: string;
  destination: string;
  status: string;
  created_at: string;
  departure_time?: string | null;
  duration_minutes?: number | null;
  transit_modes?: string[] | null;
};

type Location = {
  id: string | number;
  name: string;
  category: string;
};

type SearchSuggestion = {
  place_id: string | number;
  display_name: string;
};

function getGreeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

function subscribeToClientSnapshot() {
  return () => {};
}

function getClientFirstName() {
  return (getUser() as DashboardUser | null)?.first_name || "";
}

function formatTripDate(value?: string | null) {
  if (!value) {
    return "No departure set";
  }

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatModes(modes?: string[] | null) {
  if (!modes?.length) {
    return "Modes not set";
  }

  return modes
    .map((mode) => mode.charAt(0).toUpperCase() + mode.slice(1))
    .join(", ");
}

export default function Dashboard() {
  const router = useRouter();
  useRequireAuth();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const firstName = useSyncExternalStore(
    subscribeToClientSnapshot,
    getClientFirstName,
    () => ""
  );
  const greeting = useSyncExternalStore(
    subscribeToClientSnapshot,
    getGreeting,
    () => "Good day"
  );

  useEffect(() => {
    getTrips().then((data) => {
      if (Array.isArray(data)) {
        setTrips(data);
      }
      setLoading(false);
    });

    getLocations().then((data) => {
      if (Array.isArray(data)) {
        setLocations(data);
      }
    });
  }, []);

  const recent = trips.filter((t) => t.status === "completed").slice(0, 3);
  const scheduled = trips.filter((t) => t.status === "scheduled").slice(0, 3);

  const quickActions = [
    { label: "Live Map", sub: "Real-time vehicle positions", href: "/map", color: "#3ecfb2" },
    { label: "Plan a Trip", sub: "Find the fastest route", href: "/trip", color: "#60a5fa" },
    { label: "Trip History", sub: "View past journeys", href: "/history", color: "#a78bfa" },
    { label: "Profile", sub: "Settings & preferences", href: "/profile", color: "#f59e0b" },
  ];

  const categoryColors: Record<string, string> = {
    Campus: "#3ecfb2",
    Shopping: "#60a5fa",
    Airport: "#f59e0b",
    "Transit Hub": "#a78bfa",
  };

  const popularDestinations = locations
    .filter((location) => ["Campus", "Airport", "Shopping"].includes(location.category))
    .slice(0, 4);

  const transitHubs = locations.filter((location) => location.category === "Transit Hub");

  async function handleSearchChange(value: string) {
    setQuery(value);

    if (value.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          value
        )}&countrycodes=us&limit=5&viewbox=-118.1,33.5,-117.5,33.9&bounded=1`
      );
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch {
      setSuggestions([]);
    }
  }

  function goToTrip(destination: string) {
    router.push(`/trip?destination=${encodeURIComponent(destination)}`);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "80px 2.5rem 2.5rem",
        background: "#0d1210",
        color: "white",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 1100 }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, margin: "0 0 4px" }}>
            {greeting}{firstName ? `, ${firstName}` : ""}
          </h1>
          <p style={{ color: "#555", margin: 0, fontSize: "0.9rem" }}>
            Where are you heading today?
          </p>
        </div>

        <div style={{ position: "relative", maxWidth: 560, marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "#111a17",
              border: "1px solid #1f3530",
              borderRadius: query && suggestions.length ? "12px 12px 0 0" : 12,
              padding: "13px 18px",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#555"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search a destination..."
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "white",
                fontSize: "0.9rem",
                width: "100%",
              }}
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setSuggestions([]);
                }}
                style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 16 }}
              >
                x
              </button>
            )}
          </div>

          {suggestions.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "#111a17",
                border: "1px solid #1f3530",
                borderTop: "none",
                borderRadius: "0 0 12px 12px",
                zIndex: 100,
                overflow: "hidden",
              }}
            >
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.place_id}
                  onClick={() => goToTrip(suggestion.display_name)}
                  style={{
                    padding: "10px 18px",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    borderTop: index === 0 ? "none" : "1px solid #1a2e28",
                    color: "#ccc",
                  }}
                >
                  {suggestion.display_name}
                </div>
              ))}
            </div>
          )}
        </div>

        {popularDestinations.length > 0 && (
          <div style={{ marginBottom: "2.5rem", maxWidth: 800 }}>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.72rem", color: "#444", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
              Popular Destinations
            </p>
            <div className="dashboard-actions" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {popularDestinations.map((location) => (
                <div
                  key={location.id}
                  onClick={() => goToTrip(location.name)}
                  style={{
                    background: "#111a17",
                    border: "1px solid #1a2e28",
                    borderRadius: 14,
                    padding: "1.1rem 1.25rem",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: categoryColors[location.category] ?? "#555", marginBottom: 14 }} />
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem" }}>{location.name}</p>
                  <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#555" }}>{location.category}</p>
                  <p style={{ margin: "10px 0 0", fontSize: "0.72rem", color: "#3ecfb2" }}>
                    Plan Route →
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {transitHubs.length > 0 && (
          <div style={{ marginBottom: "2.5rem", maxWidth: 800 }}>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.72rem", color: "#444", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
              Transit Hubs
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {transitHubs.map((location) => (
                <div
                  key={location.id}
                  onClick={() => goToTrip(location.name)}
                  style={{
                    background: "#111a17",
                    border: "1px solid #1a2e28",
                    borderRadius: 14,
                    padding: "1rem 1.25rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#a78bfa", flexShrink: 0 }} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "0.85rem" }}>{location.name}</p>
                    <p style={{ margin: "3px 0 0", fontSize: "0.72rem", color: "#3ecfb2" }}>Plan Route →</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p style={{ margin: "0 0 0.75rem", fontSize: "0.72rem", color: "#444", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
          Quick Actions
        </p>
        <div className="dashboard-actions" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: "2.5rem", maxWidth: 800 }}>
          {quickActions.map((action) => (
            <div
              key={action.href}
              onClick={() => router.push(action.href)}
              style={{
                background: "#111a17",
                border: "1px solid #1a2e28",
                borderRadius: 14,
                padding: "1.1rem 1.25rem",
                cursor: "pointer",
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: action.color, marginBottom: 14 }} />
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem" }}>{action.label}</p>
              <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#555", lineHeight: 1.4 }}>{action.sub}</p>
            </div>
          ))}
        </div>

        <div className="dashboard-trips" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 800 }}>
          <div>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.72rem", color: "#444", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
              Recent Trips
            </p>
            {loading ? (
              <p style={{ color: "#333", fontSize: "0.85rem" }}>Loading...</p>
            ) : recent.length === 0 ? (
              <p style={{ color: "#333", fontSize: "0.85rem" }}>No trips yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recent.map((trip) => (
                  <div key={trip.id} style={{ background: "#111a17", border: "1px solid #1a2e28", borderRadius: 12, padding: "12px 14px" }}>
                    <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600 }}>
                      {trip.origin} → {trip.destination}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                      <span style={{ fontSize: "0.73rem", color: "#444" }}>
                        {formatTripDate(trip.departure_time)}
                      </span>
                      {trip.duration_minutes && (
                        <span style={{ fontSize: "0.73rem", color: "#3ecfb2" }}>
                          {trip.duration_minutes} min
                        </span>
                      )}
                    </div>
                    <p style={{ margin: "5px 0 0", fontSize: "0.72rem", color: "#555" }}>
                      {formatModes(trip.transit_modes)}
                    </p>
                  </div>
                ))}
                <button
                  onClick={() => router.push("/history")}
                  style={{ background: "transparent", border: "none", color: "#3ecfb2", fontSize: "0.78rem", cursor: "pointer", textAlign: "left", padding: "6px 0" }}
                >
                  View all →
                </button>
              </div>
            )}
          </div>

          <div>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.72rem", color: "#444", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
              Scheduled Trips
            </p>
            {scheduled.length === 0 ? (
              <p style={{ color: "#333", fontSize: "0.85rem" }}>No scheduled trips.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {scheduled.map((trip) => (
                  <div key={trip.id} style={{ background: "#111a17", border: "1px solid #1a2e28", borderRadius: 12, padding: "12px 14px" }}>
                    <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600 }}>
                      {trip.origin} → {trip.destination}
                    </p>
                    <span style={{ fontSize: "0.73rem", color: "#f59e0b" }}>
                      {formatTripDate(trip.departure_time)}
                    </span>
                    <p style={{ margin: "5px 0 0", fontSize: "0.72rem", color: "#555" }}>
                      {formatModes(trip.transit_modes)}
                      {trip.duration_minutes ? ` · ${trip.duration_minutes} min` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <button
              style={{ marginTop: 8, width: "100%", background: "transparent", border: "1px dashed #1f3530", borderRadius: 12, padding: "12px 14px", color: "#3ecfb2", fontSize: "0.82rem", cursor: "pointer", textAlign: "left" }}
              onClick={() => router.push("/trip")}
            >
              + Schedule a trip
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .dashboard-actions {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .dashboard-trips {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 520px) {
          .dashboard-actions {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
