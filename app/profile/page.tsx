"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth, getUser, logout } from "../lib/auth";
import { updateName, updateEmail, updatePassword } from "../lib/api";

type ModalType = "name" | "email" | "password" | "about";
type User = {
  first_name?: string;
  last_name?: string;
  email?: string;
};

const sections = [
  { label: "Account", items: ["Edit name", "Change email", "Change password"] },
  { label: "Preferences", items: ["Default transit modes", "Notification settings", "Home & work locations"] },
  { label: "App", items: ["About NextStop", "Privacy policy", "Sign out"] },
];

const aboutSections = [
  {
    title: "What NextStop does",
    body: "NextStop helps UCI and OC riders plan trips without bouncing between a bunch of tabs. You can look for routes, check transit options, and keep track of the trips you care about.",
  },
  {
    title: "Why it exists",
    body: "The goal is simple: make local transit feel less confusing. It is built for quick decisions, like figuring out how to get across campus, around Irvine, or somewhere nearby without guessing.",
  },
  {
    title: "Still being improved",
    body: "Some parts are intentionally lightweight right now while the core features come together. More settings, saved preferences, and smarter trip tools can be added from this profile area next.",
  },
];

export default function Profile() {
  const router = useRouter();
  useRequireAuth();

  const [user, setUser] = useState<User | null>(() => getUser());
  const [modal, setModal] = useState<ModalType | null>(null);
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function onRowClick(item: string) {
    if (item === "Sign out") {
      logout(router);
      return;
    }
    setError("");
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");

    if (item === "Edit name") {
      setFirstName(user?.first_name || "");
      setLastName(user?.last_name || "");
      setModal("name");
    }
    if (item === "Change email") {
      setEmail(user?.email || "");
      setModal("email");
    }
    if (item === "Change password") {
      setModal("password");
    }
    if (item === "About NextStop") {
      setModal("about");
    }
  }

  async function handleSave() {
    setError("");

    if (modal === "name") {
      if (!firstName) {
        setError("First name is required");
        return;
      }
      const res = await updateName({ first_name: firstName, last_name: lastName });
      if (res.error) {
        setError(res.error);
        return;
      }
      localStorage.setItem("user", JSON.stringify(res));
      setUser(res);
      setModal(null);
    }

    if (modal === "email") {
      if (!email || !password) {
        setError("Email and current password are required");
        return;
      }
      const res = await updateEmail({ email, password });
      if (res.error) {
        setError(res.error);
        return;
      }
      localStorage.setItem("user", JSON.stringify(res.user));
      localStorage.setItem("token", res.token);
      setUser(res.user);
      setModal(null);
    }

    if (modal === "password") {
      if (!password || !newPassword) {
        setError("Fill in all password fields");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("New passwords do not match");
        return;
      }
      const res = await updatePassword({
        current_password: password,
        new_password: newPassword,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      setModal(null);
    }
  }

  const isInfoModal = modal === "about";

  return (
    <main style={{
      minHeight: "100vh",
      padding: "80px 5rem 2.5rem",
      background: "#0d1210",
      color: "white",
    }}>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: "3rem" }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "#1a2e28", border: "1px solid #2a4a3e",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.6rem", fontWeight: 700, color: "#3ecfb2",
        }}>
          {user?.first_name?.[0] || "U"}
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
                  onClick={() => onRowClick(item)}
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

      {modal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setModal(null)}
        >
          <div
            style={{
              width: 400, background: "#111a17", border: "1px solid #1a2e28",
              borderRadius: 14, padding: "1.5rem",
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ margin: "0 0 1rem", fontSize: "1.1rem" }}>
              {modal === "name" && "Edit name"}
              {modal === "email" && "Change email"}
              {modal === "password" && "Change password"}
              {modal === "about" && "About NextStop"}
            </h2>

            {error && <p style={{ color: "#ef4444", fontSize: "0.85rem" }}>{error}</p>}

            {modal === "about" && (
              <div style={{ display: "grid", gap: 14 }}>
                {aboutSections.map(section => (
                  <section key={section.title}>
                    <h3 style={{
                      margin: "0 0 6px",
                      fontSize: "0.9rem",
                      color: "#3ecfb2",
                    }}>
                      {section.title}
                    </h3>
                    <p style={{
                      margin: 0,
                      fontSize: "0.88rem",
                      lineHeight: 1.55,
                      color: "#b8c5c1",
                    }}>
                      {section.body}
                    </p>
                  </section>
                ))}
              </div>
            )}

            {modal === "name" && (
              <>
                <input className="input" placeholder="First name" value={firstName}
                  onChange={e => setFirstName(e.target.value)} />
                <input className="input" placeholder="Last name" value={lastName}
                  onChange={e => setLastName(e.target.value)} style={{ marginTop: 10 }} />
              </>
            )}

            {modal === "email" && (
              <>
                <input className="input" type="email" placeholder="New email" value={email}
                  onChange={e => setEmail(e.target.value)} />
                <input className="input" type="password" placeholder="Current password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  style={{ marginTop: 10 }} />
              </>
            )}

            {modal === "password" && (
              <>
                <input className="input" type="password" placeholder="Current password"
                  value={password} onChange={e => setPassword(e.target.value)} />
                <input className="input" type="password" placeholder="New password"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  style={{ marginTop: 10 }} />
                <input className="input" type="password" placeholder="Confirm new password"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  style={{ marginTop: 10 }} />
              </>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: "1rem" }}>
              <button
                onClick={() => setModal(null)}
                style={{
                  flex: 1, padding: 12, borderRadius: 10,
                  border: "1px solid #1a2e28", background: "transparent", color: "#888",
                }}
              >
                {isInfoModal ? "Close" : "Cancel"}
              </button>
              {!isInfoModal && (
                <button
                  onClick={handleSave}
                  style={{
                    flex: 1, padding: 12, borderRadius: 10, border: "none",
                    background: "#3ecfb2", color: "#0d1210", fontWeight: 700,
                  }}
                >
                  Save
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
