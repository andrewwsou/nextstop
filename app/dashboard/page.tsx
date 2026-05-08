"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";

const NAVBAR_HEIGHT = 60;

const scheduledTrips = [
  { from: "Home", to: "UCI Student Center", time: "8:00 AM", lines: ["OC 79"] },
  { from: "UCI Student Center", to: "Irvine Station", time: "12:30 PM", lines: ["OC 79", "Metrolink"] },
  { from: "Irvine Station", to: "Home", time: "5:15 PM", lines: ["Metrolink", "OC 59"] },
];

const recentTrips = [
  { from: "Home", to: "UCI Student Center", time: "Yesterday" },
  { from: "UCI Student Center", to: "Irvine Station", time: "Mon" },
  { from: "Irvine Station", to: "Home", time: "Last week" },
];

export default function Dashboard() {
  const [showRecent, setShowRecent] = useState(false);

  return (
    <main style={styles.page}>
      <div style={styles.mapPlaceholder}>
        <p style={styles.mapText}>Live Map Here</p>
      </div>

      <div
        style={styles.searchStack}
        onFocus={() => setShowRecent(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setShowRecent(false);
          }
        }}
      >
        <label
          style={{
            ...styles.searchBar,
            borderRadius: showRecent ? "24px 24px 0 0" : 999,
          }}
        >
          <span style={styles.searchIcon}>⌕</span>
          <input
            aria-label="Plan a trip"
            placeholder="Search NextStop"
            style={styles.searchInput}
          />
          <Link href="/trip" style={styles.searchAction}>
            Plan
          </Link>
        </label>

        {showRecent && (
          <section style={styles.recentTray} aria-label="Recent trip searches">
            {recentTrips.map((trip) => (
              <Link
                key={`${trip.to}-${trip.time}`}
                href="/trip"
                style={styles.recentSearchItem}
              >
                <span style={styles.recentIcon}>
                  <span style={styles.clockFace}>
                    <span style={styles.clockHour} />
                    <span style={styles.clockMinute} />
                  </span>
                </span>

                <span>
                  <strong style={styles.recentDestination}>
                    {trip.from} → {trip.to}
                  </strong>
                  <span style={styles.recentMeta}>{trip.time}</span>
                </span>
              </Link>
            ))}

            <Link href="/history" style={styles.moreHistory}>
              More from recent history
            </Link>
          </section>
        )}
      </div>

      <section style={styles.panel}>
        <div style={styles.panelIntro}>
          <p style={styles.breadcrumb}>Home Dashboard</p>
          <h1 style={styles.title}>Welcome, User</h1>
        </div>

        <div style={styles.alert}>
          <strong>Live alert</strong>
          <p style={styles.alertText}>Your 8:00 AM bus departs in 20 minutes.</p>
          <Link href="/trip" style={styles.alertLink}>
            View details →
          </Link>
        </div>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Today</h2>
            <Link href="/trip" style={styles.linkButton}>
              Schedule more →
            </Link>
          </div>

          <div style={styles.todayScroller} aria-label="Today's scheduled trips">
            {scheduledTrips.map((trip) => (
              <TripCard key={`${trip.from}-${trip.time}`} {...trip} />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function TripCard({
  from,
  to,
  time,
  lines,
}: {
  from: string;
  to: string;
  time: string;
  lines: string[];
}) {
  return (
    <Link href="/trip" style={styles.tripCard}>
      <strong style={styles.tripTime}>{time}</strong>

      <p style={styles.tripRoute}>
        <span>{from}</span>
        <br />→ <span>{to}</span>
      </p>

      <div style={styles.lineRow}>
        {lines.map((line) => (
          <span key={line} style={styles.linePill}>
            {line}
          </span>
        ))}
      </div>
    </Link>
  );
}

const styles = {
  page: {
    position: "relative",
    display: "block",
    minHeight: "100vh",
    overflow: "hidden",
    background: "#0d1210",
    color: "#ffffff",
    padding: `${NAVBAR_HEIGHT + 22}px 28px 28px`,
  },

  mapPlaceholder: {
    position: "absolute",
    inset: `${NAVBAR_HEIGHT}px 0 0`,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    background: "#07100d",
  },

  mapText: {
    margin: 0,
    paddingRight: 48,
    fontSize: 28,
    fontWeight: 700,
    color: "#2a4a3e",
  },

  searchStack: {
    position: "relative",
    zIndex: 4,
    width: "min(760px, calc(50vw - 40px), calc(100vw - 56px))",
  },

  searchBar: {
    minHeight: 56,
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "0 10px 0 20px",
    background: "#16241f",
    color: "#ffffff",
    border: "1px solid #1a2e28",
    boxShadow: "0 5px 18px rgba(0,0,0,0.34)",
  },

  searchIcon: {
    flex: "0 0 auto",
    fontSize: 25,
    color: "#3ecfb2",
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    height: 54,
    border: 0,
    outline: 0,
    background: "transparent",
    color: "#ffffff",
    fontSize: 17,
    fontFamily: "inherit",
  },

  searchAction: {
    flex: "0 0 auto",
    borderRadius: 999,
    padding: "10px 16px",
    background: "#3ecfb2",
    color: "#0d1210",
    fontSize: 14,
    fontWeight: 800,
    textDecoration: "none",
  },

  recentTray: {
    position: "absolute",
    top: 56,
    left: 0,
    width: "100%",
    padding: "8px 0 18px",
    borderTop: "1px solid #1a2e28",
    borderRadius: "0 0 24px 24px",
    background: "#111a17",
    color: "#ffffff",
    boxShadow: "0 14px 28px rgba(0,0,0,0.28)",
  },

  recentSearchItem: {
    display: "grid",
    gridTemplateColumns: "64px 1fr",
    gap: 8,
    alignItems: "center",
    minHeight: 76,
    padding: "8px 28px",
    color: "inherit",
    textDecoration: "none",
  },

  recentIcon: {
    width: 42,
    height: 42,
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#1a2e28",
    color: "#3ecfb2",
  },

  clockFace: {
    position: "relative",
    width: 22,
    height: 22,
    borderRadius: "50%",
    border: "2px solid currentColor",
  },

  clockHour: {
    position: "absolute",
    width: 2,
    height: 7,
    left: "50%",
    top: "50%",
    background: "currentColor",
    borderRadius: 999,
    transform: "translate(-50%, -100%)",
    transformOrigin: "bottom center",
  },

  clockMinute: {
    position: "absolute",
    width: 8,
    height: 2,
    left: "50%",
    top: "50%",
    background: "currentColor",
    borderRadius: 999,
    transform: "translateY(-50%)",
    transformOrigin: "left center",
  },

  recentDestination: {
    display: "block",
    fontSize: 19,
    lineHeight: 1.25,
    color: "#ffffff",
  },

  recentMeta: {
    display: "block",
    marginTop: 4,
    color: "#6b8f82",
    fontSize: 16,
    lineHeight: 1.25,
  },

  moreHistory: {
    display: "block",
    padding: "16px 28px 4px 100px",
    color: "#3ecfb2",
    fontSize: 18,
    fontWeight: 800,
    textDecoration: "none",
  },

  panel: {
    position: "relative",
    zIndex: 2,
    width: "min(760px, calc(50vw - 40px), calc(100vw - 56px))",
    marginTop: 18,
    padding: 24,
    borderRadius: 24,
    background: "#111a17",
    border: "1px solid #1a2e28",
    boxShadow: "0 12px 34px rgba(0,0,0,0.35)",
  },

  panelIntro: {
    maxWidth: 420,
  },

  breadcrumb: { margin: 0, color: "#6b8f82", fontSize: 14 },

  title: {
    margin: "14px 0 18px",
    fontSize: 32,
    lineHeight: 1.08,
  },

  alert: {
    maxWidth: 500,
    padding: 15,
    borderRadius: 18,
    background: "#1a2e28",
    border: "1px solid #2a4a3e",
    color: "#3ecfb2",
  },

  alertText: {
    margin: "6px 0",
    color: "#d8fff6",
  },

  alertLink: {
    color: "#3ecfb2",
    fontWeight: 700,
    textDecoration: "none",
  },

  section: {
    marginTop: 22,
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 12,
  },

  sectionTitle: {
    margin: 0,
    fontSize: 20,
  },

  linkButton: {
    color: "#3ecfb2",
    fontWeight: 700,
    textDecoration: "none",
    fontSize: 14,
  },

  todayScroller: {
    display: "grid",
    gridAutoFlow: "column",
    gridAutoColumns: "minmax(220px, 1fr)",
    gap: 12,
    overflowX: "auto",
    paddingBottom: 4,
  },

  tripCard: {
    minHeight: 150,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: 14,
    padding: 16,
    borderRadius: 18,
    background: "#0d1210",
    border: "1px solid #1a2e28",
    color: "inherit",
    textDecoration: "none",
  },

  tripTime: {
    whiteSpace: "nowrap",
    fontSize: 22,
    color: "#ffffff",
  },

  tripRoute: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.35,
    color: "#d8fff6",
  },

  lineRow: {
    display: "flex",
    gap: 7,
    flexWrap: "wrap",
  },

  linePill: {
    padding: "4px 9px",
    borderRadius: 999,
    background: "#1a2e28",
    color: "#3ecfb2",
    fontSize: 11,
    fontWeight: 700,
  },
} satisfies Record<string, CSSProperties>;