"use client";

import dynamic from "next/dynamic";

const LiveMap = dynamic(() => import("./LiveMap"), {
  ssr: false,
});

export default function MapPage() {
  return (
    <main className="mt-16 h-[calc(100vh-4rem)] w-screen overflow-hidden">
      <LiveMap />
    </main>
  );
}