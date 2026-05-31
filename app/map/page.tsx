"use client";

import dynamic from "next/dynamic";

const LiveMap = dynamic(() => import("./LiveMap"), {
  ssr: false,
});

export default function MapPage() {
  return (
    <main className="fixed left-0 right-0 bottom-0 top-16">
      <LiveMap />
    </main>
  );
}