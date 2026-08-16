import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/routing";
import { StarRating } from "@/components/ui/StarRating";
import { formatRating, formatPrice, getLocalizedPath } from "@/lib/utils";

interface CategoryTopPicksProps {
  categoryName: string;
  categorySlug: string;
  softwares: any[];
  locale: Locale;
}

export function CategoryTopPicks({
  categoryName,
  categorySlug,
  softwares,
  locale,
}: CategoryTopPicksProps) {
  if (!softwares || softwares.length < 2) return null;

  const topThree = softwares.slice(0, 3);
  const defaultBadge = { label: "🏆 #1 Editor's Choice 2026", color: "var(--accent-primary)", bg: "rgba(99, 102, 241, 0.1)" };
  const badges = [
    defaultBadge,
    { label: "⚡ Best Value & Performance", color: "var(--success)", bg: "rgba(16, 185, 129, 0.1)" },
    { label: "🚀 High Growth Popular Pick", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" }
  ];

  return (
    <section className="top-picks-section" style={{ marginBottom: "3rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
        <span style={{ fontSize: "1.25rem" }}>🎯</span>
        <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
          Top Rated {categoryName} Solutions for 2026
        </h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {topThree.map((sw, index) => {
          const badge = badges[index] ?? defaultBadge;

          return (
            <div
              key={sw.id || sw.slug}
              className="top-pick-card"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "12px",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              <div>
                {/* Custom Badge */}
                <div
                  style={{
                    display: "inline-block",
                    padding: "0.25rem 0.6rem",
                    borderRadius: "9999px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: badge.color,
                    background: badge.bg,
                    marginBottom: "1rem",
                  }}
                >
                  {badge.label}
                </div>

                {/* Header: Logo & Title */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.85rem" }}>
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "8px",
                      background: "#ffffff",
                      border: "1px solid var(--border-subtle)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      padding: "4px",
                      flexShrink: 0,
                    }}
                  >
                    {sw.logo_url ? (
                      <Image
                        src={sw.logo_url}
                        alt={sw.name}
                        width={36}
                        height={36}
                        style={{ objectFit: "contain" }}
                        unoptimized={true}
                      />
                    ) : (
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(sw.name)}&background=random&color=fff&size=72&rounded=true`}
                        alt={sw.name}
                        width={36}
                        height={36}
                      />
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>
                      <Link href={getLocalizedPath(`/${sw.slug}`, locale)} style={{ color: "var(--text-primary)", textDecoration: "none" }}>
                        {sw.name}
                      </Link>
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.2rem" }}>
                      <StarRating rating={sw.avg_rating || 4.7} size="xs" />
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        {formatRating(sw.avg_rating || 4.7)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "1rem" }}>
                  {sw.tagline || sw.short_description || `Leading ${categoryName} software verified by independent tests.`}
                </p>
              </div>

              {/* Price & Action */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "0.75rem",
                  borderTop: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  {formatPrice(sw.starting_price, sw.price_currency || "USD")}
                </div>
                <Link
                  href={getLocalizedPath(`/${sw.slug}`, locale)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}
                >
                  View Details →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
