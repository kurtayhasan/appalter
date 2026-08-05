// @ts-nocheck
// lib/cache/queries.ts
// AppAlter merkezi veri erişim katmanı.
// Her public sorgu:
//   1. unstable_cache ile Next.js Data Cache'e alınır
//   2. İlgili cache tag'leri ile etiketlenir
//   3. Uygun revalidate süresiyle yapılandırılır
//   4. Tam Supabase tipiyle döner
// Mutasyonlar: revalidateTag() çağrıları için lib/cache/mutations.ts dosyasına bakın.

import "server-only";
import { unstable_cache } from "next/cache";
import { createStaticClient } from "@/lib/supabase/server";
import type {
  SoftwareDetail,
  SoftwareBasic,
  AlternativeItem,
  SoftwareReview,
  SoftwareFAQ,
  SoftwareScreenshot,
  Category,
  SearchResult,
  SearchParams,
} from "@/types";
import {
  softwareTag,
  alternativesTag,
  reviewsTag,
  faqsTag,
  screenshotsTag,
  featuresTag,
  prosConsTag,
  categoryTag,
  CATEGORIES_TAG,
  FEATURED_TAG,
  SITEMAP_TAG,
  SEARCH_TAG,
  REVALIDATE,
} from "./tags";

// =============================================================================
// SECTION 1: SOFTWARE QUERIES
// =============================================================================

// ---------------------------------------------------------------------------
// getSoftwareBySlugCached
// Ana software sayfası için tam detay — PPR statik shell için kullanılır.
// ---------------------------------------------------------------------------
export async function getSoftwareBySlugCached(
  slug: string
): Promise<SoftwareDetail | null> {
  return unstable_cache(
    async () => {
      const supabase = createStaticClient();

      const { data, error } = await supabase
        .rpc("get_software_by_slug", { p_slug: slug })
        .single();

      if (error || !data) {
        // Soft 404 — null döner, page.tsx notFound() çağırır
        return null;
      }

      // Supabase RPC döndürdüğü tipi SoftwareDetail'e map et
      return data as unknown as SoftwareDetail;
    },
    // Cache key: slug bazlı unique
    [`software-detail-${slug}`],
    {
      tags: [softwareTag(slug)],
      revalidate: REVALIDATE.STANDARD, // 1 saat
    }
  )();
}

// ---------------------------------------------------------------------------
// getSoftwareBasic
// Kart görünümü ve breadcrumb için hafif fetch.
// generateMetadata ve VS sayfaları bu fonksiyonu kullanır.
// ---------------------------------------------------------------------------
export async function getSoftwareBasic(
  slug: string
): Promise<SoftwareBasic | null> {
  return unstable_cache(
    async () => {
      const supabase = createStaticClient();

      const { data, error } = await supabase
        .from("softwares")
        .select(
          `
          id, slug, name, tagline, short_description, logo_url,
          avg_rating, review_count, alternative_count,
          starting_price, price_currency, is_sponsored, is_featured,
          categories!softwares_category_id_fkey (name, slug),
          pricing_models!softwares_pricing_model_id_fkey (slug)
          `
        )
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error || !data) return null;

      // Join verilerini flatten et
      const category = Array.isArray(data.categories)
        ? data.categories[0]
        : data.categories;
      const pricingModel = Array.isArray(data.pricing_models)
        ? data.pricing_models[0]
        : data.pricing_models;

      return {
        id: data.id,
        slug: data.slug,
        name: data.name,
        tagline: data.tagline,
        short_description: data.short_description,
        logo_url: data.logo_url,
        avg_rating: data.avg_rating,
        review_count: data.review_count,
        alternative_count: data.alternative_count,
        starting_price: data.starting_price,
        price_currency: data.price_currency,
        is_sponsored: data.is_sponsored,
        is_featured: data.is_featured,
        category_name: (category as { name: string } | null)?.name ?? null,
        category_slug: (category as { slug: string } | null)?.slug ?? null,
        pricing_model_slug: (pricingModel as { slug: string } | null)?.slug ?? null,
      } satisfies SoftwareBasic;
    },
    [`software-basic-${slug}`],
    {
      tags: [softwareTag(slug)],
      revalidate: REVALIDATE.STANDARD,
    }
  )();
}

