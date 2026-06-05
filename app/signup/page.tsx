"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthButton from "../components/AuthButton";
import { signup } from "../lib/api";

export default function SignUp() {
  const router = useRouter();
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "",
    affiliation: "", password: "", confirm: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handle(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit() {
    setError("");
    if (form.password !== form.confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const res = await signup({
        first_name: form.first_name, last_name: form.last_name,
        email: form.email, password: form.password, affiliation: form.affiliation,
      });
      if (res.token) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        router.push("/dashboard");
      } else {
        setError(res.error || "Signup failed");
      }
    } catch {
      setError("Network error — is the backend running?");
    }
    setLoading(false);
  }

  return (
    <main className="auth-page bg-grid">
      <div className="auth-card">

        {/* Back button */}
        <button
          onClick={() => router.push("/onboarding")}
          className="auth-back-btn"
        >
          <span aria-hidden="true">←</span> Back
        </button>

        <h1 className="auth-title">
          Welcome to NextStop
        </h1>
        <p className="sr-only">Create an account to start planning your transit trips.</p>

        {error && <p role="alert" className="auth-error">{error}</p>}

        {/* Name */}
        <section aria-labelledby="name-heading">

          <h2 id="name-heading" className="field-section-label">Name</h2>

          <label htmlFor="first-name" className="field-label">First name</label>
          <input
            id="first-name"
            className="input"
            placeholder="First Name"
            aria-describedby="name-hint"
            onChange={e => handle("first_name", e.target.value)}
          />

          <label htmlFor="last-name" className="field-label">Last name</label>
          <input
            id="last-name"
            className="input"
            placeholder="Last Name"
            onChange={e => handle("last_name", e.target.value)}
          />
          <p id="name-hint" className="sr-only">Enter your first and last name as you'd like them displayed on your account.</p>
        </section>

        {/* Email */}
        <section aria-labelledby="email-heading">
          <h2 id="email-heading" className="field-section-label" style={{ marginTop: 6 }}>Email</h2>

          <label htmlFor="email" className="field-label">Email address</label>
          <input
            id="email"
            className="input"
            type="email"
            placeholder="you@example.com"
            aria-describedby="email-hint"
            onChange={e => handle("email", e.target.value)}
          />
          <p id="email-hint" className="sr-only">Enter your email address. This will be used to sign in to your account.</p>
        </section>

        {/* Affiliation */}
        <section aria-labelledby="affiliation-heading">
          <h2 id="affiliation-heading" className="field-section-label" style={{ marginTop: 6 }}>Affiliation</h2>

          <label htmlFor="affiliation" className="field-label">School or organization</label>
          <select
            id="affiliation"
            className="input"
            aria-describedby="affiliation-hint"
            onChange={e => handle("affiliation", e.target.value)}
          >
            <option value="">Look up organization</option>
            <option value="UCI">UC Irvine</option>
            <option value="UCLA">UCLA</option>
            <option value="USC">USC</option>
          </select>
          <p id="affiliation-hint" className="sr-only">Choose the school or organization you are affiliated with. This is optional.</p>
        </section>

        {/* Password */}
        <section aria-labelledby="password-heading">
          <h2 id="password-heading" className="field-section-label" style={{ marginTop: 6 }}>Password</h2>


          <label htmlFor="password" className="field-label">Password</label>
          <input
            id="password"
            className="input"
            type="password"
            placeholder="Create a password"
            aria-describedby="password-hint"
            onChange={e => handle("password", e.target.value)}
          />

          <label htmlFor="confirm-password" className="field-label">Confirm password</label>
          <input
            id="confirm-password"
            className="input"
            type="password"
            placeholder="Re-enter your password"
            aria-describedby="confirm-hint"
            onChange={e => handle("confirm", e.target.value)}
          />
          <p id="password-hint" className="sr-only">Choose a password for your account.</p>
          <p id="confirm-hint" className="sr-only">Re-enter your password to confirm it matches.</p>
        </section>

        <AuthButton
          text={loading ? "Creating account..." : "Create Account →"}
          onClick={handleSubmit}
        />
      </div>

      <style>{`
        .sr-only {
          position: absolute; width: 1px; height: 1px; padding: 0;
          margin: -1px; overflow: hidden; clip: rect(0,0,0,0);
          white-space: nowrap; border: 0;
        }

        /* Visible field label above each input */
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

        /* Back button */
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
        /* FIX 4: explicit focus-visible outline (keyboard focus indicator warning) */
        .auth-back-btn:focus-visible,
        .input:focus-visible,
        select.input:focus-visible {
          outline: 2px solid #3ecfb2;
          outline-offset: 2px;
          border-radius: 4px;
        }
      `}</style>
    </main>
  );
}
