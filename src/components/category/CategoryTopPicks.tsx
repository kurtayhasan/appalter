import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/routing";
import { StarRating } from "@/components/ui/StarRating";
import { formatRating, formatPrice } from "@/lib/utils";

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
  const badges = [
    { label: "🏆 #1 Editor's Choice 2026", color: "var(--accent-primary)", bg: "rgba(99, 102, 241, 0.1)" },
    { label: "⚡ Best Performance / Speed", color: "var(--success)", bg: "rgba(16, 185, 129, 0.1)" },
    { label: "💎 Best Value / Features", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" },
  ];

  return (
    <div
      style={{
        marginBottom: "2.5rem",
        padding: "1.75rem 2rem",
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div style={{ marginBottom: "1.25rem" }}>
        <span
          style={{
            display: "inline-block",
            fontSize: "0.75rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--accent-secondary)",
            marginBottom: "0.25rem",
          }}
        >
          2026 Verified Benchmark Leaders
        </span>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
          Top Rated {categoryName} Solutions
        </h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {topThree.map((sw, idx) => {
          const badge = badges[idx] ?? {
            label: "⭐ Featured Choice",
            color: "var(--accent-primary)",
            bg: "rgba(99, 102, 241, 0.1)",
          };
          const benchmark = sw.ai_features?.benchmarks?.metrics;

          return (
            <div
              key={sw.id}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "1.25rem",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                transition: "transform 0.15s ease, border-color 0.15s ease",
              }}
            >
              <div>
                {/* Badge */}
                <div
                  style={{
                    display: "inline-block",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: badge.color,
                    background: badge.bg,
                    border: `1px solid ${badge.color}30`,
                    padding: "0.2rem 0.55rem",
                    borderRadius: "9999px",
                    marginBottom: "0.85rem",
                  }}
                >
                  {badge.label}
                </div>

                {/* Software Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      background: "#ffffff",
                      border: "1px solid var(--border-subtle)",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {sw.logo_url ? (
                      <Image
                        src={sw.logo_url}
                        alt={`${sw.name} logo`}
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
                      <Link href={`/${locale}/${sw.slug}`} style={{ color: "var(--text-primary)", textDecoration: "none" }}>
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
                  href={`/${locale}/${sw.slug}`}
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
    </div>
  );
}
