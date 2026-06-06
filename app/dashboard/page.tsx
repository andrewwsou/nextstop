"use client";
import { useEffect, useState, useSyncExternalStore, useCallback, useRef } from "react";
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
  Campus: "#3ecfb2", Shopping: "#3b82f6", Airport: "#f59e0b", "Transit Hub": "#8b5cf6",
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
  const inputRef = useRef<HTMLInputElement>(null);

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
    { label: "Plan a Trip", sub: "Find the fastest route", href: "/trip", color: "#3b82f6" },
    { label: "Trip History", sub: "View past journeys", href: "/history", color: "#8b5cf6" },
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
    <main className="dashboard-main">
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <h1 className="sr-only">Dashboard</h1>

      <div className="dashboard-container">
        <div className="main-content">

          <header className="dashboard-header">
            <h2 className="greeting-text">
              {greeting}{firstName ? <span className="user-name">, {firstName}</span> : ""}
            </h2>
            <p className="subtitle">Where are you heading today?</p>
          </header>

          <div className="search-wrapper">
            <label htmlFor="destination-search" className="search-label">
              Search destinations
            </label>
            <div className={`search-bar ${query ? "active" : ""}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="search-icon" aria-hidden="true">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                id="destination-search"
                ref={inputRef}
                aria-label="Search destinations, stations, routes"
                value={query}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") { setQuery(""); setSuggestions([]); } }}
                placeholder="Search destinations, stations, routes..."
              />
              {query && (
                <button
                  onClick={() => { setQuery(""); setSuggestions([]); inputRef.current?.focus(); }}
                  aria-label="Clear search"
                  className="clear-search"
                >
                  ✕
                </button>
              )}
            </div>

            {suggestions.length > 0 && (
              <ul
                role="listbox"
                aria-label="Destination suggestions"
                className="suggestions-dropdown"
              >
                {suggestions.map((s) => (
                  <li
                    key={s.place_id}
                    role="option"
                    aria-selected="false"
                    onClick={() => goToTrip(s.display_name)}
                    className="suggestion-item"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span>{s.display_name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* dest */}
          {(popularDestinations.length > 0 || transitHubs.length > 0) && (
            <section aria-labelledby="destinations-heading" className="section-block">
              <h3 id="destinations-heading">Destinations</h3>
              <div className="pill-grid">
                {[...popularDestinations, ...transitHubs].map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => goToTrip(loc.name)}
                    className="destination-pill"
                  >
                    <span aria-hidden="true" className="pill-dot" style={{ backgroundColor: categoryColors[loc.category] ?? "#3ecfb2" }} />
                    {loc.name}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* nav */}
          <section aria-labelledby="navigate-heading" className="section-block">
            <h3 id="navigate-heading">Navigate</h3>
            <div className="action-list">
              {quickActions.map((action) => (
                <button
                  key={action.href}
                  onClick={() => router.push(action.href)}
                  className="action-row"
                >
                  <div className="action-left">
                    <div aria-hidden="true" className="action-indicator" style={{ backgroundColor: action.color }} />
                    <span className="action-label">{action.label}</span>
                    <span className="action-sub">{action.sub}</span>
                  </div>
                  <span aria-hidden="true" className="action-arrow">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* trip */}
          <div className="trips-grid">
            <section aria-labelledby="recent-heading">
              <h3 id="recent-heading">Recent Trips</h3>
              <div role="status" aria-live="polite">
                {loading ? (
                  <p className="loading-text">Loading history...</p>
                ) : recent.length === 0 ? (
                  <p className="empty-text">No recent journeys found.</p>
                ) : (
                  <div className="trip-list">
                    {recent.map((trip) => (
                      <div
                        key={trip.id}
                        aria-label={`${trip.origin} to ${trip.destination}`}
                        className="trip-item recent-border"
                      >
                        <div aria-hidden="true" className="trip-route">{trip.origin} <span className="arrow-split">→</span> {trip.destination}</div>
                        <div className="trip-meta">
                          <span>{formatTripDate(trip.departure_time)}</span>
                          {trip.duration_minutes && <span className="duration-tag">{trip.duration_minutes}m duration</span>}
                        </div>
                        <div className="trip-modes">{formatModes(trip.transit_modes)}</div>
                      </div>
                    ))}
                    <button onClick={() => router.push("/history")} className="text-link-btn">
                      View full history
                    </button>
                  </div>
                )}
              </div>
            </section>

            <section aria-labelledby="scheduled-heading">
              <h3 id="scheduled-heading">Scheduled Trips</h3>
              <div className="trip-list">
                {scheduled.length === 0 ? (
                  <p className="empty-text">No upcoming schedules.</p>
                ) : (
                  scheduled.map((trip) => (
                    <div
                      key={trip.id}
                      aria-label={`${trip.origin} to ${trip.destination}`}
                      className="trip-item scheduled-border"
                    >
                      <div aria-hidden="true" className="trip-route">{trip.origin} <span className="arrow-split">→</span> {trip.destination}</div>
                      <div className="trip-meta-scheduled">{formatTripDate(trip.departure_time)}</div>
                      <div className="trip-modes">
                        {formatModes(trip.transit_modes)}{trip.duration_minutes ? ` · ${trip.duration_minutes} min` : ""}
                      </div>
                    </div>
                  ))
                )}
                <button onClick={() => router.push("/trip")} className="text-link-btn primary-link">
                  + Set new schedule
                </button>
              </div>
            </section>
          </div>

          {/* Mobile fallback for nearby departures */}
          <section aria-labelledby="nearby-mobile-heading" className="schedule-mobile-fallback">
            <h3 id="nearby-mobile-heading">Nearby Departures</h3>
            <div role="status" aria-live="polite">
              {scheduleLoading && <p className="loading-text">Locating lines...</p>}
              {scheduleError && <p className="empty-text">{scheduleError}</p>}
              {!scheduleLoading && !scheduleError && scheduleRoutes.length === 0 && (
                <p className="empty-text">No active paths nearby.</p>
              )}
              {!scheduleLoading && !scheduleError && scheduleRoutes.length > 0 && (
                <div className="pill-grid">
                  {scheduleRoutes.map((route, i) => (
                    <span key={i} className="mobile-route-pill">
                      {route.routeName} · {route.direction}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <aside aria-labelledby="sidebar-heading" className="schedule-sidebar">
          <div className="sticky-sidebar-content">
            <div className="sidebar-header">
              <h3 id="sidebar-heading">Nearby Departures</h3>
              {lastUpdatedDisplay && <span className="update-timer">Updated {lastUpdatedDisplay}</span>}
            </div>

            <div role="status" aria-live="polite">
              {scheduleLoading && <p className="loading-text">Scanning regional transit feeds...</p>}
              {scheduleError && <p className="empty-text">{scheduleError}</p>}
              {!scheduleLoading && !scheduleError && scheduleRoutes.length === 0 && (
                <p className="empty-text">No operational lines found around your current hub.</p>
              )}
            </div>

            <div className="sidebar-feed">
              {!scheduleLoading && scheduleRoutes.map((route, i) => (
                <div key={i} className="feed-card">
                  <div className="feed-card-header">
                    <span className="route-badge">{route.routeName}</span>
                    <span className="route-direction">to {route.direction}</span>
                  </div>
                  <div className="route-stop-name">{route.stopName}</div>
                  <div className="departure-time-row">
                    {route.departures.map((dep, j) => (
                      <span key={j} className={`time-badge ${dep.is_cancelled ? "cancelled" : dep.is_real_time ? "live" : "scheduled"}`}>
                        {dep.is_cancelled ? "Cancelled" : formatUnixTime(dep.arrival_time)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {!scheduleLoading && !scheduleError && (
              <button
                onClick={() => { setScheduleLoading(true); navigator.geolocation.getCurrentPosition((pos) => { fetchSchedule(pos.coords.latitude, pos.coords.longitude); }); }}
                className="refresh-btn"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                Force Refresh Feed
              </button>
            )}
          </div>
        </aside>
      </div>
      <style>{`
        :root {
          --bg-main: #0b0c0e;
          --bg-surface: #13151a;
          --bg-surface-hover: #1c1f26;
          --border-subtle: #222630;
          --brand-primary: #3ecfb2;
          --text-main: #f3f4f6;
          --text-muted: #848d9a;
          --text-ghost: #4b5363;
        }

        /* visually hidden but readable by screen readers */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0,0,0,0);
          white-space: nowrap;
          border: 0;
        }

        .dashboard-main {
          min-height: 100vh;
          padding: 76px 2rem 4rem;
          background-color: var(--bg-main);
          color: var(--text-main);
          display: flex;
          justify-content: center;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          letter-spacing: -0.01em;
        }

        .dashboard-container {
          width: 100%;
          max-width: 1240px;
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 64px;
          align-items: flex-start;
        }

        .main-content { min-width: 0; }

        .dashboard-header { margin-bottom: 2.5rem; }

        /* FIX 2: greeting-text is now an h2 — keep visual styles identical */
        h2.greeting-text {
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 6px 0;
          letter-spacing: -0.03em;
          color: var(--text-main);
        }

        .user-name { color: var(--brand-primary); }

        .subtitle {
          color: var(--text-muted);
          margin: 0;
          font-size: 0.95rem;
        }

        /* FIX 3: Visible search label — shown above the bar */
        .search-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
          margin-bottom: 8px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .search-wrapper {
          position: relative;
          max-width: 580px;
          margin-bottom: 3rem;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 14px;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          /* FIX 5: Minimum 44px touch target height */
          padding: 14px 18px;
          min-height: 44px;
          transition: all 0.2s;
        }

        .search-bar:focus-within, .search-bar.active {
          border-color: var(--brand-primary);
          box-shadow: 0 0 0 4px rgba(62, 207, 178, 0.1);
          background: var(--bg-main);
        }

        .search-bar input {
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-main);
          font-size: 0.95rem;
          width: 100%;
          font-family: inherit;
          font-weight: 500;
        }

        .search-bar input::placeholder { color: var(--text-muted); }

        .clear-search {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 14px;
          padding: 4px;
          min-width: 24px;
          min-height: 24px;
        }

        /* FIX 6: Explicit focus-visible outline for clear button */
        .clear-search:focus-visible {
          outline: 2px solid var(--brand-primary);
          outline-offset: 2px;
          border-radius: 4px;
        }

        .suggestions-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          z-index: 100;
          overflow: hidden;
          box-shadow: 0 12px 30px rgba(0,0,0,0.5);
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .suggestion-item {
          padding: 14px 18px;
          font-size: 0.9rem;
          cursor: pointer;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.1s;
          /* FIX 5: Min touch target */
          min-height: 44px;
        }

        .suggestion-item:hover { background: var(--bg-surface-hover); color: var(--text-main); }

        .section-block { margin-bottom: 3rem; }

        /* FIX 4: h3 for section headings (greeting is now h2, sections become h3)
           FIX 7: Contrast — changed color from var(--text-ghost) to var(--text-muted) */
        h3 {
          margin: 0 0 1.25rem 0;
          font-size: 0.75rem;
          /* Was --text-ghost (#4b5363, contrast 2.4:1 — FAIL)
             Now --text-muted (#848d9a, contrast 5.4:1 — PASS) */
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.15em;
          font-weight: 700;
        }

        .pill-grid { display: flex; flex-wrap: wrap; gap: 8px; }

        .destination-pill {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: 20px;
          padding: 8px 16px;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.88rem;
          color: var(--text-main);
          font-weight: 500;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
          /* FIX 5: Min touch target */
          min-height: 44px;
        }

        /* FIX 6: Explicit focus-visible for destination pills */
        .destination-pill:hover,
        .destination-pill:focus-visible {
          border-color: var(--text-muted);
          background: var(--bg-surface-hover);
          transform: translateY(-1px);
          outline: 2px solid var(--brand-primary);
          outline-offset: 2px;
        }

        .pill-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }

        .action-list {
          display: flex;
          flex-direction: column;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: 14px;
          overflow: hidden;
        }

        .action-row {
          all: unset;
          display: flex;
          align-items: center;
          justify-content: space-between;
          /* FIX 5: Min touch target height */
          padding: 16px 20px;
          min-height: 44px;
          cursor: pointer;
          border-bottom: 1px solid var(--border-subtle);
          transition: background 0.15s;
          box-sizing: border-box;
          width: 100%;
        }

        .action-row:last-child { border-bottom: none; }

        /* FIX 6: Explicit focus-visible outline for action rows */
        .action-row:hover,
        .action-row:focus-visible {
          background: var(--bg-surface-hover);
          outline: 2px solid var(--brand-primary);
          outline-offset: -2px;
        }

        .action-left { display: flex; align-items: center; gap: 16px; }
        .action-indicator { width: 4px; height: 16px; border-radius: 2px; }
        .action-label { font-size: 0.95rem; font-weight: 600; color: var(--text-main); }
        .action-sub { font-size: 0.85rem; color: var(--text-muted); }
        .action-arrow { color: var(--text-muted); transition: transform 0.2s; }
        .action-row:hover .action-arrow { color: var(--brand-primary); transform: translateX(3px); }

        .trips-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }

        .trip-list { display: flex; flex-direction: column; gap: 12px; }

        .trip-item {
          padding: 14px 16px;
          background: var(--bg-surface);
          border-radius: 10px;
          border: 1px solid var(--border-subtle);
        }

        .recent-border { border-left: 3px solid var(--border-subtle); }
        .scheduled-border { border-left: 3px solid #f59e0b; }

        .trip-route { font-size: 0.95rem; font-weight: 600; color: var(--text-main); margin-bottom: 6px; }
        .arrow-split { color: var(--text-muted); padding: 0 4px; }

        .trip-meta, .trip-meta-scheduled {
          display: flex;
          gap: 12px;
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-muted);
          margin-bottom: 4px;
        }

        .trip-meta-scheduled { color: #f59e0b; }
        .duration-tag { color: var(--brand-primary); }
        /* FIX 7: trip-modes was using --text-ghost (fail). Now uses --text-muted */
        .trip-modes { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; }

        /* FIX 7: loading-text and empty-text were using --text-ghost (fail). Now uses --text-muted */
        .loading-text, .empty-text {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin: 0;
          font-weight: 500;
        }

        .text-link-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          text-align: left;
          padding: 8px 0;
          font-family: inherit;
          transition: color 0.15s;
          align-self: flex-start;
          /* FIX 5: Min touch target */
          min-height: 44px;
          display: flex;
          align-items: center;
        }

        /* FIX 6: Explicit focus-visible for text link buttons */
        .text-link-btn:hover,
        .text-link-btn:focus-visible {
          color: var(--text-main);
          outline: 2px solid var(--brand-primary);
          outline-offset: 2px;
          border-radius: 4px;
        }

        .primary-link { color: var(--brand-primary); }
        .primary-link:hover { color: #34b399; }

        .schedule-sidebar { width: 300px; }

        .sticky-sidebar-content { position: sticky; top: 60px; }

        .sidebar-header {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-subtle);
        }

        .sidebar-header h3 { margin: 0; }
        /* FIX 7: update-timer was using --text-ghost (fail). Now uses --text-muted */
        .update-timer { font-size: 0.75rem; color: var(--text-muted); font-weight: 500; }

        .sidebar-feed { display: flex; flex-direction: column; gap: 12px; margin-bottom: 1.5rem; }

        .feed-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          padding: 16px;
        }

        .feed-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }

        .route-badge {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--bg-main);
          background: var(--text-main);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .route-direction { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; }
        /* FIX 7: route-stop-name was --text-ghost (fail). Now uses --text-muted */
        .route-stop-name { font-size: 0.75rem; color: var(--text-muted); font-weight: 500; margin-bottom: 12px; }

        .departure-time-row { display: flex; gap: 6px; flex-wrap: wrap; }

        .time-badge { font-size: 0.75rem; font-weight: 600; padding: 4px 8px; border-radius: 6px; }
        .time-badge.live { background: rgba(62, 207, 178, 0.1); color: var(--brand-primary); }
        /* FIX 7: scheduled badge was --text-muted on --bg-main (pass). Keep as is */
        .time-badge.scheduled { background: var(--bg-main); border: 1px solid var(--border-subtle); color: var(--text-muted); }
        .time-badge.cancelled { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

        .refresh-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          color: var(--text-muted);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          padding: 8px 14px;
          width: 100%;
          justify-content: center;
          font-family: inherit;
          transition: all 0.15s;
          /* FIX 5: Min touch target */
          min-height: 44px;
        }

        /* FIX 6: Explicit focus-visible for refresh button */
        .refresh-btn:hover,
        .refresh-btn:focus-visible {
          background: var(--bg-surface);
          color: var(--text-main);
          outline: 2px solid var(--brand-primary);
          outline-offset: 2px;
        }

        .transit-attribution {
          margin-top: 24px;
          display: flex;
          justify-content: flex-end;
          opacity: 0.9;
        }

        .mobile-route-pill {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          color: var(--brand-primary);
          font-size: 0.8rem;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 8px;
        }

        @media (max-width: 1024px) {
          .dashboard-container { grid-template-columns: 1fr; gap: 0; }
          .schedule-sidebar { display: none !important; }
          .schedule-mobile-fallback { display: block; margin-top: 3rem; }
        }
        .schedule-mobile-fallback { display: none; }
        @media (max-width: 768px) {
          .trips-grid { grid-template-columns: 1fr !important; gap: 32px; }
          .dashboard-main { padding: 72px 1.25rem 40px; }
        }
      `}</style>
    </main>
  );
}
