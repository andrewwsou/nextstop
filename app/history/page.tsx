"use client";
import { useEffect, useState } from "react";
import { deleteTrip, getTrips, updateTrip } from "../lib/api";
import { useRequireAuth } from "../lib/auth";
import type { Leg, RouteSummaryStep, Trip } from "./mockdata";
import { useRouter } from "next/navigation";

function mapApiTrip(t: {
  id: number;
  origin: string;
  destination: string;
  created_at?: string;
  departure_time?: string | null;
  transit_modes?: string[];
  duration_minutes?: number | null;
  route_summary?: Trip["routeSummary"];
}): Trip {
  const savedDate = t.created_at?.slice(0, 10) ?? "";
  const tripDate = t.departure_time?.slice(0, 10) || savedDate;
  const modes = t.transit_modes ?? [];
  const legs = getPreviewLegs(t.route_summary?.steps, modes, t);

  return {
    id: t.id,
    from: t.origin,
    to: t.destination,
    date: tripDate,
    savedDate,
    departureTime: t.departure_time,
    durationMinutes: t.duration_minutes,
    modes,
    routeSummary: t.route_summary,
    legs,
  };
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  });
}

function fmtDateTime(value?: string | null) {
  if (!value) {
    return "No departure time set";
  }

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMode(mode: string) {
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

function getPreviewLegs(
  steps: RouteSummaryStep[] | undefined,
  modes: string[],
  trip: { origin: string; destination: string; duration_minutes?: number | null }
): Leg[] {
  if (steps?.length) {
    return steps.map((step) => {
      if (step.type === "walking") {
        return {
          type: "walk",
          duration: step.duration || "Walk",
        };
      }

      return {
        type: "bus",
        route: step.lineName || getVehicleLabel(step),
        from: step.departureStop || trip.origin,
        to: step.arrivalStop || trip.destination,
        duration: step.duration || "--",
      };
    });
  }

  return modes.map((route) => ({
    type: "bus",
    route: formatMode(route),
    from: trip.origin,
    to: trip.destination,
    duration: trip.duration_minutes ? `${trip.duration_minutes} min` : "--",
  }));
}

function getVehicleLabel(step: RouteSummaryStep) {
  if (step.vehicleType?.includes("RAIL")) {
    return "Train";
  }

  return "Bus";
}

function RouteStepDetails({ step }: { step: RouteSummaryStep }) {
  if (step.type === "walking") {
    return (
      <div style={{ fontSize: 13, color: "#aaa", display: "flex", gap: 8 }}>
        <span>Walk</span>
        <span>
          {step.distance || "Walking segment"}
          {step.duration ? ` · ${step.duration}` : ""}
          {step.instruction ? ` · ${step.instruction}` : ""}
        </span>
      </div>
    );
  }

  return (
    <div style={{ fontSize: 13, color: "#aaa", display: "grid", gap: 3 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <span style={{ background: "#1a2e28", color: "#3ecfb2", fontSize: 11, padding: "2px 8px", borderRadius: 20 }}>
          {step.lineName || "Transit"}
        </span>
        <span style={{ color: "white" }}>
          {getVehicleLabel(step)}
          {step.duration ? ` · ${step.duration}` : ""}
        </span>
      </div>
      <div>
        {step.departureStop || "Departure stop"} → {step.arrivalStop || "Arrival stop"}
      </div>
      {(step.departureTime || step.arrivalTime) && (
        <div style={{ color: "#777" }}>
          {step.departureTime || "--"} → {step.arrivalTime || "--"}
        </div>
      )}
      {step.live && (
        <div style={{ color: "#3ecfb2" }}>
          {step.live.realtimeAvailable ? "Realtime available" : "Scheduled data"}
          {step.live.status ? ` · ${step.live.status}` : ""}
        </div>
      )}
    </div>
  );
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
              <span style={{ fontSize: 14 }}>Walk</span>
              <div style={{ flex: 1, height: 2, background: "#1a2e28" }} />
            </div>
          );
        }

        return (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: 2 }}>
            <div style={{ flex: 1, height: 2, background: "#3ecfb2" }} />
            <span style={{ background: "#1a2e28", color: "#3ecfb2", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0 }}>
              {leg.route}
            </span>
            <div style={{ flex: 1, height: 2, background: "#3ecfb2" }} />
          </div>
        );
      })}
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#555", flexShrink: 0 }} />
    </div>
  );
}

