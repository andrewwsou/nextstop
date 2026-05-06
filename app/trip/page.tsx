"use client";
import { useRouter } from "next/navigation";

export default function Trip() {
  const router = useRouter();

  return (
    <main style={{ padding: "2rem", marginTop: 60 }}>
      <h1>Trip Planner</h1>

      <button onClick={() => router.push("/trip/results")}>
        Plan Trip → Results
      </button>
    </main>
  );
}