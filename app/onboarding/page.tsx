"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import AuthButton from "../components/AuthButton";

// this is the hardcoded stops for the map overlap....
const STOPS = [
  { id: "ALP", x: 48, y: 44 },
  { id: "MES", x: 24, y: 28 },
  { id: "SCH", x: 62, y: 30 },
  { id: "STU", x: 70, y: 52 },
  { id: "ARC", x: 55, y: 68 },
  { id: "UNI", x: 30, y: 65 },
  { id: "CRY", x: 82, y: 35 },
  { id: "RAD", x: 18, y: 50 },
];

const ROUTES = [
  { stops: ["MES","ALP","STU","ARC"], color: "#3ecfb2", width: 2.5 },
  { stops: ["SCH","STU","CRY"],       color: "#60a5fa", width: 2, dash: "5 3" },
  { stops: ["RAD","UNI","ARC"],       color: "#a78bfa", width: 2, dash: "4 4" },
];

const INITIAL_VEHICLES = [
  { route: 0, t: 0.1, dir: 1 },
  { route: 0, t: 0.6, dir: 1 },
  { route: 1, t: 0.3, dir: 1 },
  { route: 2, t: 0.7, dir: -1 },
];

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function getPos(routeIdx: number, t: number) {
  const route = ROUTES[routeIdx];
  const pts = route.stops.map(id => STOPS.find(s => s.id === id)!);
  const segments = pts.length - 1;
  const seg = Math.min(Math.floor(t * segments), segments - 1);
  const localT = t * segments - seg;
  return { x: lerp(pts[seg].x, pts[seg+1].x, localT), y: lerp(pts[seg].y, pts[seg+1].y, localT) };
}

function routePath(ri: number) {
  const pts = ROUTES[ri].stops.map(id => STOPS.find(s => s.id === id)!);
  return pts.map((s, i) => `${i === 0 ? "M" : "L"} ${s.x} ${s.y}`).join(" ");
}

// actual content
export default function Onboarding() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState(INITIAL_VEHICLES);
  const [drawn, setDrawn] = useState(0); //fade effect
  const animRef = useRef<number>();
  const lastRef = useRef<number>();

  useEffect(() => {
    const tick = (ts: number) => {
      if (!lastRef.current) lastRef.current = ts;
      const dt = (ts - lastRef.current) / 1000;
      lastRef.current = ts;
      setDrawn(d => Math.min(d + dt * 0.5, 1));
      setVehicles(vs => vs.map(v => {
        let t = v.t + v.dir * dt * 0.06;
        let dir = v.dir;
        if (t >= 1) { t = 1; dir = -1; }
        if (t <= 0) { t = 0; dir =  1; }
        return { ...v, t, dir };
      }));
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current!);
  }, []);

  return (
    <main
      className="bg-grid"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "3rem 6rem",
        position: "relative",
        overflow: "hidden",
        gap: "3rem",
      }}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
          pointerEvents: "none", opacity: 0.25 }}
      >
        {ROUTES.map((r, ri) => (
          <path key={ri} d={routePath(ri)} stroke={r.color}
            strokeWidth={r.width * 0.35} fill="none"
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={r.dash ?? undefined}
            opacity={drawn}
          />
        ))}
        {STOPS.map(s => (
          <circle key={s.id} cx={s.x} cy={s.y} r="0.7"
            fill="#3ecfb2" opacity={drawn * 0.6} />
        ))}
        {vehicles.map((v, i) => {
          const pos = getPos(v.route, v.t);
          return (
            <g key={i}>
              <circle cx={pos.x} cy={pos.y} r="1.6" fill={ROUTES[v.route].color} opacity="0.85"/>
              <circle cx={pos.x} cy={pos.y} r="0.8" fill="#0d1a18"/>
            </g>
          );
        })}
      </svg>

      <div style={{ zIndex: 1, maxWidth: 500, display: "flex", flexDirection: "column", flex: 1 }}>

        {/* logo stuff (look over we can edit)*/}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: "2.5rem" }}>
          <Image src="/logo2.png" alt="NextStop" width={200} height={150}
            style={{ borderRadius: 14, objectFit: "contain" }} />
          <div>
            <p style={{ margin: 0, fontSize: "2.7rem", fontWeight: 800,
              letterSpacing: "-0.02em", lineHeight: 1 }}>
              NextStop
            </p>
            <p style={{ margin: "5px 0 0", fontSize: "0.75rem", color: "#3ecfb2",
              letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>
              UCI + OC Transit
            </p>
          </div>
        </div>

        {/* main header */}
        <h1 style={{
          fontSize: "clamp(2.6rem, 4.5vw, 3.8rem)",
          fontWeight: 800,
          lineHeight: 1.1,
          margin: "0 0 1.25rem",
          letterSpacing: "-0.03em",
        }}>
          Plan your commute.<br />
          <span style={{ color: "#3ecfb2" }}>Beat the delay.</span>
        </h1>

        <p style={{ color: "#fff", margin: "0 0 0.75rem", fontSize: "1.15rem", lineHeight: 1.65 }}>
          Buses, trains & UCI shuttles —<br />unified in one live map.
        </p>

        <p style={{ color: "#fff", margin: "0 0 2.5rem", fontSize: "0.95rem",
          fontWeight: 600, letterSpacing: "0.04em" }}>
          ● Live in Irvine &nbsp;·&nbsp; Free to use &nbsp;·&nbsp; Built for UCI
        </p>

        <div style={{ maxWidth: 400 }}>
          <AuthButton text="Create Account →" onClick={() => router.push("/signup")} />
          <div style={{ marginTop: 10 }}>
            <AuthButton text="Sign In" variant="secondary" onClick={() => router.push("/login")} />
          </div>
        </div>
      </div>

      <style>{`
        .primary-btn {
          transition: transform 0.2s ease, box-shadow 0.2s ease !important;
        }
        .primary-btn:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 0 24px rgba(62,207,178,0.3) !important;
        }
        .secondary-btn {
          transition: transform 0.2s ease !important;
        }
        .secondary-btn:hover {
          transform: translateY(-1px) !important;
        }
      `}</style>
    </main>
  );
}