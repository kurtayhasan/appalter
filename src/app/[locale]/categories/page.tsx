import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getCategoriesCached } from "@/lib/cache/queries";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

import { getLocalizedPath } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://appalter.com";
  const canonicalUrl =
    locale === routing.defaultLocale ? `${siteUrl}/categories` : `${siteUrl}/${locale}/categories`;
    
  return {
    title: `All Software Categories | AppAlter`,
    description: "Browse all verified software categories to find the best tools and alternatives for your business.",
    alternates: {
      canonical: canonicalUrl,
      languages: Object.fromEntries(
        routing.locales.map((loc) => [
          loc,
          loc === routing.defaultLocale ? `${siteUrl}/categories` : `${siteUrl}/${loc}/categories`,
        ])
      ),
    },
    openGraph: {
      title: "All Software Categories | AppAlter",
      description: "Browse all verified software categories to find the best tools and alternatives for your business.",
      url: canonicalUrl,
      type: "website",
    },
  };
}

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://appalter.com";

  // Fetch all categories and filter for active ones with products (> 0)
  const categories = await getCategoriesCached();
  const activeCategories = categories
    .filter((cat) => (cat.software_count || 0) > 0)
    .sort((a, b) => b.software_count - a.software_count);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: `${baseUrl}${getLocalizedPath("/", locale)}` },
          { name: "Categories", url: `${baseUrl}${getLocalizedPath("/categories", locale)}` },
        ]}
      />
      <main className="category-page" style={{ padding: "4rem 0" }}>
        <div className="container">
          <header style={{ marginBottom: "3rem", textAlign: "center" }}>
            <h1 className="home-title" style={{ fontSize: "2.5rem", marginBottom: "1rem", letterSpacing: "-0.03em" }}>
              All Software Categories
            </h1>
            <p className="home-subtitle" style={{ fontSize: "1.125rem", color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto" }}>
              Explore our verified directory of SaaS and software categories to find the best tools for your workflow.
            </p>
          </header>

          <div className="grid-cards">
            {activeCategories.map((cat) => (
              <Link
                key={cat.id}
                href={getLocalizedPath(`/category/${cat.slug}`, locale)}
                className="category-card"
              >
                <div
                  className="category-icon"
                  aria-hidden="true"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    overflow: "hidden",
                  }}
                >
                  {cat.icon_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cat.icon_url}
                      alt={cat.name}
                      style={{ width: "24px", height: "24px", objectFit: "contain" }}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(cat.name)}&background=random&color=fff&size=96&rounded=true&bold=true&font-size=0.4`}
                      alt={cat.name}
                      style={{ width: "48px", height: "48px", objectFit: "contain" }}
                    />
                  )}
                </div>
                <div>
                  <h3 className="category-name" style={{ fontSize: "1.125rem", marginBottom: "0.25rem" }}>
                    {cat.name}
                  </h3>
                  <p className="category-count">{cat.software_count} products</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
