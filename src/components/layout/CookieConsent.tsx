"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { getLocalizedPath } from "@/lib/utils";

export function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);
  const pathname = usePathname();
  
  // Extract locale from pathname, default to 'en'
  const firstSegment = pathname?.split('/')[1];
  const locale = ["tr", "es", "de"].includes(firstSegment || "") ? firstSegment : "en";

  useEffect(() => {
    // Check if the user has already consented
    const hasConsented = localStorage.getItem("cookie_consent");
    if (!hasConsented) {
      setShowConsent(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie_consent", "true");
    setShowConsent(false);
  };

  const declineCookies = () => {
    localStorage.setItem("cookie_consent", "false");
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div 
      className="cookie-consent-banner"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border-color)",
        padding: "1rem 2rem",
        zIndex: 9999,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem",
        boxShadow: "0 -4px 6px -1px rgba(0, 0, 0, 0.1)"
      }}
    >
      <div style={{ flex: 1, minWidth: "300px" }}>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. 
          By clicking "Accept", you consent to our use of cookies. 
          Read our <Link href={getLocalizedPath("/privacy", locale)} style={{ color: "var(--primary-color)", textDecoration: "underline" }}>Privacy Policy</Link> for more information.
        </p>
      </div>
      <div style={{ display: "flex", gap: "1rem" }}>
        <button 
          onClick={acceptCookies} 
          className="btn btn-primary"
          style={{ padding: "0.5rem 1.5rem", fontSize: "0.875rem" }}
        >
          Accept All
        </button>
      </div>
    </div>
  );
}
