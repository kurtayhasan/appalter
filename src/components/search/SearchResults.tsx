import { redirect } from "next/navigation";
import { searchSoftwaresCached } from "@/lib/cache/queries";
import { SoftwareCard } from "@/components/software/SoftwareCard";
import { FreeToolsHub } from "@/components/software/FreeToolsHub";
import { formatCount } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";

export async function SearchResults({ 
  locale, 
  pageProps, 
  tTitle, 
  tNoResults 
}: { 
  locale: string, 
  pageProps: { searchParams: Promise<any> },
  tTitle: string,
  tNoResults: string
}) {
  const searchParamsAwaited = await pageProps.searchParams;

  const query = typeof searchParamsAwaited.q === "string" ? searchParamsAwaited.q : "";
  const categoryId = typeof searchParamsAwaited.category === "string" ? searchParamsAwaited.category : undefined;
  const pricingId = typeof searchParamsAwaited.pricing === "string" ? searchParamsAwaited.pricing : undefined;

  // If user requested Free Tools without a specific query, show the rich Free Tools Hub showcase
  if (!query && pricingId === "free" && !categoryId) {
    return <FreeToolsHub locale={locale as Locale} />;
  }

  if (!query && !categoryId && !pricingId) {
    redirect(`/${locale}`);
  }

  const results = await searchSoftwaresCached({
    query,
    locale,
    category_id: categoryId,
    pricing_model_id: pricingId,
    limit: 24,
  });

  return (
    <>
      <header className="search-header" style={{ marginBottom: "2rem" }}>
        <h1 className="search-title" style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
          {query ? `Search results for "${query}"` : tTitle}
        </h1>
        <p className="search-meta" style={{ color: "var(--text-muted)" }}>
          {formatCount(results.length)} results found
        </p>
      </header>

      {results.length > 0 ? (
        <div className="grid-cards">
          {results.map((result: any) => {
            const softwareBasic = {
              id: result.id,
              slug: result.slug,
              name: result.name,
              tagline: result.tagline,
              short_description: result.short_description,
              logo_url: result.logo_url,
              avg_rating: result.avg_rating,
              review_count: result.review_count,
              alternative_count: result.alternative_count,
              starting_price: result.starting_price,
              price_currency: "USD",
              is_sponsored: result.is_sponsored,
              is_featured: result.is_featured,
              category_name: null,
              category_slug: null,
              pricing_model_slug: null,
              ai_features: result.ai_features || null,
            };

            return (
              <SoftwareCard
                key={result.id}
                software={softwareBasic}
                locale={locale as Locale}
                showCategory={false}
              />
            );
          })}
        </div>
      ) : (
        <div className="empty-state" style={{ padding: "4rem", textAlign: "center", background: "var(--bg-card)", borderRadius: "var(--radius-lg)" }}>
          <p style={{ fontSize: "1.25rem", color: "var(--text-secondary)" }}>{tNoResults}</p>
        </div>
      )}
    </>
  );
}
