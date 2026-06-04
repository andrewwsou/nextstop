"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth, getUser } from "../lib/auth";
import { getTrips } from "../lib/api";

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

export default function Dashboard() {
  const router = useRouter();
  useRequireAuth();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
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
    getTrips().then(data => {
      if (Array.isArray(data)) setTrips(data);
      setLoading(false);
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

  return (
    <main style={{
      minHeight: "100vh",
      padding: "88px 1.25rem 2.5rem",
      background: "#0d1210",
      color: "white",
      display: "flex",
      justifyContent: "center",
    }}>
      <div style={{ width: "100%", maxWidth: 800 }}>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 700, margin: "0 0 4px",
          letterSpacing: "-0.02em" }}>
          {greeting}{firstName ? `, ${firstName}` : ""}
        </h1>
        <p style={{ color: "#555", margin: 0, fontSize: "0.9rem" }}>
          Where are you heading today?
        </p>
      </div>

      {/* Search bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        background: "#111a17", border: "1px solid #1f3530",
        borderRadius: 12, padding: "13px 18px", marginBottom: "2.5rem",
        maxWidth: 560, cursor: "pointer",
      }} onClick={() => router.push("/trip")}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <span style={{ color: "#3a3a3a", fontSize: "0.9rem" }}>
          Search a destination...
        </span>
      </div>

      {/* Quick actions */}
      <p style={{ margin: "0 0 0.75rem", fontSize: "0.72rem", color: "#444",
        textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
        Quick Actions
      </p>
      <div className="dashboard-actions" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
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
      <div className="dashboard-trips" style={{ display: "grid", gridTemplateColumns: "1fr 1fr",
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
