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
        <h1 className="auth-title">
          Welcome to NextStop
        </h1>

        {error && (
          <p className="auth-error">
            {error}
          </p>
        )}

        <p className="field-section-label">Name</p>
        <input className="input" placeholder="First Name"
          onChange={e => handle("first_name", e.target.value)} />
        <input className="input" placeholder="Last Name"
          onChange={e => handle("last_name", e.target.value)} />

        <p className="field-section-label" style={{ marginTop: 6 }}>Email</p>
        <input className="input" type="email" placeholder="Email"
          onChange={e => handle("email", e.target.value)} />

        <p className="field-section-label" style={{ marginTop: 6 }}>Affiliation</p>
        <select className="input" onChange={e => handle("affiliation", e.target.value)}>
          <option value="">Look up organization</option>
          <option value="UCI">UC Irvine</option>
          <option value="UCLA">UCLA</option>
          <option value="USC">USC</option>
        </select>

        <p className="field-section-label" style={{ marginTop: 6 }}>Password</p>
        <input className="input" type="password" placeholder="Password"
          onChange={e => handle("password", e.target.value)} />
        <input className="input" type="password" placeholder="Confirm Password"
          onChange={e => handle("confirm", e.target.value)} />

        <AuthButton
          text={loading ? "Creating account..." : "Create Account →"}
          onClick={handleSubmit}
        />
      </div>
    </main>
  );
}
