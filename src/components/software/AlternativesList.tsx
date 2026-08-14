// src/components/software/AlternativesList.tsx
// Bir software için alternatiflerin pagine edilmiş listesi.
// Suspense ile sarılarak stream edilir (PPR Dynamic Island).

import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/routing";
import { getAlternativesCached } from "@/lib/cache/queries";
import { formatPrice, formatRating, formatCount, difficultyColor } from "@/lib/utils";
import { StarRating } from "@/components/ui/StarRating";
import { PricingBadge } from "@/components/software/PricingBadge";
import { AlternativesListJsonLd } from "@/components/seo/JsonLd";
import { AdBanner } from "@/components/ads/AdBanner";
import { VoteControls } from "@/components/ui/VoteControls";

interface AlternativesListProps {
  softwareSlug: string;
  locale: Locale;
  page?: number;
  limit?: number;
}

export async function AlternativesList({
  softwareSlug,
  locale,
  page = 1,
  limit = 12,
}: AlternativesListProps) {
  const { items, total } = await getAlternativesCached(softwareSlug, page, limit, locale);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://appalter.com";

  if (items.length === 0) {
    return (
      <div className="empty-state" role="status">
        <p>No alternatives found yet.</p>
        <Link href={`/${locale}/${softwareSlug}`} className="btn btn-ghost">
          Back to overview
        </Link>
      </div>
    );
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      {/* JSON-LD for this alternatives list */}
      <AlternativesListJsonLd
        softwareName={softwareSlug}
        alternatives={items.map((alt: any) => ({
          name: alt.alternative_name,
          slug: alt.alternative_slug,
          url: `${baseUrl}/${alt.alternative_slug}`,
          description: alt.tagline,
          logoUrl: alt.alternative_logo,
          rating: alt.avg_rating,
        }))}
      />

      <div className="alternatives-list">
        {/* Header */}
        <div className="alternatives-header">
          <h2 id="alternatives-heading" className="section-title">
            {total} Alternatives
          </h2>
          <span className="alternatives-count">Page {page} of {totalPages}</span>
        </div>

        <AdBanner adSlot="alternatives_top" />

        {/* Grid */}
        <div className="alternatives-grid" role="list">
          {items.map((alt: any, index: number) => (
            <article
              key={alt.alternative_id}
              className="alternative-card"
              role="listitem"
            >
              {/* Rank */}
              <div className="alt-rank" aria-label={`Rank ${(page - 1) * limit + index + 1}`}>
                #{(page - 1) * limit + index + 1}
              </div>

              {/* Logo */}
              <Link
                href={`/${locale}/${alt.alternative_slug}`}
                className="alt-logo-link"
                aria-hidden="true"
                tabIndex={-1}
              >
                {alt.alternative_logo ? (
                  <Image
                    src={alt.alternative_logo}
                    alt={`${alt.alternative_name} logo`}
                    width={56}
                    height={56}
                    className="alt-logo"
                  />
                ) : (
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(alt.alternative_name)}&background=random&color=fff&size=112&rounded=true&bold=true&font-size=0.5`}
                    alt={`${alt.alternative_name} logo fallback`}
                    width={56}
                    height={56}
                    className="alt-logo"
                    loading="lazy"
                  />
                )}
              </Link>

              {/* Content */}
              <div className="alt-content">
                <div className="alt-header">
                  <h3 className="alt-name">
                    <Link href={`/${locale}/${alt.alternative_slug}`} className="alt-link">
                      {alt.alternative_name}
                    </Link>
                  </h3>

                  {/* Similarity score */}
                  {alt.similarity_score !== null &&
                    alt.similarity_score !== undefined && (
                      <div
                        className="alt-similarity"
                        title="Similarity score"
                        aria-label={`${Math.round(alt.similarity_score * 100)}% similar`}
                      >
                        <div
                          className="similarity-bar"
                          style={{
                            width: `${Math.round(alt.similarity_score * 100)}%`,
                          }}
                        />
                        <span className="similarity-label">
                          {Math.round(alt.similarity_score * 100)}% similar
                        </span>
                      </div>
                    )}
                </div>

                {alt.tagline && (
                  <p className="alt-tagline">{alt.tagline}</p>
                )}

                {/* Meta */}
                <div className="alt-meta">
                  {/* Rating */}
                  {alt.avg_rating && alt.review_count > 0 && (
                    <div className="alt-rating">
                      <StarRating rating={alt.avg_rating} size="xs" />
                      <span className="alt-rating-value">
                        {formatRating(alt.avg_rating)}
                      </span>
                      <span className="alt-review-count">
                        ({formatCount(alt.review_count)})
                      </span>
                    </div>
                  )}

                  {/* Pricing */}
                  <PricingBadge
                    pricingModelSlug={alt.pricing_model_id}
                    startingPrice={alt.starting_price}
                    currency={alt.price_currency}
                    size="xs"
                  />

                  {/* Migration difficulty */}
                  {alt.difficulty && (
                    <span
                      className={`alt-difficulty ${difficultyColor(alt.difficulty)}`}
                    >
                      Migration: {alt.difficulty}
                    </span>
                  )}
                </div>

                {/* AI Core Difference or Reason */}
                {(alt.core_difference || alt.reason) && (
                  <div style={{ margin: "0.75rem 0 0.5rem", padding: "0.5rem 0.75rem", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-sm)", borderLeft: "2px solid var(--accent-secondary)", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    <strong style={{ color: "var(--text-primary)" }}>Key Difference: </strong>
                    {alt.core_difference || alt.reason}
                  </div>
                )}

                {/* Best For Tags (AI) */}
                {alt.best_for && alt.best_for.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.5rem" }}>
                    {alt.best_for.slice(0, 3).map((tag: string, idx: number) => (
                      <span key={idx} className="decision-tag best-for" style={{ fontSize: "0.75rem", padding: "0.15rem 0.45rem" }}>
                        ✓ {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Pros and Cons (AI Generated) */}
                <div className="alt-pros-cons" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  {alt.pros && alt.pros.length > 0 && (
                    <div className="alt-pros-section">
                      <h4 style={{ fontSize: '0.875rem', color: 'var(--success)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        Pros
                      </h4>
                      <ul className="alt-pros" aria-label="Pros" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {alt.pros.slice(0, 3).map((pro: any, i: number) => (
                          <li key={i} className="alt-pro" style={{ fontSize: '0.875rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                            • {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {alt.cons && alt.cons.length > 0 && (
                    <div className="alt-cons-section">
                      <h4 style={{ fontSize: '0.875rem', color: 'var(--danger)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                        Cons
                      </h4>
                      <ul className="alt-cons" aria-label="Cons" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {alt.cons.slice(0, 3).map((con: any, i: number) => (
                          <li key={i} className="alt-con" style={{ fontSize: '0.875rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                            • {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="alt-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '1rem' }}>
                <VoteControls 
                  alternativeRecordId={alt.relation_id} 
                  softwareSlug={softwareSlug}
                  initialUpvotes={alt.upvotes || 0}
                  initialDownvotes={alt.downvotes || 0}
                />
                
                <Link
                  href={`/${locale}/${alt.alternative_slug}`}
                  className="btn btn-secondary btn-sm"
                >
                  View
                </Link>
                
                <Link
                  href={`/${locale}/${softwareSlug}/vs/${alt.alternative_slug}`}
                  className="btn btn-ghost btn-sm"
                >
                  Compare
                </Link>

                {alt.alternative_website_url && (
                  <a
                    href={`/api/go/${alt.alternative_slug}`}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="btn btn-primary btn-sm"
                  >
                    Visit Website
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ marginLeft: '4px' }}
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav
            className="pagination"
            aria-label="Alternatives pagination"
          >
            {page > 1 && (
              <Link
                href={`/${locale}/${softwareSlug}/alternatives?page=${page - 1}`}
                className="pagination-btn"
                rel="prev"
              >
                ← Previous
              </Link>
            )}

            <span className="pagination-info">
              Page {page} of {totalPages}
            </span>

            {page < totalPages && (
              <Link
                href={`/${locale}/${softwareSlug}/alternatives?page=${page + 1}`}
                className="pagination-btn"
                rel="next"
              >
                Next →
              </Link>
            )}
          </nav>
        )}
      </div>
    </>
  );
}
