"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

type TransitTypes = {
  bus: boolean;
  train: boolean;
  express: boolean;
};

function TripForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [start, setStart] = useState("");
  const [destination, setDestination] = useState("");
  const [tripDate, setTripDate] = useState("");
  const [tripTime, setTripTime] = useState("");

  const [transitTypes, setTransitTypes] = useState<TransitTypes>({
    bus: true,
    train: true,
    express: true,
  });

  // ✅ Prefill destination from URL
  useEffect(() => {
    const dest = searchParams.get("destination");
    if (dest) setDestination(dest);
  }, [searchParams]);

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
    const allowedTransit = Object.keys(transitTypes)
      .filter((key) => transitTypes[key as keyof TransitTypes])
      .join(",");

    router.push(
      `/trip/results?start=${encodeURIComponent(start)}&destination=${encodeURIComponent(
        destination
      )}&transit=${encodeURIComponent(allowedTransit)}&date=${encodeURIComponent(
        tripDate
      )}&time=${encodeURIComponent(tripTime)}`
    );
  };

  return (
    <main className="min-h-screen bg-[#111] text-white px-6 pt-20">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6 mt-2">
        <button
          className="text-2xl opacity-70 hover:opacity-100 transition"
          onClick={() => router.push("/dashboard")}
        >
          ←
        </button>

        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Where do you want to go?
        </h1>
      </div>

      {/* LOCATION CARD */}
      <section className="rounded-2xl border border-zinc-800 bg-[#1a1a1a] p-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-zinc-400">START</span>

          <button
            onClick={handleUseCurrentLocation}
            className="text-xs text-teal-200 border border-teal-500/40 rounded-full px-3 py-1 hover:bg-teal-500/10 transition"
          >
            Use my current location
          </button>
        </div>

        <input
          value={start}
          onChange={(e) => setStart(e.target.value)}
          placeholder="Enter starting location"
          className="w-full bg-transparent border border-zinc-800 rounded-lg px-3 py-2 mb-4 text-sm outline-none placeholder:text-zinc-600 focus:border-teal-500/50 transition"
        />

        <span className="text-xs text-zinc-400">DESTINATION</span>

        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Enter destination"
          className="w-full bg-transparent border border-zinc-800 rounded-lg px-3 py-2 mt-2 text-sm outline-none placeholder:text-zinc-600 focus:border-teal-500/50 transition"
        />
      </section>

      {/* DATE + TIME */}
      <div className="grid grid-cols-2 gap-3 mb-7">
        <div>
          <p className="mb-2 text-sm text-zinc-300">Day</p>
          <input
            type="date"
            value={tripDate}
            onChange={(e) => setTripDate(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-[#1a1a1a] px-3 py-2 text-sm text-white focus:border-teal-500/50 transition"
          />
        </div>

        <div>
          <p className="mb-2 text-sm text-zinc-300">Time</p>
          <input
            type="time"
            value={tripTime}
            onChange={(e) => setTripTime(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-[#1a1a1a] px-3 py-2 text-sm text-white focus:border-teal-500/50 transition"
          />
        </div>
      </div>

      {/* TRANSIT */}
      <p className="mb-3 text-sm text-zinc-300">Transit types</p>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => toggleTransitType("bus")}
          className={`rounded-xl px-3 py-3 text-sm font-medium transition ${
            transitTypes.bus
              ? "border border-teal-400 bg-teal-400/10 text-teal-200"
              : "border border-zinc-800 bg-[#1a1a1a] text-zinc-500"
          }`}
        >
          OC Bus
        </button>

        <button
          onClick={() => toggleTransitType("train")}
          className={`rounded-xl px-3 py-3 text-sm font-medium transition ${
            transitTypes.train
              ? "border border-indigo-400 bg-indigo-400/10 text-indigo-200"
              : "border border-zinc-800 bg-[#1a1a1a] text-zinc-500"
          }`}
        >
          Metrolink
        </button>

        <button
          onClick={() => toggleTransitType("express")}
          className={`rounded-xl px-3 py-3 text-sm font-medium transition ${
            transitTypes.express
              ? "border border-cyan-400 bg-cyan-400/10 text-cyan-200"
              : "border border-zinc-800 bg-[#1a1a1a] text-zinc-500"
          }`}
        >
          Anteater Express
        </button>
      </div>

      {/* CTA */}
      <button
        onClick={handlePlanTrip}
        className="mt-10 w-full rounded-xl bg-teal-400 py-3 font-semibold text-black hover:bg-teal-300 transition"
      >
        Plan Trip
      </button>
    </main>
  );
}

export default function Trip() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#111] text-white flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <TripForm />
    </Suspense>
  );
}