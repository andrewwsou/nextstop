"use client";

import { useRouter } from "next/navigation";
import AuthInput from "../components/AuthInput";
import AuthButton from "../components/AuthButton";

export default function SignUp() {
  const router = useRouter();

  return (
    <main className="bg-grid">
      <div className="auth-card">
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0 0 1.5rem" }}>
          Welcome to NextStop
        </h1>

        <p className="field-section-label">Name</p>
        <AuthInput label="" placeholder="First Name" />
        <AuthInput label="" placeholder="Last Name" />

        <p className="field-section-label" style={{ marginTop: 6 }}>Email</p>
        <AuthInput label="" type="email" placeholder="Email" />

        <p className="field-section-label" style={{ marginTop: 6 }}>Affiliation</p>
        <AuthInput label="" isSelect placeholder="Look up organization" />

        <p className="field-section-label" style={{ marginTop: 6 }}>Password</p>
        <AuthInput label="" type="password" placeholder="Password" />
        <AuthInput label="" type="password" placeholder="Confirm Password" />

        <AuthButton
          text="Create Account"
          onClick={() => router.push("/dashboard")} // ✅ THIS
        />
      </div>
    </main>
  );
}