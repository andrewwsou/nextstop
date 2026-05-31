"use client";

import dynamic from "next/dynamic";

const LiveMap = dynamic(() => import("./LiveMap"), {
  ssr: false,
});

export default function MapPage() {
  return (
    <main className="w-screen h-[calc(100vh-64px)] overflow-hidden">
      <LiveMap />
    </main>
  );
}