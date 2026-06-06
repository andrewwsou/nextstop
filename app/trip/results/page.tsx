"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createTrip } from "../../lib/api";

type Segment =
  | { type: "walk" }
  | { type: "transit"; label: string; transitType: "bus" | "train" | "express" };

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
    <div aria-hidden="true" className="my-6 flex items-center w-full font-mono text-xs">
      <div className="h-4 w-4 rounded-full border border-teal-500 flex items-center justify-center shrink-0">
        <div className="h-1.5 w-1.5 rounded-full bg-teal-500" />
      </div>
      {segments.map((segment, index) => (
        <div key={index} className="flex flex-1 items-center">
          <div className="h-[1px] flex-1 bg-zinc-700" />
          {segment.type === "walk" && (
            <span className="mx-2 text-xs uppercase tracking-wider text-zinc-500 font-medium">WK</span>
          )}
          {segment.type === "transit" && (
            <span
              role="img"
              aria-label={`Route ${segment.label}`}
              className={`mx-2 rounded border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                segment.transitType === "train"
                  ? "border-indigo-500/40 text-indigo-400 bg-indigo-950/20"
                  : segment.transitType === "express"
                  ? "border-cyan-500/40 text-cyan-400 bg-cyan-950/20"
                  : "border-teal-500/40 text-teal-400 bg-teal-950/20"
              }`}
            >
              {segment.label}
            </span>
          )}
          <div className="h-[1px] flex-1 bg-zinc-700" />
        </div>
      ))}
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
  if (vehicleType && ["HEAVY_RAIL", "COMMUTER_TRAIN", "RAIL", "TRAIN", "TRAM"].includes(vehicleType)) return "train";
  return "bus";
}

function getDurationMinutes(duration: string) {
  const hourMatch = duration.match(/(\d+)\s*hour/);
  const minuteMatch = duration.match(/(\d+)\s*min/);
  return (hourMatch ? Number(hourMatch[1]) * 60 : 0) + (minuteMatch ? Number(minuteMatch[1]) : 0);
}

function getDepartureDateTime(date: string, time: string) {
  if (!date) return null;
  const departureDate = new Date(`${date}T${time || "00:00"}`);
  if (Number.isNaN(departureDate.getTime())) return null;
  return departureDate.toISOString();
}

function getRouteSummary(route: Route) {
  return {
    summary: route.summary, duration: route.duration,
    departureTime: route.time.split(" -> ")[0] || null,
    arrivalTime: route.time.split(" -> ")[1] || null,
    transitLines: route.transitLines,
    steps: route.steps.map((step) => ({
      type: step.type, instruction: step.instruction, duration: step.duration,
      distance: step.distance, lineName: step.lineName, vehicleType: step.vehicleType,
      departureStop: step.departureStop, arrivalStop: step.arrivalStop,
      departureTime: step.departureTime, arrivalTime: step.arrivalTime, live: step.live,
    })),
  };
}

