"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type TransitTypes = {
  bus: boolean;
  train: boolean;
};

function TripForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [start, setStart] = useState("");
  const [destination, setDestination] = useState(searchParams.get("destination") || "");
  const [formError, setFormError] = useState("");
  const [tripDate, setTripDate] = useState("");
  const [tripTime, setTripTime] = useState("");

  const [transitTypes, setTransitTypes] = useState<TransitTypes>({
    bus: true,
    train: true,
  });

  const toggleTransitType = (type: keyof TransitTypes) => {
    setTransitTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setStart(`${latitude}, ${longitude}`);
      },
      () => {
        alert("Unable to get your current location.");
      }
    );
  };

  const handlePlanTrip = () => {
    const trimmedStart = start.trim();
    const trimmedDestination = destination.trim();
    const allowedTransit = Object.entries(transitTypes)
      .filter(([, isEnabled]) => isEnabled)
      .map(([type]) => type)
      .join(",");

    if (!trimmedStart || !trimmedDestination) {
      setFormError("Enter both a start and destination.");
      return;
    }

    if (!allowedTransit) {
      setFormError("Choose at least one transit type.");
      return;
    }

    setFormError("");

    router.push(
      `/trip/results?start=${encodeURIComponent(trimmedStart)}&destination=${encodeURIComponent(
        trimmedDestination
      )}&transit=${encodeURIComponent(allowedTransit)}&date=${encodeURIComponent(
        tripDate
      )}&time=${encodeURIComponent(tripTime)}`
    );
  };

  return (
    <main className="min-h-screen bg-[#18181b] text-zinc-100 font-sans px-6 py-16 max-w-4xl mx-auto">
      {/* Header Deck */}
      <div className="border-b border-zinc-800 pb-6 mb-8 flex items-center gap-4">
        <button
          className="text-zinc-400 hover:text-white transition-colors text-sm font-mono"
          onClick={() => router.push("/dashboard")}
        >
          [← BACK]
        </button>

        <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
          Route Planner
        </h1>
      </div>

      <div className="space-y-6">
        {/* Core Coordinates Section (No background block, separated by thin stack lines) */}
        <section className="space-y-5">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500">START COORDINATES</span>
              <button
                onClick={handleUseCurrentLocation}
                className="rounded border border-teal-500/30 bg-teal-950/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-teal-400 transition hover:border-teal-400 hover:bg-teal-950/30"
              >
                Use Current Location
              </button>
            </div>
            <input
              value={start}
              onChange={(e) => setStart(e.target.value)}
              placeholder="Enter starting location or coordinates"
              className="w-full rounded border border-zinc-700 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-100 font-mono placeholder:text-zinc-600 outline-none transition focus:border-teal-500/50 focus:bg-zinc-900"
            />
          </div>

          <div>
            <div className="mb-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500">TARGET DESTINATION</span>
            </div>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Enter destination location"
              className="w-full rounded border border-zinc-700 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-100 font-mono placeholder:text-zinc-600 outline-none transition focus:border-teal-500/50 focus:bg-zinc-900"
            />
          </div>
        </section>

        {/* Temporal Parameters (Date / Time picker grid) */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <p className="mb-2 text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Date //</p>
            <input
              type="date"
              value={tripDate}
              onChange={(e) => setTripDate(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-100 font-mono outline-none transition focus:border-teal-500/50 color-scheme-dark"
            />
          </div>

          <div>
            <p className="mb-2 text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Time //</p>
            <input
              type="time"
              value={tripTime}
              onChange={(e) => setTripTime(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-100 font-mono outline-none transition focus:border-teal-500/50 color-scheme-dark"
            />
          </div>
        </div>

        {/* Transit Network Configuration */}
        <div className="pt-2">
          <p className="mb-3 text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Network Protocols</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => toggleTransitType("bus")}
              className={`rounded border px-4 py-2.5 text-xs font-mono font-bold tracking-wider uppercase transition-all ${
                transitTypes.bus
                  ? "border-teal-500 text-teal-400 bg-teal-950/20"
                  : "border-zinc-700 text-zinc-500 bg-transparent hover:border-zinc-500"
              }`}
            >
              OC Bus
            </button>

            <button
              onClick={() => toggleTransitType("train")}
              className={`rounded border px-4 py-2.5 text-xs font-mono font-bold tracking-wider uppercase transition-all ${
                transitTypes.train
                  ? "border-indigo-500/50 text-indigo-400 bg-indigo-950/20"
                  : "border-zinc-700 text-zinc-500 bg-transparent hover:border-zinc-500"
              }`}
            >
              Metrolink
            </button>
          </div>
        </div>
      </div>

      {formError && (
        <div className="mt-6 rounded border border-red-500/20 bg-red-950/10 p-4 text-xs font-mono text-red-400">
          SYSTEM_ERR // {formError}
        </div>
      )}

      {/* Primary Navigation Trigger */}
      <button
        onClick={handlePlanTrip}
        className="mt-10 w-full rounded border border-teal-500 bg-teal-500/10 hover:bg-teal-500/20 py-3 text-xs font-mono font-bold uppercase tracking-widest text-teal-400 shadow-sm transition-all active:scale-[0.99]"
      >
        Execute Trajectory Planning
      </button>
    </main>
  );
}

export default function Trip() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#18181b] font-mono text-xs text-zinc-500 tracking-widest">
          INITIALIZING GEOLOCATION SYSTEMS...
        </div>
      }
    >
      <TripForm />
    </Suspense>
  );
}