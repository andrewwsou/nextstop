// import Link from "next/link";
// import AuthButton from "./components/AuthButton";
//
// export default function Home() {
//   return (
//     <main className="bg-grid">
//       <h1 style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>
//         NextStop
//       </h1>
//       <p style={{ marginBottom: "2rem", color: "#aaa" }}>
//         Your commute, one stop.
//       </p>
//
//       <Link href="/signup">
//         <AuthButton text="Get Started" />
//       </Link>
//
//       <div style={{ height: "1rem" }} />
//
//       <Link href="/login">
//         <AuthButton text="Sign In" variant="secondary" />
//       </Link>
//     </main>
//   );
// }

import { redirect } from "next/navigation";

export default function Home() {
  redirect("/onboarding");
}