// ---------------------------------------------------------------------------
// getFeaturedSoftwaresCached
// Ana sayfa hero ve kategori sayfaları için öne çıkan yazılımlar.
// ---------------------------------------------------------------------------
export async function getFeaturedSoftwaresCached(
  categoryId?: string,
  limit = 12
): Promise<SoftwareBasic[]> {
  const cacheKey = categoryId
    ? `featured-softwares-${categoryId}-${limit}`
    : `featured-softwares-all-${limit}`;

  return unstable_cache(
    async () => {
      const supabase = createStaticClient();

      const { data, error } = await supabase.rpc("get_featured_softwares", {
        p_category_id: categoryId ?? null,
        p_limit: limit,
      });

      if (error || !data) return [];

      return (data as unknown as SoftwareBasic[]);
    },
    [cacheKey],
    {
      tags: [FEATURED_TAG, ...(categoryId ? [categoryTag(categoryId)] : [])],
      revalidate: REVALIDATE.FREQUENT, // 5 dakika
    }
  )();
}

// =============================================================================
// SECTION 2: ALTERNATIVES QUERIES
// =============================================================================

// ---------------------------------------------------------------------------
// getAlternativesCached
// Bir software için alternatifler — /[slug]/alternatives sayfasında kullanılır.
// ---------------------------------------------------------------------------
export async function getAlternativesCached(
  softwareSlug: string,
  page = 1,
  limit = 12
): Promise<{ items: AlternativeItem[]; total: number }> {
  const offset = (page - 1) * limit;

  return unstable_cache(
    async () => {
      const supabase = createStaticClient();

      const { data, error } = await supabase.rpc(
        "get_alternatives_for_software",
        {
          p_slug: softwareSlug,
          p_limit: limit,
          p_offset: offset,
        }
      );

      if (error || !data) return { items: [], total: 0 };

      // Toplam alternatif sayısını software kaydından al
      const { data: countData } = await supabase
        .from("softwares")
        .select("alternative_count")
        .eq("slug", softwareSlug)
        .eq("status", "published")
        .single();

      return {
        items: data as unknown as AlternativeItem[],
        total: countData?.alternative_count ?? data.length,
      };
    },
    [`alternatives-${softwareSlug}-page-${page}-limit-${limit}`],
    {
      tags: [alternativesTag(softwareSlug)],
      revalidate: REVALIDATE.STANDARD,
    }
  )();
}

// ---------------------------------------------------------------------------
// getComparisonDataCached
// VS sayfası için iki software'in karşılaştırma verisi.
// ---------------------------------------------------------------------------
export async function getComparisonDataCached(
  softwareSlug: string,
  alternativeSlug: string
): Promise<{
  software: SoftwareDetail | null;
  alternative: SoftwareDetail | null;
  relation: AlternativeItem | null;
}> {
  return unstable_cache(
    async () => {
      const supabase = createStaticClient();

      // Paralel fetch — bağımsız sorgular eş zamanlı çalışır
      const [softwareResult, alternativeResult, relationResult] =
        await Promise.all([
          supabase
            .rpc("get_software_by_slug", { p_slug: softwareSlug })
            .single(),
          supabase
            .rpc("get_software_by_slug", { p_slug: alternativeSlug })
            .single(),
          supabase.rpc("get_alternatives_for_software", {
            p_slug: softwareSlug,
            p_limit: 1,
            p_offset: 0,
          }),
        ]);

      // Alternatif yönünde ilişkiyi bul
      const relationItems = relationResult.data as unknown as AlternativeItem[];
      const relation =
        relationItems?.find(
          (r) => r.alternative_slug === alternativeSlug
        ) ?? null;

      return {
        software: softwareResult.data as unknown as SoftwareDetail | null,
        alternative: alternativeResult.data as unknown as SoftwareDetail | null,
        relation,
      };
    },
    [`comparison-${softwareSlug}-vs-${alternativeSlug}`],
    {
      tags: [
        softwareTag(softwareSlug),
        softwareTag(alternativeSlug),
        alternativesTag(softwareSlug),
      ],
      revalidate: REVALIDATE.STANDARD,
    }
  )();
}

