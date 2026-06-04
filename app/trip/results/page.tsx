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
    <div className="my-5 flex items-center w-full">
      {/* Start circle */}
      <div className="h-6 w-6 rounded-full border-2 border-teal-300 flex items-center justify-center shrink-0">
        <div className="h-3 w-3 rounded-full bg-teal-300" />
      </div>

      {/* Dynamic route pieces */}
      {segments.map((segment, index) => (
        <div key={index} className="flex flex-1 items-center">
          <div className="h-[2px] flex-1 bg-teal-200" />

          {/* WALK */}
          {segment.type === "walk" && (
            <div className="mx-2 text-sm">🚶</div>
          )}

          {/* TRANSIT */}
          {segment.type === "transit" && (
            <div
              className={`rounded-md px-4 py-1 text-xs font-bold whitespace-nowrap ${
                segment.transitType === "train"
                  ? "bg-indigo-500"
                  : segment.transitType === "express"
                  ? "bg-cyan-700"
                  : "bg-teal-700"
              }`}
            >
              {segment.label}
            </div>
          )}

          <div className="h-[2px] flex-1 bg-teal-200" />
        </div>
      ))}

      {/* End circle */}
      <div className="h-6 w-6 rounded-full border-2 border-teal-700 shrink-0" />
    </div>
  );
}

{/* Placeholder for Live Route API Data*/}
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
  if (!date) {
    return null;
  }

  const departureDate = new Date(`${date}T${time || "00:00"}`);
  if (Number.isNaN(departureDate.getTime())) {
    return null;
  }

  return departureDate.toISOString();
}

