// category/[category_slug]/page.tsx
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { type Locale, routing } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCategoryCached, getCategorySoftwaresCached } from "@/lib/cache/queries";
import { SoftwareCard } from "@/components/software/SoftwareCard";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import Link from "next/link";


type SortOption = "relevance" | "rating" | "reviews" | "newest" | undefined;

interface Props {
  params: Promise<{ locale: string; category_slug: string }>;
  searchParams: Promise<{
    page?: string;
    pricing?: string;
    platform?: string;
    sort?: string;
  }>;
}

export async function generateStaticParams(): Promise<
  Array<{ locale: string; category_slug: string }>
> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("invalid-domain") || !process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("categories")
    .select("slug")
    .eq("is_active", true);

  if (!data || data.length === 0) return [];

  // Limit locales to save build time
  const buildLocales: Locale[] = ["en", "tr"];

  return buildLocales.flatMap((locale) =>
    data.map((row: any) => ({ locale, category_slug: row.slug }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, category_slug } = await params;
  setRequestLocale(locale);
  
  // Use a fallback if translation is not found
  let title = "Software Category";
  let description = "Find the best software alternatives in this category.";
  
  try {
    const t = await getTranslations({ locale, namespace: "seo" });
    const category = await getCategoryCached(category_slug);
    if (category) {
      const year = 2026;
      title = t("categoryTitle", { category: category.name, year });
      description = t("categoryDescription", {
        category: category.name,
        count: category.software_count,
      });
    }
  } catch (e) {
    // Translation fallback
    const category = await getCategoryCached(category_slug);
    if (category) {
      title = `Best ${category.name} Software & Tools (${2026})`;
      description = `Compare ${category.software_count} best ${category.name} tools. Find alternatives and read user reviews.`;
    }
  }

  return {
    title,
    description,
    alternates: {
      canonical: `/category/${category_slug}`,
      languages: Object.fromEntries(
        routing.locales.map((loc) => [
          loc,
          `/${loc}/category/${category_slug}`,
        ])
      ),
    },
    openGraph: { title, description, type: "website" },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { locale, category_slug } = await params;
  setRequestLocale(locale);

  const category = await getCategoryCached(category_slug);
  if (!category) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://appalter.com";

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: siteUrl },
          { name: "Categories", url: `${siteUrl}/${locale}/categories` },
          { name: category.name, url: `${siteUrl}/${locale}/category/${category.slug}` },
        ]}
      />

      <main className="category-page">
        {/* Static shell */}
        <section className="home-hero" style={{ padding: "4rem 0 2rem" }}>
          <div className="bg-grid-pattern"></div>
          <div className="container" style={{ position: 'relative', zIndex: 1 }}>
            <h1 className="home-title" style={{ fontSize: "3rem", marginBottom: "1rem" }}>
              {category.name} Software
            </h1>
            {category.description && (
              <p className="home-subtitle" style={{ marginBottom: "1.5rem" }}>
                {category.description}
              </p>
            )}
            <span className="badge badge-featured">
              {category.software_count} tools available
            </span>
          </div>
        </section>

        {/* Dynamic software list — streamed */}
        <section className="container" style={{ padding: "2rem 1.5rem 4rem" }}>
          <Suspense fallback={<CategorySkeleton />}>
            <CategorySoftwareList
              categorySlug={category_slug}
              locale={locale as Locale}
              searchParamsPromise={searchParams}
            />
          </Suspense>
        </section>
      </main>
    </>
  );
}

async function CategorySoftwareList({
  categorySlug,
  locale,
  searchParamsPromise,
}: {
  categorySlug: string;
  locale: Locale;
  searchParamsPromise: Promise<any>;
}) {
  const { page, pricing, platform, sort } = await searchParamsPromise;
  
  const softwares = await getCategorySoftwaresCached({
    categorySlug,
    page: parseInt(page ?? "1", 10),
    pricing,
    platform,
    sort,
  });

  if (!softwares.length) {
    return (
      <div className="empty-state">
        <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <p>No tools available yet. We're currently reviewing software for this category.</p>
        <Link href={`/${locale}/search`} className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }}>
          Explore all software
        </Link>
      </div>
    );
  }

  return (
    <div className="grid-cards">
      {softwares.map((sw: any) => (
        <SoftwareCard key={sw.id} software={sw} locale={locale} />
      ))}
    </div>
  );
}

function CategorySkeleton() {
  return (
    <div className="grid-cards" aria-busy="true">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="software-card" style={{ height: "300px", background: "var(--bg-card)", animation: "pulse 2s infinite" }} />
      ))}
    </div>
  );
}

