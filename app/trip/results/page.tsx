"use client";

import { useRouter, useSearchParams } from "next/navigation";

// Draws the transit line graphic used in all three routes
function RouteLine({ stops }: { stops: string[] }) {
  return (
    <div className="my-5 flex items-center w-full">
      <div className="h-6 w-6 rounded-full border-2 border-teal-300 flex items-center justify-center shrink-0">
        <div className="h-3 w-3 rounded-full bg-teal-300" />
      </div>

      <span className="mx-3 text-sm text-zinc-300">🚶</span>

      {stops.map((stop, index) => (
        <div key={`${stop}-${index}`} className="flex flex-1 items-center">
          <div className="h-[2px] flex-1 bg-teal-200" />

          <div
            className={`rounded-md px-4 py-1 text-xs font-bold whitespace-nowrap ${
              stop.includes("ML") || stop.includes("Metrolink")
                ? "bg-indigo-500"
                : "bg-teal-700"
            }`}
          >
            {stop}
          </div>

          <div className="h-[2px] flex-1 bg-teal-200" />

          {index < stops.length - 1 && (
            <span className="mx-3 text-sm text-zinc-300">🚶</span>
          )}
        </div>
      ))}

      <span className="mx-3 text-sm text-zinc-300">🚶</span>

      <div className="h-6 w-6 rounded-full border-2 border-teal-700 shrink-0" />
    </div>
  );
}

// Main page component
export default function TripResults() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Reads START/Dest location from prior pages and defaults to fill in if nothing
  const start = searchParams.get("start") || "1234 Street Lane";
  const destination = searchParams.get("destination") || "Huntington Library";

  // Static routes....
  const routes = [
    {
      label: "Suggested Route",
      time: "9:52 am → 10:56 am",
      depart: "Departs in 11 min",
      duration: "1h 4min",
      transfers: "2 transfers",
      walk: "12 min walk",
      stops: ["OC 57", "Metrolink 682"],
    },
    {
      time: "10:22 am → 11:37 am",
      depart: "Departs in 24 min",
      duration: "1h 15min",
      transfers: "3 transfers",
      walk: "20 min walk",
      stops: ["OC 57", "Metrolink 682", "OC 43"],
    },
    {
      time: "10:08 am → 11:53 am",
      depart: "Departs in 34 min",
      duration: "1h 45min",
      transfers: "2 transfers",
      walk: "28 min walk",
      stops: ["OC 57", "OC 54"],
    },
  ];

  return (
    <main className="min-h-screen bg-[#111] text-white px-6 py-6">
      // Back button
      <button
        onClick={() => router.back()}
        className="block text-left text-4xl mb-4"
      >
        ←
      </button>

      // hardcoded route num
      <h1 className="text-4xl font-bold">3 routes found</h1>

      <p className="text-lg underline text-zinc-200 mt-1">
        {start} → {destination}
      </p>

      // Shows Today's date
      <p className="text-sm text-zinc-400 mb-5">
      Departing now ·{" "}
      {new Date().toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })}
      </p>

      <div className="space-y-5">
        // Renders label if exists
        {routes.map((route, index) => (
          <section
            key={index}
            className={`rounded-2xl p-4 border ${
              index === 0
                ? "bg-teal-900/50 border-teal-300"
                : "bg-[#2b2b2b] border-zinc-700"
            }`}
          >
            // Route time and departure info
            {route.label && (
              <p className="text-teal-200 font-bold mb-1">{route.label}</p>
            )}

            <h2 className="text-2xl font-bold">{route.time}</h2>
            <p className="text-sm text-zinc-300">{route.depart}</p>

            // Line graphic referenced at top
            <RouteLine stops={route.stops} />
            
            // Duration, Transfer, and Walk TIme
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