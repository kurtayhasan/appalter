// src/components/software/SoftwareCard.tsx
// Yazılım listelerinde kullanılan kart bileşeni — kategori, arama, öne çıkanlar.
// Server Component.

import Image from "next/image";
import Link from "next/link";
import type { SoftwareBasic } from "@/types";
import type { Locale } from "@/i18n/routing";
import { formatPrice, formatCount, formatRating } from "@/lib/utils";
import { StarRating } from "@/components/ui/StarRating";
import { PricingBadge } from "@/components/software/PricingBadge";

interface SoftwareCardProps {
  software: SoftwareBasic;
  locale: Locale;
  showCategory?: boolean;
  variant?: "default" | "compact" | "featured";
}

export function SoftwareCard({
  software,
  locale,
  showCategory = true,
  variant = "default",
}: SoftwareCardProps) {
  const {
    slug,
    name,
    tagline,
    short_description,
    logo_url,
    avg_rating,
    review_count,
    alternative_count,
    starting_price,
    price_currency,
    is_sponsored,
    is_featured,
    category_name,
    category_slug,
    pricing_model_slug,
  } = software;

  const href = `/${locale}/${slug}`;

  if (variant === "compact") {
    return (
      <article className="software-card software-card--compact">
        <Link href={href} className="card-link" tabIndex={-1} aria-hidden="true">
          {logo_url ? (
            <Image
              src={logo_url}
              alt={`${name} logo`}
              width={40}
              height={40}
              className="card-logo-sm"
            />
          ) : (
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=80&rounded=true&bold=true&font-size=0.5`}
              alt={`${name} logo fallback`}
              width={40}
              height={40}
              className="card-logo-sm"
              loading="lazy"
            />
          )}
        </Link>
        <div className="card-body-compact">
          <Link href={href} className="card-title-sm">
            {name}
          </Link>
          {tagline && <p className="card-tagline-sm">{tagline}</p>}
        </div>
        <PricingBadge
          pricingModelSlug={pricing_model_slug}
          startingPrice={starting_price}
          currency={price_currency}
          hasFreeTrial={false}
          size="xs"
        />
      </article>
    );
  }

  return (
    <article
      className={[
        "software-card",
        variant === "featured" ? "software-card--featured" : "",
        is_sponsored ? "software-card--sponsored" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Sponsored / Featured badge */}
      {(is_sponsored || is_featured) && (
        <div className="card-badges">
          {is_sponsored && (
            <span className="badge badge-sponsored">Sponsored</span>
          )}
          {is_featured && !is_sponsored && (
            <span className="badge badge-featured">Featured</span>
          )}
        </div>
      )}

      {/* Card header */}
      <div className="card-header">
        <Link href={href} className="card-logo-link" aria-hidden="true" tabIndex={-1}>
          {logo_url ? (
            <Image
              src={logo_url}
              alt={`${name} logo`}
              width={64}
              height={64}
              className="card-logo"
            />
          ) : (
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128&rounded=true&bold=true&font-size=0.5`}
              alt={`${name} logo fallback`}
              width={64}
              height={64}
              className="card-logo"
              loading="lazy"
            />
          )}
        </Link>

        <div className="card-header-info">
          <h3 className="card-title">
            <Link href={href} className="card-title-link">
              {name}
            </Link>
          </h3>

          {showCategory && category_name && category_slug && (
            <Link
              href={`/${locale}/category/${category_slug}`}
              className="card-category"
            >
              {category_name}
            </Link>
          )}

          {/* Rating */}
          {avg_rating && review_count > 0 ? (
            <div className="card-rating">
              <StarRating rating={avg_rating} size="xs" />
              <span className="card-rating-value">{formatRating(avg_rating)}</span>
              <span className="card-rating-count">
                ({formatCount(review_count)})
              </span>
            </div>
          ) : (
            <div className="card-no-rating">No reviews yet</div>
          )}
        </div>

        <div className="card-pricing">
          <PricingBadge
            pricingModelSlug={pricing_model_slug}
            startingPrice={starting_price}
            currency={price_currency}
            hasFreeTrial={false}
          />
        </div>
      </div>

      {/* Description / TLDR */}
      {(software.ai_features?.tldr || tagline || short_description) && (
        <p className="card-description" style={{ fontStyle: software.ai_features?.tldr ? "italic" : "normal" }}>
          {software.ai_features?.tldr ?? tagline ?? short_description}
        </p>
      )}

      {/* Footer */}
      <div className="card-footer">
        <span className={`card-alternatives ${alternative_count >= 8 ? 'text-success' : alternative_count > 0 ? 'text-warning' : 'text-danger'}`}>
          {formatCount(alternative_count)} alternatives
        </span>

        <Link href={href} className="card-cta">
          View details →
        </Link>
      </div>
    </article>
  );
}
