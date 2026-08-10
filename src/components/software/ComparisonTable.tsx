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
            {software.logo_url && (
              <Image
                src={software.logo_url}
                alt={`${software.name} logo`}
                width={48}
                height={48}
                className="comparison-col-logo"
              />
            )}
            <Link
              href={`/${locale}/${softwareSlug}`}
              className="comparison-col-name"
            >
              {software.name}
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
            {alternative.logo_url && (
              <Image
                src={alternative.logo_url}
                alt={`${alternative.name} logo`}
                width={48}
                height={48}
                className="comparison-col-logo"
              />
            )}
            <Link
              href={`/${locale}/${alternativeSlug}`}
              className="comparison-col-name"
            >
              {alternative.name}
            </Link>
            {alternative.avg_rating && (
              <div className="comparison-col-rating">
                <StarRating rating={alternative.avg_rating} size="xs" />
                <span>{formatRating(alternative.avg_rating)}</span>
              </div>
            )}
          </div>
        </div>

        {/* AI Overview / TLDR & Core Difference */}
        {((software.ai_features as any)?.tldr || (alternative.ai_features as any)?.tldr || relation?.core_difference) && (
          <div className="comparison-ai-summary" style={{ margin: "2rem 0", padding: "1.5rem", background: "var(--bg-muted)", borderRadius: "var(--radius-lg)" }}>
            {relation?.core_difference && (
              <div style={{ marginBottom: "1rem" }}>
                <strong style={{ color: "var(--primary)" }}>The Core Difference: </strong>
                <span>{relation.core_difference}</span>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
              {(software.ai_features as any)?.tldr && (
                <div>
                  <strong>Why {software.name}? </strong>
                  <span>{(software.ai_features as any).tldr}</span>
                </div>
              )}
              {(alternative.ai_features as any)?.tldr && (
                <div>
                  <strong>Why {alternative.name}? </strong>
                  <span>{(alternative.ai_features as any).tldr}</span>
                </div>
              )}
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
          <div className="pros-cons-col">
            <h3 className="pros-cons-title">{software.name} Pros</h3>
            {swProsCons.pros.length > 0 ? (
              <ul className="pros-list">
                {swProsCons.pros.map((pro) => (
                  <li key={pro.id} className="pro-item">
                    <span className="pro-icon" aria-hidden="true">✓</span>
                    {pro.content}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="pros-cons-empty">No pros listed yet.</p>
            )}
          </div>

          <div className="pros-cons-col">
            <h3 className="pros-cons-title">{alternative.name} Pros</h3>
            {altProsCons.pros.length > 0 ? (
              <ul className="pros-list">
                {altProsCons.pros.map((pro) => (
                  <li key={pro.id} className="pro-item">
                    <span className="pro-icon" aria-hidden="true">✓</span>
                    {pro.content}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="pros-cons-empty">No pros listed yet.</p>
            )}
          </div>
        </div>

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
