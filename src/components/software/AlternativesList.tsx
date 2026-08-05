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
  const { items, total } = await getAlternativesCached(softwareSlug, page, limit);
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
                  <div className="alt-logo-placeholder">
                    {alt.alternative_name.charAt(0)}
                  </div>
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

                {/* Pros */}
                {alt.pros && alt.pros.length > 0 && (
                  <ul className="alt-pros" aria-label="Pros">
                    {alt.pros.slice(0, 2).map((pro: any, i: number) => (
                      <li key={i} className="alt-pro">
                        <span className="alt-pro-icon" aria-hidden="true">✓</span>
                        {pro}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Actions */}
              <div className="alt-actions">
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
