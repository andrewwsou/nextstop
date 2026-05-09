"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Trip() {
  const router = useRouter();

  const [start, setStart] = useState("");
  const [destination, setDestination] = useState("");

  const [tripDate, setTripDate] = useState("");
  const [tripTime, setTripTime] = useState("");

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
    const allowedTransit = Object.entries(transitTypes)
      .filter(([_, isEnabled]) => isEnabled)
      .map(([type]) => type)
      .join(",");

      router.push(
      `/trip/results?start=${encodeURIComponent(start)}&destination=${encodeURIComponent(destination
      )}&transit=${encodeURIComponent(allowedTransit)}&date=${encodeURIComponent(tripDate
      )}&time=${encodeURIComponent(tripTime)}`
    );
  };

  return (
    <main className="min-h-screen bg-[#111] text-white px-6 pt-8">
      <div className="flex items-center gap-4 mb-6">
        <button
          className="text-4xl leading-none"
          onClick={() => router.push("/dashboard")}
        >
          ←
        </button>

        <h1 className="text-4xl font-bold whitespace-nowrap">
          Where do you want to go?
        </h1>
      </div>

      <section className="rounded-3xl border border-zinc-600 bg-[#262626] p-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-zinc-400">START</span>

          <button
            onClick={handleUseCurrentLocation}
            className="text-xs text-teal-300 border border-teal-400 rounded-full px-3 py-1"
          >
            ↗ Use my current location
          </button>
        </div>

        <input
          value={start}
          onChange={(e) => setStart(e.target.value)}
          placeholder="Enter location"
          className="w-full bg-transparent border-b border-zinc-500 pb-2 mb-4 text-sm outline-none placeholder:text-zinc-500"
        />

        <span className="text-xs text-zinc-400">DESTINATION</span>

        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Enter location"
          className="w-full bg-transparent border-b border-zinc-500 pb-2 mt-2 text-sm outline-none placeholder:text-zinc-500"
        />
      </section>

      <div className="grid grid-cols-2 gap-3 mb-7">
        <div>
          <p className="mb-2">Day</p>
          <input
            type="date"
            value={tripDate}
            onChange={(e) => setTripDate(e.target.value)}
            className="w-full rounded-xl border border-zinc-600 bg-[#262626] px-4 py-3 text-left text-white"
          />
        </div>

        <div>
          <p className="mb-2">Time</p>
          <input
            type="time"
            value={tripTime}
            onChange={(e) => setTripTime(e.target.value)}
            className="w-full rounded-xl border border-zinc-600 bg-[#262626] px-4 py-3 text-left text-white"
          />
        </div>
      </div>

      <p className="mb-3">Transit types</p>

      <div className="grid grid-cols-3 gap-2">
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
      </div>

      <button
        onClick={handlePlanTrip}
        className="mt-10 w-full rounded-xl bg-teal-400 py-4 font-bold text-black"
      >
        Plan Trip
      </button>
    </main>
  );
}