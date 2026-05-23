"use client";
import { useRouter } from "next/navigation";
import { useRequireAuth, getUser, logout } from "../lib/auth";

const sections = [
  { label: "Account", items: ["Edit name", "Change email", "Change password"] },
  { label: "Preferences", items: ["Default transit modes", "Notification settings", "Home & work locations"] },
  { label: "App", items: ["About NextStop", "Privacy policy", "Sign out"] },
];

export default function Profile() {
  const router = useRouter();
  useRequireAuth();
  const user = getUser();

  return (
    <main style={{
      minHeight: "100vh",
      padding: "80px 5rem 2.5rem",
      background: "#0d1210",
      color: "white",
    }}>

      {/* Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: "3rem" }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "#1a2e28", border: "1px solid #2a4a3e",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.6rem", fontWeight: 700, color: "#3ecfb2",
        }}>
          {user?.first_name?.[0] ?? "U"}
        </div>
        <div>
          <p style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>
            {user?.first_name} {user?.last_name}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#555" }}>
            {user?.email}
          </p>
        </div>
      </div>

      {/* Settings grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 24,
        alignItems: "start",
      }}>
        {sections.map(s => (
          <div key={s.label}>
            <p style={{
              margin: "0 0 10px",
              fontSize: "0.72rem", color: "#444",
              textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700,
            }}>
              {s.label}
            </p>
            <div style={{
              background: "#111a17", border: "1px solid #1a2e28",
              borderRadius: 14, overflow: "hidden",
            }}>
              {s.items.map((item, i) => (
                <div
                  key={item}
                  onClick={() => item === "Sign out" && logout(router)}
                  style={{
                    padding: "16px 20px",
                    borderBottom: i < s.items.length - 1 ? "1px solid #1a2e28" : "none",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    cursor: "pointer", fontSize: "0.9rem",
                    color: item === "Sign out" ? "#ef4444" : "white",
                  }}
                >
                  {item}
                  {item !== "Sign out" && <span style={{ color: "#333" }}>›</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}