"use client";

import { type CSSProperties } from "react";

const NAVBAR_HEIGHT = 60;

export default function Dashboard() {
  return (
    <main style={styles.page}>
      <div style={styles.mapPlaceholder}>
        <p style={styles.mapText}>Live Map Here in background</p>
      </div>

      <section style={styles.panel}>
        <p style={styles.breadcrumb}>Home</p>
        <h1 style={styles.title}>Welcome, User</h1>
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

  breadcrumb: { margin: 0, color: "#9ca3af", fontSize: 14 },

  title: {
    margin: "14px 0 0",
    fontSize: 32,
    lineHeight: 1.08,
  },
} satisfies Record<string, CSSProperties>;