"use client";
import { useState } from "react";
import { trips } from "./mockdata";
import type { Leg, Trip } from "./mockdata";

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "numeric", day: "numeric", year: "2-digit",
  });
}

function getGroup(dateStr: string): "this-week" | "this-month" | "last-6-months" | null {
  const now = new Date();
  const date = new Date(dateStr + "T00:00:00");

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const start6Months = new Date(now);
  start6Months.setMonth(now.getMonth() - 6);

  if (date >= startOfWeek) return "this-week";
  if (date >= startOfMonth) return "this-month";
  if (date >= start6Months) return "last-6-months";
  return null;
}

const GROUP_LABELS: Record<string, string> = {
  "this-week": "This week",
  "this-month": "This month",
  "last-6-months": "Last 6 months",
};

const GROUP_ORDER = ["this-week", "this-month", "last-6-months"];

function RouteVisualizer({ legs }: { legs: Leg[] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginTop: "0.75rem", width: "100%" }}>
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#3ecfb2", flexShrink: 0 }} />
      {legs.map((leg, i) => {
        if (leg.type === "walk") {
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div style={{ flex: 1, height: 2, background: "#1a2e28" }} />
              <span style={{ fontSize: 14 }}>🚶</span>
              <div style={{ flex: 1, height: 2, background: "#1a2e28" }} />
            </div>
          );
        } else {
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: 2 }}>
              <div style={{ flex: 1, height: 2, background: "#3ecfb2" }} />
              <span style={{ background: "#1a2e28", color: "#3ecfb2", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0 }}>
                {leg.route}
              </span>
              <div style={{ flex: 1, height: 2, background: "#3ecfb2" }} />
            </div>
          );
        }
      })}
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#555", flexShrink: 0 }} />
    </div>
  );
}

export default function History() {
  const [expanded, setExpanded] = useState<number | null>(null);

  const grouped: Record<string, Trip[]> = { "this-week": [], "this-month": [], "last-6-months": [] };
  trips.forEach(t => {
    const g = getGroup(t.date);
    if (g) grouped[g].push(t);
  });

  return (
      <main style={{ padding: "2rem", width: "100%", maxWidth: 1000, marginTop: 60, marginLeft: "auto", marginRight: "auto" }}>    
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "white", marginBottom: "1.5rem" }}>
          Trip History
        </h1> 
      {GROUP_ORDER.map(group => {
        const groupTrips = grouped[group];
        if (!groupTrips.length) return null;

        return (
          
          <div key={group} style={{ marginBottom: "2rem" }}>
            <div style={{ marginBottom: "0.75rem" }}>
              <span style={{ fontSize: 13, color: "#888" }}>{GROUP_LABELS[group]}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {groupTrips.map(t => (
                <div
                  key={t.id}
                  style={{ background: "#0d1a16", border: "1px solid #1a2e28", borderRadius: 12, padding: "1.25rem 2rem", width: "100%" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, color: "white", fontWeight: 500 }}>{t.from}</div>
                      <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>→ {t.to}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "white", whiteSpace: "nowrap" }}>
                        {fmtDate(t.date)}
                      </div>
                      <button
                        onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                        style={{ fontSize: 11, color: "#3ecfb2", background: "none", border: "1px solid #1a2e28", borderRadius: 20, cursor: "pointer", padding: "2px 10px", whiteSpace: "nowrap" }}
                      >
                        {expanded === t.id ? "Hide details" : "See details"}
                      </button>
                    </div>
                  </div>

                  <RouteVisualizer legs={t.legs} />

                  {expanded === t.id && (
                    <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #1a2e28" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {t.legs.map((leg, i) =>
                          leg.type === "walk" ? (
                            <div key={i} style={{ fontSize: 13, color: "#888", display: "flex", gap: 8, alignItems: "center" }}>
                              <span>🚶</span> Walk · {leg.duration}
                            </div>
                          ) : (
                            <div key={i} style={{ fontSize: 13, color: "#aaa", display: "flex", gap: 8, alignItems: "center" }}>
                              <span style={{ background: "#1a2e28", color: "#3ecfb2", fontSize: 11, padding: "2px 8px", borderRadius: 20 }}>
                                {leg.route}
                              </span>
                              {leg.from} → {leg.to} · {leg.duration}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </main>
  );
}