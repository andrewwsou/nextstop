"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthButton from "../components/AuthButton";
import { login } from "../lib/api";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      const res = await login({ email, password });
      if (res.token) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        router.push("/dashboard");
      } else {
        setError(res.error || "Login failed");
      }
    } catch {
      setError("Network error — is the backend running?");
    }
    setLoading(false);
  }

  return (
    <main className="bg-grid">
      <div className="auth-card">
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0 0 1.5rem" }}>
          Welcome back!
        </h1>

        {error && (
          <p style={{ color: "#ef4444", fontSize: "0.85rem", marginBottom: "1rem" }}>
            {error}
          </p>
        )}

        <p className="field-section-label">Email</p>
        <input className="input" type="email" placeholder="Email"
          onChange={e => setEmail(e.target.value)} />

        <p className="field-section-label" style={{ marginTop: 6 }}>Password</p>
        <input className="input" type="password" placeholder="Password"
          onChange={e => setPassword(e.target.value)} />

        <a href="/forgot-password" style={{
          fontSize: "0.78rem", color: "#3ecfb2",
          display: "block", marginTop: 6, marginBottom: 4,
        }}>
          Forgot password?
        </a>

        <AuthButton
          text={loading ? "Signing in..." : "Sign In"}
          onClick={handleSubmit}
        />
        <AuthButton text="Sign in with Google" variant="google" />
      </div>
    </main>
  );
}