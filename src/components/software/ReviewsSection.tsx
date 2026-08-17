// src/components/software/ReviewsSection.tsx
// Yazılım yorumları bölümü — Suspense stream edilir.

import type { Locale } from "@/i18n/routing";
import { getReviewsCached } from "@/lib/cache/queries";
import { formatDate, formatCount, getInitials } from "@/lib/utils";
import { StarRating } from "@/components/ui/StarRating";
import { ReviewForm } from "@/components/software/ReviewForm";

interface ReviewsSectionProps {
  softwareId: string;
  softwareName?: string;
  locale: Locale;
  page?: number;
}

export async function ReviewsSection({
  softwareId,
  softwareName,
  locale,
  page = 1,
}: ReviewsSectionProps) {
  const { items: reviews, total } = await getReviewsCached(
    softwareId,
    locale,
    page,
    10
  );

  if (reviews.length === 0) {
    return (
      <section className="reviews-section" aria-labelledby="reviews-heading">
        <h2 id="reviews-heading" className="section-title">
          User Reviews
        </h2>
        <p className="empty-state">
          No reviews yet. Be the first to share your experience with this software!
        </p>
        <ReviewForm softwareId={softwareId} locale={locale} />
      </section>
    );
  }

  // Rating dağılımı hesapla
  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));
  const maxCount = Math.max(...ratingCounts.map((r) => r.count), 1);

  // Ortalama rating
  const avgRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <section className="reviews-section" aria-labelledby="reviews-heading">
      <div className="reviews-header">
        <h2 id="reviews-heading" className="section-title">
          User Reviews
          <span className="reviews-count">({formatCount(total)})</span>
        </h2>

        {/* Rating summary */}
        <div className="rating-summary">
          <div className="rating-summary-score">
            <span className="rating-big">{avgRating.toFixed(1)}</span>
            <StarRating rating={avgRating} size="md" />
            <span className="rating-summary-count">
              {formatCount(total)} reviews
            </span>
          </div>

          <div
            className="rating-bars"
            aria-label="Rating distribution"
            role="img"
          >
            {ratingCounts.map(({ star, count }) => (
              <div key={star} className="rating-bar-row">
                <span className="rating-bar-label">{star}★</span>
                <div className="rating-bar-track" role="progressbar" aria-valuenow={count} aria-valuemax={maxCount}>
                  <div
                    className="rating-bar-fill"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="rating-bar-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews list */}
      <div className="reviews-list" role="list">
        {reviews.map((review) => (
          <article
            key={review.id}
            className="review-card"
            role="listitem"
            itemScope
            itemType="https://schema.org/Review"
          >
            {/* itemReviewed Schema for Google Search Console */}
            {softwareName && (
              <span itemProp="itemReviewed" itemScope itemType="https://schema.org/SoftwareApplication" style={{ display: "none" }}>
                <meta itemProp="name" content={softwareName} />
              </span>
            )}

            {/* Reviewer */}
            <div className="review-header">
              <div className="reviewer-avatar" aria-hidden="true">
                {review.reviewer_avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={review.reviewer_avatar}
                    alt={review.reviewer_name ?? "Reviewer"}
                    width={40}
                    height={40}
                    className="avatar-img"
                  />
                ) : (
                  <span className="avatar-initials">
                    {getInitials(review.reviewer_name ?? "Anonymous")}
                  </span>
                )}
              </div>

              <div className="reviewer-info">
                <span
                  className="reviewer-name"
                  itemProp="author"
                  itemScope
                  itemType="https://schema.org/Person"
                >
                  <span itemProp="name">
                    {review.reviewer_name ?? "Anonymous"}
                  </span>
                </span>
                {review.reviewer_role && (
                  <span className="reviewer-role">{review.reviewer_role}</span>
                )}
              </div>

              <div className="review-meta">
                <div itemProp="reviewRating" itemScope itemType="https://schema.org/Rating">
                  <meta itemProp="ratingValue" content={String(review.rating)} />
                  <meta itemProp="bestRating" content="5" />
                  <meta itemProp="worstRating" content="1" />
                  <StarRating rating={review.rating} size="xs" />
                </div>
                <time
                  className="review-date"
                  dateTime={review.created_at}
                  itemProp="datePublished"
                >
                  {formatDate(review.created_at, locale)}
                </time>
              </div>
            </div>

            {/* Review content */}
            {review.title && (
              <h3 className="review-title" itemProp="name">
                {review.title}
              </h3>
            )}
            <p className="review-body" itemProp="reviewBody">
              {review.body}
            </p>

            {/* Badges */}
            <div className="review-badges">
              {review.is_verified && (
                <span className="badge badge-verified" title="Verified user">
                  ✓ Verified
                </span>
              )}
              {review.is_featured && (
                <span className="badge badge-featured">Featured</span>
              )}
              {review.source && review.source !== "user" && (
                <span className="badge badge-source">via {review.source}</span>
              )}
            </div>

            {/* Helpful */}
            <div className="review-footer">
              {review.helpful_count > 0 && (
                <span className="review-helpful">
                  {review.helpful_count} found this helpful
                </span>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* Review Form CTA */}
      <ReviewForm softwareId={softwareId} locale={locale} />
    </section>
  );
}
