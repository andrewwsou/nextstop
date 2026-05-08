"use client";

import Link from "next/link";
import { type CSSProperties } from "react";

const NAVBAR_HEIGHT = 60;

export default function Dashboard() {
  return (
    <main style={styles.page}>
      <div style={styles.mapPlaceholder}>
        <p style={styles.mapText}>Live Map Here</p>
      </div>

      <div style={styles.searchStack}>
        <label style={styles.searchBar}>
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
      </section>
    </main>
  );
}

const styles = {
  page: {
    position: "relative",
    display: "block",
    minHeight: "100vh",
    overflow: "hidden",
    background: "#0f1115",
    color: "#f8fafc",
    padding: `${NAVBAR_HEIGHT + 22}px 28px 28px`,
  },

  mapPlaceholder: {
    position: "absolute",
    inset: `${NAVBAR_HEIGHT}px 0 0`,
    display: "flex",
    alignItems: "center",
    justifyContent: "right",
    background: "#151922",
    border: "2px dashed #374151",
  },

  mapText: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: "#6b7280",
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
    borderRadius: 999,
    background: "#f8fafc",
    color: "#111827",
    boxShadow: "0 5px 18px rgba(0,0,0,0.34)",
  },

  searchIcon: {
    flex: "0 0 auto",
    fontSize: 25,
    color: "#64748b",
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    height: 54,
    border: 0,
    outline: 0,
    background: "transparent",
    color: "#111827",
    fontSize: 17,
    fontFamily: "inherit",
  },

  searchAction: {
    flex: "0 0 auto",
    borderRadius: 999,
    padding: "10px 16px",
    background: "#00bfa5",
    color: "#06251f",
    fontSize: 14,
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
    background: "rgba(24,28,37,0.94)",
    boxShadow: "0 12px 34px rgba(0,0,0,0.35)",
  },

  panelIntro: {
    maxWidth: 420,
  },

  breadcrumb: { margin: 0, color: "#9ca3af", fontSize: 14 },

  title: {
    margin: "14px 0 18px",
    fontSize: 32,
    lineHeight: 1.08,
  },

  alert: {
    maxWidth: 500,
    padding: 15,
    borderRadius: 18,
    background: "rgba(0,191,165,0.14)",
    border: "1px solid rgba(0,191,165,0.45)",
    color: "#99f6e4",
  },

  alertText: {
    margin: "6px 0",
    color: "#d1fae5",
  },

  alertLink: {
    color: "#5eead4",
    fontWeight: 700,
    textDecoration: "none",
  },
} satisfies Record<string, CSSProperties>;