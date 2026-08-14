// src/components/software/ComparisonTable.tsx
// İki software arasında paralel karşılaştırma tablosu.
// VS sayfasının dinamik island'ı — Suspense ile stream edilir.

import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/routing";
import { getComparisonDataCached, getFeaturesCached, getProsConsCached } from "@/lib/cache/queries";
import { formatPrice, formatRating, formatCount } from "@/lib/utils";
import { StarRating } from "@/components/ui/StarRating";
import { ComparisonJsonLd } from "@/components/seo/JsonLd";
import { CommunityPoll } from "@/components/software/CommunityPoll";

interface ComparisonTableProps {
  softwareSlug: string;
  alternativeSlug: string;
  locale: Locale;
}

export async function ComparisonTable({
  softwareSlug,
  alternativeSlug,
  locale,
}: ComparisonTableProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://appalter.com";

  const { software, alternative, relation } = await getComparisonDataCached(
    softwareSlug,
    alternativeSlug
  );

  if (!software || !alternative) {
    return (
      <div className="comparison-error">
        <p>Comparison data is not available.</p>
      </div>
    );
  }

  // Paralel feature + pros/cons fetch
  const [swFeatures, altFeatures, swProsCons, altProsCons] = await Promise.all([
    getFeaturesCached(software.id),
    getFeaturesCached(alternative.id),
    getProsConsCached(software.id),
    getProsConsCached(alternative.id),
  ]);

  // Tüm benzersiz feature isimlerini birleştir
  const allFeatureNames = Array.from(
    new Set([
      ...swFeatures.map((f) => f.name),
      ...altFeatures.map((f) => f.name),
    ])
  );

  const swFeatureSet = new Set(swFeatures.map((f) => f.name));
  const altFeatureSet = new Set(altFeatures.map((f) => f.name));

  return (
    <>
      <ComparisonJsonLd
        software={{
          name: software.name,
          url: `${baseUrl}/${softwareSlug}`,
          logo: software.logo_url,
          rating: software.avg_rating,
        }}
        alternative={{
          name: alternative.name,
          url: `${baseUrl}/${alternativeSlug}`,
          logo: alternative.logo_url,
          rating: alternative.avg_rating,
        }}
        comparisonUrl={`${baseUrl}/${softwareSlug}/vs/${alternativeSlug}`}
      />

      <div className="comparison-table-wrapper">
        {/* Comparison header */}
        <div className="comparison-header" role="row">
          <div className="comparison-header-label" />
          {/* Software A */}
          <div className="comparison-col-header" role="columnheader">
            <Link href={`/${locale}/${softwareSlug}`} className="comparison-col-name-link" style={{ display: "flex", flexDirection: "column", alignItems: "center", textDecoration: "none" }}>
              {software.logo_url && (
                <Image
                  src={software.logo_url}
                  alt={`${software.name} logo`}
                  width={48}
                  height={48}
                  className="comparison-col-logo"
                />
              )}
              <span className="comparison-col-name">
                {software.name}
              </span>
            </Link>
            {software.avg_rating && (
              <div className="comparison-col-rating">
                <StarRating rating={software.avg_rating} size="xs" />
                <span>{formatRating(software.avg_rating)}</span>
              </div>
            )}
          </div>
          {/* Software B */}
          <div className="comparison-col-header" role="columnheader">
            <Link href={`/${locale}/${alternativeSlug}`} className="comparison-col-name-link" style={{ display: "flex", flexDirection: "column", alignItems: "center", textDecoration: "none" }}>
              {alternative.logo_url && (
                <Image
                  src={alternative.logo_url}
                  alt={`${alternative.name} logo`}
                  width={48}
                  height={48}
                  className="comparison-col-logo"
                />
              )}
              <span className="comparison-col-name">
                {alternative.name}
              </span>
            </Link>
            {alternative.avg_rating && (
              <div className="comparison-col-rating">
                <StarRating rating={alternative.avg_rating} size="xs" />
                <span>{formatRating(alternative.avg_rating)}</span>
              </div>
            )}
          </div>
        </div>

        {/* AppAlter Comparison Verdict & Core Difference */}
        {((software.ai_features as any)?.tldr || (alternative.ai_features as any)?.tldr || relation?.core_difference || relation?.difficulty) && (
          <div className="comparison-ai-summary ai-decision-card" style={{ margin: "2rem 0" }}>
            <div className="decision-header" style={{ marginBottom: "1rem" }}>
              <span className="decision-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                AppAlter Comparison Verdict
              </span>
              {relation?.difficulty && (
                <span className="decision-tag" style={{ marginLeft: "auto", fontSize: "0.75rem" }}>
                  Migration: <strong style={{ textTransform: "capitalize", marginLeft: "4px" }}>{relation.difficulty}</strong>
                </span>
              )}
            </div>

            {relation?.core_difference && (
              <div style={{ marginBottom: "1.25rem", padding: "0.875rem 1rem", background: "rgba(255,255,255,0.05)", borderRadius: "var(--radius-md)", borderLeft: "3px solid var(--accent-primary)" }}>
                <strong style={{ color: "var(--text-primary)" }}>The Core Difference: </strong>
                <span style={{ color: "var(--text-secondary)" }}>{relation.core_difference}</span>
              </div>
            )}

            <div className="decision-grid">
              <div className="decision-block">
                <div className="decision-block-title" style={{ color: "var(--accent-primary)" }}>
                  Why Choose {software.name}?
                </div>
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {(software.ai_features as any)?.tldr || `${software.name} offers specialized features with a starting price of ${formatPrice(software.starting_price, software.price_currency)}.`}
                </p>
              </div>

              <div className="decision-block">
                <div className="decision-block-title" style={{ color: "var(--accent-primary)" }}>
                  Why Choose {alternative.name}?
                </div>
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {(alternative.ai_features as any)?.tldr || `${alternative.name} provides an alternative approach with starting price of ${formatPrice(alternative.starting_price, alternative.price_currency)}.`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Overview rows */}
        <table className="comparison-table" role="table">
          <caption className="sr-only">
            {software.name} vs {alternative.name} comparison
          </caption>
          <tbody>
            <ComparisonRow
              label="Pricing"
              a={formatPrice(software.starting_price, software.price_currency)}
              b={formatPrice(alternative.starting_price, alternative.price_currency)}
            />
            <ComparisonRow
              label="Free Trial"
              a={software.has_free_trial ? "✓ Yes" : "✗ No"}
              b={alternative.has_free_trial ? "✓ Yes" : "✗ No"}
              aHighlight={software.has_free_trial}
              bHighlight={alternative.has_free_trial}
            />
            <ComparisonRow
              label="User Rating"
              a={software.avg_rating ? `${formatRating(software.avg_rating)}/5 (${formatCount(software.review_count)})` : "No ratings"}
              b={alternative.avg_rating ? `${formatRating(alternative.avg_rating)}/5 (${formatCount(alternative.review_count)})` : "No ratings"}
              aHighlight={(software.avg_rating ?? 0) >= (alternative.avg_rating ?? 0)}
              bHighlight={(alternative.avg_rating ?? 0) > (software.avg_rating ?? 0)}
            />
            <ComparisonRow
              label="Open Source"
              a={software.github_url ? "✓ Yes" : "✗ No"}
              b={alternative.github_url ? "✓ Yes" : "✗ No"}
              aHighlight={!!software.github_url}
              bHighlight={!!alternative.github_url}
            />
            <ComparisonRow
              label="Category"
              a={software.category_name ?? "—"}
              b={alternative.category_name ?? "—"}
            />
            {relation?.difficulty && (
              <ComparisonRow
                label="Migration Difficulty"
                a="(source)"
                b={relation.difficulty}
              />
            )}
          </tbody>
        </table>

        {/* Features comparison */}
        {allFeatureNames.length > 0 && (
          <div className="comparison-features">
            <h3 className="comparison-section-title">Feature Comparison</h3>
            <table className="comparison-table" role="table">
              <caption className="sr-only">Feature comparison</caption>
              <tbody>
                {allFeatureNames.map((feature) => (
                  <ComparisonRow
                    key={feature}
                    label={feature}
                    a={swFeatureSet.has(feature) ? "✓" : "✗"}
                    b={altFeatureSet.has(feature) ? "✓" : "✗"}
                    aHighlight={swFeatureSet.has(feature)}
                    bHighlight={altFeatureSet.has(feature)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pros & Cons */}
        <div className="comparison-pros-cons">
          {/* PROS ROW */}
          <div className="pros-cons-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
            <div className="pros-cons-col">
              <h3 className="pros-cons-title" style={{ color: "var(--success)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                {software.name} Pros
              </h3>
              {(software.ai_features as any)?.pros?.length > 0 ? (
                <ul className="pros-list">
                  {(software.ai_features as any).pros.map((pro: string, i: number) => (
                    <li key={i} className="pro-item">
                      {pro}
                    </li>
                  ))}
                </ul>
              ) : swProsCons.pros.length > 0 ? (
                <ul className="pros-list">
                  {swProsCons.pros.map((pro) => (
                    <li key={pro.id} className="pro-item">
                      {pro.content}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="pros-cons-empty">No pros listed yet.</p>
              )}
            </div>

            <div className="pros-cons-col">
              <h3 className="pros-cons-title" style={{ color: "var(--success)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                {alternative.name} Pros
              </h3>
              {(alternative.ai_features as any)?.pros?.length > 0 ? (
                <ul className="pros-list">
                  {(alternative.ai_features as any).pros.map((pro: string, i: number) => (
                    <li key={i} className="pro-item">
                      {pro}
                    </li>
                  ))}
                </ul>
              ) : altProsCons.pros.length > 0 ? (
                <ul className="pros-list">
                  {altProsCons.pros.map((pro) => (
                    <li key={pro.id} className="pro-item">
                      {pro.content}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="pros-cons-empty">No pros listed yet.</p>
              )}
            </div>
          </div>

          {/* CONS ROW */}
          <div className="pros-cons-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
            <div className="pros-cons-col">
              <h3 className="pros-cons-title" style={{ color: "var(--danger)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                {software.name} Cons
              </h3>
              {(software.ai_features as any)?.cons?.length > 0 ? (
                <ul className="cons-list">
                  {(software.ai_features as any).cons.map((con: string, i: number) => (
                    <li key={i} className="con-item" style={{ marginBottom: "0.5rem" }}>
                      {con}
                    </li>
                  ))}
                </ul>
              ) : swProsCons.cons.length > 0 ? (
                <ul className="cons-list">
                  {swProsCons.cons.map((con) => (
                    <li key={con.id} className="con-item" style={{ marginBottom: "0.5rem" }}>
                      {con.content}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="pros-cons-empty">No cons listed yet.</p>
              )}
            </div>

            <div className="pros-cons-col">
              <h3 className="pros-cons-title" style={{ color: "var(--danger)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                {alternative.name} Cons
              </h3>
              {(alternative.ai_features as any)?.cons?.length > 0 ? (
                <ul className="cons-list">
                  {(alternative.ai_features as any).cons.map((con: string, i: number) => (
                    <li key={i} className="con-item" style={{ marginBottom: "0.5rem" }}>
                      {con}
                    </li>
                  ))}
                </ul>
              ) : altProsCons.cons.length > 0 ? (
                <ul className="cons-list">
                  {altProsCons.cons.map((con) => (
                    <li key={con.id} className="con-item" style={{ marginBottom: "0.5rem" }}>
                      {con.content}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="pros-cons-empty">No cons listed yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Community Recommendation Poll */}
        <CommunityPoll
          softwareA={software.name}
          softwareB={alternative.name}
          slugA={softwareSlug}
          slugB={alternativeSlug}
        />

        {/* CTA */}
        <div className="comparison-cta">
          <Link href={`/${locale}/${softwareSlug}`} className="btn btn-primary">
            Learn more about {software.name}
          </Link>
          <Link href={`/${locale}/${alternativeSlug}`} className="btn btn-secondary">
            Learn more about {alternative.name}
          </Link>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// ComparisonRow — tek bir karşılaştırma satırı
// ---------------------------------------------------------------------------
function ComparisonRow({
  label,
  a,
  b,
  aHighlight = false,
  bHighlight = false,
}: {
  label: string;
  a: string;
  b: string;
  aHighlight?: boolean;
  bHighlight?: boolean;
}) {
  return (
    <tr className="comparison-row" role="row">
      <th scope="row" className="comparison-row-label" role="rowheader">
        {label}
      </th>
      <td
        className={[
          "comparison-row-cell",
          aHighlight ? "comparison-row-cell--highlight" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        role="cell"
      >
        {a}
      </td>
      <td
        className={[
          "comparison-row-cell",
          bHighlight ? "comparison-row-cell--highlight" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        role="cell"
      >
        {b}
      </td>
    </tr>
  );
}
