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
    <main className="min-h-screen bg-[#0b0c0e] text-[#f3f4f6] px-6 py-16 max-w-2xl mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header Navigation */}
      <div className="border-b border-[#222630] pb-5 mb-10 flex items-center gap-4">
        <button
          className="text-[#848d9a] hover:text-[#f3f4f6] transition-colors text-xs uppercase tracking-wider flex items-center gap-2 font-semibold"
          onClick={() => router.push("/dashboard")}
        >
          <span>←</span> Back to Dashboard
        </button>
      </div>

      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          Plan Your Route
        </h1>
        <p className="text-sm text-[#848d9a]">Enter your travel details to find the best transit directions.</p>
      </div>

      <div className="space-y-8">
        {/* Locations Inputs */}
        <section className="space-y-6">
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <label className="text-xs font-bold tracking-widest text-[#4b5363] uppercase">Starting Point</label>
              <button
                onClick={handleUseCurrentLocation}
                className="rounded-xl bg-transparent border border-[#222630] hover:border-[#3ecfb2] px-3 py-1 text-xs text-[#848d9a] hover:text-[#3ecfb2] transition-colors flex items-center gap-2 font-medium"
              >
                Use current location
              </button>
            </div>
            <input
              value={start}
              onChange={(e) => setStart(e.target.value)}
              placeholder="Enter street, city, or coordinates"
              className="w-full rounded-none border-b border-[#222630] bg-transparent py-3 text-sm text-[#f3f4f6] placeholder-[#4b5363] outline-none transition-colors focus:border-[#3ecfb2]"
            />
          </div>

          <div>
            <div className="mb-2.5">
              <label className="text-xs font-bold tracking-widest text-[#4b5363] uppercase">Destination</label>
            </div>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Where do you want to go?"
              className="w-full rounded-none border-b border-[#222630] bg-transparent py-3 text-sm text-[#f3f4f6] placeholder-[#4b5363] outline-none transition-colors focus:border-[#3ecfb2]"
            />
          </div>
        </section>

        {/* Date / Time Picker Grid */}
        <div className="grid grid-cols-2 gap-6 pt-2">
          <div>
            <label className="mb-2.5 block text-xs font-bold tracking-widest text-[#4b5363] uppercase">Departure Date</label>
            <input
              type="date"
              value={tripDate}
              onChange={(e) => setTripDate(e.target.value)}
              className="w-full rounded-none border-b border-[#222630] bg-transparent py-2 text-sm text-[#f3f4f6] outline-none transition-colors focus:border-[#3ecfb2] [color-scheme:dark]"
            />
          </div>

          <div>
            <label className="mb-2.5 block text-xs font-bold tracking-widest text-[#4b5363] uppercase">Departure Time</label>
            <input
              type="time"
              value={tripTime}
              onChange={(e) => setTripTime(e.target.value)}
              className="w-full rounded-none border-b border-[#222630] bg-transparent py-2 text-sm text-[#f3f4f6] outline-none transition-colors focus:border-[#3ecfb2] [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Transit Selection — Layout styled like the Navigate panel stack */}
        <div className="pt-2">
          <label className="mb-4 block text-xs font-bold tracking-widest text-[#4b5363] uppercase">Preferred Transit</label>
          <div className="flex flex-col border border-[#222630] bg-[#13151a]/30">

            {/* OC Bus Option */}
            <button
              onClick={() => toggleTransitType("bus")}
              className={`w-full text-left p-5 transition-all flex items-center justify-between border-b border-[#222630] ${
                transitTypes.bus 
                  ? "bg-[#1c1f26]/60" 
                  : "hover:bg-[#1c1f26]/30 opacity-60"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-1 h-5 transition-all"
                  style={{ backgroundColor: transitTypes.bus ? "#3ecfb2" : "#4b5363" }}
                />
                <div>
                  <div className="text-sm font-semibold text-white">OC Bus</div>
                  <div className="text-xs text-[#848d9a] mt-0.5">Include local and express bus networks</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className={`w-4 h-4 border flex items-center justify-center text-[10px] ${transitTypes.bus ? "border-[#3ecfb2] text-[#3ecfb2]" : "border-[#4b5363]"}`}>
                  {transitTypes.bus && "✓"}
                </div>
              </div>
            </button>

            {/* Metrolink Option */}
            <button
              onClick={() => toggleTransitType("train")}
              className={`w-full text-left p-5 transition-all flex items-center justify-between ${
                transitTypes.train 
                  ? "bg-[#1c1f26]/60" 
                  : "hover:bg-[#1c1f26]/30 opacity-60"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-1 h-5 transition-all"
                  style={{ backgroundColor: transitTypes.train ? "#3b82f6" : "#4b5363" }}
                />
                <div>
                  <div className="text-sm font-semibold text-white">Metrolink</div>
                  <div className="text-xs text-[#848d9a] mt-0.5">Include regional commuter rail lines</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className={`w-4 h-4 border flex items-center justify-center text-[10px] ${transitTypes.train ? "border-[#3b82f6] text-[#3b82f6]" : "border-[#4b5363]"}`}>
                  {transitTypes.train && "✓"}
                </div>
              </div>
            </button>

          </div>
        </div>
      </div>

      {formError && (
        <div className="mt-8 rounded-none border border-red-500/30 bg-red-950/10 p-4 text-xs tracking-wide uppercase font-semibold text-red-400 flex items-center gap-2">
          <span>✕ Error:</span>
          {formError}
        </div>
      )}

      {/* Primary Action Button — matching landing page color scheme but crisp rectangular */}
      <button
        onClick={handlePlanTrip}
        className="mt-12 w-full rounded-xl bg-[#3ecfb2] hover:bg-[#34b399] py-4 text-sm font-bold uppercase tracking-wider text-[#0b0c0e] transition-colors active:scale-[0.99] flex items-center justify-center gap-2"
      >
        Find Routes <span>→</span>
      </button>
    </main>
  );
}

export default function Trip() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0b0c0e] text-xs uppercase tracking-widest text-[#848d9a]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Loading interface...
        </div>
      }
    >
      <TripForm />
    </Suspense>
  );
}