// src/components/software/AlternativesMatrix.tsx
// Use-Case Bazlı Alternatif Karar Matrisi ve Geçiş Tuzakları Rehberi (AI Benchmark formatı).

import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { SoftwareDetail } from "@/types";
import type { Locale } from "@/i18n/routing";
import { formatPrice } from "@/lib/utils";

interface AlternativesMatrixProps {
  software: SoftwareDetail;
  alternatives: any[];
  locale: Locale;
}

export function AlternativesMatrix({ software, alternatives, locale }: AlternativesMatrixProps) {
  if (!alternatives || alternatives.length === 0) return null;

  const topAlternatives = alternatives.slice(0, 5);

  return (
    <div className="container">
      <div className="alternatives-matrix-card" aria-label="Use Case Comparison Matrix">
        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(139, 92, 246, 0.15)", border: "1px solid rgba(139, 92, 246, 0.3)", color: "#c084fc", padding: "0.25rem 0.65rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
            <span>💡 Decision Matrix</span>
          </div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            Top {software.name} Alternatives Ranked by Use Case
          </h2>
          <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            Compare key advantages, pricing, and specific scenarios where each alternative outperforms {software.name}.
          </p>
        </div>

        {/* Matrix Table */}
        <div className="matrix-table-wrapper" style={{ overflowX: "auto", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "rgba(0,0,0,0.25)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ background: "rgba(255, 255, 255, 0.04)", borderBottom: "1px solid var(--border-subtle)" }}>
                <th style={{ padding: "0.875rem 1rem", color: "var(--text-muted)", fontWeight: 600 }}>Alternative</th>
                <th style={{ padding: "0.875rem 1rem", color: "var(--text-muted)", fontWeight: 600 }}>Best For</th>
                <th style={{ padding: "0.875rem 1rem", color: "var(--text-muted)", fontWeight: 600 }}>Starting Price</th>
                <th style={{ padding: "0.875rem 1rem", color: "var(--text-muted)", fontWeight: 600 }}>Key Advantage over {software.name}</th>
                <th style={{ padding: "0.875rem 1rem", color: "var(--text-muted)", fontWeight: 600, textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {topAlternatives.map((alt, idx) => {
                const altName = alt.alternative_name || alt.name;
                const altSlug = alt.alternative_slug || alt.slug;
                const bestFor = alt.best_for?.[0] || alt.tagline || "General workflow scaling";
                const advantage = alt.core_difference || alt.reason || `Specialized tools and flexible plans compared to ${software.name}.`;
                const price = formatPrice(alt.starting_price, alt.price_currency || "USD");

                return (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--border-subtle)", transition: "background 0.15s" }}>
                    {/* Alternative Info */}
                    <td style={{ padding: "1rem", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "6px", overflow: "hidden", background: "#18181b", flexShrink: 0 }}>
                          {alt.alternative_logo ? (
                            <Image src={alt.alternative_logo} alt={altName} width={32} height={32} style={{ objectFit: "contain" }} />
                          ) : (
                            <img
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(altName)}&background=random&color=fff&size=64&rounded=true`}
                              alt={altName}
                              width={32}
                              height={32}
                            />
                          )}
                        </div>
                        <Link href={`/${locale}/${altSlug}`} style={{ fontWeight: 700, color: "var(--text-primary)", textDecoration: "none" }}>
                          {altName}
                        </Link>
                      </div>
                    </td>

                    {/* Best For */}
                    <td style={{ padding: "1rem", color: "var(--text-primary)" }}>
                      <span className="decision-tag best-for" style={{ fontSize: "0.8rem", padding: "0.2rem 0.5rem" }}>
                        ✓ {bestFor}
                      </span>
                    </td>

                    {/* Pricing */}
                    <td style={{ padding: "1rem", color: "var(--text-secondary)", fontWeight: 600, whiteSpace: "nowrap" }}>
                      {price}
                    </td>

                    {/* Key Advantage */}
                    <td style={{ padding: "1rem", color: "var(--text-secondary)", lineHeight: 1.4, minWidth: "240px" }}>
                      {advantage}
                    </td>

                    {/* Action */}
                    <td style={{ padding: "1rem", textAlign: "right", whiteSpace: "nowrap" }}>
                      <Link
                        href={`/${locale}/${software.slug}/vs/${altSlug}`}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}
                      >
                        Compare VS →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Switching Traps & Hidden Costs to Consider */}
        <div style={{ marginTop: "2rem", padding: "1.25rem 1.5rem", background: "rgba(245, 158, 11, 0.05)", border: "1px solid rgba(245, 158, 11, 0.2)", borderRadius: "var(--radius-md)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#f59e0b", fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.75rem" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Important Factors & Traps to Consider Before Switching
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem", fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            <div>
              <strong style={{ color: "var(--text-primary)", display: "block", marginBottom: "0.25rem" }}>
                1. The "All-in-One" Trap:
              </strong>
              Switching from a versatile platform to a specialized point solution may require purchasing supplementary tools for operations.
            </div>
            <div>
              <strong style={{ color: "var(--text-primary)", display: "block", marginBottom: "0.25rem" }}>
                2. Data Migration Liftoff:
              </strong>
              Exporting historical logs, custom properties, and board relationships requires mapping time. Plan for a 1-2 week transition period.
            </div>
            <div>
              <strong style={{ color: "var(--text-primary)", display: "block", marginBottom: "0.25rem" }}>
                3. Tier Escalation & Seat Jumps:
              </strong>
              Free and entry tiers offer massive upfront value, but verify user and contact thresholds to prevent sudden budget spikes.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
