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
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await signup({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
        affiliation: form.affiliation,
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

        {/* Page heading — first in DOM so screen reader announces it immediately */}
        <h1 tabIndex={0} className="auth-title">
          Welcome to NextStop
        </h1>
        <p className="sr-only">Create an account to start planning your transit trips.</p>

        {/* Error announced immediately when it appears */}
        {error && (
          <p role="alert" className="auth-error">{error}</p>
        )}

        {/* Name */}
        <section aria-labelledby="name-heading">
          <h2 id="name-heading" tabIndex={0} className="field-section-label">Name</h2>

          <label htmlFor="first-name" className="sr-only">First name</label>
          <input
            id="first-name"
            className="input"
            placeholder="First Name"
            aria-describedby="name-hint"
            onChange={e => handle("first_name", e.target.value)}
          />

          <label htmlFor="last-name" className="sr-only">Last name</label>
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
          <h2 id="email-heading" tabIndex={0} className="field-section-label" style={{ marginTop: 6 }}>Email</h2>

          <label htmlFor="email" className="sr-only">Email address</label>
          <input
            id="email"
            className="input"
            type="email"
            placeholder="Email"
            aria-describedby="email-hint"
            onChange={e => handle("email", e.target.value)}
          />
          <p id="email-hint" className="sr-only">Enter your email address. This will be used to sign in to your account.</p>
        </section>

        {/* Affiliation */}
        <section aria-labelledby="affiliation-heading">
          <h2 id="affiliation-heading" tabIndex={0} className="field-section-label" style={{ marginTop: 6 }}>Affiliation</h2>

          <label htmlFor="affiliation" className="sr-only">Select your school or organization</label>
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
          <h2 id="password-heading" tabIndex={0} className="field-section-label" style={{ marginTop: 6 }}>Password</h2>

          <label htmlFor="password" className="sr-only">Password</label>
          <input
            id="password"
            className="input"
            type="password"
            placeholder="Password"
            aria-describedby="password-hint"
            onChange={e => handle("password", e.target.value)}
          />

          <label htmlFor="confirm-password" className="sr-only">Confirm password</label>
          <input
            id="confirm-password"
            className="input"
            type="password"
            placeholder="Confirm Password"
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
    </main>
  );
}
