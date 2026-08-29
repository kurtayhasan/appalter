// alternatives/page.tsx
// Tüm import'lar dosya başında (TypeScript hoisting kuralına uygun)
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { type Locale, routing } from "@/i18n/routing";
import { AlternativesList } from "@/components/software/AlternativesList";
import { getSoftwareBasic } from "@/lib/cache/queries";

import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { getLocalizedPath } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Route: /[locale]/[slug]/alternatives
// Shows all alternatives for a given software, paginated.
// Uses PPR: static shell (hero) + dynamic alternatives list (Suspense).
// ---------------------------------------------------------------------------
// ISR: 24-hour Edge CDN Cache
// ---------------------------------------------------------------------------
export const revalidate = 86400;

// ---------------------------------------------------------------------------
// generateStaticParams — pre-render the first page for top 500 softwares
// ---------------------------------------------------------------------------
export async function generateStaticParams(): Promise<
  Array<{ locale: string; slug: string }>
> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("invalid-domain") || !process.env.NEXT_PUBLIC_SUPABASE_URL) return [];

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("softwares")
    .select("slug")
    .eq("status", "published")
    .order("alternative_count", { ascending: false })
    .limit(500);

  if (!data || data.length === 0) return [];

  return routing.locales.flatMap((locale) =>
    data.map((row: any) => ({ locale, slug: row.slug }))
  );
}

interface Props {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

// ---------------------------------------------------------------------------
// generateMetadata
// ---------------------------------------------------------------------------
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "seo" });
  const software = await getSoftwareBasic(slug, locale);

  if (!software) return {};

  const year = 2026;
  const title = t("alternativesTitle", { name: software.name, year });
  const description = t("alternativesDescription", {
    name: software.name,
    count: software.alternative_count,
    year,
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://appalter.com";
  const canonicalUrl =
    locale === routing.defaultLocale
      ? `${siteUrl}/${slug}/alternatives`
      : `${siteUrl}/${locale}/${slug}/alternatives`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: Object.fromEntries(
        routing.locales.map((loc) => [
          loc,
          loc === routing.defaultLocale
            ? `${siteUrl}/${slug}/alternatives`
            : `${siteUrl}/${loc}/${slug}/alternatives`,
        ])
      ),
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonicalUrl,
    },
  };
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------
export default async function AlternativesPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "software" });

  const software = await getSoftwareBasic(slug, locale);
  if (!software) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://appalter.com";
  const canonicalUrl =
    locale === routing.defaultLocale
      ? `${siteUrl}/${slug}/alternatives`
      : `${siteUrl}/${locale}/${slug}/alternatives`;
  const softwareUrl =
    locale === routing.defaultLocale
      ? `${siteUrl}/${slug}`
      : `${siteUrl}/${locale}/${slug}`;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: `${siteUrl}${getLocalizedPath("/", locale)}` },
          { name: software.name, url: softwareUrl },
          { name: `Alternatives to ${software.name}`, url: canonicalUrl },
        ]}
      />

      <main>
        {/* Static shell — immediately rendered */}
        <section className="alternatives-hero">
          <h1>
            {t("bestAlternativesTo", {
              name: software.name,
              year: 2026,
            })}
          </h1>
          <p className="alternatives-count">
            {t("basedOnReviews", { count: software.alternative_count })}
          </p>
        </section>

        {/* Dynamic slot — streamed */}
        <Suspense fallback={<AlternativesListSkeleton />}>
          <AlternativesListWrapper
            softwareSlug={slug}
            locale={locale as Locale}
            searchParamsPromise={searchParams}
          />
        </Suspense>
      </main>
    </>
  );
}

async function AlternativesListWrapper({ softwareSlug, locale, searchParamsPromise }: { softwareSlug: string, locale: Locale, searchParamsPromise: Promise<any> }) {
  const { page } = await searchParamsPromise;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10));
  return <AlternativesList softwareSlug={softwareSlug} locale={locale} page={currentPage} />;
}

function AlternativesListSkeleton() {
  return (
    <div
      className="alternatives-skeleton"
      aria-busy="true"
      aria-label="Loading alternatives"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton-card" />
      ))}
    </div>
  );
}
