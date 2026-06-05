"use client";
import { useEffect, useRef, useState } from "react";
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

  const [user, setUser] = useState<User | null>(null);
  const [modal, setModal] = useState<ModalType | null>(null);
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (modal) modalRef.current?.focus();
  }, [modal]);

  useEffect(() => {
    setUser(getUser());
  }, []);

  function onRowClick(item: string) {
    if (item === "Sign out") { logout(router); return; }
    setError("");
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");

    if (item === "Edit name") { setFirstName(user?.first_name || ""); setLastName(user?.last_name || ""); setModal("name"); }
    if (item === "Change email") { setEmail(user?.email || ""); setModal("email"); }
    if (item === "Change password") setModal("password");
    if (item === "About NextStop") setModal("about");
    if (item === "Privacy policy") setModal("privacy");
  }

  async function handleSave() {
    setError("");

    if (modal === "name") {
      if (!firstName) { setError("First name is required"); return; }
      const res = await updateName({ first_name: firstName, last_name: lastName });
      if (res.error) { setError(res.error); return; }
      localStorage.setItem("user", JSON.stringify(res));
      setUser(res);
      setModal(null);
    }

    if (modal === "email") {
      if (!email || !password) { setError("Email and current password are required"); return; }
      const res = await updateEmail({ email, password });
      if (res.error) { setError(res.error); return; }
      localStorage.setItem("user", JSON.stringify(res.user));
      localStorage.setItem("token", res.token);
      setUser(res.user);
      setModal(null);
    }

    if (modal === "password") {
      if (!password || !newPassword) { setError("Fill in all password fields"); return; }
      if (newPassword !== confirmPassword) { setError("New passwords do not match"); return; }
      const res = await updatePassword({ current_password: password, new_password: newPassword });
      if (res.error) { setError(res.error); return; }
      setModal(null);
    }
  }

  const isInfoModal = modal === "about" || modal === "privacy";
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ");

  return (
    <main className="profile-main min-h-screen bg-[#0b0c0e] text-[#f3f4f6] px-20 py-16 max-w-5xl mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* FIX 1: sr-only h1 is the page title; visible name is now an h2 heading */}
      <h1 className="sr-only">Profile</h1>

      <div className="flex items-center gap-4 mb-12">
        {/* Avatar is decorative */}
        <div aria-hidden="true" className="w-16 h-16 rounded-full bg-[#13151a] border border-[#222630] flex items-center justify-center text-2xl font-bold text-[#3ecfb2] shrink-0">
          {user?.first_name?.[0] || "U"}
        </div>
        <div className="min-w-0">

          <h2 className="margin-0 text-xl font-bold tracking-tight text-white break-words">
            {fullName || "User"}
          </h2>
          <p className="margin-0 text-sm text-[#848d9a] mt-1 break-all font-medium">
            {user?.email}
          </p>
        </div>
      </div>

      {/* Settings sections */}
      <div className="profile-grid grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {sections.map(s => (
          <section key={s.label} aria-labelledby={`section-${s.label}`}>

            <h3
              id={`section-${s.label}`}
              className="mb-3 text-xs font-bold tracking-widest text-[#848d9a] uppercase"
            >
              {s.label}
            </h3>
            <div className="bg-[#13151a]/40 border border-[#222630] rounded-xl overflow-hidden">
              {s.items.map((item, i) => (
                <button
                  key={item}
                  onClick={() => onRowClick(item)}
                  className={`w-full px-5 py-4 flex justify-between items-center text-sm font-semibold transition-colors text-left box-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3ecfb2] focus-visible:outline-offset-[-2px] ${
                    i < s.items.length - 1 ? "border-b border-[#222630]/60" : ""
                  } ${
                    item === "Sign out"
                      ? "text-red-400 hover:bg-red-950/10"
                      : "text-[#f3f4f6] hover:bg-[#1c1f26]/40"
                  }`}
                >
                  {item}
                  {item !== "Sign out" && (
                    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#848d9a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setModal(null)}
          onKeyDown={(e) => { if (e.key === "Escape") setModal(null); }}
        >
          <div
            ref={modalRef}
            tabIndex={-1}
            className="profile-modal w-full max-w-md bg-[#13151a] border border-[#222630] rounded-xl p-6 shadow-xl outline-none"
            onClick={e => e.stopPropagation()}
          >
            <h2 id="modal-title" className="text-lg font-bold text-white mb-4">
              {modal === "name" && "Edit name"}
              {modal === "email" && "Change email"}
              {modal === "password" && "Change password"}
              {modal === "about" && "About NextStop"}
              {modal === "privacy" && "Privacy policy"}
            </h2>

            {error && (
              <div role="alert" className="mb-4 rounded-xl border border-red-500/20 bg-red-950/10 p-3 text-sm text-red-400 flex items-center gap-2 font-medium">
                <span aria-hidden="true">✕</span> {error}
              </div>
            )}

            {modal === "about" && (
              <div className="space-y-4">
                {aboutSections.map(section => (
                  <section key={section.title}>
                    <h3 className="text-xs font-bold tracking-wider text-[#3ecfb2] uppercase mb-1">{section.title}</h3>
                    <p className="text-sm leading-relaxed text-[#848d9a] font-medium">{section.body}</p>
                  </section>
                ))}
              </div>
            )}

            {modal === "privacy" && (
              <div className="space-y-4">
                {privacySections.map(section => (
                  <section key={section.title}>
                    <h3 className="text-xs font-bold tracking-wider text-[#3ecfb2] uppercase mb-1">{section.title}</h3>
                    <p className="text-sm leading-relaxed text-[#848d9a] font-medium">{section.body}</p>
                  </section>
                ))}
              </div>
            )}

            {modal === "name" && (
              <div className="space-y-3">
                <label htmlFor="first-name" className="sr-only">First name</label>
                <input
                  id="first-name"
                  placeholder="First name"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="w-full rounded-xl border border-[#222630] bg-[#0b0c0e] px-4 py-3 text-sm text-[#f3f4f6] placeholder-[#4b5363] outline-none transition focus:border-[#3ecfb2]"
                />
                <label htmlFor="last-name" className="sr-only">Last name</label>
                <input
                  id="last-name"
                  placeholder="Last name"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="w-full rounded-xl border border-[#222630] bg-[#0b0c0e] px-4 py-3 text-sm text-[#f3f4f6] placeholder-[#4b5363] outline-none transition focus:border-[#3ecfb2]"
                />
              </div>
            )}

            {modal === "email" && (
              <div className="space-y-3">
                <label htmlFor="new-email" className="sr-only">New email address</label>
                <input
                  id="new-email"
                  type="email"
                  placeholder="New email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-[#222630] bg-[#0b0c0e] px-4 py-3 text-sm text-[#f3f4f6] placeholder-[#4b5363] outline-none transition focus:border-[#3ecfb2]"
                />
                <label htmlFor="current-password-email" className="sr-only">Current password</label>
                <input
                  id="current-password-email"
                  type="password"
                  placeholder="Current password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#222630] bg-[#0b0c0e] px-4 py-3 text-sm text-[#f3f4f6] placeholder-[#4b5363] outline-none transition focus:border-[#3ecfb2]"
                />
              </div>
            )}

            {modal === "password" && (
              <div className="space-y-3">
                <label htmlFor="current-password" className="sr-only">Current password</label>
                <input
                  id="current-password"
                  type="password"
                  placeholder="Current password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#222630] bg-[#0b0c0e] px-4 py-3 text-sm text-[#f3f4f6] placeholder-[#4b5363] outline-none transition focus:border-[#3ecfb2]"
                />
                <label htmlFor="new-password" className="sr-only">New password</label>
                <input
                  id="new-password"
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#222630] bg-[#0b0c0e] px-4 py-3 text-sm text-[#f3f4f6] placeholder-[#4b5363] outline-none transition focus:border-[#3ecfb2]"
                />
                <label htmlFor="confirm-password" className="sr-only">Confirm new password</label>
                <input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#222630] bg-[#0b0c0e] px-4 py-3 text-sm text-[#f3f4f6] placeholder-[#4b5363] outline-none transition focus:border-[#3ecfb2]"
                />
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModal(null)}
                className="flex-1 rounded-xl border border-[#222630] bg-transparent hover:bg-[#1c1f26]/40 py-3 text-sm font-semibold text-[#848d9a] hover:text-[#f3f4f6] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3ecfb2]"
              >
                {isInfoModal ? "Close" : "Cancel"}
              </button>
              {!isInfoModal && (
                <button
                  onClick={handleSave}
                  className="flex-1 rounded-xl bg-[#3ecfb2] hover:bg-[#34b399] py-3 text-sm font-bold text-[#0b0c0e] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3ecfb2]"
                >
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
        @media (max-width: 768px) {
          .profile-main { padding: 80px 1.25rem 2rem !important; }
          .profile-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}