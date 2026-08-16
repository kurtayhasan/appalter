// src/components/software/AlternativesMatrix.tsx
// Use-Case Bazlı Alternatif Karar Matrisi ve Geçiş Tuzakları Rehberi.

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { SoftwareDetail } from "@/types";
import type { Locale } from "@/i18n/routing";
import { formatPrice, getLocalizedPath } from "@/lib/utils";

interface AlternativesMatrixProps {
  software: SoftwareDetail;
  alternatives: any[];
  locale: Locale;
}

export function AlternativesMatrix({ software, alternatives, locale }: AlternativesMatrixProps) {
  const t = useTranslations("decisionMatrix");

  if (!alternatives || alternatives.length === 0) return null;

  const topAlternatives = alternatives.slice(0, 5);

  return (
    <section className="decision-matrix-section" style={{ marginTop: "3.5rem", marginBottom: "2rem" }}>
      <div className="section-header" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
          {t("title", { software: software.name })}
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
          {t("subtitle")}
        </p>
      </div>

      <div className="matrix-table-container" style={{ overflowX: "auto", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "12px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-subtle)" }}>
              <th style={{ padding: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>{t("softwareCol")}</th>
              <th style={{ padding: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>{t("bestForCol")}</th>
              <th style={{ padding: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>{t("priceCol")}</th>
              <th style={{ padding: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>{t("advantageCol")}</th>
              <th style={{ padding: "1rem", textAlign: "right", fontWeight: 700, color: "var(--text-primary)" }}>{t("actionCol")}</th>
            </tr>
          </thead>
          <tbody>
            {topAlternatives.map((alt) => {
              const altName = alt.alternative_name || alt.alternative?.name || "Alternative";
              const altSlug = alt.alternative_slug || alt.alternative?.slug || "";
              const bestFor = alt.use_case_tag || alt.best_for || "General Purpose";
              const advantage = alt.comparison_highlight || alt.reasons?.[0] || `${altName} provides robust features comparable to ${software.name}.`;
              const price = alt.starting_price !== undefined && alt.starting_price !== null
                ? formatPrice(alt.starting_price, alt.price_currency || "USD")
                : alt.pricing_model || "Contact Sales";

              return (
                <tr key={alt.id || altSlug} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  {/* Software Name & Logo */}
                  <td style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "8px", overflow: "hidden", background: "#ffffff", border: "1px solid var(--border-subtle)", padding: "3px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {alt.alternative_logo ? (
                          <Image src={alt.alternative_logo} alt={altName} width={30} height={30} style={{ objectFit: "contain" }} unoptimized={true} />
                        ) : (
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(altName)}&background=random&color=fff&size=64&rounded=true`}
                            alt={altName}
                            width={30}
                            height={30}
                          />
                        )}
                      </div>
                      <Link href={getLocalizedPath(`/${altSlug}`, locale)} style={{ fontWeight: 700, color: "var(--text-primary)", textDecoration: "none" }}>
                        {altName}
                      </Link>
                    </div>
                  </td>

                  {/* Best For */}
                  <td style={{ padding: "1rem" }}>
                    <span className="decision-tag best-for" style={{ fontSize: "0.8rem", padding: "0.25rem 0.6rem" }}>
                      {bestFor}
                    </span>
                  </td>

                  {/* Pricing */}
                  <td style={{ padding: "1rem", color: "var(--text-primary)", fontWeight: 700, whiteSpace: "nowrap" }}>
                    {price}
                  </td>

                  {/* Key Advantage */}
                  <td style={{ padding: "1rem", color: "var(--text-secondary)", lineHeight: 1.5, minWidth: "240px" }}>
                    {advantage}
                  </td>

                  {/* Action */}
                  <td style={{ padding: "1rem", textAlign: "right", whiteSpace: "nowrap" }}>
                    <Link
                      href={getLocalizedPath(`/${software.slug}/vs/${altSlug}`, locale)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: "0.8125rem", padding: "0.35rem 0.75rem", fontWeight: 600 }}
                    >
                      {t("compare")}
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {t("trapsTitle")}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem", fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          <div>
            <strong style={{ color: "var(--text-primary)", display: "block", marginBottom: "0.25rem" }}>
              {t("trap1Title")}
            </strong>
            {t("trap1Desc")}
          </div>
          <div>
            <strong style={{ color: "var(--text-primary)", display: "block", marginBottom: "0.25rem" }}>
              {t("trap2Title")}
            </strong>
            {t("trap2Desc")}
          </div>
          <div>
            <strong style={{ color: "var(--text-primary)", display: "block", marginBottom: "0.25rem" }}>
              {t("trap3Title")}
            </strong>
            {t("trap3Desc")}
          </div>
        </div>
      </div>
    </section>
  );
}
