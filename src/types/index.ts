// src/types/index.ts
// AppAlter merkezi tip tanımlamaları
// Supabase generated types (src/types/supabase.ts) üzerine kurulur.

export type { Database } from "./supabase";

// ---------------------------------------------------------------------------
// Temel domain tipleri — component'lerde kullanılacak shape'ler
// ---------------------------------------------------------------------------

/** getSoftwareBySlugCached ve getSoftwareBasic dönüş tipi */
export interface SoftwareDetail {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  short_description: string | null;
  website_url: string | null;
  logo_url: string | null;
  og_image_url: string | null;
  hero_image_url: string | null;
  category_id: string | null;
  pricing_model_id: string | null;
  starting_price: number | null;
  price_currency: string;
  has_free_trial: boolean;
  free_trial_days: number | null;
  pricing_page_url: string | null;
  pricing_notes: string | null;
  developer_name: string | null;
  developer_url: string | null;
  github_url: string | null;
  twitter_handle: string | null;
  founded_year: number | null;
  is_discontinued: boolean;
  meta_title: string | null;
  meta_description: string | null;
  focus_keywords: string[] | null;
  geo_summary: string | null;
  ai_description: string | null;
  review_count: number;
  avg_rating: number | null;
  alternative_count: number;
  view_count: number;
  is_verified: boolean;
  is_featured: boolean;
  is_sponsored: boolean;
  data_quality_score: number | null;
  price_rating: number | null;
  ease_of_use_rating: number | null;
  features_rating: number | null;
  support_rating: number | null;
  published_at: string | null;
  // Joined fields
  category_name: string | null;
  category_slug: string | null;
  pricing_model_name: string | null;
  pricing_model_slug: string | null;
}

/** getSoftwareBasic — hafif kart verisi */
export interface SoftwareBasic {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  short_description: string | null;
  logo_url: string | null;
  avg_rating: number | null;
  review_count: number;
  alternative_count: number;
  starting_price: number | null;
  price_currency: string;
  is_sponsored: boolean;
  is_featured: boolean;
  category_name: string | null;
  category_slug: string | null;
  pricing_model_slug: string | null;
}

/** Alternatif kayıt tipi */
export interface AlternativeItem {
  alternative_id: string;
  alternative_slug: string;
  alternative_name: string;
  alternative_logo: string | null;
  tagline: string | null;
  short_description: string | null;
  avg_rating: number | null;
  review_count: number;
  starting_price: number | null;
  price_currency: string;
  pricing_model_id: string | null;
  similarity_score: number | null;
  migration_score: number | null;
  difficulty: "easy" | "medium" | "hard" | "expert" | null;
  reason: string | null;
  pros: string[] | null;
  cons: string[] | null;
  relation_id: string;
  upvotes: number;
  downvotes: number;
  alternative_website_url: string | null;
}

/** Yorum tipi */
export interface SoftwareReview {
  id: string;
  software_id: string;
  user_id: string | null;
  reviewer_name: string | null;
  reviewer_role: string | null;
  reviewer_avatar: string | null;
  rating: number;
  title: string | null;
  body: string;
  source: string;
  is_verified: boolean;
  is_featured: boolean;
  helpful_count: number;
  locale: string;
  created_at: string;
}

/** FAQ tipi */
export interface SoftwareFAQ {
  id: string;
  software_id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_featured: boolean;
  locale: string;
}

/** Ekran görüntüsü tipi */
export interface SoftwareScreenshot {
  id: string;
  software_id: string;
  url: string;
  thumb_url: string | null;
  alt_text: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  sort_order: number;
}

/** Kategori tipi */
export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  image_url: string | null;
  software_count: number;
  is_featured: boolean;
  parent_id: string | null;
}

/** Hibrit arama sonuç satırı */
export interface SearchResult {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  short_description: string | null;
  logo_url: string | null;
  category_id: string | null;
  pricing_model_id: string | null;
  starting_price: number | null;
  avg_rating: number | null;
  review_count: number;
  alternative_count: number;
  is_featured: boolean;
  is_sponsored: boolean;
  fts_score: number;
  trgm_score: number;
  vector_score: number;
  popularity_score: number;
  combined_score: number;
}

/** Arama filtre parametreleri */
export interface SearchParams {
  query: string;
  locale?: string;
  category_id?: string;
  pricing_model_id?: string;
  platforms?: string[];
  limit?: number;
  offset?: number;
}

/** BreadcrumbList item */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

/** Affiliate link tipi */
export interface AffiliateLink {
  id: string;
  software_id: string;
  raw_url: string;
  tracking_url: string;
  label: string | null;
  link_type: "primary" | "trial" | "pricing" | "download";
  is_active: boolean;
}

/** Cache tag sabitleri için tip */
export type CacheTag =
  | `software-${string}`
  | `category-${string}`
  | `collection-${string}`
  | `alternatives-${string}`
  | `reviews-${string}`
  | `faqs-${string}`
  | `screenshots-${string}`
  | `search`
  | `sitemap`
  | `featured`
  | `categories`;