export default function History() {
  useRequireAuth();
  const router = useRouter();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
  origin: "",
  destination: "",
  departure_date: "",
  departure_time: "",
  transit_modes: [] as string[],
});


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
  trips.forEach((trip) => {
    const group = getGroup(trip.date);
    if (group) {
      grouped[group].push(trip);
    }
  });

  const hasTrips = GROUP_ORDER.some((group) => grouped[group].length > 0);

  async function handleDelete(id: number) {
    if (!confirm("Delete this trip?")) {
      return;
    }

    const data = await deleteTrip(id);
    if (data.error) {
      setError(data.error);
      return;
    }

    setTrips((currentTrips) => currentTrips.filter((trip) => trip.id !== id));
  }

async function handleEditSave(id: number) {
  const departure_time = editForm.departure_date && editForm.departure_time
    ? `${editForm.departure_date}T${editForm.departure_time}:00`
    : undefined;

  const trip = trips.find(t => t.id === id);
  const routeChanged = trip && (editForm.origin !== trip.from || editForm.destination !== trip.to);

  const updatePayload: any = {
    origin: editForm.origin,
    destination: editForm.destination,
    departure_time,
    transit_modes: editForm.transit_modes,
  };

  if (routeChanged) {
    updatePayload.duration_minutes = null;
    updatePayload.transit_modes = [];
  }

  const data = await updateTrip(id, updatePayload);

  if (data.error) {
    setError(data.error);
    return;
  }

  setTrips(currentTrips =>
    currentTrips.map(t =>
      t.id === id
        ? {
            ...t,
            from: editForm.origin,
            to: editForm.destination,
            departureTime: departure_time ?? t.departureTime,
            modes: routeChanged ? [] : editForm.transit_modes,
            durationMinutes: routeChanged ? null : t.durationMinutes,
            routeSummary: routeChanged ? undefined : t.routeSummary,
            legs: routeChanged ? [] : t.legs,
          }
        : t
    )
  );
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
      {!loading && !error && GROUP_ORDER.map((group) => {
        const groupTrips = grouped[group];
        if (!groupTrips.length) return null;

        return (
          <div key={group} style={{ marginBottom: "2rem" }}>
            <div style={{ marginBottom: "0.75rem" }}>
              <span style={{ fontSize: 13, color: "#888" }}>{GROUP_LABELS[group]}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {groupTrips.map((trip) => (
                <div
                  key={trip.id}
                  style={{ background: "#0d1a16", border: "1px solid #1a2e28", borderRadius: 12, padding: "1.25rem 2rem", width: "100%" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div>
                      {editingId === trip.id ? (
                          <div style={{display: "flex", flexDirection: "column", gap: 8, minWidth: 220}}>
                            <div>
                              <div style={{fontSize: 11, color: "#666", marginBottom: 3}}>ORIGIN</div>
                              <input
                                  value={editForm.origin}
                                  onChange={e => setEditForm({...editForm, origin: e.target.value})}
                                  style={{
                                    background: "#1a2e28",
                                    border: "1px solid #3ecfb2",
                                    borderRadius: 6,
                                    padding: "4px 8px",
                                    color: "white",
                                    fontSize: 13,
                                    width: "100%"
                                  }}
                              />
                            </div>
                            <div>
                              <div style={{fontSize: 11, color: "#666", marginBottom: 3}}>DESTINATION</div>
                              <input
                                  value={editForm.destination}
                                  onChange={e => setEditForm({...editForm, destination: e.target.value})}
                                  style={{
                                    background: "#1a2e28",
                                    border: "1px solid #3ecfb2",
                                    borderRadius: 6,
                                    padding: "4px 8px",
                                    color: "white",
                                    fontSize: 13,
                                    width: "100%"
                                  }}
                              />
                            </div>
                            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6}}>
                              <div>
                                <div style={{fontSize: 11, color: "#666", marginBottom: 3}}>DATE</div>
                                <input
                                    type="date"
                                    value={editForm.departure_date}
                                    onChange={e => setEditForm({...editForm, departure_date: e.target.value})}
                                    style={{
                                      background: "#1a2e28",
                                      border: "1px solid #3ecfb2",
                                      borderRadius: 6,
                                      padding: "4px 8px",
                                      color: "white",
                                      fontSize: 13,
                                      width: "100%"
                                    }}
                                />
                              </div>
                              <div>
                                <div style={{fontSize: 11, color: "#666", marginBottom: 3}}>TIME</div>
                                <input
                                    type="time"
                                    value={editForm.departure_time}
                                    onChange={e => setEditForm({...editForm, departure_time: e.target.value})}
                                    style={{
                                      background: "#1a2e28",
                                      border: "1px solid #3ecfb2",
                                      borderRadius: 6,
                                      padding: "4px 8px",
                                      color: "white",
                                      fontSize: 13,
                                      width: "100%"
                                    }}
                                />
                              </div>
                            </div>
                            <div>
                              <div style={{fontSize: 11, color: "#666", marginBottom: 6}}>TRANSIT MODES</div>
                              <div style={{display: "flex", gap: 6, flexWrap: "wrap"}}>
                                {["bus", "train"].map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => setEditForm(f => ({
                                          ...f,
                                          transit_modes: f.transit_modes.includes(mode)
                                              ? f.transit_modes.filter(m => m !== mode)
                                              : [...f.transit_modes, mode]
                                        }))}
                                        style={{
                                          fontSize: 11, padding: "3px 10px", borderRadius: 20, cursor: "pointer",
                                          background: editForm.transit_modes.includes(mode) ? "#3ecfb2" : "#1a2e28",
                                          color: editForm.transit_modes.includes(mode) ? "#0d1a16" : "#888",
                                          border: "1px solid #3ecfb2"
                                        }}
                                    >
                                      {mode === "bus" ? "OC Bus" : "Metrolink"}
                                    </button>
                                ))}
                              </div>
                            </div>
                          </div>
                      ) : (
                          <>
                            <div style={{fontSize: 14, color: "white", fontWeight: 500}}>{trip.from}</div>
                            <div style={{fontSize: 13, color: "#888", marginTop: 2}}>→ {trip.to}</div>
                          </>
                      )}
                    </div>
                    <div style={{display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6}}>
                      <div style={{fontSize: 16, fontWeight: 700, color: "white", whiteSpace: "nowrap"}}>
                        {fmtDate(trip.date)}
                      </div>
                      <div style={{fontSize: 12, color: "#888", whiteSpace: "nowrap"}}>
                        {trip.durationMinutes ? `${trip.durationMinutes} min` : "Duration unavailable"}
                      </div>
                      <button
                          onClick={() => setExpanded(expanded === trip.id ? null : trip.id)}
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
                        {expanded === trip.id ? "Hide details" : "See details"}
                      </button>
                      {editingId === trip.id ? (
                          <div style={{display: "flex", gap: 6}}>
                            <button
                                onClick={() => handleEditSave(trip.id)}
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
                                  setEditingId(trip.id);
                                  setEditForm({
                                    origin: trip.from,
                                    destination: trip.to,
                                    departure_date: trip.departureTime?.slice(0, 10) ?? "",
                                    departure_time: trip.departureTime?.slice(11, 16) ?? "",
                                transit_modes: trip.modes ?? [],
                              });
                            }}
                            style={{ fontSize: 11, color: "#3ecfb2", background: "none", border: "1px solid #1a2e28", borderRadius: 20, cursor: "pointer", padding: "2px 10px" }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(trip.id)}
                            style={{ fontSize: 11, color: "#f87171", background: "none", border: "1px solid #1a2e28", borderRadius: 20, cursor: "pointer", padding: "2px 10px" }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {trip.legs.length === 0 ? (
                    <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 12, color: "#888" }}>Route info unavailable —</span>
                      <button
                        onClick={() => router.push(`/trip?destination=${encodeURIComponent(trip.to)}`)}
                        style={{ fontSize: 12, color: "#3ecfb2", background: "none", border: "1px solid #3ecfb2", borderRadius: 20, cursor: "pointer", padding: "2px 10px" }}
                      >
                        Re-plan trip →
                      </button>
                    </div>
                  ) : (
                    <RouteVisualizer legs={trip.legs} />
                  )}

                  {expanded === trip.id && (
                    <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #1a2e28" }}>
                      <div style={{ display: "grid", gap: 8, fontSize: 13, color: "#aaa" }}>
                        <div>
                          <span style={{ color: "#666" }}>Planned departure: </span>
                          {fmtDateTime(trip.departureTime)}
                        </div>
                        <div>
                          <span style={{ color: "#666" }}>Saved: </span>
                          {trip.savedDate ? fmtDate(trip.savedDate) : "Unknown"}
                        </div>
                        <div>
                          <span style={{ color: "#666" }}>Transit modes: </span>
                          {trip.modes?.length ? trip.modes.map(formatMode).join(", ") : "Not specified"}
                        </div>
                        <div>
                          <span style={{ color: "#666" }}>Estimated duration: </span>
                          {trip.durationMinutes ? `${trip.durationMinutes} min` : "Unavailable"}
                        </div>
                        {trip.routeSummary?.steps?.length ? (
                          <div style={{ display: "grid", gap: 10, marginTop: 6 }}>
                            <div style={{ color: "#666" }}>Route steps</div>
                            {trip.routeSummary.steps.map((step, index) => (
                              <RouteStepDetails key={`${trip.id}-${index}`} step={step} />
                            ))}
                          </div>
                        ) : (
                          <div style={{ color: "#666" }}>
                            Detailed bus/train steps were not saved for this older trip.
                          </div>
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
