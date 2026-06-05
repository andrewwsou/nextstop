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
    setTransitTypes((prev) => ({ ...prev, [type]: !prev[type] }));
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
      () => alert("Unable to get your current location.")
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
      `/trip/results?start=${encodeURIComponent(trimmedStart)}&destination=${encodeURIComponent(trimmedDestination)}&transit=${encodeURIComponent(allowedTransit)}&date=${encodeURIComponent(tripDate)}&time=${encodeURIComponent(tripTime)}`
    );
  };

  return (
    <main className="min-h-screen bg-[#0b0c0e] text-[#f3f4f6] px-6 py-16 max-w-2xl mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Back */}
      <div className="border-b border-[#222630] pb-5 mb-10 flex items-center gap-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-[#848d9a] hover:text-[#f3f4f6] transition-colors text-xs uppercase tracking-wider flex items-center gap-2 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3ecfb2] rounded"
        >
          <span aria-hidden="true">←</span> Back to Dashboard
        </button>
      </div>

      {/* Page heading — real h1, visible to both sighted users and screen readers */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Plan Your Route</h1>
        <p className="text-sm text-[#848d9a]">Enter your travel details to find the best transit directions.</p>
      </div>

      <div className="space-y-8">

        {/* Locations */}
        <section aria-labelledby="locations-heading" className="space-y-6">
          <h2
            id="locations-heading"
            tabIndex={0}
            className="text-xs font-bold tracking-widest text-[#4b5363] uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3ecfb2] rounded"
          >
            Trip Locations
          </h2>

          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <label htmlFor="start-input" className="text-xs font-bold tracking-widest text-[#4b5363] uppercase">
                Starting Point
              </label>
              <button
                onClick={handleUseCurrentLocation}
                className="rounded-xl bg-transparent border border-[#222630] hover:border-[#3ecfb2] px-3 py-1 text-xs text-[#848d9a] hover:text-[#3ecfb2] transition-colors flex items-center gap-2 font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3ecfb2]"
              >
                Use current location
              </button>
            </div>
            <input
              id="start-input"
              aria-describedby="start-hint"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              placeholder="Enter street, city, or coordinates"
              className="w-full rounded-none border-b border-[#222630] bg-transparent py-3 text-sm text-[#f3f4f6] placeholder-[#4b5363] outline-none transition-colors focus:border-[#3ecfb2]"
            />
            <p id="start-hint" className="sr-only">Enter where you are starting from. You can type an address, city, or use the button above to fill in your current coordinates.</p>
          </div>

          <div>
            <label htmlFor="destination-input" className="mb-2.5 block text-xs font-bold tracking-widest text-[#4b5363] uppercase">
              Destination
            </label>
            <input
              id="destination-input"
              aria-describedby="destination-hint"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Where do you want to go?"
              className="w-full rounded-none border-b border-[#222630] bg-transparent py-3 text-sm text-[#f3f4f6] placeholder-[#4b5363] outline-none transition-colors focus:border-[#3ecfb2]"
            />
            <p id="destination-hint" className="sr-only">Enter where you want to go. Type an address, landmark, or place name.</p>
          </div>
        </section>

        {/* Date / Time */}
        <section aria-labelledby="datetime-heading" className="pt-2">
          <h2
            id="datetime-heading"
            tabIndex={0}
            className="mb-4 text-xs font-bold tracking-widest text-[#4b5363] uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3ecfb2] rounded"
          >
            Departure Time
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="trip-date" className="mb-2.5 block text-xs font-bold tracking-widest text-[#4b5363] uppercase">
                Date
              </label>
              <input
                id="trip-date"
                type="text"
                inputMode="numeric"
                value={tripDate}
                onChange={(e) => setTripDate(e.target.value)}
                placeholder="MM/DD/YYYY"
                aria-label="Departure date, optional. Enter in MM/DD/YYYY format."
                className="w-full rounded-none border-b border-[#222630] bg-transparent py-2 text-sm text-[#f3f4f6] placeholder-[#4b5363] outline-none transition-colors focus:border-[#3ecfb2]"
              />
            </div>
            <div>
              <label htmlFor="trip-time" className="mb-2.5 block text-xs font-bold tracking-widest text-[#4b5363] uppercase">
                Time
              </label>
              <input
                id="trip-time"
                type="text"
                inputMode="numeric"
                value={tripTime}
                onChange={(e) => setTripTime(e.target.value)}
                placeholder="HH:MM AM/PM"
                aria-label="Departure time, optional. Enter in HH:MM AM or PM format."
                className="w-full rounded-none border-b border-[#222630] bg-transparent py-2 text-sm text-[#f3f4f6] placeholder-[#4b5363] outline-none transition-colors focus:border-[#3ecfb2]"
              />
            </div>
          </div>
        </section>

        {/* Transit Selection */}
        <section aria-labelledby="transit-heading" className="pt-2">
          <h2
            id="transit-heading"
            tabIndex={0}
            className="mb-4 text-xs font-bold tracking-widest text-[#4b5363] uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3ecfb2] rounded"
          >
            Preferred Transit
          </h2>
          <p className="sr-only">Choose which transit types to include in your route. At least one must be selected.</p>
          <div className="flex flex-col border border-[#222630] bg-[#13151a]/30">

            <button
              onClick={() => toggleTransitType("bus")}
              aria-pressed={transitTypes.bus}
              aria-label={`OC Bus, ${transitTypes.bus ? "on" : "off"}. Include local and express bus networks.`}
              className={`w-full text-left p-5 transition-all flex items-center justify-between border-b border-[#222630] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3ecfb2] ${
                transitTypes.bus ? "bg-[#1c1f26]/60" : "hover:bg-[#1c1f26]/30 opacity-60"
              }`}
            >
              <div className="flex items-center gap-4">
                <div aria-hidden="true" className="w-1 h-5 transition-all" style={{ backgroundColor: transitTypes.bus ? "#3ecfb2" : "#4b5363" }} />
                <div>
                  <div className="text-sm font-semibold text-white">OC Bus</div>
                  <div id="bus-desc" className="text-xs text-[#848d9a] mt-0.5">Include local and express bus networks</div>
                </div>
              </div>
              <div aria-hidden="true" className={`w-4 h-4 border flex items-center justify-center text-[10px] ${transitTypes.bus ? "border-[#3ecfb2] text-[#3ecfb2]" : "border-[#4b5363]"}`}>
                {transitTypes.bus && "✓"}
              </div>
            </button>

            <button
              onClick={() => toggleTransitType("train")}
              aria-pressed={transitTypes.train}
              aria-label={`Metrolink, ${transitTypes.train ? "on" : "off"}. Include regional commuter rail lines.`}
              className={`w-full text-left p-5 transition-all flex items-center justify-between focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3ecfb2] ${
                transitTypes.train ? "bg-[#1c1f26]/60" : "hover:bg-[#1c1f26]/30 opacity-60"
              }`}
            >
              <div className="flex items-center gap-4">
                <div aria-hidden="true" className="w-1 h-5 transition-all" style={{ backgroundColor: transitTypes.train ? "#3b82f6" : "#4b5363" }} />
                <div>
                  <div className="text-sm font-semibold text-white">Metrolink</div>
                  <div id="train-desc" className="text-xs text-[#848d9a] mt-0.5">Include regional commuter rail lines</div>
                </div>
              </div>
              <div aria-hidden="true" className={`w-4 h-4 border flex items-center justify-center text-[10px] ${transitTypes.train ? "border-[#3b82f6] text-[#3b82f6]" : "border-[#4b5363]"}`}>
                {transitTypes.train && "✓"}
              </div>
            </button>

          </div>
        </section>
      </div>

      {/* Error */}
      {formError && (
        <div role="alert" className="mt-8 rounded-none border border-red-500/30 bg-red-950/10 p-4 text-xs tracking-wide uppercase font-semibold text-red-400 flex items-center gap-2">
          <span aria-hidden="true">✕</span> {formError}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handlePlanTrip}
        className="mt-12 w-full rounded-xl bg-[#3ecfb2] hover:bg-[#34b399] py-4 text-sm font-bold uppercase tracking-wider text-[#0b0c0e] transition-colors active:scale-[0.99] flex items-center justify-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3ecfb2] focus-visible:outline-offset-2"
      >
        Find Routes <span aria-hidden="true">→</span>
      </button>

      <style>{`
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0,0,0,0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
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