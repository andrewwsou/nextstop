"use client";

import { useRouter } from "next/navigation";
import AuthInput from "../components/AuthInput";
import AuthButton from "../components/AuthButton";

export default function Login() {
  const router = useRouter();

  return (
    <main className="bg-grid">
      <div className="auth-card">
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0 0 1.5rem" }}>
          Welcome back!
        </h1>

        <p className="field-section-label">Email</p>
        <AuthInput label="" type="email" placeholder="Email" />

        <p className="field-section-label" style={{ marginTop: 6 }}>Password</p>
        <AuthInput label="" type="password" placeholder="Password" />

        <a
          href="/forgot-password"
          style={{
            fontSize: "0.78rem",
            color: "#3ecfb2",
            display: "block",
            marginTop: 6,
            marginBottom: 4,
            textDecoration: "underline",
          }}
        >
          Forgot password?
        </a>

        <AuthButton
          text="Sign In"
          onClick={() => router.push("/dashboard")} // ✅ THIS
        />

        <AuthButton
          text="Sign in with Google"
          variant="google"
          onClick={() => router.push("/dashboard")} // ✅ optional
        />
      </div>
    </main>
  );
}