// =============================================================================
// SECTION 3: CONTENT QUERIES (Reviews, FAQs, Screenshots)
// =============================================================================

// ---------------------------------------------------------------------------
// getReviewsCached
// ---------------------------------------------------------------------------
export async function getReviewsCached(
  softwareId: string,
  locale = "en",
  page = 1,
  limit = 10
): Promise<{ items: SoftwareReview[]; total: number }> {
  const offset = (page - 1) * limit;

  return unstable_cache(
    async () => {
      const supabase = createStaticClient();

      // Sayfa verisi
      const { data, error } = await supabase
        .from("software_reviews")
        .select(
          `id, software_id, user_id, reviewer_name, reviewer_role,
           reviewer_avatar, rating, title, body, source, is_verified,
           is_featured, helpful_count, locale, created_at`
        )
        .eq("software_id", softwareId)
        .eq("is_approved", true)
        .or(`locale.eq.${locale},locale.eq.en`)
        .order("is_featured", { ascending: false })
        .order("helpful_count", { ascending: false })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      // Toplam sayım — ayrı sorgu (range + count aynı anda çalışmaz iyi)
      const { count } = await supabase
        .from("software_reviews")
        .select("id", { count: "exact", head: true })
        .eq("software_id", softwareId)
        .eq("is_approved", true);

      if (error || !data) return { items: [], total: 0 };

      return {
        items: data as unknown as SoftwareReview[],
        total: count ?? 0,
      };
    },
    [`reviews-${softwareId}-${locale}-page-${page}`],
    {
      tags: [reviewsTag(softwareId)],
      revalidate: REVALIDATE.FREQUENT,
    }
  )();
}

// ---------------------------------------------------------------------------
// getFAQsCached
// ---------------------------------------------------------------------------
export async function getFAQsCached(
  softwareId: string,
  locale = "en"
): Promise<SoftwareFAQ[]> {
  return unstable_cache(
    async () => {
      const supabase = createStaticClient();

      const { data, error } = await supabase
        .from("software_faqs")
        .select("id, software_id, question, answer, sort_order, is_featured, locale")
        .eq("software_id", softwareId)
        .or(`locale.eq.${locale},locale.eq.en`)
        .order("is_featured", { ascending: false })
        .order("sort_order", { ascending: true })
        .limit(20);

      if (error || !data) return [];

      return data as unknown as SoftwareFAQ[];
    },
    [`faqs-${softwareId}-${locale}`],
    {
      tags: [faqsTag(softwareId)],
      revalidate: REVALIDATE.SLOW,
    }
  )();
}

// ---------------------------------------------------------------------------
// getScreenshotsCached
// ---------------------------------------------------------------------------
export async function getScreenshotsCached(
  softwareId: string,
  locale?: string
): Promise<SoftwareScreenshot[]> {
  return unstable_cache(
    async () => {
      const supabase = createStaticClient();

      let query = supabase
        .from("software_screenshots")
        .select(
          "id, software_id, url, thumb_url, alt_text, caption, width, height, sort_order"
        )
        .eq("software_id", softwareId)
        .order("sort_order", { ascending: true })
        .limit(12);

      if (locale) {
        query = query.or(`locale.is.null,locale.eq.${locale}`);
      }

      const { data, error } = await query;

      if (error || !data) return [];

      return data as unknown as SoftwareScreenshot[];
    },
    [`screenshots-${softwareId}-${locale ?? "all"}`],
    {
      tags: [screenshotsTag(softwareId)],
      revalidate: REVALIDATE.SLOW,
    }
  )();
}

