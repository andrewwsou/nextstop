"use client";

import dynamic from "next/dynamic";

const LiveMap = dynamic(() => import("./LiveMap"), {
  ssr: false,
});

export default function MapPage() {
  return (
    <main className="fixed left-0 right-0 bottom-0 top-16">
      {/* read page heading on load */}
      <h1 tabIndex={0} style={{
        position: "absolute",
        width: 1, height: 1,
        overflow: "hidden",
        clip: "rect(0,0,0,0)",
        whiteSpace: "nowrap",
        margin: -1, padding: 0, border: 0,
      }}>
        Live Map
      </h1>
      <LiveMap />
    </main>
  );
}
