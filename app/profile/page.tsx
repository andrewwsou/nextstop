"use client";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    setUser(getUser());
  }, []);

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
    <main className="profile-main min-h-screen bg-[#0b0c0e] text-[#f3f4f6] px-20 py-16 max-w-5xl mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* User Header Section */}
      <div className="flex items-center gap-4 mb-12">
        <div className="w-16 h-16 rounded-full bg-[#13151a] border border-[#222630] flex items-center justify-center text-2xl font-bold text-[#3ecfb2] shrink-0">
          {user?.first_name?.[0] || "U"}
        </div>
        <div className="min-w-0">
          <p className="margin-0 text-xl font-bold tracking-tight text-white break-words">
            {user?.first_name} {user?.last_name}
          </p>
          <p className="margin-0 text-sm text-[#848d9a] mt-1 break-all font-medium">
            {user?.email}
          </p>
        </div>
      </div>

      {/* Settings Panel Grid */}
      <div className="profile-grid grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {sections.map(s => (
          <div key={s.label}>
            <p className="mb-3 text-xs font-bold tracking-widest text-[#4b5363] uppercase">
              {s.label}
            </p>
            <div className="bg-[#13151a]/40 border border-[#222630] rounded-xl overflow-hidden">
              {s.items.map((item, i) => (
                <div
                  key={item}
                  onClick={() => onRowClick(item)}
                  className={`px-5 py-4 flex justify-between items-center cursor-pointer text-sm font-semibold transition-colors ${
                    i < s.items.length - 1 ? "border-b border-[#222630]/60" : ""
                  } ${
                    item === "Sign out" 
                      ? "text-red-400 hover:bg-red-950/10" 
                      : "text-[#f3f4f6] hover:bg-[#1c1f26]/40"
                  }`}
                >
                  {item}
                  {item !== "Sign out" && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4b5363" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Action / Information Modals */}
      {modal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="profile-modal w-full max-w-md bg-[#13151a] border border-[#222630] rounded-xl p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-white mb-4">
              {modal === "name" && "Edit name"}
              {modal === "email" && "Change email"}
              {modal === "password" && "Change password"}
              {modal === "about" && "About NextStop"}
              {modal === "privacy" && "Privacy policy"}
            </h2>

            {error && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-950/10 p-3 text-sm text-red-400 flex items-center gap-2 font-medium">
                <span>✕</span> {error}
              </div>
            )}

            {/* About App Modal Content */}
            {modal === "about" && (
              <div className="space-y-4">
                {aboutSections.map(section => (
                  <section key={section.title}>
                    <h3 className="text-xs font-bold tracking-wider text-[#3ecfb2] uppercase mb-1">
                      {section.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#848d9a] font-medium">
                      {section.body}
                    </p>
                  </section>
                ))}
              </div>
            )}

            {/* Privacy Modal Content */}
            {modal === "privacy" && (
              <div className="space-y-4">
                {privacySections.map(section => (
                  <section key={section.title}>
                    <h3 className="text-xs font-bold tracking-wider text-[#3ecfb2] uppercase mb-1">
                      {section.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#848d9a] font-medium">
                      {section.body}
                    </p>
                  </section>
                ))}
              </div>
            )}

            {/* Edit Name Fields */}
            {modal === "name" && (
              <div className="space-y-3">
                <input
                  placeholder="First name"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="w-full rounded-xl border border-[#222630] bg-[#0b0c0e] px-4 py-3 text-sm text-[#f3f4f6] placeholder-[#4b5363] outline-none transition focus:border-[#3ecfb2]"
                />
                <input
                  placeholder="Last name"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="w-full rounded-xl border border-[#222630] bg-[#0b0c0e] px-4 py-3 text-sm text-[#f3f4f6] placeholder-[#4b5363] outline-none transition focus:border-[#3ecfb2]"
                />
              </div>
            )}

            {/* Change Email Fields */}
            {modal === "email" && (
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="New email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-[#222630] bg-[#0b0c0e] px-4 py-3 text-sm text-[#f3f4f6] placeholder-[#4b5363] outline-none transition focus:border-[#3ecfb2]"
                />
                <input
                  type="password"
                  placeholder="Current password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#222630] bg-[#0b0c0e] px-4 py-3 text-sm text-[#f3f4f6] placeholder-[#4b5363] outline-none transition focus:border-[#3ecfb2]"
                />
              </div>
            )}

            {/* Change Password Fields */}
            {modal === "password" && (
              <div className="space-y-3">
                <input
                  type="password"
                  placeholder="Current password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#222630] bg-[#0b0c0e] px-4 py-3 text-sm text-[#f3f4f6] placeholder-[#4b5363] outline-none transition focus:border-[#3ecfb2]"
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#222630] bg-[#0b0c0e] px-4 py-3 text-sm text-[#f3f4f6] placeholder-[#4b5363] outline-none transition focus:border-[#3ecfb2]"
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#222630] bg-[#0b0c0e] px-4 py-3 text-sm text-[#f3f4f6] placeholder-[#4b5363] outline-none transition focus:border-[#3ecfb2]"
                />
              </div>
            )}

            {/* Modal Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModal(null)}
                className="flex-1 rounded-xl border border-[#222630] bg-transparent hover:bg-[#1c1f26]/40 py-3 text-sm font-semibold text-[#848d9a] hover:text-[#f3f4f6] transition-colors"
              >
                {isInfoModal ? "Close" : "Cancel"}
              </button>
              {!isInfoModal && (
                <button
                  onClick={handleSave}
                  className="flex-1 rounded-xl bg-[#3ecfb2] hover:bg-[#34b399] py-3 text-sm font-bold text-[#0b0c0e] transition-colors"
                >
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Styled Responsive Overrides */}
      <style>{`
        @media (max-width: 768px) {
          .profile-main {
            padding: 80px 1.25rem 2rem !important;
          }
          .profile-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