// ---------------------------------------------------------------------------
// getFeaturesCached
// ---------------------------------------------------------------------------
export async function getFeaturesCached(
  softwareId: string,
  locale = "en"
): Promise<
  Array<{
    id: string;
    name: string;
    description: string | null;
    icon_url: string | null;
    is_core: boolean;
    is_unique: boolean;
    sort_order: number;
  }>
> {
  return unstable_cache(
    async () => {
      const supabase = createStaticClient();

      const { data, error } = await supabase
        .from("software_features")
        .select(
          "id, name, description, icon_url, is_core, is_unique, sort_order"
        )
        .eq("software_id", softwareId)
        .or(`locale.eq.${locale},locale.eq.en`)
        .order("is_core", { ascending: false })
        .order("sort_order", { ascending: true })
        .limit(30);

      if (error || !data) return [];

      return data;
    },
    [`features-${softwareId}-${locale}`],
    {
      tags: [featuresTag(softwareId)],
      revalidate: REVALIDATE.SLOW,
    }
  )();
}

// ---------------------------------------------------------------------------
// getProsConsCached
// ---------------------------------------------------------------------------
export async function getProsConsCached(
  softwareId: string,
  locale = "en"
): Promise<{
  pros: Array<{ id: string; content: string; upvotes: number }>;
  cons: Array<{ id: string; content: string; upvotes: number }>;
}> {
  return unstable_cache(
    async () => {
      const supabase = createStaticClient();

      const { data, error } = await supabase
        .from("software_pros_cons")
        .select("id, type, content, upvotes, sort_order")
        .eq("software_id", softwareId)
        .or(`locale.eq.${locale},locale.eq.en`)
        .order("upvotes", { ascending: false })
        .order("sort_order", { ascending: true })
        .limit(20);

      if (error || !data) return { pros: [], cons: [] };

      const pros = data
        .filter((r) => r.type === "pro")
        .map((r) => ({ id: r.id, content: r.content, upvotes: r.upvotes }));

      const cons = data
        .filter((r) => r.type === "con")
        .map((r) => ({ id: r.id, content: r.content, upvotes: r.upvotes }));

      return { pros, cons };
    },
    [`pros-cons-${softwareId}-${locale}`],
    {
      tags: [prosConsTag(softwareId)],
      revalidate: REVALIDATE.SLOW,
    }
  )();
}

// =============================================================================
// SECTION 4: CATEGORY QUERIES
// =============================================================================

// ---------------------------------------------------------------------------
// getCategoriesCached — tüm aktif kategoriler
// ---------------------------------------------------------------------------
export async function getCategoriesCached(): Promise<Category[]> {
  return unstable_cache(
    async () => {
      const supabase = createStaticClient();

      const { data, error } = await supabase
        .from("categories")
        .select(
          "id, slug, name, description, icon_url, image_url, software_count, is_featured, parent_id"
        )
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error || !data) return [];

      return data as unknown as Category[];
    },
    ["all-categories"],
    {
      tags: [CATEGORIES_TAG],
      revalidate: REVALIDATE.SLOW,
    }
  )();
}

// ---------------------------------------------------------------------------
// getCategoryCached — tek kategori
// ---------------------------------------------------------------------------
export async function getCategoryCached(
  slug: string
): Promise<Category | null> {
  return unstable_cache(
    async () => {
      const supabase = createStaticClient();

      const { data, error } = await supabase
        .from("categories")
        .select(
          "id, slug, name, description, icon_url, image_url, software_count, is_featured, parent_id"
        )
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (error || !data) return null;

      return data as unknown as Category;
    },
    [`category-${slug}`],
    {
      tags: [categoryTag(slug), CATEGORIES_TAG],
      revalidate: REVALIDATE.SLOW,
    }
  )();
}

// ---------------------------------------------------------------------------
// getCategorySoftwaresCached — kategori sayfası için filtrelenmiş liste
// ---------------------------------------------------------------------------
export type CategorySoftwareSort =
  | "relevance"
  | "rating"
  | "reviews"
  | "newest"
  | undefined;

