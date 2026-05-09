"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Trip() {
  const router = useRouter();

{/* buttons for transit types */}
const [transitTypes, setTransitTypes] = useState({
  bus: true,
  train: true,
  express: true,
});

const toggleTransitType = (type: "bus" | "train" | "express") => {
  setTransitTypes((prev) => ({
    ...prev,
    [type]: !prev[type],
  }));
};

  {/* Holds state for Location inputs */}
  const [start, setStart] = useState("");
  const [destination, setDestination] = useState("");

  {/* Plan trip button */}
  const handlePlanTrip = () => {
    const allowedTransit = Object.entries(transitTypes)
      .filter(([_, isEnabled]) => isEnabled)
      .map(([type]) => type)
      .join(",");

    router.push(
      `/trip/results?start=${encodeURIComponent(start)}&destination=${encodeURIComponent(
        destination
      )}&transit=${encodeURIComponent(allowedTransit)}`
    );
  };

  return (
    <main className="min-h-screen bg-[#111] text-white px-6 pt-8">
      <div className="flex items-center gap-4 mb-6">
        {/* Back button */} 
        <button className="text-4xl leading-none" onClick={() => router.push("/dashboard")}>
          ←
        </button>

        {/* Header */}
        <h1 className="text-4xl font-bold whitespace-nowrap">
          Where do you want to go?
        </h1>
      </div>

      {/* Start Label */}
      {/* Current Location Button doesn't do anything... .. */}
      <section className="rounded-3xl border border-zinc-600 bg-[#262626] p-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-zinc-400">START</span>
          <button className="text-xs text-teal-300 border border-teal-400 rounded-full px-3 py-1">
            ↗ Use my current location
          </button>
        </div>

        {/* Location Input */}
        <input
          value={start}
          onChange={(e) => setStart(e.target.value)}
          placeholder="Enter location"
          className="w-full bg-transparent border-b border-zinc-500 pb-2 mb-4 text-sm outline-none placeholder:text-zinc-500"
        />

        <span className="text-xs text-zinc-400">DESTINATION</span>

        {/* Destination Input */}
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Enter location"
          className="w-full bg-transparent border-b border-zinc-500 pb-2 mt-2 text-sm outline-none placeholder:text-zinc-500"
        />
      </section>

      {/* Buttons for Day, Time, Transit Types */}
      <div className="grid grid-cols-2 gap-3 mb-7">
        <div>
          <p className="mb-2">Day</p>
          <button className="w-full rounded-xl border border-zinc-600 bg-[#262626] px-4 py-3 text-left">
            ◷ Today
          </button>
        </div>

        <div>
          <p className="mb-2">Time</p>
          <button className="w-full rounded-xl border border-zinc-600 bg-[#262626] px-4 py-3 text-left">
            ◷ Now
          </button>
        </div>
      </div>

      <p className="mb-3">Transit types</p>

      <button
        onClick={() => toggleTransitType("bus")}
        className={`rounded-xl border-4 py-4 font-semibold ${
          transitTypes.bus
            ? "border-teal-300 bg-teal-700"
            : "border-zinc-600 bg-zinc-800 text-zinc-500 opacity-50"
        }`}
      >
        🚌
        <br />
        OC Bus
      </button>

      <button
        onClick={() => toggleTransitType("train")}
        className={`rounded-xl border-4 py-4 font-semibold ${
          transitTypes.train
            ? "border-indigo-400 bg-indigo-500/60"
            : "border-zinc-600 bg-zinc-800 text-zinc-500 opacity-50"
        }`}
      >
        🚆
        <br />
        Metrolink
      </button>

      <button
        onClick={() => toggleTransitType("express")}
        className={`rounded-xl border-2 py-4 text-sm font-semibold ${
          transitTypes.express
            ? "border-cyan-700 bg-cyan-950"
            : "border-zinc-600 bg-zinc-800 text-zinc-500 opacity-50"
        }`}
      >
        🚌
        <br />
        Anteater
        <br />
        Express
      </button>

      {/* Goes to trip planner page */}
      <button
        onClick={handlePlanTrip}
        className="mt-10 w-full rounded-xl bg-teal-400 py-4 font-bold text-black"
      >
        Plan Trip
      </button>
    </main>
  );
}