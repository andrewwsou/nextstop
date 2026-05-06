"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Home" },
  { href: "/map", label: "Live Map" },
  { href: "/trip", label: "Trip Planner" },
  { href: "/history", label: "Trip History" },
  { href: "/profile", label: "Profile" },
];

export default function Navbar() {
  const pathname = usePathname();
  const authPages = ["/onboarding", "/login", "/signup"];
  if (authPages.some(p => pathname.startsWith(p))) return null;
  return (
    <nav style={{
      position: "fixed",
      top: 0, left: 0, right: 0,
      zIndex: 100,
      background: "rgba(10,18,16,0.85)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid #1a2e28",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 2.5rem",
      height: 60,
    }}>
      <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>
          NextStop
        </span>
        <span style={{ fontSize: "0.65rem", color: "#3ecfb2", fontWeight: 600,
          letterSpacing: "0.08em", textTransform: "uppercase" }}>
          UCI + OC Transit
        </span>
      </Link>

      <div style={{ display: "flex", gap: "0.25rem" }}>
        {links.map(l => (
          <Link key={l.href} href={l.href} style={{
            padding: "6px 14px",
            borderRadius: 8,
            fontSize: "0.85rem",
            fontWeight: 500,
            textDecoration: "none",
            color: pathname === l.href ? "#3ecfb2" : "#888",
            background: pathname === l.href ? "rgba(62,207,178,0.08)" : "transparent",
            transition: "all 0.15s ease",
          }}>
            {l.label}
          </Link>
        ))}
      </div>

      <Link href="/profile" style={{
        width: 34, height: 34, borderRadius: "50%",
        background: "#1a2e28", border: "1px solid #2a4a3e",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.8rem", fontWeight: 700, color: "#3ecfb2",
        textDecoration: "none",
      }}>
        U
      </Link>
    </nav>
  );
}