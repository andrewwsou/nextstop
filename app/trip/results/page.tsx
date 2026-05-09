"use client";

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
  label?: string;
  time: string;
  depart: string;
  duration: string;
  transfers: string;
  walk: string;
  segments: Segment[];
};

const liveRoutesPlaceholder: Route[] = [
  {
    label: "Suggested Route",
    time: "--:-- → --:--",
    depart: "Live departure time",
    duration: "-- min",
    transfers: "-- transfers",
    walk: "-- min walk",

    segments: [
      { type: "walk" },

      {
        type: "transit",
        label: "OC 57",
        transitType: "bus",
      },

      { type: "walk" },

      {
        type: "transit",
        label: "Metrolink 682",
        transitType: "train",
      },

      { type: "walk" },
    ],
  },

  {
    time: "--:-- → --:--",
    depart: "Live departure time",
    duration: "-- min",
    transfers: "-- transfers",
    walk: "-- min walk",

    segments: [
      { type: "walk" },

      {
        type: "transit",
        label: "OC 43",
        transitType: "bus",
      },

      { type: "walk" },
    ],
  },

  {
    time: "--:-- → --:--",
    depart: "Live departure time",
    duration: "-- min",
    transfers: "-- transfers",
    walk: "-- min walk",

    segments: [
      { type: "walk" },

      {
        type: "transit",
        label: "OC 54",
        transitType: "bus",
      },

      { type: "walk" },

      {
        type: "transit",
        label: "OC 12",
        transitType: "bus",
      },

      { type: "walk" },
    ],
  },
];

{/* Main page component */}
export default function TripResults() {
  const router = useRouter();
  const searchParams = useSearchParams();

  {/* Reads START/Dest location from prior pages and defaults to fill in if nothing */}
  const start = searchParams.get("start") || "1234 Street Lane";
  const destination = searchParams.get("destination") || "Huntington Library";

  {/* Static routes.... */}
  const routes = liveRoutesPlaceholder;

  const allowedTransitTypes =
  searchParams.get("transit")?.split(",").filter(Boolean) || [
    "bus",
    "train",
    "express",
  ];

  const filteredRoutes = routes.filter((route) =>
    route.segments.every((segment) => {
      if (segment.type === "walk") {
        return true;
      }

      return allowedTransitTypes.includes(
        segment.transitType as string
      );
    })
  );

  return (
    <main className="min-h-screen bg-[#111] text-white px-6 py-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="block text-left text-4xl mb-4"
      >
        ←
      </button>

      {/* grabs routes found */}
      <h1 className="text-4xl font-bold">
        {filteredRoutes.length} routes found
      </h1>

      <p className="text-lg underline text-zinc-200 mt-1">
        {start} → {destination}
      </p>

      {/* Shows Today's date */}
      <p className="text-sm text-zinc-400 mb-5">
      Departing now ·{" "}
      {new Date().toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })}
      </p>

      <div className="space-y-5">
        {/* Renders label if exists */}
        {filteredRoutes.map((route, index) => (
          <section
            key={index}
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