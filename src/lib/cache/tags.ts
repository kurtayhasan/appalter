// lib/cache/tags.ts
// Cache tag sabitleri — revalidateTag() ve unstable_cache() tag'leri burada yönetilir.
// Kural: Her tag bir entity type + id'ye karşılık gelir.
// Mutasyon fonksiyonları ilgili tag'leri invalidate eder.

// ---------------------------------------------------------------------------
// Tag sabitleri (type-safe)
// ---------------------------------------------------------------------------

/** Tek bir software kaydı için cache tag */
export const softwareTag = (slug: string) => `software-${slug}` as const;

/** Bir software'in alternatifleri */
export const alternativesTag = (slug: string) => `alternatives-${slug}` as const;

/** Bir software'in yorumları */
export const reviewsTag = (softwareId: string) => `reviews-${softwareId}` as const;

/** Bir software'in SSS'leri */
export const faqsTag = (softwareId: string) => `faqs-${softwareId}` as const;

/** Bir software'in ekran görüntüleri */
export const screenshotsTag = (softwareId: string) => `screenshots-${softwareId}` as const;

/** Bir software'in özellikleri */
export const featuresTag = (softwareId: string) => `features-${softwareId}` as const;

/** Bir software'in artı/eksileri */
export const prosConsTag = (softwareId: string) => `pros-cons-${softwareId}` as const;

/** Tek bir kategori */
export const categoryTag = (slug: string) => `category-${slug}` as const;

/** Tek bir koleksiyon */
export const collectionTag = (slug: string) => `collection-${slug}` as const;

/** Tüm kategoriler listesi */
export const CATEGORIES_TAG = "categories" as const;

/** Öne çıkan yazılımlar */
export const FEATURED_TAG = "featured" as const;

/** Sitemap verisi */
export const SITEMAP_TAG = "sitemap" as const;

/** Arama indeksi */
export const SEARCH_TAG = "search" as const;

/** Admin dashboard istatistikleri */
export const STATS_TAG = "stats" as const;

/** Özellik bayrakları */
export const FEATURE_FLAGS_TAG = "feature-flags" as const;

/** Bir VS karşılaştırma sayfası */
export const comparisonTag = (slug: string, altSlug: string) =>
  `comparison-${slug}-vs-${altSlug}` as const;

// ---------------------------------------------------------------------------
// Revalidation süresi sabitleri (saniye cinsinden)
// ---------------------------------------------------------------------------
export const REVALIDATE = {
  /** Sık güncellenen içerik — 5 dakika */
  FREQUENT: 300,
  /** Normal içerik — 1 saat */
  STANDARD: 3600,
  /** Nadir güncellenen içerik — 24 saat */
  SLOW: 86400,
  /** Sabit içerik — 7 gün */
  STATIC: 604800,
  /** Hiç expire olmaz (el ile invalidate edilir) */
  FOREVER: false as const,
} as const;
