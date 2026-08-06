// src/app/[locale]/page.tsx
// Ana sayfa — Server Component (PPR ile render edilir).

import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getFeaturedSoftwaresCached, getCategoriesCached } from "@/lib/cache/queries";
import { SoftwareCard } from "@/components/software/SoftwareCard";
import { WebSiteJsonLd } from "@/components/seo/JsonLd";
import Link from "next/link";
import { Suspense } from "react";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "HomePage" });
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://appalter.com";

  return (
    <>
      <WebSiteJsonLd baseUrl={baseUrl} />

      <main className="home-page">
        {/* Hero Section */}
        <section className="home-hero">
          <div className="bg-grid-pattern"></div>
          <div className="container" style={{ position: 'relative', zIndex: 1 }}>
            <h1 className="home-title">{t("title")}</h1>
            <p className="home-subtitle">{t("subtitle")}</p>
            
            <div className="home-search-wrapper">
              <form action={`/${locale}/search`} className="search-form" role="search">
                <input
                  type="search"
                  name="q"
                  placeholder="Search 1,000,000+ software products..."
                  className="search-input"
                  aria-label="Search software"
                />
                <button type="submit" className="search-submit" aria-label="Search">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Featured Software (PPR ile anında yüklenir) */}
        <section className="home-section bg-secondary">
          <div className="container">
            <div className="home-section-header">
              <h2 className="home-section-title">{t("featuredSoftware")}</h2>
              <Link href={`/${locale}/search`} className="view-all-link">
                {t("viewAll")} →
              </Link>
            </div>
            
            <Suspense fallback={<div className="loading-skeleton grid-cards" />}>
              <FeaturedIsland locale={locale as Locale} />
            </Suspense>
          </div>
        </section>

        {/* Categories */}
        <section className="home-section">
          <div className="container">
            <div className="home-section-header">
              <h2 className="home-section-title">{t("popularCategories")}</h2>
              <Link href={`/${locale}/categories`} className="view-all-link">
                {t("viewAll")} →
              </Link>
            </div>
            
            <Suspense fallback={<div className="loading-skeleton grid-cards" />}>
              <CategoriesIsland locale={locale as Locale} />
            </Suspense>
          </div>
        </section>
      </main>
    </>
  );
}

// ---------------------------------------------------------------------------
// Dynamic Islands (Suspense ile asenkron yüklenir)
// ---------------------------------------------------------------------------

async function FeaturedIsland({ locale }: { locale: Locale }) {
  // En üstteki 6 featured yazılım
  const softwares = await getFeaturedSoftwaresCached(undefined, 6);

  if (softwares.length === 0) return null;

  return (
    <div className="grid-cards">
      {softwares.map((sw) => (
        <SoftwareCard
          key={sw.id}
          software={sw}
          locale={locale}
          variant="featured"
        />
      ))}
    </div>
  );
}

async function CategoriesIsland({ locale }: { locale: Locale }) {
  // Sadece en çok yazılım içeren ilk 6 kategoriyi göster
  const categories = await getCategoriesCached();
  const topCategories = categories
    .sort((a, b) => b.software_count - a.software_count)
    .slice(0, 6);

  return (
    <div className="grid-cards">
      {topCategories.map((cat) => (
        <Link
          key={cat.id}
          href={`/${locale}/category/${cat.slug}`}
          className="category-card"
        >
          <div className="category-icon" aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'transparent', overflow: 'hidden' }}>
            {cat.icon_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cat.icon_url} alt={cat.name} style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(cat.name)}&background=random&color=fff&size=80&rounded=true&bold=true&font-size=0.4`}
                alt={cat.name}
                style={{ width: '40px', height: '40px', objectFit: 'contain' }}
              />
            )}
          </div>
          <div>
            <h3 className="category-name">{cat.name}</h3>
            <p className="category-count">{cat.software_count} products</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
