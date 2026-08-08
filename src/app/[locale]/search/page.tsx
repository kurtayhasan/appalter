// src/app/[locale]/search/page.tsx
// Arama Sonuçları Sayfası — Hibrit Arama (FTS + Vector).
// Server Component. URL query parametrelerine göre veriyi çeker.

import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { type Locale, routing } from "@/i18n/routing";
import { searchSoftwaresCached } from "@/lib/cache/queries";
import { SoftwareCard } from "@/components/software/SoftwareCard";
import { formatCount } from "@/lib/utils";
import { SearchResults } from "@/components/search/SearchResults";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { q } = await searchParams;
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://appalter.com";
  const query = typeof q === 'string' ? q : '';
  
  const title = query 
    ? `Search results for "${query}" | AppAlter`
    : "Search Software & Alternatives | AppAlter";
    
  return {
    title,
    description: "Search across thousands of software products to find the best alternatives.",
    robots: {
      index: false,
      follow: true,
    },
  };
}

interface SearchPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}



export default async function SearchPage(props: SearchPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "SearchPage" });

  return (
    <main className="search-page container" style={{ padding: "3rem 1.5rem" }}>
      <Suspense fallback={
        <div style={{ padding: "4rem", textAlign: "center" }}>
          <p>Loading search results...</p>
        </div>
      }>
        <SearchResults locale={locale} pageProps={props} tTitle={t("title")} tNoResults={t("noResults")} />
      </Suspense>
    </main>
  );
}


