"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createTrip } from "../../lib/api";

type Segment =
  | {
      type: "walk";
    }
  | {
      type: "transit";
      label: string;
      transitType: "bus" | "train" | "express";
    };

type PlanStep = {
  type: "walking" | "transit";
  instruction: string;
  duration: string;
  distance: string;
  lineName?: string;
  vehicleType?: string;
  departureStop?: string;
  arrivalStop?: string;
  departureTime?: string;
  arrivalTime?: string;
  live?: {
    realtimeAvailable?: boolean;
    routeColor?: string;
    nextDeparture?: string;
    status?: string;
  };
};

type PlanRoute = {
  id: string;
  summary: string;
  duration: string;
  arrivalTime: string;
  departureTime: string;
  steps: PlanStep[];
  transitLines: string[];
  totalWalkingTime?: string;
};

function RouteLine({ segments }: { segments: Segment[] }) {
  return (
    <div className="my-6 flex items-center w-full font-mono text-xs">
      {/* Start Dot - Tactical border style matching the dashboard */}
      <div className="h-4 w-4 rounded-full border border-teal-500 flex items-center justify-center shrink-0">
        <div className="h-1.5 w-1.5 rounded-full bg-teal-500" />
      </div>

      {/* Dynamic route pieces */}
      {segments.map((segment, index) => (
        <div key={index} className="flex flex-1 items-center">
          <div className="h-[1px] flex-1 bg-zinc-700" />

          {/* WALK */}
          {segment.type === "walk" && (
            <span className="mx-2 text-xs uppercase tracking-wider text-zinc-500 font-medium">WK</span>
          )}

          {/* TRANSIT */}
          {segment.type === "transit" && (
            <div
              className={`mx-2 rounded border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                segment.transitType === "train"
                  ? "border-indigo-500/40 text-indigo-400 bg-indigo-950/20"
                  : segment.transitType === "express"
                  ? "border-cyan-500/40 text-cyan-400 bg-cyan-950/20"
                  : "border-teal-500/40 text-teal-400 bg-teal-950/20"
              }`}
            >
              {segment.label}
            </div>
          )}

          <div className="h-[1px] flex-1 bg-zinc-700" />
        </div>
      ))}

      {/* End Dot */}
      <div className="h-4 w-4 rounded-full border border-zinc-500 shrink-0" />
    </div>
  );
}

type Route = {
  id: string;
  label?: string;
  summary: string;
  time: string;
  depart: string;
  duration: string;
  transfers: string;
  walk: string;
  segments: Segment[];
  steps: PlanStep[];
  transitLines: string[];
  hasLiveData: boolean;
};

function getTransitType(vehicleType?: string): "bus" | "train" | "express" {
  if (
    vehicleType &&
    ["HEAVY_RAIL", "COMMUTER_TRAIN", "RAIL", "TRAIN", "TRAM"].includes(vehicleType)
  ) {
    return "train";
  }
  return "bus";
}

function getDurationMinutes(duration: string) {
  const hourMatch = duration.match(/(\d+)\s*hour/);
  const minuteMatch = duration.match(/(\d+)\s*min/);
  return (
    (hourMatch ? Number(hourMatch[1]) * 60 : 0) +
    (minuteMatch ? Number(minuteMatch[1]) : 0)
  );
}

function getDepartureDateTime(date: string, time: string) {
  if (!date) return null;
  const departureDate = new Date(`${date}T${time || "00:00"}`);
  if (Number.isNaN(departureDate.getTime())) return null;
  return departureDate.toISOString();
}

function getRouteSummary(route: Route) {
  return {
    summary: route.summary,
    duration: route.duration,
    departureTime: route.time.split(" -> ")[0] || null,
    arrivalTime: route.time.split(" -> ")[1] || null,
    transitLines: route.transitLines,
    steps: route.steps.map((step) => ({
      type: step.type,
      instruction: step.instruction,
      duration: step.duration,
      distance: step.distance,
      lineName: step.lineName,
      vehicleType: step.vehicleType,
      departureStop: step.departureStop,
      arrivalStop: step.arrivalStop,
      departureTime: step.departureTime,
      arrivalTime: step.arrivalTime,
      live: step.live,
    })),
  };
}

function mapPlanRoute(route: PlanRoute, index: number): Route {
  const transitSteps = route.steps.filter((step) => step.type === "transit");
  return {
    id: route.id,
    label: index === 0 ? "SUGGESTED ROUTE" : undefined,
    summary: route.summary,
    time:
      route.departureTime && route.arrivalTime
        ? `${route.departureTime} → ${route.arrivalTime}`
        : route.summary,
    depart: route.summary || "Transit route",
    duration: route.duration || "--",
    transfers:
      transitSteps.length > 1
        ? `${transitSteps.length - 1} transfer${transitSteps.length - 1 === 1 ? "" : "s"}`
        : "Direct",
    walk: route.totalWalkingTime ? `${route.totalWalkingTime} walk` : "-- walk",
    steps: route.steps,
    transitLines: route.transitLines,
    hasLiveData: route.steps.some((step) => step.live?.realtimeAvailable),
    segments: route.steps.map((step) => {
      if (step.type === "transit") {
        return {
          type: "transit",
          label: step.lineName || "Transit",
          transitType: getTransitType(step.vehicleType),
        };
      }
      return { type: "walk" };
    }),
  };
}

function TripResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
  const [savingRouteId, setSavingRouteId] = useState<string | null>(null);
  const [savedRouteIds, setSavedRouteIds] = useState<string[]>([]);
  const [saveError, setSaveError] = useState("");
  const tripDate = searchParams.get("date") || "";
  const tripTime = searchParams.get("time") || "";

  const start = searchParams.get("start") || "";
  const destination = searchParams.get("destination") || "";
  const transit = searchParams.get("transit") || "bus,train,express";

  useEffect(() => {
    async function loadRoutes() {
      setIsLoading(true);
      setError("");
      const query = new URLSearchParams({
        origin: start,
        destination,
        modes: transit,
        date: tripDate,
        time: tripTime,
      });

      try {
        const res = await fetch(`/api/transit/plan?${query.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load routes.");
        setRoutes((data.routes || []).map(mapPlanRoute));
      } catch (err) {
        setRoutes([]);
        setError(err instanceof Error ? err.message : "Could not load routes.");
      } finally {
        setIsLoading(false);
      }
    }
    loadRoutes();
  }, [destination, start, transit, tripDate, tripTime]);

  async function handleSaveTrip(route: Route) {
    setSavingRouteId(route.id);
    setSaveError("");
    try {
      const data = await createTrip({
        origin: start,
        destination,
        departure_time: getDepartureDateTime(tripDate, tripTime),
        transit_modes: transit.split(",").filter(Boolean),
        duration_minutes: getDurationMinutes(route.duration),
        route_summary: getRouteSummary(route),
      });
      if (data.error) throw new Error(data.error);
      setSavedRouteIds((currentIds) => [...currentIds, route.id]);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save trip.");
    } finally {
      setSavingRouteId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0c0e] text-[#f3f4f6] px-6 py-16 max-w-3xl mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Navigation */}
      <button
        onClick={() => router.back()}
        className="text-[#848d9a] hover:text-[#f3f4f6] transition-colors text-xs uppercase tracking-wider font-semibold mb-8 flex items-center gap-2"
      >
        <span>←</span> Back to Planner
      </button>

      {/* Header Info */}
      <div className="border-b border-[#222630] pb-6 mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          {isLoading ? "Finding your routes..." : `${routes.length} Available Routes`}
        </h1>
        <div className="mt-2 text-sm text-[#848d9a] flex items-center flex-wrap gap-1.5 font-medium">
          <span className="text-[#3ecfb2]">{start}</span>
          <span className="text-[#4b5363]">→</span>
          <span className="text-[#f3f4f6]">{destination}</span>
        </div>
        <p className="text-xs font-bold tracking-widest text-[#4b5363] mt-3 uppercase">
          DEPARTURE:{" "}
          <span className="text-[#848d9a]">
            {tripDate
              ? new Date(tripDate).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })
              : "Today"}
            {tripTime && ` @ ${tripTime}`}
          </span>
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-950/10 p-4 text-sm text-red-400 flex items-center gap-2">
          <span>✕ Error:</span> {error}
        </div>
      )}

      {saveError && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-950/10 p-4 text-sm text-red-400 flex items-center gap-2">
          <span>✕ Save Error:</span> {saveError}
        </div>
      )}

      {!isLoading && !error && routes.length === 0 && (
        <div className="mb-6 rounded-xl border border-[#222630] bg-[#13151a]/30 p-5 text-sm text-[#848d9a]">
          No transit routes match your filters. Try adjusting your departure preferences.
        </div>
      )}

      {/* Route List Container */}
      <div className="space-y-6">
        {routes.map((route, index) => {
          const isExpanded = expandedRouteId === route.id;
          const isSaving = savingRouteId === route.id;
          const isSaved = savedRouteIds.includes(route.id);
          const isSuggested = index === 0;

          return (
            <section
              key={route.id}
              className={`p-6 border transition-all rounded-xl ${
                isSuggested
                  ? "bg-[#13151a]/60 border-[#3ecfb2]/40"
                  : "bg-[#13151a]/30 border-[#222630]"
              }`}
            >
              {/* Top Suggestion Tag */}
              {isSuggested && (
                <span className="inline-block text-[10px] font-bold tracking-widest text-[#3ecfb2] uppercase mb-3 bg-[rgba(62,207,178,0.06)] border border-[#3ecfb2]/20 px-2 py-0.5 rounded-md">
                  Suggested Route
                </span>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">{route.time}</h2>
                <span className="text-xs font-semibold text-[#848d9a] tracking-wide">
                  {route.transitLines.length > 0
                    ? route.transitLines.join(" + ")
                    : route.depart}
                </span>
              </div>

              {route.hasLiveData && (
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#3ecfb2] animate-pulse" />
                  <span className="text-[11px] font-medium text-[#3ecfb2]">
                    Live updates active
                  </span>
                </div>
              )}

              {/* Graphic Timeline component */}
              <RouteLine segments={route.segments} />

              {/* Metrics Panel */}
              <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-[#848d9a] font-medium pt-1">
                <span className="flex items-center gap-1"><span className="text-[#4b5363]">Duration:</span> {route.duration}</span>
                <span className="flex items-center gap-1"><span className="text-[#4b5363]">Transfers:</span> {route.transfers}</span>
                <span className="flex items-center gap-1"><span className="text-[#4b5363]">Walking:</span> {route.walk}</span>
              </div>

              {/* Interactive buttons */}
              <div className="mt-6 pt-4 border-t border-[#222630]/60 flex items-center gap-3">
                <button
                  onClick={() => setExpandedRouteId(isExpanded ? null : route.id)}
                  className="rounded-xl border border-[#222630] bg-[#0b0c0e]/40 px-4 py-2 text-xs font-semibold text-[#848d9a] hover:text-[#f3f4f6] hover:border-[#4b5363] transition-all"
                >
                  {isExpanded ? "Hide Details" : "View Details"}
                </button>
                <button
                  onClick={() => handleSaveTrip(route)}
                  disabled={isSaving || isSaved}
                  className="rounded-xl border border-[#222630] bg-[#0b0c0e]/40 px-4 py-2 text-xs font-semibold text-[#848d9a] hover:border-[#3ecfb2] hover:text-[#3ecfb2] transition-all disabled:cursor-not-allowed disabled:border-[#222630] disabled:text-[#4b5363] disabled:bg-transparent"
                >
                  {isSaved ? "Saved to History" : isSaving ? "Saving..." : "Save Route"}
                </button>
              </div>

              {/* Expanded Vertical Timeline View */}
              {isExpanded && (
                <div className="mt-8 pt-4 border-t border-[#222630]/40 ml-1 pl-4 relative before:absolute before:top-6 before:bottom-4 before:left-[3px] before:w-[2px] before:bg-[#222630] space-y-6">
                  {route.steps.map((step, stepIndex) => (
                    <div key={`${route.id}-${stepIndex}`} className="relative text-xs pl-6">

                      {/* Timeline Hub Node */}
                      <span className={`absolute left-[-5px] top-[4px] h-3 w-3 rounded-full border-2 bg-[#0b0c0e] ${
                        step.type === 'transit' ? 'border-[#3ecfb2]' : 'border-[#4b5363]'
                      }`} />

                      {step.type === "transit" ? (
                        <div className="space-y-1">
                          <div className="font-semibold text-white tracking-wide text-sm flex flex-wrap items-center gap-2">
                            {step.vehicleType?.includes("RAIL") ? "Train Service" : "Bus Line"}{" "}
                            <span className="text-[#3ecfb2] font-bold bg-[rgba(62,207,178,0.06)] px-2 py-0.5 rounded-md border border-[#3ecfb2]/20 text-xs">
                              {step.lineName || "Transit"}
                            </span>
                            {step.duration && (
                              <span className="text-xs text-[#4b5363] font-normal">({step.duration})</span>
                            )}
                          </div>
                          <div className="text-[#848d9a] text-xs font-medium">
                            {step.departureStop || "Origin Station"} <span className="text-[#4b5363]">→</span> {step.arrivalStop || "Destination Station"}
                          </div>
                          {(step.departureTime || step.arrivalTime) && (
                            <div className="text-xs text-[#4b5363] font-medium">
                              {step.departureTime || "--:--"} — {step.arrivalTime || "--:--"}
                            </div>
                          )}
                          {step.live && (
                            <div className="mt-2 text-xs text-[#3ecfb2] font-medium flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-[#3ecfb2]" />
                              <span>{step.live.realtimeAvailable ? "Live Schedule" : "Scheduled Time"}</span>
                              {step.live.nextDeparture && (
                                <>
                                  <span className="text-[#4b5363]">·</span>
                                  <span className="text-[#848d9a]">Next Arrival: {new Date(step.live.nextDeparture).toLocaleTimeString([], {
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })}</span>
                                </>
                              )}
                              {step.live.status && (
                                <>
                                  <span className="text-[#4b5363]">/</span>
                                  <span className="uppercase font-bold text-[#3ecfb2]/90">{step.live.status.toLowerCase()}</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-[#848d9a] space-y-1">
                          <div className="font-semibold text-zinc-300 text-sm">
                            Walk {step.distance && `(${step.distance})`}
                            {step.duration && <span className="text-xs text-[#4b5363] font-normal ml-1.5">({step.duration})</span>}
                          </div>
                          {step.instruction && (
                            <div className="text-[#848d9a] text-xs leading-relaxed font-medium">{step.instruction}</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}

export default function TripResults() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#0b0c0e] text-sm text-[#848d9a] tracking-wide" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        Loading direct routes...
      </div>
    }>
      <TripResultsContent />
    </Suspense>
  );
}