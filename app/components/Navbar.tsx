"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/dashboard", label: "Home" },
  { href: "/map", label: "Live Map" },
  { href: "/trip", label: "Trip Planner" },
  { href: "/history", label: "Trip History" },
  { href: "/profile", label: "Profile" },
];

const styles = {
  nav: {
    position: "fixed" as const,
    top: 0, left: 0, right: 0,
    zIndex: 100,
    height: 60,
    padding: "0 1.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "rgba(10,18,16,0.85)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid #1a2e28",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    textDecoration: "none",
  },
  logoText: {
    fontSize: "1.1rem",
    fontWeight: 800,
    color: "white",
    letterSpacing: "-0.02em",
  },
  logoSub: {
    fontSize: "0.65rem",
    fontWeight: 600,
    color: "#3ecfb2",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
  },
  desktopLinks: {
    display: "flex",
    gap: "0.25rem",
  },
  hamburger: {
    display: "none",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 8,
    flexDirection: "column" as const,
    gap: 5,
  },
  mobileMenu: {
    position: "fixed" as const,
    top: 60,
    left: 0, right: 0,
    zIndex: 99,
    display: "none",
    flexDirection: "column" as const,
    background: "rgba(10,18,16,0.97)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid #1a2e28",
  },
};

function navLink(active: boolean) {
  return {
    padding: "6px 14px",
    borderRadius: 8,
    fontSize: "0.85rem",
    fontWeight: 500,
    textDecoration: "none",
    color: active ? "#3ecfb2" : "#888",
    background: active ? "rgba(62,207,178,0.08)" : "transparent",
    transition: "all 0.15s ease",
  };
}

function mobileLink(active: boolean) {
  return {
    padding: "12px 16px",
    borderRadius: 8,
    fontSize: "0.95rem",
    fontWeight: 500,
    textDecoration: "none",
    color: active ? "#3ecfb2" : "#aaa",
    background: active ? "rgba(62,207,178,0.08)" : "transparent",
    borderBottom: "1px solid #1a2e28",
  };
}

function Bar({ open, rotate, hide }: { open: boolean, rotate?: string, hide?: boolean }) {
  return (
    <span style={{
      display: "block",
      width: 22, height: 2,
      background: open ? "#3ecfb2" : "white",
      transition: "all 0.2s ease",
      opacity: hide && open ? 0 : 1,
      transform: rotate && open ? rotate : "none",
    }} />
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const authPages = ["/onboarding", "/login", "/signup"];
  if (authPages.some(p => pathname.startsWith(p))) return null;

  return (
    <>
      {/* role="navigation" + aria-label distinguishes this from any other nav on the page */}
      <nav role="navigation" aria-label="Main navigation" style={styles.nav}>

        {/* Logo — "NextStop" is enough, hide the redundant subtitle */}
        <Link href="/dashboard" style={styles.logo} aria-label="NextStop, go to dashboard">
          <span style={styles.logoText} aria-hidden="true">NextStop</span>
          <span style={styles.logoSub} aria-hidden="true">UCI + OC Transit</span>
          <Image src="/transitlogo.png" 
            alt="Powered by Transit"
            width={19}
            height={4}
            style={{ objectFit: "contain" }}
          />
        </Link>

        {/* Desktop links — aria-current tells screen readers which page is active */}
        <div className="nav-desktop-links" style={styles.desktopLinks}>
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              style={navLink(pathname === l.href)}
              aria-current={pathname === l.href ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Hamburger — aria-expanded tells screen readers whether the menu is open */}
        <button
          className="nav-hamburger"
          style={styles.hamburger}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          <Bar open={menuOpen} rotate="rotate(45deg) translate(5px, 5px)" />
          <Bar open={menuOpen} hide />
          <Bar open={menuOpen} rotate="rotate(-45deg) translate(5px, -5px)" />
        </button>
      </nav>

      {/* Mobile menu — id matches aria-controls above */}
      <div
        id="mobile-menu"
        className="nav-mobile-menu"
        aria-hidden={!menuOpen}
        style={{
          ...styles.mobileMenu,
          maxHeight: menuOpen ? 400 : 0,
          overflow: "hidden",
          transition: "max-height 0.3s ease",
        }}
      >
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            style={mobileLink(pathname === l.href)}
            aria-current={pathname === l.href ? "page" : undefined}
            onClick={() => setMenuOpen(false)}
            tabIndex={menuOpen ? 0 : -1}
          >
            {l.label}
          </Link>
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .nav-desktop-links { display: none !important; }
          .nav-hamburger { display: flex !important; }
          .nav-mobile-menu { display: flex !important; }
        }
        a:focus-visible {
          outline: 2px solid #3ecfb2;
          outline-offset: 2px;
          border-radius: 6px;
        }
        button:focus-visible {
          outline: 2px solid #3ecfb2;
          outline-offset: 2px;
          border-radius: 6px;
        }
      `}</style>
    </>
  );
}