"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
  time: string;
  depart: string;
  duration: string;
  transfers: string;
  walk: string;
  segments: Segment[];
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

function mapPlanRoute(route: PlanRoute, index: number): Route {
  const transitSteps = route.steps.filter((step) => step.type === "transit");

  return {
    id: route.id,
    label: index === 0 ? "Suggested Route" : undefined,
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

      {!isLoading && !error && routes.length === 0 && (
        <p className="mb-5 rounded-xl border border-zinc-700 bg-[#262626] px-4 py-3 text-sm text-zinc-300">
          No routes match those transit filters.
        </p>
      )}

      <div className="space-y-5">
        {/* Renders label if exists */}
        {routes.map((route, index) => (
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
            <p className="text-sm text-zinc-300">{route.depart}</p>

            {/* Line graphic referenced at top */}
            <RouteLine segments={route.segments} />
            
            {/* Duration, Transfer, and Walk Time */}
            <div className="flex justify-between text-sm text-teal-100 border-t border-teal-200/40 pt-3">
              <span>◷ {route.duration}</span>
              <span>→ {route.transfers}</span>
              <span>🚶 {route.walk}</span>
            </div>
          </section>
        ))}
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
