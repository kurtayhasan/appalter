// src/components/software/AIDecisionCard.tsx
// AppAlter Hızlı Karar Kartı ve Editöryal İnceleme Rehberi.

import React from "react";
import { useTranslations } from "next-intl";
import type { SoftwareDetail } from "@/types";
import type { Locale } from "@/i18n/routing";

interface AIDecisionCardProps {
  software: SoftwareDetail;
  locale: Locale;
}

export function AIDecisionCard({ software, locale }: AIDecisionCardProps) {
  const t = useTranslations("decisionCard");
  const aiFeatures = (software.ai_features as any) || {};

  const tldr = aiFeatures.tldr || software.short_description;
  const bestFor = aiFeatures.best_for || [];
  const notFor = aiFeatures.not_for || [];
  const dealbreakers = aiFeatures.dealbreakers || [];
  const hiddenCosts = aiFeatures.hidden_costs || [];

  // Eğer hiçbir alan yoksa kartı boş render etmeyelim
  if (!tldr && bestFor.length === 0 && notFor.length === 0 && dealbreakers.length === 0) {
    return null;
  }

  return (
    <div className="container">
      <div className="ai-decision-card" aria-label={t("badge")}>
        {/* Header */}
        <div className="decision-header">
          <span className="decision-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            {t("badge")}
          </span>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            {t("guideFor", { name: software.name })}
          </span>
        </div>

        {/* TL;DR Summary */}
        {tldr && (
          <div style={{ marginBottom: "1.5rem", fontSize: "1.05rem", lineHeight: 1.6, color: "var(--text-primary)" }}>
            <strong>{t("theVerdict")} </strong>
            <span style={{ color: "var(--text-secondary)" }}>{tldr}</span>
          </div>
        )}

        {/* Grid Blocks */}
        <div className="decision-grid">
          {/* Best For Block */}
          {bestFor.length > 0 && (
            <div className="decision-block">
              <h3 className="decision-block-title" style={{ color: "var(--success)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
                {t("bestSuitedFor")}
              </h3>
              <div className="decision-tags">
                {bestFor.map((item: string, idx: number) => (
                  <span key={idx} className="decision-tag best-for">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Not For / Avoid If Block */}
          {notFor.length > 0 && (
            <div className="decision-block">
              <h3 className="decision-block-title" style={{ color: "var(--danger)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {t("considerAlternativesIf")}
              </h3>
              <div className="decision-tags">
                {notFor.map((item: string, idx: number) => (
                  <span key={idx} className="decision-tag not-for">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Dealbreakers & Hidden Costs */}
          {(dealbreakers.length > 0 || hiddenCosts.length > 0) && (
            <div className="decision-block" style={{ gridColumn: "1 / -1" }}>
              <h3 className="decision-block-title" style={{ color: "var(--warning)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {t("watchOutTitle")}
              </h3>
              <ul style={{ listStyle: "disc", paddingLeft: "1.25rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                {dealbreakers.map((item: string, idx: number) => (
                  <li key={`db-${idx}`} style={{ marginBottom: "0.35rem" }}>
                    <strong style={{ color: "var(--text-primary)" }}>{t("dealbreaker")}</strong> {item}
                  </li>
                ))}
                {hiddenCosts.map((item: string, idx: number) => (
                  <li key={`hc-${idx}`} style={{ marginBottom: "0.35rem" }}>
                    <strong style={{ color: "var(--warning)" }}>{t("pricingNote")}</strong> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