function mapPlanRoute(route: PlanRoute, index: number): Route {
  const transitSteps = route.steps.filter((step) => step.type === "transit");
  return {
    id: route.id,
    label: index === 0 ? "SUGGESTED ROUTE" : undefined,
    summary: route.summary,
    time: route.departureTime && route.arrivalTime ? `${route.departureTime} → ${route.arrivalTime}` : route.summary,
    depart: route.summary || "Transit route",
    duration: route.duration || "--",
    transfers: transitSteps.length > 1 ? `${transitSteps.length - 1} transfer${transitSteps.length - 1 === 1 ? "" : "s"}` : "Direct",
    walk: route.totalWalkingTime ? `${route.totalWalkingTime} walk` : "-- walk",
    steps: route.steps,
    transitLines: route.transitLines,
    hasLiveData: route.steps.some((step) => step.live?.realtimeAvailable),
    segments: route.steps.map((step) => {
      if (step.type === "transit") return { type: "transit", label: step.lineName || "Transit", transitType: getTransitType(step.vehicleType) };
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
      setIsLoading(true); setError("");
      const query = new URLSearchParams({ origin: start, destination, modes: transit, date: tripDate, time: tripTime });
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
    setSavingRouteId(route.id); setSaveError("");
    try {
      const data = await createTrip({
        origin: start, destination,
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

      <button
        onClick={() => router.back()}
        className="text-[#848d9a] hover:text-[#f3f4f6] transition-colors text-xs uppercase tracking-wider font-semibold mb-8 flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3ecfb2] rounded"
      >
        <span aria-hidden="true">←</span> Back to Planner
      </button>

      <div className="border-b border-[#222630] pb-6 mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          {isLoading ? "Finding your routes..." : `${routes.length} Available Routes`}
        </h1>
        <div className="mt-2 text-sm text-[#848d9a] flex items-center flex-wrap gap-1.5 font-medium">
          <span className="text-[#3ecfb2]">{start}</span>
          <span aria-hidden="true" className="text-[#848d9a]">→</span>
          <span className="text-[#f3f4f6]">{destination}</span>
        </div>

        <div role="note" className="text-xs font-semibold tracking-widest text-[#848d9a] mt-3 uppercase">
          Departure:{" "}
          <span className="text-[#848d9a] font-normal normal-case tracking-normal">
            {tripDate
              ? new Date(tripDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
              : "Today"}
            {tripTime && ` @ ${tripTime}`}
          </span>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-6 rounded-xl border border-red-500/20 bg-red-950/10 p-4 text-sm text-red-400 flex items-center gap-2">
          <span aria-hidden="true">✕</span> Error: {error}
        </div>
      )}
      {saveError && (
        <div role="alert" className="mb-6 rounded-xl border border-red-500/20 bg-red-950/10 p-4 text-sm text-red-400 flex items-center gap-2">
          <span aria-hidden="true">✕</span> Save Error: {saveError}
        </div>
      )}
      {!isLoading && !error && routes.length === 0 && (
        <div className="mb-6 rounded-xl border border-[#222630] bg-[#13151a]/30 p-5 text-sm text-[#848d9a]">
          No transit routes match your filters. Try adjusting your departure preferences.
        </div>
      )}

      <div className="space-y-6">
        {routes.map((route, index) => {
          const isExpanded = expandedRouteId === route.id;
          const isSaving = savingRouteId === route.id;
          const isSaved = savedRouteIds.includes(route.id);
          const isSuggested = index === 0;

          return (
            <section
              key={route.id}
              aria-label={`Route ${index + 1}: ${route.time}, ${route.duration}${isSuggested ? ", suggested" : ""}`}
              className={`p-6 border transition-all rounded-xl ${isSuggested ? "bg-[#13151a]/60 border-[#3ecfb2]/40" : "bg-[#13151a]/30 border-[#222630]"}`}
            >

              {isSuggested && (
                <span aria-hidden="true" className="inline-block text-[10px] font-bold tracking-widest text-[#3ecfb2] uppercase mb-3 bg-[rgba(62,207,178,0.06)] border border-[#3ecfb2]/20 px-2 py-0.5 rounded-md">
                  Suggested Route
                </span>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">{route.time}</h2>
                <span className="text-xs font-semibold text-[#848d9a] tracking-wide">
                  {route.transitLines.length > 0 ? route.transitLines.join(" + ") : route.depart}
                </span>
              </div>

              {route.hasLiveData && (
                <div className="mt-2 flex items-center gap-1.5">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#3ecfb2] animate-pulse" />
                  <span className="text-[11px] font-medium text-[#3ecfb2]">Live updates active</span>
                </div>
              )}

              <RouteLine segments={route.segments} />

              <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-[#848d9a] font-medium pt-1">
                <span><span className="text-[#848d9a] font-bold">Duration:</span> {route.duration}</span>
                <span><span className="text-[#848d9a] font-bold">Transfers:</span> {route.transfers}</span>
                <span><span className="text-[#848d9a] font-bold">Walking:</span> {route.walk}</span>
              </div>

              <div className="mt-6 pt-4 border-t border-[#222630]/60 flex items-center gap-3">
                <button
                  onClick={() => setExpandedRouteId(isExpanded ? null : route.id)}
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? "Hide" : "View"} details for route ${index + 1}`}
                  className="rounded-xl border border-[#222630] bg-[#0b0c0e]/40 px-4 py-2 text-xs font-semibold text-[#848d9a] hover:text-[#f3f4f6] hover:border-[#4b5363] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3ecfb2]"
                >
                  {isExpanded ? "Hide Details" : "View Details"}
                </button>
                <button
                  onClick={() => handleSaveTrip(route)}
                  disabled={isSaving || isSaved}
                  aria-label={isSaved ? `Route ${index + 1} saved to history` : `Save route ${index + 1}`}
                  className="rounded-xl border border-[#222630] bg-[#0b0c0e]/40 px-4 py-2 text-xs font-semibold text-[#848d9a] hover:border-[#3ecfb2] hover:text-[#3ecfb2] transition-all disabled:cursor-not-allowed disabled:border-[#222630] disabled:text-[#4b5363] disabled:bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3ecfb2]"
                >
                  {isSaved ? "Saved to History" : isSaving ? "Saving..." : "Save Route"}
                </button>
              </div>

              {isExpanded && (
                <div className="mt-8 pt-4 border-t border-[#222630]/40 ml-1 pl-4 relative before:absolute before:top-6 before:bottom-4 before:left-[3px] before:w-[2px] before:bg-[#222630] space-y-6">
                  {route.steps.map((step, stepIndex) => (
                    <div key={`${route.id}-${stepIndex}`} className="relative text-xs pl-6">
                      <span aria-hidden="true" className={`absolute left-[-5px] top-[4px] h-3 w-3 rounded-full border-2 bg-[#0b0c0e] ${step.type === "transit" ? "border-[#3ecfb2]" : "border-[#848d9a]"}`} />
                      {step.type === "transit" ? (
                        <div className="space-y-1">
                          <div className="font-semibold text-white tracking-wide text-sm flex flex-wrap items-center gap-2">
                            {step.vehicleType?.includes("RAIL") ? "Train Service" : "Bus Line"}{" "}
                            <span className="text-[#3ecfb2] font-bold bg-[rgba(62,207,178,0.06)] px-2 py-0.5 rounded-md border border-[#3ecfb2]/20 text-xs">
                              {step.lineName || "Transit"}
                            </span>
                            {step.duration && <span className="text-xs text-[#848d9a] font-normal">({step.duration})</span>}
                          </div>
                          <div className="text-[#848d9a] text-xs font-medium">
                            {step.departureStop || "Origin Station"}{" "}
                            <span aria-hidden="true" className="text-[#848d9a]">→</span>{" "}
                            {step.arrivalStop || "Destination Station"}
                          </div>
                          {(step.departureTime || step.arrivalTime) && (
                            <div className="text-xs text-[#848d9a] font-medium">
                              {step.departureTime || "--:--"} — {step.arrivalTime || "--:--"}
                            </div>
                          )}
                          {step.live && (
                            <div className="mt-2 text-xs text-[#3ecfb2] font-medium flex items-center gap-1.5">
                              <span aria-hidden="true" className="w-1 h-1 rounded-full bg-[#3ecfb2]" />
                              <span>{step.live.realtimeAvailable ? "Live Schedule" : "Scheduled Time"}</span>
                              {step.live.nextDeparture && (
                                <>
                                  <span aria-hidden="true" className="text-[#848d9a]">·</span>
                                  <span className="text-[#848d9a]">Next Arrival: {new Date(step.live.nextDeparture).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                                </>
                              )}
                              {step.live.status && (
                                <>
                                  <span aria-hidden="true" className="text-[#848d9a]">/</span>
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
                            {step.duration && <span className="text-xs text-[#848d9a] font-normal ml-1.5">({step.duration})</span>}
                          </div>
                          {step.instruction && <div className="text-[#848d9a] text-xs leading-relaxed font-medium">{step.instruction}</div>}
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
