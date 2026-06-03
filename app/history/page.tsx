"use client";
import { useEffect, useState } from "react";
import { getTrips, deleteTrip, updateTrip } from "../lib/api";
import { useRequireAuth } from "../lib/auth";
import type { Leg, Trip } from "./mockdata";

function mapApiTrip(t: {
  id: number;
  origin: string;
  destination: string;
  created_at?: string;
  transit_modes?: string[];
  duration_minutes?: number;
}): Trip {
  const date = t.created_at?.slice(0, 10) ?? "";
  const legs: Leg[] = (t.transit_modes ?? []).map((route) => ({
    type: "bus",
    route,
    from: t.origin,
    to: t.destination,
    duration: t.duration_minutes ? `${t.duration_minutes} min` : "—",
  }));
  return { id: t.id, from: t.origin, to: t.destination, date, legs };
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "numeric", day: "numeric", year: "2-digit",
  });
}

function getGroup(dateStr: string): "this-week" | "this-month" | "last-6-months" | null {
  const now = new Date();
  const date = new Date(dateStr + "T00:00:00");

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const start6Months = new Date(now);
  start6Months.setMonth(now.getMonth() - 6);

  if (date >= startOfWeek) return "this-week";
  if (date >= startOfMonth) return "this-month";
  if (date >= start6Months) return "last-6-months";
  return null;
}

const GROUP_LABELS: Record<string, string> = {
  "this-week": "This week",
  "this-month": "This month",
  "last-6-months": "Last 6 months",
};

const GROUP_ORDER = ["this-week", "this-month", "last-6-months"];

function RouteVisualizer({ legs }: { legs: Leg[] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginTop: "0.75rem", width: "100%" }}>
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#3ecfb2", flexShrink: 0 }} />
      {legs.map((leg, i) => {
        if (leg.type === "walk") {
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div style={{ flex: 1, height: 2, background: "#1a2e28" }} />
              <span style={{ fontSize: 14 }}>🚶</span>
              <div style={{ flex: 1, height: 2, background: "#1a2e28" }} />
            </div>
          );
        } else {
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: 2 }}>
              <div style={{ flex: 1, height: 2, background: "#3ecfb2" }} />
              <span style={{ background: "#1a2e28", color: "#3ecfb2", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0 }}>
                {leg.route}
              </span>
              <div style={{ flex: 1, height: 2, background: "#3ecfb2" }} />
            </div>
          );
        }
      })}
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#555", flexShrink: 0 }} />
    </div>
  );
}

