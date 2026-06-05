"use client";

import dynamic from "next/dynamic";

const LiveMap = dynamic(() => import("./LiveMap"), {
  ssr: false,
});

export default function MapPage() {
  return (
    <main className="fixed left-0 right-0 bottom-0 top-16">
      {/* read page heading on load */}
      <h1 >
        Live Map
      </h1>
      <LiveMap />
    </main>
  );
}
