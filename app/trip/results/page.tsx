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
    <main className="min-h-screen bg-[#18181b] text-zinc-100 font-sans px-6 py-16 max-w-4xl mx-auto">
      {/* Navigation */}
      <button
        onClick={() => router.back()}
        className="text-zinc-400 hover:text-white transition-colors text-sm font-medium tracking-wide uppercase mb-8 flex items-center gap-2"
      >
        <span>←</span> Back to Planner
      </button>

      {/* Header Info */}
      <div className="border-b border-zinc-800 pb-6 mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
          {isLoading ? "Finding paths..." : `${routes.length} Available Routes`}
        </h1>
        <div className="mt-2 text-sm text-zinc-400 font-medium">
          <span className="text-teal-400">{start}</span>
          <span className="mx-2 text-zinc-600">→</span>
          <span className="text-zinc-200">{destination}</span>
        </div>
        <p className="text-xs font-mono text-zinc-500 mt-1.5 uppercase tracking-wider">
          DEPARTURE:{" "}
          {tripDate
            ? new Date(tripDate).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })
            : "Today"}
          {tripTime && ` @ ${tripTime}`}
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded border border-red-500/20 bg-red-950/10 p-4 text-xs font-mono text-red-400">
          ERR // {error}
        </div>
      )}

      {saveError && (
        <div className="mb-6 rounded border border-red-500/20 bg-red-950/10 p-4 text-xs font-mono text-red-400">
          ERR_SAVE // {saveError}
        </div>
      )}

      {!isLoading && !error && routes.length === 0 && (
        <div className="mb-6 rounded border border-zinc-800 bg-zinc-900/50 p-4 text-xs font-mono text-zinc-400">
          SYSTEM // No routes match filters.
        </div>
      )}

      {/* Route List Container */}
      <div className="divide-y divide-zinc-800/60">
        {routes.map((route, index) => {
          const isExpanded = expandedRouteId === route.id;
          const isSaving = savingRouteId === route.id;
          const isSaved = savedRouteIds.includes(route.id);
          const isSuggested = index === 0;

          return (
            <section
              key={route.id}
              className={`py-8 first:pt-0 last:pb-0 transition-all ${
                isSuggested
                  ? "bg-gradient-to-r from-teal-950/10 via-transparent to-transparent border-l-2 border-teal-500/40 pl-4 -ml-4"
                  : ""
              }`}
            >
              {/* Tactical Top Tag */}
              {isSuggested && (
                <span className="inline-block text-[10px] font-bold tracking-widest text-teal-400 font-mono mb-2 bg-teal-950/40 border border-teal-500/30 px-2 py-0.5 rounded-sm">
                  {route.label}
                </span>
              )}

              <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white font-mono">{route.time}</h2>
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  {route.transitLines.length > 0
                    ? route.transitLines.join(" + ")
                    : route.depart}
                </span>
              </div>

              {route.hasLiveData && (
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400">
                    Live Feed Intercepted
                  </span>
                </div>
              )}

              {/* Graphic Timeline component */}
              <RouteLine segments={route.segments} />

              {/* Micro-metrics Panel */}
              <div className="flex gap-6 text-xs font-mono text-zinc-400">
                <span className="flex items-center gap-1"><span className="text-zinc-600">DUR:</span> {route.duration}</span>
                <span className="flex items-center gap-1"><span className="text-zinc-600">XFER:</span> {route.transfers}</span>
                <span className="flex items-center gap-1"><span className="text-zinc-600">WALK:</span> {route.walk}</span>
              </div>

              {/* Control Deck */}
              <div className="mt-5 flex items-center gap-4">
                <button
                  onClick={() => setExpandedRouteId(isExpanded ? null : route.id)}
                  className="text-xs font-mono uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
                >
                  [{isExpanded ? "Collapse -" : "Expand +"}]
                </button>
                <button
                  onClick={() => handleSaveTrip(route)}
                  disabled={isSaving || isSaved}
                  className="rounded border border-zinc-700 bg-zinc-900/30 px-3 py-1 text-xs font-mono uppercase tracking-wider text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800/40 transition-all disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600 disabled:bg-transparent"
                >
                  {isSaved ? "Saved" : isSaving ? "Processing..." : "Save Route"}
                </button>
              </div>

              {/* Expanded Vertical Timeline View */}
              {isExpanded && (
                <div className="mt-8 ml-2 pl-4 relative before:absolute before:top-2 before:bottom-2 before:left-[3px] before:w-[1px] before:bg-zinc-800 space-y-6">
                  {route.steps.map((step, stepIndex) => (
                    <div key={`${route.id}-${stepIndex}`} className="relative text-xs pl-6">

                      {/* Technical Line Node */}
                      <span className={`absolute left-[-4px] top-[4px] h-2 w-2 rounded-full border bg-[#18181b] ${
                        step.type === 'transit' ? 'border-teal-500' : 'border-zinc-600'
                      }`} />

                      {step.type === "transit" ? (
                        <div className="space-y-1">
                          <div className="font-semibold text-white tracking-wide">
                            {step.vehicleType?.includes("RAIL") ? "Train Service" : "Bus Service"}{" "}
                            <span className="text-teal-400 font-mono font-bold bg-teal-950/30 px-1.5 py-0.5 rounded border border-teal-500/20 text-[10px] ml-1">
                              {step.lineName || "Transit"}
                            </span>
                            {step.duration && (
                              <span className="font-mono text-[10px] text-zinc-500 uppercase ml-2">// {step.duration}</span>
                            )}
                          </div>
                          <div className="text-zinc-400 text-xs">
                            {step.departureStop || "Origin Station"} <span className="text-zinc-600">→</span> {step.arrivalStop || "Terminus Station"}
                          </div>
                          {(step.departureTime || step.arrivalTime) && (
                            <div className="text-[10px] font-mono text-zinc-500">
                              {step.departureTime || "--:--"} — {step.arrivalTime || "--:--"}
                            </div>
                          )}
                          {step.live && (
                            <div className="mt-1.5 text-[10px] font-mono text-teal-400/90 flex items-center gap-1">
                              <span>▪</span>
                              <span>{step.live.realtimeAvailable ? "Telemetry Live" : "Scheduled Track"}</span>
                              {step.live.nextDeparture && (
                                <><span>·</span> Next Arr: {new Date(step.live.nextDeparture).toLocaleTimeString([], {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}</>
                              )}
                              {step.live.status && <><span className="text-zinc-600">/</span> <span className="uppercase text-teal-300">{step.live.status}</span></>}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-zinc-400 space-y-0.5">
                          <div className="font-medium text-zinc-300">
                            Pedestrian Transfer {step.distance && `(${step.distance})`}
                            {step.duration && <span className="font-mono text-[10px] text-zinc-500 ml-2">// {step.duration}</span>}
                          </div>
                          {step.instruction && (
                            <div className="text-zinc-500 italic text-[11px]">{step.instruction}</div>
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
    <Suspense fallback={<div className="p-8 text-xs font-mono text-zinc-500">SYNCHRONIZING RECONNAISSANCE...</div>}>
      <TripResultsContent />
    </Suspense>
  );
}