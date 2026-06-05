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

        <button onClick={() => router.push("/onboarding")} className="auth-back-btn">
          <span aria-hidden="true">←</span> Back
        </button>

        <h1 className="auth-title">Welcome back!</h1>
        <p className="sr-only">Sign in to your NextStop account to continue planning trips.</p>

        {error && <p role="alert" className="auth-error">{error}</p>}

        <section aria-labelledby="email-heading">
          <h2 id="email-heading" className="field-section-label">Email</h2>
          <label htmlFor="email" className="field-label">Email address</label>
          <input
            id="email"
            className="input"
            type="email"
            placeholder="you@example.com"
            aria-describedby="email-hint"
            onChange={e => setEmail(e.target.value)}
          />
          <p id="email-hint" className="sr-only">Enter the email address associated with your NextStop account.</p>
        </section>

        <section aria-labelledby="password-heading">
          <h2 id="password-heading" className="field-section-label" style={{ marginTop: 6 }}>Password</h2>
          <label htmlFor="password" className="field-label">Password</label>
          <input
            id="password"
            className="input"
            type="password"
            placeholder="Your password"
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

        <fieldset className="google-fieldset">
          <legend className="sr-only">Or sign in with</legend>
          <AuthButton text="Sign in with Google" variant="google" />
        </fieldset>

      </div>

      <style>{`
        .sr-only {
          position: absolute; width: 1px; height: 1px; padding: 0;
          margin: -1px; overflow: hidden; clip: rect(0,0,0,0);
          white-space: nowrap; border: 0;
        }

        .field-label {
          display: block;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #848d9a;
          margin-bottom: 5px;
          margin-top: 14px;
        }

        .auth-back-btn {
          background: none;
          border: none;
          color: #848d9a;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0;
          margin-bottom: 1.5rem;
          font-family: inherit;
          transition: color 0.15s;
        }
        .auth-back-btn:hover { color: #f3f4f6; }

        .google-fieldset {
          border: none;
          padding: 0;
          margin: 0;
        }

        .auth-back-btn:focus-visible,
        .input:focus-visible,
        .auth-link:focus-visible {
          outline: 2px solid #3ecfb2;
          outline-offset: 2px;
          border-radius: 4px;
        }
      `}</style>
    </main>
  );
}
