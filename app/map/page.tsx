"use client";

import dynamic from "next/dynamic";

const LiveMap = dynamic(() => import("./LiveMap"), {
  ssr: false,
});

export default function MapPage() {
  return (
    <main className="w-screen h-screen pt-16 overflow-hidden">
      <LiveMap />
    </main>
  );
}