"use client";
import { useEffect, useState, useSyncExternalStore, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth, getUser } from "../lib/auth";
import { getLocations, getTrips } from "../lib/api";

type DashboardUser = { first_name?: string };
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
type Location = { id: string | number; name: string; category: string };
type SearchSuggestion = { place_id: string | number; display_name: string };
type ScheduleItem = { arrival_time: number; is_real_time: boolean; is_cancelled: boolean };
type ScheduleRoute = { routeName: string; stopName: string; direction: string; departures: ScheduleItem[] };

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
function subscribeToClientSnapshot() { return () => {}; }
function getClientFirstName() { return (getUser() as DashboardUser | null)?.first_name || ""; }
function formatTripDate(value?: string | null) {
  if (!value) return "No departure set";
  return new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
function formatModes(modes?: string[] | null) {
  if (!modes?.length) return "Modes not set";
  return modes.map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(", ");
}
function formatUnixTime(unix: number) {
  return new Date(unix * 1000).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function timeAgo(date: Date) {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}
function parseScheduleRoutes(data: any): ScheduleRoute[] {
  if (!data?.nearby_routes) return [];
  return data.nearby_routes.map((route: any) => {
    const routeName = route.compact_display_short_name?.elements?.filter(Boolean).join(" ") || "Unknown";
    const itinerary = route.merged_itineraries?.[0];
    const stopName = itinerary?.closest_stop?.stop_name || "Unknown stop";
    const direction = itinerary?.itineraries?.[0]?.direction_headsign || "Unknown direction";
    const departures: ScheduleItem[] = (itinerary?.schedule_items || []).slice(0, 3).map((item: any) => ({
      arrival_time: item.arrival_time, is_real_time: item.is_real_time, is_cancelled: item.is_cancelled,
    }));
    return { routeName, stopName, direction, departures };
  }).filter((r: ScheduleRoute) => r.departures.length > 0).slice(0, 6);
}

const categoryColors: Record<string, string> = {
  Campus: "#3ecfb2", Shopping: "#60a5fa", Airport: "#f59e0b", "Transit Hub": "#a78bfa",
};

export default function Dashboard() {
  const router = useRouter();
  useRequireAuth();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [scheduleRoutes, setScheduleRoutes] = useState<ScheduleRoute[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [lastUpdatedDisplay, setLastUpdatedDisplay] = useState("");

  const firstName = useSyncExternalStore(subscribeToClientSnapshot, getClientFirstName, () => "");
  const greeting = useSyncExternalStore(subscribeToClientSnapshot, getGreeting, () => "Good day");

  useEffect(() => {
    getTrips().then((data) => { if (Array.isArray(data)) setTrips(data); setLoading(false); });
    getLocations().then((data) => { if (Array.isArray(data)) setLocations(data); });
  }, []);

  const fetchSchedule = useCallback((lat: number, lon: number) => {
    fetch(`/api/transit/nearby?lat=${lat}&lon=${lon}`)
      .then((res) => res.json())
      .then((data) => { setScheduleRoutes(parseScheduleRoutes(data)); setLastUpdated(new Date()); setScheduleError(""); })
      .catch(() => setScheduleError("Could not load schedule."))
      .finally(() => setScheduleLoading(false));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) { setScheduleError("Geolocation not supported."); setScheduleLoading(false); return; }
    let intervalId: ReturnType<typeof setInterval>;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetchSchedule(latitude, longitude);
        intervalId = setInterval(() => fetchSchedule(latitude, longitude), 5 * 60 * 1000);
      },
      () => { setScheduleError("Enable location to see live schedules."); setScheduleLoading(false); }
    );
    return () => clearInterval(intervalId);
  }, [fetchSchedule]);

  useEffect(() => {
    if (!lastUpdated) return;
    setLastUpdatedDisplay(timeAgo(lastUpdated));
    const interval = setInterval(() => setLastUpdatedDisplay(timeAgo(lastUpdated)), 30000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const recent = trips.filter((t) => t.status === "completed").slice(0, 3);
  const scheduled = trips.filter((t) => t.status === "scheduled").slice(0, 3);
  const popularDestinations = locations.filter((l) => ["Campus", "Airport", "Shopping"].includes(l.category)).slice(0, 6);
  const transitHubs = locations.filter((l) => l.category === "Transit Hub");

  const quickActions = [
    { label: "Live Map", sub: "Real-time vehicle positions", href: "/map", color: "#3ecfb2" },
    { label: "Plan a Trip", sub: "Find the fastest route", href: "/trip", color: "#60a5fa" },
    { label: "Trip History", sub: "View past journeys", href: "/history", color: "#a78bfa" },
    { label: "Profile", sub: "Settings & preferences", href: "/profile", color: "#f59e0b" },
  ];

  async function handleSearchChange(value: string) {
    setQuery(value);
    if (value.length < 2) { setSuggestions([]); return; }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&countrycodes=us&limit=5&viewbox=-118.1,33.5,-117.5,33.9&bounded=1`);
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch { setSuggestions([]); }
  }

  function goToTrip(destination: string) { router.push(`/trip?destination=${encodeURIComponent(destination)}`); }

  return (
    <main style={{ minHeight: "100vh", padding: "80px 2.5rem 2.5rem", background: "#0a0f0d", color: "white", display: "flex", justifyContent: "center", fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      <div style={{ width: "100%", maxWidth: 1300, display: "flex", gap: 48, alignItems: "flex-start" }}>

        {/* LEFT */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Greeting */}
          <div style={{ marginBottom: "2.5rem", borderBottom: "1px solid #1a2e28", paddingBottom: "1.5rem" }}>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 500, margin: "0 0 4px", letterSpacing: "-0.02em" }}>
              {greeting}{firstName ? `, ${firstName}` : ""}
            </h1>
            <p style={{ color: "#3a5248", margin: 0, fontSize: "0.85rem" }}>
              Where are you heading today?
            </p>
          </div>

          {/* Search — underline style, no box */}
          <div style={{ position: "relative", maxWidth: 520, marginBottom: "2.5rem" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              background: "transparent",
              borderBottom: `1px solid ${query ? "#3ecfb2" : "#1f3530"}`,
              padding: "8px 0", transition: "border-color 0.2s",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3a5248" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                value={query}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search a destination..."
                style={{ background: "transparent", border: "none", outline: "none", color: "white", fontSize: "0.9rem", width: "100%", fontFamily: "inherit" }}
              />
              {query && (
                <button onClick={() => { setQuery(""); setSuggestions([]); }}
                  style={{ background: "none", border: "none", color: "#3a5248", cursor: "pointer", fontSize: 13, padding: 0 }}>✕</button>
              )}
            </div>
            {suggestions.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#0d1a16", border: "1px solid #1f3530", borderTop: "none", zIndex: 100, overflow: "hidden" }}>
                {suggestions.map((s, i) => (
                  <div key={s.place_id} onClick={() => goToTrip(s.display_name)}
                    style={{ padding: "10px 0", fontSize: "0.82rem", cursor: "pointer", borderTop: i === 0 ? "none" : "1px solid #111a17", color: "#888" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "white")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#888")}
                  >{s.display_name}</div>
                ))}
              </div>
            )}
          </div>

          {/* Destinations — flat pill row, no card boxes */}
          {(popularDestinations.length > 0 || transitHubs.length > 0) && (
            <div style={{ marginBottom: "2.5rem" }}>
              <p style={{ margin: "0 0 0.85rem", fontSize: "0.68rem", color: "#3a5248", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>
                Destinations
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {[...popularDestinations, ...transitHubs].map((loc) => (
                  <button key={loc.id} onClick={() => goToTrip(loc.name)}
                    style={{
                      background: "transparent",
                      border: "1px solid #1f3530",
                      borderRadius: 2,
                      padding: "5px 13px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontSize: "0.82rem",
                      color: "#888",
                      fontWeight: 400,
                      transition: "all 0.15s",
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = categoryColors[loc.category] ?? "#3ecfb2"; e.currentTarget.style.color = "white"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#1f3530"; e.currentTarget.style.color = "#888"; }}
                  >
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: categoryColors[loc.category] ?? "#3ecfb2", display: "inline-block", flexShrink: 0 }} />
                    {loc.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions — list rows, no cards */}
          <div style={{ marginBottom: "2.5rem" }}>
            <p style={{ margin: "0 0 0.85rem", fontSize: "0.68rem", color: "#3a5248", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>
              Navigate
            </p>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {quickActions.map((action, i) => (
                <div key={action.href} onClick={() => router.push(action.href)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 0", cursor: "pointer",
                    borderBottom: "1px solid #0f1e1a",
                    transition: "opacity 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "0.65")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: action.color, flexShrink: 0, display: "inline-block" }} />
                    <span style={{ fontSize: "0.88rem", fontWeight: 500, color: "white" }}>{action.label}</span>
                    <span style={{ fontSize: "0.78rem", color: "#3a5248" }}>{action.sub}</span>
                  </div>
                  <span style={{ color: "#3a5248", fontSize: "0.8rem" }}>→</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trips — left accent bar, no box backgrounds */}
          <div className="dashboard-trips" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
            <div>
              <p style={{ margin: "0 0 0.85rem", fontSize: "0.68rem", color: "#3a5248", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>
                Recent Trips
              </p>
              {loading ? (
                <p style={{ color: "#3a5248", fontSize: "0.85rem" }}>Loading...</p>
              ) : recent.length === 0 ? (
                <p style={{ color: "#3a5248", fontSize: "0.85rem" }}>No trips yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {recent.map((trip) => (
                    <div key={trip.id} style={{ padding: "10px 0 10px 14px", borderLeft: "2px solid #1f3530", marginBottom: 10 }}>
                      <p style={{ margin: 0, fontSize: "0.87rem", fontWeight: 500, color: "white" }}>{trip.origin} → {trip.destination}</p>
                      <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                        <span style={{ fontSize: "0.72rem", color: "#3a5248" }}>{formatTripDate(trip.departure_time)}</span>
                        {trip.duration_minutes && <span style={{ fontSize: "0.72rem", color: "#3ecfb2" }}>{trip.duration_minutes} min</span>}
                      </div>
                      <p style={{ margin: "3px 0 0", fontSize: "0.72rem", color: "#3a5248" }}>{formatModes(trip.transit_modes)}</p>
                    </div>
                  ))}
                  <button onClick={() => router.push("/history")}
                    style={{ background: "transparent", border: "none", color: "#3ecfb2", fontSize: "0.78rem", cursor: "pointer", textAlign: "left", padding: "4px 0", fontFamily: "inherit" }}>
                    View all →
                  </button>
                </div>
              )}
            </div>

            <div>
              <p style={{ margin: "0 0 0.85rem", fontSize: "0.68rem", color: "#3a5248", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>
                Scheduled Trips
              </p>
              {scheduled.length === 0 ? (
                <p style={{ color: "#3a5248", fontSize: "0.85rem" }}>No scheduled trips.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {scheduled.map((trip) => (
                    <div key={trip.id} style={{ padding: "10px 0 10px 14px", borderLeft: "2px solid #f59e0b44", marginBottom: 10 }}>
                      <p style={{ margin: 0, fontSize: "0.87rem", fontWeight: 500 }}>{trip.origin} → {trip.destination}</p>
                      <span style={{ fontSize: "0.72rem", color: "#f59e0b" }}>{formatTripDate(trip.departure_time)}</span>
                      <p style={{ margin: "3px 0 0", fontSize: "0.72rem", color: "#3a5248" }}>
                        {formatModes(trip.transit_modes)}{trip.duration_minutes ? ` · ${trip.duration_minutes} min` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => router.push("/trip")}
                style={{ background: "transparent", border: "none", borderBottom: "1px solid #1f3530", color: "#3ecfb2", fontSize: "0.82rem", cursor: "pointer", textAlign: "left", padding: "4px 0", fontFamily: "inherit" }}>
                + Schedule a trip
              </button>
            </div>
          </div>

          {/* Mobile schedule fallback */}
          <div className="schedule-mobile-fallback">
            <p style={{ margin: "2rem 0 0.75rem", fontSize: "0.68rem", color: "#3a5248", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>
              Nearby Departures
            </p>
            {scheduleLoading && <p style={{ color: "#3a5248", fontSize: "0.85rem" }}>Loading schedule...</p>}
            {scheduleError && <p style={{ color: "#3a5248", fontSize: "0.85rem" }}>{scheduleError}</p>}
            {!scheduleLoading && !scheduleError && scheduleRoutes.length === 0 && (
              <p style={{ color: "#3a5248", fontSize: "0.85rem" }}>No nearby routes found.</p>
            )}
            {!scheduleLoading && !scheduleError && scheduleRoutes.length > 0 && (
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {scheduleRoutes.map((route, i) => (
                  <span key={i} style={{ background: "transparent", border: "1px solid #1f3530", color: "#3ecfb2", fontSize: "0.72rem", fontWeight: 500, padding: "3px 10px" }}>
                    {route.routeName} · {route.direction}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — schedule panel, no card background */}
        <div className="schedule-panel" style={{ width: 240, flexShrink: 0 }}>
          <div style={{ position: "sticky", top: 90 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid #1a2e28" }}>
              <p style={{ margin: 0, fontSize: "0.68rem", color: "#3a5248", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>
                Nearby Departures
              </p>
              {lastUpdatedDisplay && <span style={{ fontSize: "0.65rem", color: "#2a3e38" }}>Updated {lastUpdatedDisplay}</span>}
            </div>

            {scheduleLoading && <p style={{ color: "#3a5248", fontSize: "0.78rem" }}>Loading schedule...</p>}
            {scheduleError && <p style={{ color: "#3a5248", fontSize: "0.78rem" }}>{scheduleError}</p>}
            {!scheduleLoading && !scheduleError && scheduleRoutes.length === 0 && (
              <p style={{ color: "#3a5248", fontSize: "0.78rem" }}>No nearby routes found.</p>
            )}

            {!scheduleLoading && scheduleRoutes.map((route, i) => (
              <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: i < scheduleRoutes.length - 1 ? "1px solid #0f1e1a" : "none" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginBottom: 3 }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "white" }}>{route.routeName}</span>
                  <span style={{ fontSize: "0.68rem", color: "#3a5248" }}>→ {route.direction}</span>
                </div>
                <div style={{ fontSize: "0.68rem", color: "#2a3e38", marginBottom: 6 }}>{route.stopName}</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {route.departures.map((dep, j) => (
                    <span key={j} style={{
                      fontSize: "0.7rem", padding: "2px 7px",
                      border: `1px solid ${dep.is_cancelled ? "#f87171" : dep.is_real_time ? "#3ecfb2" : "#1f3530"}`,
                      color: dep.is_cancelled ? "#f87171" : dep.is_real_time ? "#3ecfb2" : "#3a5248",
                    }}>
                      {dep.is_cancelled ? "Cancelled" : formatUnixTime(dep.arrival_time)}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {!scheduleLoading && !scheduleError && (
              <button
                onClick={() => { setScheduleLoading(true); navigator.geolocation.getCurrentPosition((pos) => { fetchSchedule(pos.coords.latitude, pos.coords.longitude); }); }}
                style={{ background: "transparent", border: "none", borderBottom: "1px solid #1f3530", color: "#3ecfb2", fontSize: "0.72rem", cursor: "pointer", padding: "2px 0", fontFamily: "inherit" }}
              >
                Refresh
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) { .schedule-panel { display: none !important; } }
        @media (max-width: 768px) { .dashboard-trips { grid-template-columns: 1fr !important; } }
        .schedule-mobile-fallback { display: none; }
        @media (max-width: 1024px) { .schedule-mobile-fallback { display: block; } }
      `}</style>
    </main>
  );
}