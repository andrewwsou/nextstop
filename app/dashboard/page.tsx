"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth, getUser } from "../lib/auth";
import { getTrips, getLocations } from "../lib/api";

export default function Dashboard() {
  const router = useRouter();
  useRequireAuth();

  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    getTrips().then(data => {
      if (Array.isArray(data)) setTrips(data);
      setLoading(false);
    });
    getLocations().then(data => {
      if (Array.isArray(data)) setLocations(data);
    });
  }, []);

  const recent = trips.filter(t => t.status === "completed").slice(0, 3);
  const scheduled = trips.filter(t => t.status === "scheduled").slice(0, 3);

  const quickActions = [
    { label: "Live Map", sub: "Real-time vehicle positions", href: "/map", color: "#3ecfb2" },
    { label: "Plan a Trip", sub: "Find the fastest route", href: "/trip", color: "#60a5fa" },
    { label: "Trip History", sub: "View past journeys", href: "/history", color: "#a78bfa" },
    { label: "Profile", sub: "Settings & preferences", href: "/profile", color: "#f59e0b" },
  ];

  const categoryColors: Record<string, string> = {
    "Campus": "#3ecfb2",
    "Shopping": "#60a5fa",
    "Airport": "#f59e0b",
    "Transit Hub": "#a78bfa",
  };

  const popularDestinations = locations.filter(l =>
    ["Campus", "Airport", "Shopping"].includes(l.category)
  ).slice(0, 4);

  const transitHubs = locations.filter(l => l.category === "Transit Hub");

  const [user, setUser] = useState<any>(null);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    setUser(getUser());
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");
  }, []);

  return (
    <main style={{ minHeight: "100vh", padding: "80px 2.5rem 2.5rem",
      background: "#0d1210", color: "white", maxWidth: 1100, marginLeft: "auto", marginRight: "auto"}}>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 700, margin: "0 0 4px",
          letterSpacing: "-0.02em" }}>
          {greeting}{user?.first_name ? `, ${user.first_name}` : ""}
        </h1>
        <p style={{ color: "#555", margin: 0, fontSize: "0.9rem" }}>
          Where are you heading today?
        </p>
      </div>

      {/* Search bar with autocomplete */}
      <div style={{ position: "relative", maxWidth: 560, marginBottom: "2.5rem" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          background: "#111a17", border: "1px solid #1f3530",
          borderRadius: query && suggestions.length ? "12px 12px 0 0" : 12,
          padding: "13px 18px", cursor: "text",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={query}
            onChange={async (e) => {
              const val = e.target.value;
              setQuery(val);
              if (val.length < 2) { setSuggestions([]); return; }
              const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&countrycodes=us&limit=5&viewbox=-118.1,33.5,-117.5,33.9&bounded=1`
              );
              const data = await res.json();
              setSuggestions(data);
            }}
            placeholder="Search a destination..."
            style={{
              background: "transparent", border: "none", outline: "none",
              color: "white", fontSize: "0.9rem", width: "100%",
            }}
          />
          {query && (
            <button onClick={() => { setQuery(""); setSuggestions([]); }}
              style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 16 }}>
              ✕
            </button>
          )}
        </div>

        {suggestions.length > 0 && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0,
            background: "#111a17", border: "1px solid #1f3530", borderTop: "none",
            borderRadius: "0 0 12px 12px", zIndex: 100, overflow: "hidden",
          }}>
            {suggestions.map((s, i) => (
              <div key={s.place_id}
                onClick={() => {
                  setQuery("");
                  setSuggestions([]);
                  router.push(`/trip?destination=${encodeURIComponent(s.display_name)}`);
                }}
                style={{
                  padding: "10px 18px", fontSize: "0.85rem", cursor: "pointer",
                  borderTop: i === 0 ? "none" : "1px solid #1a2e28",
                  color: "#ccc",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#1a2e28")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                {s.display_name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Popular Destinations */}
      {popularDestinations.length > 0 && (
        <div style={{ marginBottom: "2.5rem", maxWidth: 800 }}>
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.72rem", color: "#444",
            textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
            Popular Destinations
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {popularDestinations.map(loc => (
              <div key={loc.id}
                onClick={() => router.push(`/trip?destination=${encodeURIComponent(loc.name)}`)}
                style={{ background: "#111a17", border: "1px solid #1a2e28",
                  borderRadius: 14, padding: "1.1rem 1.25rem", cursor: "pointer",
                  transition: "border-color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = (categoryColors[loc.category] ?? "#555") + "55")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "#1a2e28")}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%",
                  background: categoryColors[loc.category] ?? "#555",
                  marginBottom: 14 }} />
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem",
                  letterSpacing: "-0.01em" }}>{loc.name}</p>
                <p style={{ margin: "4px 0 0", fontSize: "0.75rem",
                  color: "#555", lineHeight: 1.4 }}>{loc.category}</p>
                <p style={{ margin: "10px 0 0", fontSize: "0.72rem", color: "#3ecfb2" }}>
                  Plan Route →
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transit Hubs */}
      {transitHubs.length > 0 && (
        <div style={{ marginBottom: "2.5rem", maxWidth: 800 }}>
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.72rem", color: "#444",
            textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
            Transit Hubs
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            {transitHubs.map(loc => (
              <div key={loc.id}
                onClick={() => router.push(`/trip?destination=${encodeURIComponent(loc.name)}`)}
                style={{ background: "#111a17", border: "1px solid #1a2e28",
                  borderRadius: 14, padding: "1rem 1.25rem", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 12,
                  transition: "border-color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "#a78bfa55")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "#1a2e28")}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%",
                  background: "#a78bfa", flexShrink: 0 }} />
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "0.85rem",
                    letterSpacing: "-0.01em" }}>{loc.name}</p>
                  <p style={{ margin: "3px 0 0", fontSize: "0.72rem",
                    color: "#3ecfb2" }}>Plan Route →</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <p style={{ margin: "0 0 0.75rem", fontSize: "0.72rem", color: "#444",
        textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
        Quick Actions
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        gap: 12, marginBottom: "2.5rem", maxWidth: 800 }}>
        {quickActions.map(a => (
          <div key={a.href} onClick={() => router.push(a.href)} style={{
            background: "#111a17", border: "1px solid #1a2e28",
            borderRadius: 14, padding: "1.1rem 1.25rem", cursor: "pointer",
            transition: "border-color 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = a.color + "55")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "#1a2e28")}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%",
              background: a.color, marginBottom: 14 }} />
            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem",
              letterSpacing: "-0.01em" }}>{a.label}</p>
            <p style={{ margin: "4px 0 0", fontSize: "0.75rem",
              color: "#555", lineHeight: 1.4 }}>{a.sub}</p>
          </div>
        ))}
      </div>

      {/* Trips grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 20, maxWidth: 800 }}>

        {/* Recent */}
        <div>
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.72rem", color: "#444",
            textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
            Recent Trips
          </p>
          {loading ? (
            <p style={{ color: "#333", fontSize: "0.85rem" }}>Loading...</p>
          ) : recent.length === 0 ? (
            <p style={{ color: "#333", fontSize: "0.85rem" }}>No trips yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recent.map(t => (
                <div key={t.id} style={{ background: "#111a17",
                  border: "1px solid #1a2e28", borderRadius: 12,
                  padding: "12px 14px" }}>
                  <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600,
                    letterSpacing: "-0.01em" }}>
                    {t.origin} → {t.destination}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between",
                    marginTop: 5 }}>
                    <span style={{ fontSize: "0.73rem", color: "#444" }}>
                      {new Date(t.created_at).toLocaleString()}
                    </span>
                    {t.duration_minutes && (
                      <span style={{ fontSize: "0.73rem", color: "#3ecfb2" }}>
                        {t.duration_minutes} min
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <button onClick={() => router.push("/history")} style={{
                background: "transparent", border: "none",
                color: "#3ecfb2", fontSize: "0.78rem", cursor: "pointer",
                textAlign: "left", padding: "6px 0", letterSpacing: "0.02em",
              }}>
                View all →
              </button>
            </div>
          )}
        </div>

        {/* Scheduled */}
        <div>
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.72rem", color: "#444",
            textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
            Scheduled Trips
          </p>
          {scheduled.length === 0 ? (
            <p style={{ color: "#333", fontSize: "0.85rem" }}>No scheduled trips.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {scheduled.map(t => (
                <div key={t.id} style={{ background: "#111a17",
                  border: "1px solid #1a2e28", borderRadius: 12,
                  padding: "12px 14px" }}>
                  <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600,
                    letterSpacing: "-0.01em" }}>
                    {t.origin} → {t.destination}
                  </p>
                  <span style={{ fontSize: "0.73rem", color: "#f59e0b" }}>
                    {t.departure_time
                      ? new Date(t.departure_time).toLocaleString()
                      : "No time set"}
                  </span>
                </div>
              ))}
            </div>
          )}
          <button style={{
            marginTop: 8, width: "100%",
            background: "transparent",
            border: "1px dashed #1f3530",
            borderRadius: 12, padding: "12px 14px",
            color: "#3ecfb2", fontSize: "0.82rem",
            cursor: "pointer", textAlign: "left",
          }} onClick={() => router.push("/trip")}>
            + Schedule a trip
          </button>
        </div>
      </div>
    </main>
  );
}