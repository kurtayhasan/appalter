import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getCategoriesCached } from "@/lib/cache/queries";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "HomePage" });
  return {
    title: `All Software Categories | AppAlter`,
    description: "Browse all software categories to find the best tools and alternatives for your business.",
  };
}

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "HomePage" });
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://appalter.com";

  // Fetch all categories and sort by software count (descending)
  const categories = await getCategoriesCached();
  const sortedCategories = categories.sort((a, b) => b.software_count - a.software_count);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: `${baseUrl}/${locale}` },
          { name: "Categories", url: `${baseUrl}/${locale}/categories` },
        ]}
      />
      <main className="category-page" style={{ padding: "4rem 0" }}>
        <div className="container">
          <header style={{ marginBottom: "3rem", textAlign: "center" }}>
            <h1 className="home-title" style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
              All Categories
            </h1>
            <p className="home-subtitle" style={{ fontSize: "1.125rem", color: "var(--text-secondary)" }}>
              Explore our extensive directory of software categories to find the perfect tools.
            </p>
          </header>

          <div className="grid-cards">
            {sortedCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/${locale}/category/${cat.slug}`}
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
