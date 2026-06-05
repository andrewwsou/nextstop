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
      <div className="text-xs text-zinc-400 flex gap-2 font-mono uppercase tracking-wider">
        <span className="text-zinc-600">Walk</span>
        <span>
          {step.distance || "Walking segment"}
          {step.duration ? ` · ${step.duration}` : ""}
          {step.instruction ? ` · ${step.instruction}` : ""}
        </span>
      </div>
    );
  }

  return (
    <div className="text-xs text-zinc-400 grid gap-1 relative pl-4 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[1px] before:bg-teal-500/30">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="border border-teal-500/30 text-teal-400 text-[10px] px-1.5 py-0.5 rounded-sm font-mono font-bold bg-teal-950/20 uppercase tracking-wide">
          {step.lineName || "Transit"}
        </span>
        <span className="text-white font-medium">
          {getVehicleLabel(step)}
          {step.duration ? ` · ${step.duration}` : ""}
        </span>
      </div>
      <div className="text-zinc-300 font-mono text-[11px] mt-0.5">
        {step.departureStop || "Departure stop"} → {step.arrivalStop || "Arrival stop"}
      </div>
      {(step.departureTime || step.arrivalTime) && (
        <div className="text-[10px] font-mono text-zinc-500">
          {step.departureTime || "--"} — {step.arrivalTime || "--"}
        </div>
      )}
      {step.live && (
        <div className="text-[10px] font-mono text-teal-400 mt-0.5 flex items-center gap-1">
          <span className="h-1 w-1 rounded-full bg-teal-400 animate-pulse" />
          <span>{step.live.realtimeAvailable ? "Live updates" : "Scheduled times"}</span>
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
  "this-week": "THIS WEEK",
  "this-month": "THIS MONTH",
  "last-6-months": "LAST 6 MONTHS",
};

const GROUP_ORDER = ["this-week", "this-month", "last-6-months"];

function RouteVisualizer({ legs }: { legs: Leg[] }) {
  return (
    <div className="my-5 flex items-center w-full font-mono text-xs">
      <div className="h-3 w-3 rounded-full border border-teal-500 flex items-center justify-center shrink-0">
        <div className="h-1 w-1 rounded-full bg-teal-500" />
      </div>
      {legs.map((leg, i) => {
        if (leg.type === "walk") {
          return (
            <div key={i} className="flex flex-1 items-center">
              <div className="h-[1px] flex-1 bg-zinc-800" />
              <span className="mx-2 text-[10px] uppercase tracking-wider text-zinc-500 font-medium">WK</span>
              <div className="h-[1px] flex-1 bg-zinc-800" />
            </div>
          );
        }

        return (
          <div key={i} className="flex flex-[2] items-center">
            <div className="h-[1px] flex-1 bg-zinc-700" />
            <span className="mx-2 rounded border border-teal-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase text-teal-400 bg-teal-950/20 whitespace-nowrap shrink-0">
              {leg.route}
            </span>
            <div className="h-[1px] flex-1 bg-zinc-700" />
          </div>
        );
      })}
      <div className="h-3 w-3 rounded-full border border-zinc-600 shrink-0" />
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
    <main className="min-h-screen bg-[#0b0c0e] text-[#f3f4f6] px-6 py-16 max-w-4xl mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header Navigation */}
      <div className="border-b border-[#222630] pb-5 mb-10 flex items-center gap-4">
        <button
          className="text-[#848d9a] hover:text-[#f3f4f6] transition-colors text-xs uppercase tracking-wider flex items-center gap-2 font-semibold"
          onClick={() => router.push("/dashboard")}
        >
          <span>←</span> Back to Dashboard
        </button>
      </div>

      {/* Title */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          Trip History
        </h1>
        <p className="text-sm text-[#848d9a]">Review, edit, and revisit your saved trips.</p>
      </div>

      {loading && <p className="text-sm text-[#848d9a] font-medium">Loading saved trips...</p>}
      {error && <p className="text-sm text-red-400 border border-red-500/20 bg-red-950/10 p-4 rounded-xl font-medium">Error: {error}</p>}
      {!loading && !error && !hasTrips && (
        <p className="text-sm text-[#848d9a] font-medium">You don't have any saved trips yet.</p>
      )}

      {!loading && !error && GROUP_ORDER.map((group) => {
        const groupTrips = grouped[group];
        if (!groupTrips.length) return null;

        return (
          <div key={group} className="mb-10">
            <div className="mb-4">
              <span className="text-xs font-bold tracking-widest text-[#4b5363] uppercase">
                {GROUP_LABELS[group] === "THIS WEEK" ? "This Week" : GROUP_LABELS[group] === "THIS MONTH" ? "This Month" : "Older Trips"}
              </span>
            </div>

            {/* Structured Card Grid */}
            <div className="space-y-4">
              {groupTrips.map((trip) => (
                <div key={trip.id} className="p-6 bg-[#13151a]/30 border border-[#222630] rounded-xl transition-all">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1 w-full">
                      {editingId === trip.id ? (
                        <div className="flex flex-col gap-4 max-w-md text-sm">
                          <div>
                            <label className="text-xs font-bold text-[#4b5363] uppercase tracking-wider mb-1 block">Origin</label>
                            <input
                              value={editForm.origin}
                              onChange={e => setEditForm({...editForm, origin: e.target.value})}
                              className="bg-[#0b0c0e] border border-[#222630] focus:border-[#3ecfb2] outline-none rounded-xl px-4 py-2 text-sm text-[#f3f4f6] w-full"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-[#4b5363] uppercase tracking-wider mb-1 block">Destination</label>
                            <input
                              value={editForm.destination}
                              onChange={e => setEditForm({...editForm, destination: e.target.value})}
                              className="bg-[#0b0c0e] border border-[#222630] focus:border-[#3ecfb2] outline-none rounded-xl px-4 py-2 text-sm text-[#f3f4f6] w-full"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-bold text-[#4b5363] uppercase tracking-wider mb-1 block">Date</label>
                              <input
                                type="date"
                                value={editForm.departure_date}
                                onChange={e => setEditForm({...editForm, departure_date: e.target.value})}
                                className="bg-[#0b0c0e] border border-[#222630] focus:border-[#3ecfb2] outline-none rounded-xl px-4 py-2 text-sm text-[#f3f4f6] w-full [color-scheme:dark]"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-[#4b5363] uppercase tracking-wider mb-1 block">Time</label>
                              <input
                                type="time"
                                value={editForm.departure_time}
                                onChange={e => setEditForm({...editForm, departure_time: e.target.value})}
                                className="bg-[#0b0c0e] border border-[#222630] focus:border-[#3ecfb2] outline-none rounded-xl px-4 py-2 text-sm text-[#f3f4f6] w-full [color-scheme:dark]"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-bold text-[#4b5363] uppercase tracking-wider mb-2 block">Transit Settings</label>
                            <div className="flex gap-2">
                              {["bus", "train"].map(mode => (
                                <button
                                  key={mode}
                                  onClick={() => setEditForm(f => ({
                                    ...f,
                                    transit_modes: f.transit_modes.includes(mode)
                                        ? f.transit_modes.filter(m => m !== mode)
                                        : [...f.transit_modes, mode]
                                  }))}
                                  className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
                                    editForm.transit_modes.includes(mode)
                                      ? "border-[#3ecfb2] text-[#3ecfb2] bg-[rgba(62,207,178,0.06)]"
                                      : "border-[#222630] text-[#848d9a] bg-transparent hover:border-[#4b5363]"
                                  }`}
                                >
                                  {mode === "bus" ? "OC Bus" : "Metrolink"}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-lg font-bold text-white tracking-tight">{trip.from}</div>
                          <div className="text-sm text-[#848d9a] font-medium mt-1">
                            <span className="text-[#4b5363] mr-1.5">→</span> {trip.to}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Metadata & Inline Controls */}
                    <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0 w-full sm:w-auto">
                      <div className="text-base font-bold text-white">{fmtDate(trip.date)}</div>
                      <div className="text-xs font-medium text-[#848d9a]">
                        <span className="text-[#4b5363] font-bold mr-1">Travel Time:</span>
                        {trip.durationMinutes ? `${trip.durationMinutes} min` : "No duration set"}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => setExpanded(expanded === trip.id ? null : trip.id)}
                          className="text-xs font-semibold text-[#3ecfb2] hover:text-[#34b399]"
                        >
                          {expanded === trip.id ? "Hide Details" : "View Details"}
                        </button>

                        {editingId === trip.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditSave(trip.id)}
                              className="text-xs font-bold border border-[#3ecfb2]/40 text-[#3ecfb2] bg-[rgba(62,207,178,0.06)] px-3 py-1 rounded-xl hover:border-[#3ecfb2]"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-xs font-bold border border-[#222630] text-[#848d9a] px-3 py-1 rounded-xl hover:border-[#4b5363]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-3">
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
                              className="text-xs font-semibold text-[#848d9a] hover:text-[#f3f4f6]"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(trip.id)}
                              className="text-xs font-semibold text-red-400/80 hover:text-red-400"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {trip.legs.length === 0 ? (
                    <div className="mt-4 flex items-center gap-3 text-sm">
                      <span className="text-[#4b5363] font-medium">No map steps available —</span>
                      <button
                        onClick={() => router.push(`/trip?destination=${encodeURIComponent(trip.to)}`)}
                        className="text-xs border border-[#3ecfb2]/30 px-3 py-1 text-[#3ecfb2] font-semibold rounded-xl bg-[rgba(62,207,178,0.04)] hover:border-[#3ecfb2]"
                      >
                        Re-plan Trip →
                      </button>
                    </div>
                  ) : (
                    <RouteVisualizer legs={trip.legs} />
                  )}

                  {/* Expanded Route Step Drawer */}
                  {expanded === trip.id && (
                    <div className="mt-5 pt-5 border-t border-[#222630]/60 text-sm">
                      <div className="grid gap-2 text-[#848d9a] font-medium">
                        <div>
                          <span className="text-[#4b5363]">Departure: </span>
                          <span className="text-[#f3f4f6]">{fmtDateTime(trip.departureTime)}</span>
                        </div>
                        <div>
                          <span className="text-[#4b5363]">Saved On: </span>
                          <span className="text-[#f3f4f6]">{trip.savedDate ? fmtDate(trip.savedDate) : "Unknown"}</span>
                        </div>
                        <div>
                          <span className="text-[#4b5363]">Transit Preferences: </span>
                          <span className="text-[#f3f4f6]">{trip.modes?.length ? trip.modes.map(formatMode).join(", ") : "Default filters"}</span>
                        </div>
                        <div>
                          <span className="text-[#4b5363]">Total Trip Length: </span>
                          <span className="text-[#f3f4f6]">{trip.durationMinutes ? `${trip.durationMinutes} mins` : "Unavailable"}</span>
                        </div>

                        {trip.routeSummary?.steps?.length ? (
                          <div className="grid gap-3 mt-4 pt-4 border-t border-[#222630]/40">
                            <div className="text-xs text-[#4b5363] font-bold uppercase tracking-widest">Route Steps</div>
                            {trip.routeSummary.steps.map((step, index) => (
                              <RouteStepDetails key={`${trip.id}-${index}`} step={step} />
                            ))}
                          </div>
                        ) : (
                          <div className="text-[#4b5363] text-xs italic mt-2">
                            Step-by-step navigation logs are not attached to this historical summary record.
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
