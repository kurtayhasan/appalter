import Link from "next/link";
import { routing } from "@/i18n/routing";

// Root not-found page to catch any unmatched routes and prevent Vercel Edge 404s
export default function NotFound() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>404 - Not Found</h1>
      <p style={{ marginBottom: "2rem" }}>The page you are looking for does not exist.</p>
      <Link href={`/${routing.defaultLocale}`} style={{ padding: "0.5rem 1rem", backgroundColor: "#0070f3", color: "white", textDecoration: "none", borderRadius: "5px" }}>
        Return Home
      </Link>
    </div>
  );
}
