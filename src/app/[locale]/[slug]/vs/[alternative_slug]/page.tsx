// vs/[alternative_slug]/page.tsx
// Tüm import'lar dosya başında
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { type Locale, routing } from "@/i18n/routing";
import { getSoftwareBasic } from "@/lib/cache/queries";

// ---------------------------------------------------------------------------
// Route: /[locale]/[slug]/vs/[alternative_slug]
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// generateStaticParams — top 1000 VS pairs
// ---------------------------------------------------------------------------
export async function generateStaticParams(): Promise<
  Array<{ locale: string; slug: string; alternative_slug: string }>
> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("invalid-domain") || !process.env.NEXT_PUBLIC_SUPABASE_URL) return [];

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("alternatives")
    .select(
      `
      software_id,
      alternative_id,
      software:softwares!alternatives_software_id_fkey (slug),
      alternative:softwares!alternatives_alternative_id_fkey (slug)
      `
    )
    .eq("is_approved", true)
    .order("similarity_score", { ascending: false })
    .limit(1000);

  if (!data || data.length === 0) return [];

  // Type the raw Supabase join result
  type Row = {
    software_id: string;
    alternative_id: string;
    software: { slug: string } | null;
    alternative: { slug: string } | null;
  };

  return routing.locales.flatMap((locale) =>
    (data as unknown as Row[]).flatMap((row) => {
      const slug = row.software?.slug;
      const alternative_slug = row.alternative?.slug;
      if (!slug || !alternative_slug) return [];
      return [{ locale, slug, alternative_slug }];
    })
  );
}

interface Props {
  params: Promise<{
    locale: string;
    slug: string;
    alternative_slug: string;
  }>;
}

// ---------------------------------------------------------------------------
// generateMetadata
// ---------------------------------------------------------------------------
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug, alternative_slug } = await params;
  const { getTranslations } = await import("next-intl/server");
  const t = await getTranslations({ locale, namespace: "seo" });

  const [software, alternative] = await Promise.all([
    getSoftwareBasic(slug),
    getSoftwareBasic(alternative_slug),
  ]);

  if (!software || !alternative) return {};

  const year = 2026;
  const title = t("compareTitle", {
    name: software.name,
    alternative: alternative.name,
    year,
  });
  const description = t("compareDescription", {
    name: software.name,
    alternative: alternative.name,
  });

  return {
    title,
    description,
    alternates: {
      canonical: `/${slug}/vs/${alternative_slug}`,
      languages: Object.fromEntries(
        routing.locales.map((loc) => [
          loc,
          `/${loc}/${slug}/vs/${alternative_slug}`,
        ])
      ),
    },
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------
export default async function VsPage({ params }: Props) {
  const { locale, slug, alternative_slug } = await params;

  // Self-comparison guard
  if (slug === alternative_slug) notFound();

  const [software, alternative] = await Promise.all([
    getSoftwareBasic(slug),
    getSoftwareBasic(alternative_slug),
  ]);

  if (!software || !alternative) notFound();

  return (
    <main>
      {/* Static shell — hero with both software logos */}
      <section className="vs-hero">
        <h1>
          {software.name} vs {alternative.name}
        </h1>
        <div className="vs-brands">
          <div className="vs-brand">
            {software.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={software.logo_url}
                alt={`${software.name} logo`}
                width={64}
                height={64}
              />
            )}
            <span>{software.name}</span>
          </div>
          <span className="vs-divider" aria-hidden="true">
            VS
          </span>
          <div className="vs-brand">
            {alternative.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={alternative.logo_url}
                alt={`${alternative.name} logo`}
                width={64}
                height={64}
              />
            )}
            <span>{alternative.name}</span>
          </div>
        </div>
      </section>

      {/* Dynamic comparison table — streamed */}
      <Suspense fallback={<ComparisonSkeleton />}>
        <ComparisonIsland
          softwareSlug={slug}
          alternativeSlug={alternative_slug}
          locale={locale as Locale}
        />
      </Suspense>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Dynamic Island — deferred inside Suspense
// ---------------------------------------------------------------------------
async function ComparisonIsland({
  softwareSlug,
  alternativeSlug,
  locale,
}: {
  softwareSlug: string;
  alternativeSlug: string;
  locale: Locale;
}) {
  const { ComparisonTable } = await import(
    "@/components/software/ComparisonTable"
  );
  return (
    <ComparisonTable
      softwareSlug={softwareSlug}
      alternativeSlug={alternativeSlug}
      locale={locale}
    />
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function ComparisonSkeleton() {
  return (
    <div className="comparison-skeleton" aria-busy="true">
      <div className="skeleton-row header" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="skeleton-row" />
      ))}
    </div>
  );
}
