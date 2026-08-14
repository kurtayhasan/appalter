// src/components/software/AIDecisionCard.tsx
// Yapay zeka destekli hızlı karar kartı (Quick Verdict, Best For, Not For, Dealbreakers, Migration).

import React from "react";
import type { SoftwareDetail } from "@/types";
import type { Locale } from "@/i18n/routing";

interface AIDecisionCardProps {
  software: SoftwareDetail;
  locale: Locale;
}

export function AIDecisionCard({ software, locale }: AIDecisionCardProps) {
  const aiFeatures = (software.ai_features as any) || {};

  const tldr = aiFeatures.tldr || software.short_description;
  const bestFor = aiFeatures.best_for || [];
  const notFor = aiFeatures.not_for || [];
  const dealbreakers = aiFeatures.dealbreakers || [];
  const hiddenCosts = aiFeatures.hidden_costs || [];
  const migrationDifficulty = aiFeatures.migration_difficulty || null;
  const switchingReasons = aiFeatures.switching_reasons || [];

  // Eğer hiçbir AI alanı yoksa kartı boş render etmeyelim
  if (!tldr && bestFor.length === 0 && notFor.length === 0 && dealbreakers.length === 0) {
    return null;
  }

  return (
    <div className="container">
      <div className="ai-decision-card" aria-label="AppAlter Decision & Evaluation Summary">
        {/* Header */}
        <div className="decision-header">
          <span className="decision-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
            </svg>
            AppAlter Verdict
          </span>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Editorial Decision Guide for {software.name}
          </span>
        </div>

        {/* TL;DR Summary */}
        {tldr && (
          <div style={{ marginBottom: "1.5rem", fontSize: "1.05rem", lineHeight: 1.6, color: "var(--text-primary)" }}>
            <strong>The Verdict: </strong>
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
                Best Suited For
              </h3>
              <div className="decision-tags">
                {bestFor.map((item: string, idx: number) => (
                  <span key={idx} className="decision-tag best-for">
                    ✓ {item}
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
                Consider Alternatives If
              </h3>
              <div className="decision-tags">
                {notFor.map((item: string, idx: number) => (
                  <span key={idx} className="decision-tag not-for">
                    ✕ {item}
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
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Things to Watch Out For (Potential Dealbreakers & Hidden Costs)
              </h3>
              <ul style={{ listStyle: "disc", paddingLeft: "1.25rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                {dealbreakers.map((item: string, idx: number) => (
                  <li key={`db-${idx}`} style={{ marginBottom: "0.35rem" }}>
                    <strong style={{ color: "var(--text-primary)" }}>Dealbreaker:</strong> {item}
                  </li>
                ))}
                {hiddenCosts.map((item: string, idx: number) => (
                  <li key={`hc-${idx}`} style={{ marginBottom: "0.35rem" }}>
                    <strong style={{ color: "var(--warning)" }}>Pricing Note:</strong> {item}
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