export async function getCategorySoftwaresCached(params: {
  categorySlug: string;
  page?: number;
  pricing?: string;
  platform?: string;
  sort?: CategorySoftwareSort;
  limit?: number;
}): Promise<SoftwareBasic[]> {
  const {
    categorySlug,
    page = 1,
    pricing,
    platform,
    sort = "relevance",
    limit = 24,
  } = params;

  const offset = (page - 1) * limit;
  const cacheKey = `category-softwares-${categorySlug}-${page}-${pricing ?? "all"}-${platform ?? "all"}-${sort}`;

  return unstable_cache(
    async () => {
      const supabase = createStaticClient();

      // Kategori ID'sini slug'dan çöz
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", categorySlug)
        .single();

      if (!cat) return [];

      // Temel sorgu
      let query = supabase
        .from("softwares")
        .select(
          `
          id, slug, name, tagline, short_description, logo_url,
          avg_rating, review_count, alternative_count,
          starting_price, price_currency, is_sponsored, is_featured,
          categories!softwares_category_id_fkey (name, slug),
          pricing_models!softwares_pricing_model_id_fkey (slug)
          `
        )
        .eq("category_id", cat.id)
        .eq("status", "published");

      // Fiyatlandırma filtresi
      if (pricing) {
        const { data: pm } = await supabase
          .from("pricing_models")
          .select("id")
          .eq("slug", pricing)
          .single();

        if (pm) query = query.eq("pricing_model_id", pm.id);
      }

      // Sıralama
      switch (sort) {
        case "rating":
          query = query.order("avg_rating", { ascending: false, nullsFirst: false });
          break;
        case "reviews":
          query = query.order("review_count", { ascending: false });
          break;
        case "newest":
          query = query.order("published_at", { ascending: false });
          break;
        default:
          // Relevance: sponsor boost + featured + rating
          query = query
            .order("sponsor_sort_boost", { ascending: false })
            .order("is_featured", { ascending: false })
            .order("avg_rating", { ascending: false, nullsFirst: false });
      }

      const { data, error } = await query.range(offset, offset + limit - 1);

      if (error || !data) return [];

      // Join verilerini flatten et
      return data.map((row) => {
        const category = Array.isArray(row.categories)
          ? row.categories[0]
          : row.categories;
        const pricingModel = Array.isArray(row.pricing_models)
          ? row.pricing_models[0]
          : row.pricing_models;

        return {
          id: row.id,
          slug: row.slug,
          name: row.name,
          tagline: row.tagline,
          short_description: row.short_description,
          logo_url: row.logo_url,
          avg_rating: row.avg_rating,
          review_count: row.review_count,
          alternative_count: row.alternative_count,
          starting_price: row.starting_price,
          price_currency: row.price_currency,
          is_sponsored: row.is_sponsored,
          is_featured: row.is_featured,
          category_name: (category as { name: string } | null)?.name ?? null,
          category_slug: (category as { slug: string } | null)?.slug ?? null,
          pricing_model_slug:
            (pricingModel as { slug: string } | null)?.slug ?? null,
        } satisfies SoftwareBasic;
      });
    },
    [cacheKey],
    {
      tags: [categoryTag(categorySlug), CATEGORIES_TAG],
      revalidate: REVALIDATE.STANDARD,
    }
  )();
}

// =============================================================================
// SECTION 5: SEARCH
// =============================================================================

// ---------------------------------------------------------------------------
// searchSoftwaresCached
// Hibrit arama (FTS + Trigram + Vector) — query bazlı cache.
// Arama sonuçları 5 dakika cache'de tutulur.
// ---------------------------------------------------------------------------
export async function searchSoftwaresCached(
  params: SearchParams
): Promise<SearchResult[]> {
  const {
    query,
    locale = "en",
    category_id,
    pricing_model_id,
    platforms,
    limit = 20,
    offset = 0,
  } = params;

  const cacheKey = `search-${query}-${locale}-${category_id ?? ""}-${pricing_model_id ?? ""}-${limit}-${offset}`;

  return unstable_cache(
    async () => {
      const supabase = createStaticClient();

      const { data, error } = await supabase.rpc("search_softwares", {
        query_text: query,
        query_embedding: null, // Embedding'ler route handler'da üretilir
        p_category_id: category_id ?? null,
        p_pricing_model_id: pricing_model_id ?? null,
        p_platforms: platforms ?? null,
        p_locale: locale,
        p_limit: limit,
        p_offset: offset,
      });

      if (error || !data) return [];

      return data as unknown as SearchResult[];
    },
    [cacheKey],
    {
      tags: [SEARCH_TAG],
      revalidate: REVALIDATE.FREQUENT,
    }
  )();
}

