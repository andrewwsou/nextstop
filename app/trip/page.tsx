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
      <main className="min-h-screen bg-[#111] px-6 pt-24 text-white">
        <div className="mb-6 mt-2 flex items-center gap-3">
          <button
              className="text-2xl opacity-70 transition hover:opacity-100"
              onClick={() => router.push("/dashboard")}
          >
            ←
          </button>

          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Where do you want to go?
          </h1>
        </div>

        <section className="mb-6 rounded-2xl border border-zinc-800 bg-[#1a1a1a] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-zinc-400">START</span>

            <button
                onClick={handleUseCurrentLocation}
                className="rounded-full border border-teal-500/40 px-3 py-1 text-xs text-teal-200 transition hover:bg-teal-500/10"
            >
              Use my current location
            </button>
          </div>

          <input
              value={start}
              onChange={(e) => setStart(e.target.value)}
              placeholder="Enter starting location"
              className="mb-4 w-full rounded-lg border border-zinc-800 bg-transparent px-3 py-2 text-sm outline-none transition placeholder:text-zinc-600 focus:border-teal-500/50"
          />

          <span className="text-xs text-zinc-400">DESTINATION</span>

          <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Enter destination"
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-transparent px-3 py-2 text-sm outline-none transition placeholder:text-zinc-600 focus:border-teal-500/50"
          />
        </section>

        <div className="mb-7 grid grid-cols-2 gap-3">
          <div>
            <p className="mb-2 text-sm text-zinc-300">Day</p>
            <input
                type="date"
                value={tripDate}
                onChange={(e) => setTripDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-[#1a1a1a] px-3 py-2 text-sm text-white transition focus:border-teal-500/50"
            />
          </div>

          <div>
            <p className="mb-2 text-sm text-zinc-300">Time</p>
            <input
                type="time"
                value={tripTime}
                onChange={(e) => setTripTime(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-[#1a1a1a] px-3 py-2 text-sm text-white transition focus:border-teal-500/50"
            />
          </div>
        </div>

        <p className="mb-3 text-sm text-zinc-300">Transit types</p>

        <div className="grid grid-cols-2 gap-2">
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
        </div>

        {formError && (
            <p className="mt-4 rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
              {formError}
            </p>
        )}

        <button
            onClick={handlePlanTrip}
            className="mt-10 w-full rounded-xl bg-teal-400 py-3 font-semibold text-black transition hover:bg-teal-300"
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
            <div className="flex min-h-screen items-center justify-center bg-[#111] text-white">
              Loading...
            </div>
          }
      >
        <TripForm/>
      </Suspense>
  );
}
