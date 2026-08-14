// [slug]/page.tsx — Master Software Page
// Tüm import'lar dosya başında (TypeScript ESM hoisting kuralı)
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import type { Metadata } from "next";
import { type Locale, routing } from "@/i18n/routing";
import { SoftwareHero } from "@/components/software/SoftwareHero";
import { AIDecisionCard } from "@/components/software/AIDecisionCard";
import { SoftwareJsonLd } from "@/components/seo/JsonLd";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { getSoftwareBySlugCached } from "@/lib/cache/queries";
import { AdBanner } from "@/components/ads/AdBanner";

// ---------------------------------------------------------------------------
// Route: /[locale]/[slug]
// Master dynamic software page with PPR + concurrent streaming.
//
// Render strategy:
//   Static Shell (PPR)  → Software hero + meta tags → served from CDN
//   Dynamic Island 1    → Alternatives list           → streamed
//   Dynamic Island 2    → Screenshots carousel        → streamed
//   Dynamic Island 3    → Reviews section             → streamed
//   Dynamic Island 4    → FAQs                        → streamed
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// generateStaticParams — top 10,000 softwares pre-rendered at build
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
    .order("view_count", { ascending: false })
    .limit(10000);

  if (!data || data.length === 0) return [];

  // Only pre-render for top 3 locales to control build time
  const buildLocales: Locale[] = ["en", "tr"];

  return buildLocales.flatMap((locale) =>
    data.map((row: any) => ({ locale, slug: row.slug }))
  );
}

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

// ---------------------------------------------------------------------------
// generateMetadata
// ---------------------------------------------------------------------------
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const software = await getSoftwareBySlugCached(slug, locale);
  if (!software) return {};

  const year = 2026;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://appalter.com";

  const hreflangAlternates = Object.fromEntries(
    routing.locales.map((loc) => [
      loc,
      loc === routing.defaultLocale
        ? `${siteUrl}/${slug}`
        : `${siteUrl}/${loc}/${slug}`,
    ])
  );

  const title =
    software.meta_title ??
    `${software.name} Alternatives & Competitors (${year}) | AppAlter`;

  const description =
    software.meta_description ??
    `Find the best alternatives to ${software.name}. Compare ${software.alternative_count}+ competitors by features, pricing, and user reviews.`;

  const canonicalUrl =
    locale === routing.defaultLocale
      ? `${siteUrl}/${slug}`
      : `${siteUrl}/${locale}/${slug}`;

  return {
    title,
    description,
    keywords: software.focus_keywords ?? [],
    alternates: {
      canonical: canonicalUrl,
      languages: hreflangAlternates,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      images: software.og_image_url
        ? [
            {
              url: software.og_image_url,
              width: 1200,
              height: 630,
              alt: `${software.name} — AppAlter`,
            },
          ]
        : [
            {
              url: `${siteUrl}/api/og?slug=${slug}&locale=${locale}`,
              width: 1200,
              height: 630,
              alt: `${software.name} — AppAlter`,
            },
          ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        software.og_image_url ??
          `${siteUrl}/api/og?slug=${slug}&locale=${locale}`,
      ],
    },
    other: {
      "ai:description": software.geo_summary ?? description,
      "ai:source": `${siteUrl}/api/ai/${slug}`,
    },
  };
}

