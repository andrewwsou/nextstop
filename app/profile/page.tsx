"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth, getUser, logout } from "../lib/auth";
import { updateName, updateEmail, updatePassword } from "../lib/api";

type ModalType = "name" | "email" | "password" | "about" | "privacy";
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
    title: "What is NextStop",
    body: "NextStop helps UCI and OC riders plan trips without bouncing between a bunch of tabs. You can look for routes, check transit options, and keep track of the trips you care about.",
  },
  {
    title: "Our Goal",
    body: "It's simple: to make local transit less confusing. It is built for quick decisions, like figuring out how to get across campus, around Irvine, or somewhere nearby without feeling hopeless.",
  },
  {
    title: "In Progress",
    body: "We plan on having more settings, better preferences, and smarter trip features in the near future!",
  },
];

const privacySections = [
  {
    title: "What NextStop saves",
    body: "NextStop keeps the basic information needed for your account, including your name and email. When you use trip features, it may also save trips, places, or route details so the app can remember them later.",
  },
  {
    title: "How that info is used",
    body: "The app uses your information to keep you signed in, display your profile, and make transit tools more personalized. It is meant strictly for app features.",
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
    if (item === "Privacy policy") {
      setModal("privacy");
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

  const isInfoModal = modal === "about" || modal === "privacy";

  return (
    <main
      className="profile-main"
      style={{
        minHeight: "100vh",
        padding: "80px 5rem 2.5rem",
        background: "#0d1210",
        color: "white",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: "3rem" }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "#1a2e28", border: "1px solid #2a4a3e",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.6rem", fontWeight: 700, color: "#3ecfb2",
          flexShrink: 0,
        }}>
          {user?.first_name?.[0] || "U"}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700, wordBreak: "break-word" }}>
            {user?.first_name} {user?.last_name}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#555", wordBreak: "break-all" }}>
            {user?.email}
          </p>
        </div>
      </div>

      <div
        className="profile-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
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
            padding: "0 1rem",
          }}
          onClick={() => setModal(null)}
        >
          <div
            className="profile-modal"
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
              {modal === "privacy" && "Privacy policy"}
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

            {modal === "privacy" && (
              <div style={{ display: "grid", gap: 14 }}>
                {privacySections.map(section => (
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

      <style>{`
        @media (max-width: 768px) {
          .profile-main {
            padding: 80px 1.25rem 2rem !important;
          }
          .profile-grid {
            grid-template-columns: 1fr !important;
          }
          .profile-modal {
            width: calc(100vw - 2rem) !important;
          }
        }
      `}</style>
    </main>
  );
}