function mapPlanRoute(route: PlanRoute, index: number): Route {
  const transitSteps = route.steps.filter((step) => step.type === "transit");

  return {
    id: route.id,
    label: `Route option ${index + 1}${index === 0 ? " · Suggested" : ""}`,
    summary: route.summary,
    time:
      route.departureTime && route.arrivalTime
        ? `${route.departureTime} -> ${route.arrivalTime}`
        : route.summary,
    depart: route.summary || "Transit route",
    duration: route.duration || "--",
    transfers:
      transitSteps.length > 1
        ? `${transitSteps.length - 1} transfer${
            transitSteps.length - 1 === 1 ? "" : "s"
          }`
        : "0 transfers",
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

{/* Main page component */}
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

  {/* Reads START/Dest location from prior pages and defaults to fill in if nothing */}
  const start = searchParams.get("start") || "";
  const destination = searchParams.get("destination") || "";
  const transit =
    searchParams.get("transit") || "bus,train,express";

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

        if (!res.ok) {
          throw new Error(data.error || "Could not load routes.");
        }

        setRoutes((data.routes || []).map(mapPlanRoute));
      } catch (err) {
        setRoutes([]);
        setError(
          err instanceof Error ? err.message : "Could not load routes."
        );
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
      });

      if (data.error) {
        throw new Error(data.error);
      }

      setSavedRouteIds((currentIds) => [...currentIds, route.id]);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save trip.");
    } finally {
      setSavingRouteId(null);
    }
  }

  return (
    <main
      className="min-h-screen bg-[#111] text-white"
      style={{ justifyContent: "flex-start", padding: "6rem 1.5rem 2rem" }}
    >
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="block text-left text-4xl mb-4"
      >
        ←
      </button>

      {/* grabs routes found */}
      <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
        {isLoading ? "Finding routes..." : `${routes.length} routes found`}
      </h1>

      <p className="text-lg underline text-zinc-200 mt-1">
        {start} → {destination}
      </p>

      {/* Shows Today's date */}
      <p className="text-sm text-zinc-400 mb-5">
        Departing{" "}
        {tripDate
          ? new Date(tripDate).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })
          : "today"}
        {tripTime && ` · ${tripTime}`}
      </p>

      {error && (
        <p className="mb-5 rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {saveError && (
        <p className="mb-5 rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {saveError}
        </p>
      )}

      {!isLoading && !error && routes.length === 0 && (
        <p className="mb-5 rounded-xl border border-zinc-700 bg-[#262626] px-4 py-3 text-sm text-zinc-300">
          No routes match those transit filters.
        </p>
      )}

      <div className="space-y-5">
        {/* Renders label if exists */}
        {routes.map((route, index) => {
          const isExpanded = expandedRouteId === route.id;
          const isSaving = savingRouteId === route.id;
          const isSaved = savedRouteIds.includes(route.id);

          return (
            <section
              key={route.id}
              className={`rounded-2xl p-4 border ${
                index === 0
                  ? "bg-teal-900/50 border-teal-300"
                  : "bg-[#2b2b2b] border-zinc-700"
              }`}
            >
            {/* Route time and departure info */}
            {route.label && (
              <p className="text-teal-200 font-bold mb-1">{route.label}</p>
            )}

            <h2 className="text-2xl font-bold">{route.time}</h2>
            <p className="text-sm text-zinc-300">
              {route.transitLines.length > 0
                ? route.transitLines.join(" + ")
                : route.depart}
            </p>
            {route.hasLiveData && (
              <p className="mt-1 text-xs font-semibold text-teal-200">
                Live Transit data available
              </p>
            )}

            {/* Line graphic referenced at top */}
            <RouteLine segments={route.segments} />
            
            {/* Duration, Transfer, and Walk Time */}
            <div className="flex justify-between text-sm text-teal-100 border-t border-teal-200/40 pt-3">
              <span>◷ {route.duration}</span>
              <span>→ {route.transfers}</span>
              <span>🚶 {route.walk}</span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setExpandedRouteId(isExpanded ? null : route.id)}
                className="text-sm font-semibold text-teal-200"
              >
                {isExpanded ? "Hide details" : "Show details"}
              </button>
              <button
                onClick={() => handleSaveTrip(route)}
                disabled={isSaving || isSaved}
                className="rounded-lg border border-teal-300/60 px-3 py-2 text-sm font-semibold text-teal-100 disabled:cursor-not-allowed disabled:border-zinc-600 disabled:text-zinc-400"
              >
                {isSaved ? "Saved" : isSaving ? "Saving..." : "Save trip"}
              </button>
            </div>

            {isExpanded && (
              <div className="mt-4 space-y-3 border-t border-zinc-700 pt-4">
                {route.steps.map((step, stepIndex) => (
                  <div key={`${route.id}-${stepIndex}`} className="text-sm">
                    {step.type === "transit" ? (
                      <>
                        <div className="font-semibold text-white">
                          {step.vehicleType?.includes("RAIL") ? "Train" : "Bus"}{" "}
                          {step.lineName || "Transit"}
                          {step.duration && (
                            <span className="font-normal text-zinc-400"> · {step.duration}</span>
                          )}
                        </div>
                        <div className="text-zinc-300">
                          {step.departureStop || "Departure stop"} →{" "}
                          {step.arrivalStop || "Arrival stop"}
                        </div>
                        {(step.departureTime || step.arrivalTime) && (
                          <div className="text-xs text-zinc-400">
                            {step.departureTime || "--"} → {step.arrivalTime || "--"}
                          </div>
                        )}
                        {step.live && (
                          <div className="mt-1 text-xs text-teal-200">
                            {step.live.realtimeAvailable ? "Realtime available" : "Scheduled data"}
                            {step.live.nextDeparture && (
                              <> · Next: {new Date(step.live.nextDeparture).toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                              })}</>
                            )}
                            {step.live.status && <> · {step.live.status}</>}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-zinc-300">
                        Walk {step.distance && `${step.distance} `}
                        {step.duration && `(${step.duration})`}
                        {step.instruction && (
                          <span className="text-zinc-500"> · {step.instruction}</span>
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
    <Suspense fallback={<div>Loading...</div>}>
      <TripResultsContent />
    </Suspense>
  );
}