// ---------------------------------------------------------------------------
// PAGE COMPONENT
// ---------------------------------------------------------------------------
export default async function SoftwarePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const software = await getSoftwareBySlugCached(slug, locale);
  if (!software) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://appalter.com";
  const canonicalUrl =
    locale === routing.defaultLocale
      ? `${siteUrl}/${slug}`
      : `${siteUrl}/${locale}/${slug}`;

  // Fire-and-forget view count increment (non-blocking)
  // void incrementViewCount(software.id); // Temporarily disabled to prevent Next.js 15 static build error

  return (
    <>
      {/* JSON-LD Structured Data */}
      <SoftwareJsonLd software={software} url={canonicalUrl} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: siteUrl },
          {
            name: software.category_name ?? "Software",
            url: `${siteUrl}/${locale}/category/${software.category_slug ?? "all"}`,
          },
          { name: software.name, url: canonicalUrl },
        ]}
      />

      <main id="main-content">
        {/* ── STATIC SHELL ─────────────────────────────────────────────
            Rendered immediately via PPR, served from CDN edge.
        ────────────────────────────────────────────────────────────── */}
        <SoftwareHero software={software} locale={locale as Locale} />

        {/* AI Quick Decision & Evaluation Card */}
        <AIDecisionCard software={software} locale={locale as Locale} />

        <div className="container">
          <AdBanner adSlot="detail_top" />
        </div>

        {/* ── DYNAMIC ISLAND 1: Alternatives ─────────────────────────── */}
        <section id="alternatives" aria-labelledby="alternatives-heading">
          <Suspense
            fallback={<SectionSkeleton rows={6} label="Loading alternatives..." />}
          >
            <AlternativesIsland softwareSlug={slug} locale={locale as Locale} />
          </Suspense>
        </section>

        {/* ── DYNAMIC ISLAND 2: Screenshots ──────────────────────────── */}
        <section id="screenshots" aria-labelledby="screenshots-heading">
          <Suspense fallback={<GallerySkeleton />}>
            <ScreenshotsIsland softwareId={software.id} />
          </Suspense>
        </section>

        {/* ── DYNAMIC ISLAND 3: Reviews ──────────────────────────────── */}
        <section id="reviews" aria-labelledby="reviews-heading">
          <Suspense
            fallback={<SectionSkeleton rows={3} label="Loading reviews..." />}
          >
            <ReviewsIsland softwareId={software.id} locale={locale as Locale} />
          </Suspense>
        </section>

        {/* ── DYNAMIC ISLAND 4: FAQs → FAQPage JSON-LD ─────────────── */}
        <section id="faqs" aria-labelledby="faqs-heading">
          <Suspense
            fallback={<SectionSkeleton rows={4} label="Loading FAQs..." />}
          >
            <FAQIsland
              softwareId={software.id}
              softwareName={software.name}
              locale={locale as Locale}
            />
          </Suspense>
        </section>
      </main>
    </>
  );
}

// ---------------------------------------------------------------------------
// Dynamic Island Components (async Server Components — deferred inside Suspense)
// Named distinctly to avoid naming collision with the real components.
// ---------------------------------------------------------------------------

async function AlternativesIsland({
  softwareSlug,
  locale,
}: {
  softwareSlug: string;
  locale: Locale;
}) {
  const { AlternativesList } = await import(
    "@/components/software/AlternativesList"
  );
  return <AlternativesList softwareSlug={softwareSlug} locale={locale} page={1} />;
}

async function ScreenshotsIsland({ softwareId }: { softwareId: string }) {
  const { ScreenshotsGallery } = await import(
    "@/components/software/ScreenshotsGallery"
  );
  return <ScreenshotsGallery softwareId={softwareId} />;
}

async function ReviewsIsland({
  softwareId,
  locale,
}: {
  softwareId: string;
  locale: Locale;
}) {
  const { ReviewsSection } = await import(
    "@/components/software/ReviewsSection"
  );
  return <ReviewsSection softwareId={softwareId} locale={locale} />;
}

async function FAQIsland({
  softwareId,
  softwareName,
  locale,
}: {
  softwareId: string;
  softwareName: string;
  locale: Locale;
}) {
  const { FAQSection } = await import("@/components/software/FAQSection");
  return (
    <FAQSection
      softwareId={softwareId}
      softwareName={softwareName}
      locale={locale}
    />
  );
}

// ---------------------------------------------------------------------------
// Skeleton components
// ---------------------------------------------------------------------------
function SectionSkeleton({ rows, label }: { rows: number; label: string }) {
  return (
    <div className="section-skeleton" aria-busy="true" aria-label={label}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton-row"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}

function GallerySkeleton() {
  return (
    <div
      className="gallery-skeleton"
      aria-busy="true"
      aria-label="Loading screenshots..."
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="skeleton-image" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Non-blocking view count increment
// ---------------------------------------------------------------------------
async function incrementViewCount(softwareId: string): Promise<void> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) return;

    await fetch(`${supabaseUrl}/rest/v1/rpc/increment_software_view`, {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_id: softwareId }),
      cache: "no-store",
    });
  } catch {
    // Never throw on analytics failure
  }
}