// =============================================================================
// SECTION 6: SITEMAP QUERIES
// =============================================================================

// ---------------------------------------------------------------------------
// getSoftwaresForSitemapCached
// ---------------------------------------------------------------------------
export async function getSoftwaresForSitemapCached(
  limit = 50000,
  offset = 0
): Promise<Array<{ slug: string; updated_at: string }>> {
  return unstable_cache(
    async () => {
      const supabase = createStaticClient();

      const { data, error } = await supabase.rpc(
        "get_software_for_sitemap",
        { p_limit: limit, p_offset: offset }
      );

      if (error || !data) return [];

      return data as Array<{ slug: string; updated_at: string }>;
    },
    [`sitemap-softwares-${offset}-${limit}`],
    {
      tags: [SITEMAP_TAG],
      revalidate: REVALIDATE.SLOW, // 24 saat
    }
  )();
}

// ---------------------------------------------------------------------------
// getComparisonsForSitemapCached
// ---------------------------------------------------------------------------
export async function getComparisonsForSitemapCached(
  limit = 50000,
  offset = 0
): Promise<
  Array<{
    software_slug: string;
    alternative_slug: string;
    updated_at: string;
  }>
> {
  return unstable_cache(
    async () => {
      const supabase = createStaticClient();

      const { data, error } = await supabase.rpc(
        "get_comparisons_for_sitemap",
        { p_limit: limit, p_offset: offset }
      );

      if (error || !data) return [];

      return data as Array<{
        software_slug: string;
        alternative_slug: string;
        updated_at: string;
      }>;
    },
    [`sitemap-comparisons-${offset}-${limit}`],
    {
      tags: [SITEMAP_TAG],
      revalidate: REVALIDATE.SLOW,
    }
  )();
}

// ---------------------------------------------------------------------------
// getCategoriesForSitemapCached
// ---------------------------------------------------------------------------
export async function getCategoriesForSitemapCached(): Promise<
  Array<{ slug: string; updated_at: string }>
> {
  return unstable_cache(
    async () => {
      const supabase = createStaticClient();

      const { data, error } = await supabase.rpc("get_categories_for_sitemap");

      if (error || !data) return [];

      return data as Array<{ slug: string; updated_at: string }>;
    },
    ["sitemap-categories"],
    {
      tags: [SITEMAP_TAG, CATEGORIES_TAG],
      revalidate: REVALIDATE.SLOW,
    }
  )();
}

// =============================================================================
// SECTION 7: FEATURE FLAGS
// =============================================================================

// ---------------------------------------------------------------------------
// getFeatureFlagCached
// ---------------------------------------------------------------------------
export async function getFeatureFlagCached(
  key: string
): Promise<boolean | null> {
  return unstable_cache(
    async () => {
      const supabase = createStaticClient();

      const { data } = await supabase
        .from("feature_flags")
        .select("value, is_active")
        .eq("key", key)
        .eq("is_active", true)
        .single();

      if (!data) return null;

      // JSON boolean değeri parse et
      if (typeof data.value === "boolean") return data.value;
      if (data.value === "true") return true;
      if (data.value === "false") return false;

      return Boolean(data.value);
    },
    [`feature-flag-${key}`],
    {
      tags: [`feature-flags`],
      revalidate: REVALIDATE.FREQUENT, // Bayraklar 5 dakikada bir güncellenir
    }
  )();
}
