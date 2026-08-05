// src/components/software/SoftwareHero.tsx
// Ana software sayfasının statik shell bölümü — PPR'ın hızla serve ettiği kısım.
// Server Component — client bundle'a dahil değil.

import Image from "next/image";
import Link from "next/link";
import type { SoftwareDetail } from "@/types";
import type { Locale } from "@/i18n/routing";
import { formatPrice, formatCount, formatRating } from "@/lib/utils";
import { StarRating } from "@/components/ui/StarRating";
import { PricingBadge } from "@/components/software/PricingBadge";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";

interface SoftwareHeroProps {
  software: SoftwareDetail;
  locale: Locale;
}

export function SoftwareHero({ software, locale }: SoftwareHeroProps) {
  const {
    name,
    tagline,
    short_description,
    logo_url,
    hero_image_url,
    website_url,
    avg_rating,
    review_count,
    alternative_count,
    is_verified,
    is_discontinued,
    github_url,
    starting_price,
    price_currency,
    has_free_trial,
    pricing_model_slug,
    category_name,
    category_slug,
    slug,
    developer_name,
    founded_year,
  } = software;

  return (
    <section className="software-hero" aria-label={`${name} overview`}>
      {/* Hero background */}
      {hero_image_url && (
        <div className="hero-bg" aria-hidden="true">
          <Image
            src={hero_image_url}
            alt=""
            fill
            className="hero-bg-image"
            priority
          />
          <div className="hero-bg-overlay" />
        </div>
      )}

      <div className="hero-container">
        {/* Breadcrumb */}
        <nav className="hero-breadcrumb" aria-label="Breadcrumb">
          <ol className="breadcrumb-list">
            <li>
              <Link href={`/${locale}`} className="breadcrumb-link">
                Home
              </Link>
            </li>
            {category_name && category_slug && (
              <li>
                <span className="breadcrumb-separator" aria-hidden="true">›</span>
                <Link
                  href={`/${locale}/category/${category_slug}`}
                  className="breadcrumb-link"
                >
                  {category_name}
                </Link>
              </li>
            )}
            <li>
              <span className="breadcrumb-separator" aria-hidden="true">›</span>
              <span className="breadcrumb-current" aria-current="page">
                {name}
              </span>
            </li>
          </ol>
        </nav>

        {/* Main hero content */}
        <div className="hero-content">
          {/* Logo */}
          <div className="hero-logo-wrapper">
            {logo_url ? (
              <Image
                src={logo_url}
                alt={`${name} logo`}
                width={96}
                height={96}
                className="hero-logo"
                priority
              />
            ) : (
              <div className="hero-logo-placeholder" aria-hidden="true">
                {name.charAt(0)}
              </div>
            )}
          </div>

          {/* Title block */}
          <div className="hero-title-block">
            <div className="hero-title-row">
              <h1 className="hero-title">{name}</h1>
              {is_verified && <VerifiedBadge />}
              {is_discontinued && (
                <span className="badge badge-discontinued">Discontinued</span>
              )}
            </div>

            {tagline && (
              <p className="hero-tagline">{tagline}</p>
            )}

            {short_description && (
              <p className="hero-description">{short_description}</p>
            )}

            {/* Meta row */}
            <div className="hero-meta-row">
              {developer_name && (
                <span className="hero-meta-item">
                  <span className="hero-meta-label">By</span>
                  {developer_name}
                </span>
              )}
              {founded_year && (
                <span className="hero-meta-item">
                  <span className="hero-meta-label">Since</span>
                  {founded_year}
                </span>
              )}
              {category_name && (
                <span className="hero-meta-item">
                  <Link
                    href={`/${locale}/category/${category_slug}`}
                    className="hero-category-link"
                  >
                    {category_name}
                  </Link>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="hero-stats-bar" role="list" aria-label="Software statistics">
          {/* Rating */}
          {avg_rating && review_count > 0 && (
            <div className="stat-item" role="listitem">
              <StarRating rating={avg_rating} size="sm" />
              <span className="stat-value">{formatRating(avg_rating)}</span>
              <span className="stat-label">
                ({formatCount(review_count)} reviews)
              </span>
            </div>
          )}

          {/* Alternatives */}
          <div className="stat-item" role="listitem">
            <span className="stat-value">{formatCount(alternative_count)}</span>
            <span className="stat-label">alternatives</span>
          </div>

          {/* Pricing */}
          <div className="stat-item" role="listitem">
            <PricingBadge
              pricingModelSlug={pricing_model_slug}
              startingPrice={starting_price}
              currency={price_currency}
              hasFreeTrial={has_free_trial}
            />
          </div>
        </div>

        {/* CTA buttons */}
        <div className="hero-ctas">
          {website_url && (
            <a
              href={website_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="btn btn-primary btn-lg"
              id="visit-website-btn"
            >
              Visit Website
              <svg
                className="btn-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}

          <Link
            href={`/${locale}/${slug}/alternatives`}
            className="btn btn-secondary btn-lg"
            id="view-alternatives-btn"
          >
            View Alternatives
          </Link>

          {github_url && (
            <a
              href={github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-lg"
              id="github-link-btn"
              aria-label={`${name} on GitHub`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
          )}
        </div>

        {/* Navigation tabs */}
        <nav className="hero-tabs" aria-label="Software sections">
          <a href="#alternatives" className="hero-tab">
            Alternatives
          </a>
          <a href="#reviews" className="hero-tab">
            Reviews
          </a>
          <a href="#screenshots" className="hero-tab">
            Screenshots
          </a>
          <a href="#faqs" className="hero-tab">
            FAQs
          </a>
          <Link href={`/${locale}/${slug}/alternatives`} className="hero-tab">
            All Alternatives →
          </Link>
        </nav>
      </div>
    </section>
  );
}
