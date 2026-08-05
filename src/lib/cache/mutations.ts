// @ts-nocheck
// lib/cache/mutations.ts
// Tüm yazma işlemleri (INSERT/UPDATE/DELETE) ve ardından cache invalidasyonu.
// Kural: Her mutasyon ilgili tag'leri revalidate eder.
// Bu dosya SADECE Server Actions ve Route Handlers'ta kullanılır.

import "server-only";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
} from "./tags";

// =============================================================================
// SOFTWARE MUTATIONS
// =============================================================================

/** Bir software kaydını günceller ve tüm ilgili cache'leri invalidate eder. */
export async function invalidateSoftwareCache(slug: string): Promise<void> {
  // Ana software cache'i
  revalidateTag(softwareTag(slug));
  // Alternatifleri de güncellenmesi gerekebilir
  revalidateTag(alternativesTag(slug));
  // Sitemap güncellenir
  revalidateTag(SITEMAP_TAG);
  // Arama indeksi
  revalidateTag(SEARCH_TAG);
  // Öne çıkanlar listesi değişmiş olabilir
  revalidateTag(FEATURED_TAG);
}

/** Yeni software yayınlandığında çağrılır */
export async function onSoftwarePublished(slug: string): Promise<void> {
  await invalidateSoftwareCache(slug);
  revalidateTag(CATEGORIES_TAG); // software_count güncellendi
}

/** Software silindiğinde veya arşivlendiğinde */
export async function onSoftwareArchived(slug: string): Promise<void> {
  await invalidateSoftwareCache(slug);
  revalidateTag(CATEGORIES_TAG);
}

// =============================================================================
// REVIEW MUTATIONS
// =============================================================================

/** Yorum onaylandığında veya eklendiğinde */
export async function onReviewChanged(softwareId: string, softwareSlug: string): Promise<void> {
  revalidateTag(reviewsTag(softwareId));
  // avg_rating değiştiği için ana software cache'i de invalidate et
  revalidateTag(softwareTag(softwareSlug));
  revalidateTag(FEATURED_TAG);
}

// =============================================================================
// CONTENT MUTATIONS
// =============================================================================

/** FAQ değiştiğinde */
export async function onFAQChanged(softwareId: string): Promise<void> {
  revalidateTag(faqsTag(softwareId));
}

/** Ekran görüntüsü değiştiğinde */
export async function onScreenshotChanged(softwareId: string): Promise<void> {
  revalidateTag(screenshotsTag(softwareId));
}

/** Özellikler değiştiğinde */
export async function onFeaturesChanged(softwareId: string): Promise<void> {
  revalidateTag(featuresTag(softwareId));
  // data_quality_score güncellendi — ana software cache'i yenile
}

/** Artı/eksi değiştiğinde */
export async function onProsConsChanged(softwareId: string): Promise<void> {
  revalidateTag(prosConsTag(softwareId));
}

// =============================================================================
// ALTERNATIVE MUTATIONS
// =============================================================================

/** Alternatif ilişkisi değiştiğinde */
export async function onAlternativeChanged(
  softwareSlug: string,
  alternativeSlug: string
): Promise<void> {
  revalidateTag(alternativesTag(softwareSlug));
  revalidateTag(alternativesTag(alternativeSlug));
  revalidateTag(softwareTag(softwareSlug));
  revalidateTag(softwareTag(alternativeSlug));
  revalidateTag(SITEMAP_TAG);
}

// =============================================================================
// CATEGORY MUTATIONS
// =============================================================================

/** Kategori değiştiğinde */
export async function onCategoryChanged(slug: string): Promise<void> {
  revalidateTag(categoryTag(slug));
  revalidateTag(CATEGORIES_TAG);
  revalidateTag(SITEMAP_TAG);
}

// =============================================================================
// BULK INVALIDATION (İngest pipeline için)
// =============================================================================

/** Toplu import sonrası tüm kritik tag'leri invalidate eder */
export async function invalidateAllSearchCaches(): Promise<void> {
  revalidateTag(SEARCH_TAG);
  revalidateTag(FEATURED_TAG);
  revalidateTag(SITEMAP_TAG);
}

// =============================================================================
// SUPABASE WEBHOOK HANDLER (Modül 6'da kullanılır)
// Supabase Database Webhook'tan gelen payload'u parse eder ve
// ilgili cache'leri invalidate eder.
// =============================================================================

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: Record<string, unknown> | null;
  old_record: Record<string, unknown> | null;
}

export async function handleDatabaseWebhook(
  payload: WebhookPayload
): Promise<void> {
  const { type, table, record, old_record } = payload;
  const target = record ?? old_record;
  if (!target) return;

  switch (table) {
    case "softwares": {
      const slug = (target["slug"] as string | undefined) ?? "";
      if (slug) await invalidateSoftwareCache(slug);
      break;
    }

    case "software_reviews": {
      const softwareId = target["software_id"] as string | undefined;
      if (softwareId) {
        revalidateTag(reviewsTag(softwareId));
        // avg_rating değişebileceği için software cache'ini de yenile
        const supabase = await createClient();
        const { data } = await supabase
          .from("softwares")
          .select("slug")
          .eq("id", softwareId)
          .single();
        if (data?.slug) revalidateTag(softwareTag(data.slug));
      }
      break;
    }

    case "software_faqs": {
      const softwareId = target["software_id"] as string | undefined;
      if (softwareId) revalidateTag(faqsTag(softwareId));
      break;
    }

    case "software_screenshots": {
      const softwareId = target["software_id"] as string | undefined;
      if (softwareId) revalidateTag(screenshotsTag(softwareId));
      break;
    }

    case "alternatives": {
      // Her iki taraftaki yazılım için invalidate
      const softwareId = target["software_id"] as string | undefined;
      const altId = target["alternative_id"] as string | undefined;
      if (softwareId || altId) {
        revalidateTag(SITEMAP_TAG);
        revalidateTag(SEARCH_TAG);
      }
      break;
    }

    case "categories": {
      const slug = target["slug"] as string | undefined;
      if (slug) await onCategoryChanged(slug);
      break;
    }

    default:
      break;
  }
}
