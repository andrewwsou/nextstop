"use client";

import React from "react";

export default function OfflineDashboard() {
  const localSchedules = [
    {
      line: "OC Bus (OCTA)",
      status: "Static Fallback",
      note: "Key routes serving the UCI Campus / UTC Transit Center area.",
      times: ["Route 79 (Tustin - Newport Beach)", "Route 167 (Orange - Irvine)"]
    },
    {
      line: "Metrolink (Tustin Station)",
      status: "Static Fallback",
      note: "Connecting Irvine to LA Union Station and Oceanside.",
      times: ["Weekday Service: 5:00 AM - 9:30 PM", "Weekend Service: Limited Schedule"]
    }
  ];

  return (
    <div className="w-full min-h-screen bg-[#0b0c0e] text-[#f3f4f6] flex flex-col items-center">
      <div className="h-20 md:h-24 w-full shrink-0" />

      <main
        className="w-full px-5 md:px-20 py-8 max-w-5xl"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >

        {/* offline banner */}
        <div className="mb-8 p-4 rounded-xl border border-amber-500/20 bg-amber-950/10 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <div className="text-sm font-medium text-amber-300">
            <strong>Offline Mode Active:</strong> You are currently disconnected. Displaying cached emergency transit references.
          </div>
        </div>

        <div className="border-b border-[#222630] pb-6 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Transit Reference Hub
          </h1>
          <p className="text-sm text-[#848d9a] mt-1 font-medium">
            Essential schedules saved directly to your device memory.
          </p>
        </div>

        {/* Static info cards */}
        <div className="space-y-4">
          {localSchedules.map((sched, idx) => (
            <div key={idx} className="p-5 md:p-6 bg-[#13151a]/30 border border-[#222630] rounded-xl">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
                  {sched.line}
                </h2>
                <span className="self-start sm:self-auto text-[10px] md:text-xs font-bold border border-[#3ecfb2]/30 text-[#3ecfb2] bg-[rgba(62,207,178,0.06)] px-2.5 py-1 rounded-xl whitespace-nowrap">
                  {sched.status}
                </span>
              </div>
              <p className="text-xs md:text-sm text-[#848d9a] font-medium mb-4">
                {sched.note}
              </p>
              <div className="bg-[#0b0c0e] border border-[#222630] rounded-xl p-4 space-y-2">
                {sched.times.map((time, tIdx) => (
                  <div key={tIdx} className="text-xs font-semibold text-[#f3f4f6] flex items-center gap-2">
                    <span className="text-[#4b5363]">•</span> {time}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* for reconnect */}
        <p className="text-center text-xs font-medium text-[#4b5363] mt-12 px-4">
          Live maps, dynamic trip planning, and database updates will resume automatically once a network link is established.
        </p>

      </main>
    </div>
  );
}