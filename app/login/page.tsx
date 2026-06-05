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
    <main className="auth-page bg-grid">
      <div className="auth-card">

        {/* Page heading first — screen reader announces before anything else */}
        <h1 tabIndex={0} className="auth-title">Welcome back!</h1>
        <p className="sr-only">Sign in to your NextStop account to continue planning trips.</p>

        {/* Error announced immediately when it appears */}
        {error && (
          <p role="alert" className="auth-error">{error}</p>
        )}

        {/* Email */}
        <section aria-labelledby="email-heading">
          <h2 id="email-heading" tabIndex={0} className="field-section-label">Email</h2>

          <label htmlFor="email" className="sr-only">Email address</label>
          <input
            id="email"
            className="input"
            type="email"
            placeholder="Email"
            aria-describedby="email-hint"
            onChange={e => setEmail(e.target.value)}
          />
          <p id="email-hint" className="sr-only">Enter the email address associated with your NextStop account.</p>
        </section>

        {/* Password */}
        <section aria-labelledby="password-heading">
          <h2 id="password-heading" tabIndex={0} className="field-section-label" style={{ marginTop: 6 }}>Password</h2>

          <label htmlFor="password" className="sr-only">Password</label>
          <input
            id="password"
            className="input"
            type="password"
            placeholder="Password"
            onChange={e => setPassword(e.target.value)}
          />
        </section>

        <a href="/forgot-password" className="auth-link">
          Forgot password?
        </a>

        <AuthButton
          text={loading ? "Signing in..." : "Sign In"}
          onClick={handleSubmit}
        />
        <AuthButton text="Sign in with Google" variant="google" />
      </div>

      <style>{`
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0,0,0,0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </main>
  );
}
