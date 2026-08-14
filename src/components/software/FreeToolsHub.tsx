// src/components/software/FreeToolsHub.tsx
// Kategorilere göre gruplanmış En İyi Ücretsiz ve Açık Kaynak Araçlar Rehberi (Free Tools Hub).

import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/i18n/routing";
import { createStaticClient } from "@/lib/supabase/server";
import { StarRating } from "@/components/ui/StarRating";
import { formatRating, formatCount } from "@/lib/utils";

interface FreeToolsHubProps {
  locale: Locale;
}

export async function FreeToolsHub({ locale }: FreeToolsHubProps) {
  const supabase = createStaticClient();

  // Kategorileri ve her kategorideki ücretsiz/freemium/open-source yazılımları çekelim
  const { data: categories } = await supabase
    .from("categories")
    .select("id, slug, name, icon_url")
    .eq("is_active", true)
    .order("software_count", { ascending: false })
    .limit(10);

  const { data: freeSoftwares } = await supabase
    .from("softwares")
    .select(`
      id, slug, name, tagline, logo_url, avg_rating, review_count, starting_price, has_free_trial,
      categories!softwares_category_id_fkey (id, slug, name),
      pricing_models!softwares_pricing_model_id_fkey (slug)
    `)
    .eq("status", "published")
    .order("view_count", { ascending: false })
    .limit(80);

  // Softwares'ı kategorilerine göre gruplayalım
  const categoryGroups: Record<string, { categoryName: string; categorySlug: string; items: any[] }> = {};

  if (categories && Array.isArray(categories)) {
    for (const cat of categories as any[]) {
      categoryGroups[cat.slug] = {
        categoryName: cat.name,
        categorySlug: cat.slug,
        items: [],
      };
    }
  }

  if (freeSoftwares && Array.isArray(freeSoftwares)) {
    for (const sw of freeSoftwares as any[]) {
      const cat = Array.isArray(sw.categories) ? sw.categories[0] : sw.categories;
      const catSlug = cat?.slug || "other";

      if (!categoryGroups[catSlug]) {
        categoryGroups[catSlug] = {
          categoryName: cat?.name || "General Tools",
          categorySlug: catSlug,
          items: [],
        };
      }

      if (categoryGroups[catSlug].items.length < 8) {
        categoryGroups[catSlug].items.push(sw);
      }
    }
  }

  const activeGroups = Object.values(categoryGroups).filter((g) => g.items.length > 0);

  return (
    <div className="free-tools-hub" aria-label="Free Tools Directory">
      {/* Hero Header */}
      <header className="free-tools-header" style={{ textAlign: "center", marginBottom: "3rem", padding: "2rem 0" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(52, 211, 153, 0.1)", border: "1px solid rgba(52, 211, 153, 0.25)", color: "#34d399", padding: "0.35rem 0.85rem", borderRadius: "9999px", fontSize: "0.85rem", fontWeight: 600, marginBottom: "1rem" }}>
          <span>🎁 100% Free & Freemium Selection</span>
        </div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "0.75rem", letterSpacing: "-0.03em" }}>
          Best Free Software & Alternatives (2026)
        </h1>
        <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)", maxWidth: "680px", margin: "0 auto" }}>
          Hand-picked free tiers and open-source tools to scale your business, workflow, and projects without paying a dime.
        </p>
      </header>

      {/* Categorized Groups */}
      <div className="free-groups-container" style={{ display: "flex", flexDirection: "column", gap: "3.5rem" }}>
        {activeGroups.map((group) => (
          <section key={group.categorySlug} className="free-category-section">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.75rem" }}>
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  Top Free {group.categoryName} Software
                </h2>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Zero-cost & high-value alternatives for {group.categoryName.toLowerCase()}
                </span>
              </div>
              <Link
                href={`/${locale}/category/${group.categorySlug}?pricing=free`}
                className="view-all-link"
                style={{ fontSize: "0.9rem", color: "var(--accent-primary)", fontWeight: 600 }}
              >
                View all free {group.categoryName} →
              </Link>
            </div>

            <div className="grid-cards">
              {group.items.map((sw) => (
                <div key={sw.id} className="software-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem", marginBottom: "1rem" }}>
                      <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                        {sw.logo_url ? (
                          <Image src={sw.logo_url} alt={sw.name} width={48} height={48} style={{ objectFit: "contain" }} />
                        ) : (
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(sw.name)}&background=random&color=fff&size=96&rounded=true`}
                            alt={sw.name}
                            width={48}
                            height={48}
                          />
                        )}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          <Link href={`/${locale}/${sw.slug}`} style={{ color: "var(--text-primary)" }}>
                            {sw.name}
                          </Link>
                        </h3>
                        <span className="badge badge-featured" style={{ background: "rgba(52, 211, 153, 0.12)", color: "#34d399", fontSize: "0.75rem", marginTop: "0.25rem", display: "inline-block" }}>
                          Free Tier Available
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "1rem" }}>
                      {sw.tagline || "Powerful free software with scalable features for teams and individuals."}
                    </p>
                  </div>

                  <div>
                    {sw.avg_rating && sw.review_count > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", fontSize: "0.85rem" }}>
                        <StarRating rating={sw.avg_rating} size="xs" />
                        <span style={{ fontWeight: 600 }}>{formatRating(sw.avg_rating)}</span>
                        <span style={{ color: "var(--text-muted)" }}>({formatCount(sw.review_count)})</span>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: "0.5rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-subtle)" }}>
                      <Link href={`/${locale}/${sw.slug}`} className="btn btn-secondary btn-sm" style={{ flex: 1, textAlign: "center" }}>
                        Alternatives
                      </Link>
                      <a
                        href={`/api/go/${sw.slug}`}
                        target="_blank"
                        rel="noopener noreferrer nofollow sponsored"
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, textAlign: "center" }}
                      >
                        Try Free →
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