export default function History() {
  useRequireAuth();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ origin: "", destination: "" });

  useEffect(() => {
    getTrips()
      .then((data) => {
        if (Array.isArray(data)) {
          setTrips(data.map(mapApiTrip));
        } else {
          setError(data.error ?? "Failed to load trips");
        }
      })
      .catch(() => setError("Failed to load trips"))
      .finally(() => setLoading(false));
  }, []);

  const grouped: Record<string, Trip[]> = { "this-week": [], "this-month": [], "last-6-months": [] };
  trips.forEach(t => {
    const g = getGroup(t.date);
    if (g) grouped[g].push(t);
  });

  const hasTrips = GROUP_ORDER.some((g) => grouped[g].length > 0);


  // delete and edits for trips
  async function handleDelete(id: number) {
  if (!confirm("Delete this trip?")) return;
  await deleteTrip(id);
  setTrips(trips.filter(t => t.id !== id));
  }

  async function handleEditSave(id: number) {
    await updateTrip(id, { origin: editForm.origin, destination: editForm.destination });
    setTrips(trips.map(t => t.id === id ? { ...t, from: editForm.origin, to: editForm.destination } : t));
    setEditingId(null);
  }
  return (
      <main style={{ padding: "2rem", width: "100%", maxWidth: 1000, marginTop: 60, marginLeft: "auto", marginRight: "auto" }}>    
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "white", marginBottom: "1.5rem" }}>
          Trip History
        </h1>
      {loading && <p style={{ color: "#888", fontSize: 14 }}>Loading trips...</p>}
      {error && <p style={{ color: "#f87171", fontSize: 14 }}>{error}</p>}
      {!loading && !error && !hasTrips && (
        <p style={{ color: "#888", fontSize: 14 }}>No trips yet.</p>
      )}
      {!loading && !error && GROUP_ORDER.map(group => {
        const groupTrips = grouped[group];
        if (!groupTrips.length) return null;

        return (
          <div key={group} style={{ marginBottom: "2rem" }}>
            <div style={{ marginBottom: "0.75rem" }}>
              <span style={{ fontSize: 13, color: "#888" }}>{GROUP_LABELS[group]}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {groupTrips.map(t => ( // loops thru trips
                <div
                  key={t.id}
                  style={{ background: "#0d1a16", border: "1px solid #1a2e28", borderRadius: 12, padding: "1.25rem 2rem", width: "100%" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div>
                      {editingId === t.id ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <input
                            value={editForm.origin}
                            onChange={e => setEditForm({ ...editForm, origin: e.target.value })}
                            style={{ background: "#1a2e28", border: "1px solid #3ecfb2", borderRadius: 6, padding: "4px 8px", color: "white", fontSize: 13 }}
                          />
                          <input
                            value={editForm.destination}
                            onChange={e => setEditForm({ ...editForm, destination: e.target.value })}
                            style={{ background: "#1a2e28", border: "1px solid #3ecfb2", borderRadius: 6, padding: "4px 8px", color: "white", fontSize: 13 }}
                          />
                        </div>
                      ) : (
                        <>
                          <div style={{ fontSize: 14, color: "white", fontWeight: 500 }}>{t.from}</div>
                          <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>→ {t.to}</div>
                        </>
                      )}
                    </div>
                    <div style={{display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6}}>
                      <div style={{fontSize: 16, fontWeight: 700, color: "white", whiteSpace: "nowrap"}}>
                        {fmtDate(t.date)}
                      </div>
                      <button
                          onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                          style={{
                            fontSize: 11,
                            color: "#3ecfb2",
                            background: "none",
                            border: "1px solid #1a2e28",
                            borderRadius: 20,
                            cursor: "pointer",
                            padding: "2px 10px",
                            whiteSpace: "nowrap"
                          }}
                      >
                        {expanded === t.id ? "Hide details" : "See details"}
                      </button>
                      {editingId === t.id ? (
                          <div style={{display: "flex", gap: 6}}>
                            <button
                                onClick={() => handleEditSave(t.id)}
                                style={{
                                  fontSize: 11,
                                  color: "#0d1a16",
                                  background: "#3ecfb2",
                                  border: "none",
                                  borderRadius: 20,
                                  cursor: "pointer",
                                  padding: "2px 10px"
                                }}
                            >
                              Save
                            </button>
                            <button
                                onClick={() => setEditingId(null)}
                                style={{
                                  fontSize: 11,
                                  color: "#888",
                                  background: "none",
                                  border: "1px solid #1a2e28",
                                  borderRadius: 20,
                                  cursor: "pointer",
                                  padding: "2px 10px"
                                }}
                            >
                              Cancel
                            </button>
                          </div>
                      ) : (
                          <div style={{display: "flex", gap: 6}}>
                            <button
                                onClick={() => {
                                  setEditingId(t.id);
                                  setEditForm({origin: t.from, destination: t.to});
                                }}
                                style={{
                                  fontSize: 11,
                                  color: "#3ecfb2",
                                  background: "none",
                                  border: "1px solid #1a2e28",
                                  borderRadius: 20,
                                  cursor: "pointer",
                                  padding: "2px 10px"
                                }}
                            >
                              Edit
                            </button>
                            <button
                                onClick={() => handleDelete(t.id)}
                                style={{
                                  fontSize: 11,
                                  color: "#f87171",
                                  background: "none",
                                  border: "1px solid #1a2e28",
                                  borderRadius: 20,
                                  cursor: "pointer",
                                  padding: "2px 10px"
                                }}
                            >
                              Delete
                            </button>
                          </div>
                      )}
                    </div>
                  </div>

                  <RouteVisualizer legs={t.legs}/>

                  {expanded === t.id && (
                      <div style={{marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #1a2e28"}}>
                        <div style={{display: "flex", flexDirection: "column", gap: 8}}>
                          {t.legs.map((leg, i) =>
                              leg.type === "walk" ? (
                                  <div key={i} style={{
                                    fontSize: 13,
                                    color: "#888",
                                    display: "flex",
                                    gap: 8,
                                    alignItems: "center"
                                  }}>
                                    <span>🚶</span> Walk · {leg.duration}
                                  </div>
                              ) : (
                                  <div key={i} style={{
                                    fontSize: 13,
                                    color: "#aaa",
                                    display: "flex",
                                    gap: 8,
                                    alignItems: "center"
                                  }}>
                              <span style={{
                                background: "#1a2e28",
                                color: "#3ecfb2",
                                fontSize: 11,
                                padding: "2px 8px",
                                borderRadius: 20
                              }}>
                                {leg.route}
                              </span>
                                    {leg.from} → {leg.to} · {leg.duration}
                                  </div>
                              )
                          )}
                        </div>
                      </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      </main>
  );
}