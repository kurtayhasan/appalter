// @ts-nocheck
// src/lib/ai/geo.ts
// GEO (Generative Engine Optimization) içerik üretici.
// LLM'lerin doğrudan tüketebileceği yapılandırılmış Markdown üretir.
// /api/ai/[slug] endpoint'i bu modülü kullanır.

import "server-only";
import type { SoftwareDetail, AlternativeItem, SoftwareFAQ } from "@/types";

// ---------------------------------------------------------------------------
// generateGeoMarkdown
// Bir software için LLM-optimize Markdown dökümanı üretir.
// ---------------------------------------------------------------------------
export function generateGeoMarkdown(params: {
  software: SoftwareDetail;
  alternatives: AlternativeItem[];
  faqs: SoftwareFAQ[];
  baseUrl: string;
  locale?: string;
}): string {
  const { software, alternatives, faqs, baseUrl, locale = "en" } = params;

  const year = new Date().getFullYear();
  const rating = software.avg_rating
    ? `${software.avg_rating.toFixed(1)}/5`
    : "Not rated yet";

  const pricingText = formatPricing(software);

  const sections: string[] = [];

  // ── Front matter ────────────────────────────────────────────────────────
  sections.push(`---
title: ${software.name}
slug: ${software.slug}
category: ${software.category_name ?? "Software"}
pricing: ${software.pricing_model_slug ?? "unknown"}
rating: ${rating}
review_count: ${software.review_count}
alternative_count: ${software.alternative_count}
url: ${baseUrl}/${software.slug}
api_url: ${baseUrl}/api/ai/${software.slug}
locale: ${locale}
updated: ${new Date().toISOString().split("T")[0]}
---`);

  // ── Title & Summary ──────────────────────────────────────────────────────
  sections.push(`# ${software.name}

> ${software.tagline ?? software.short_description ?? ""}

${software.geo_summary ?? software.short_description ?? software.description ?? ""}`);

  // ── Key Facts ────────────────────────────────────────────────────────────
  sections.push(`## Key Facts

| Property | Value |
|---|---|
| **Category** | ${software.category_name ?? "N/A"} |
| **Pricing** | ${pricingText} |
| **Rating** | ${rating} (${software.review_count} reviews) |
| **Platforms** | See [full page](${baseUrl}/${software.slug}) |
| **Developer** | ${software.developer_name ?? "N/A"} |
| **Founded** | ${software.founded_year ?? "N/A"} |
| **Open Source** | ${software.github_url ? `Yes — [GitHub](${software.github_url})` : "No"} |
| **Free Trial** | ${software.has_free_trial ? `Yes${software.free_trial_days ? ` (${software.free_trial_days} days)` : ""}` : "No"} |
| **Status** | ${software.is_discontinued ? "⚠️ Discontinued" : "✅ Active"} |`);

  // ── Description ──────────────────────────────────────────────────────────
  if (software.description || software.ai_description) {
    sections.push(`## Description

${software.ai_description ?? software.description ?? ""}`);
  }

  // ── Best Alternatives ────────────────────────────────────────────────────
  if (alternatives.length > 0) {
    const altRows = alternatives
      .slice(0, 10)
      .map((alt) => {
        const simScore = alt.similarity_score
          ? `${Math.round(alt.similarity_score * 100)}%`
          : "N/A";
        const price = alt.starting_price
          ? `$${alt.starting_price}/mo`
          : "Free";
        const rating = alt.avg_rating ? `${alt.avg_rating.toFixed(1)}/5` : "N/A";
        return `| [${alt.alternative_name}](${baseUrl}/${alt.alternative_slug}) | ${simScore} | ${alt.difficulty ?? "N/A"} | ${price} | ${rating} |`;
      })
      .join("\n");

    sections.push(`## Best Alternatives to ${software.name} (${year})

The following tools are frequently considered as alternatives to ${software.name}:

| Alternative | Similarity | Migration | Price | Rating |
|---|---|---|---|---|
${altRows}

For a complete comparison, visit: ${baseUrl}/${software.slug}/alternatives`);
  }

  // ── FAQs ─────────────────────────────────────────────────────────────────
  if (faqs.length > 0) {
    const faqText = faqs
      .slice(0, 8)
      .map((faq) => `### ${faq.question}\n\n${faq.answer}`)
      .join("\n\n");

    sections.push(`## Frequently Asked Questions

${faqText}`);
  }

  // ── Links ─────────────────────────────────────────────────────────────────
  const links: string[] = [
    `- **Full page**: ${baseUrl}/${software.slug}`,
    `- **Alternatives**: ${baseUrl}/${software.slug}/alternatives`,
  ];
  if (software.website_url)
    links.push(`- **Official website**: ${software.website_url}`);
  if (software.pricing_page_url)
    links.push(`- **Pricing**: ${software.pricing_page_url}`);
  if (software.documentation_url)
    links.push(`- **Documentation**: ${software.documentation_url}`);
  if (software.github_url)
    links.push(`- **GitHub**: ${software.github_url}`);

  sections.push(`## Links\n\n${links.join("\n")}`);

  // ── Machine-readable footer ───────────────────────────────────────────────
  sections.push(`---
*This document is machine-readable and optimized for AI language models.*
*Source: AppAlter — ${baseUrl}*
*Data endpoint: ${baseUrl}/api/ai/${software.slug}*`);

  return sections.join("\n\n");
}

// ---------------------------------------------------------------------------
// generateGeoJson
// JSON formatında yapılandırılmış software verisi — /ai.json ve API için
// ---------------------------------------------------------------------------
export function generateGeoJson(params: {
  software: SoftwareDetail;
  alternatives: AlternativeItem[];
  faqs: SoftwareFAQ[];
  baseUrl: string;
}): Record<string, unknown> {
  const { software, alternatives, faqs, baseUrl } = params;

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${baseUrl}/${software.slug}`,
    name: software.name,
    slug: software.slug,
    description: software.geo_summary ?? software.short_description ?? software.description,
    url: software.website_url,
    applicationCategory: software.category_name ?? "Software",
    operatingSystem: "Web, Windows, macOS, Linux, iOS, Android",
    offers: software.starting_price
      ? {
          "@type": "Offer",
          price: software.starting_price,
          priceCurrency: software.price_currency,
        }
      : {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        },
    aggregateRating: software.avg_rating
      ? {
          "@type": "AggregateRating",
          ratingValue: software.avg_rating,
          ratingCount: software.review_count,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
    alternatives: alternatives.slice(0, 20).map((alt) => ({
      "@type": "SoftwareApplication",
      name: alt.alternative_name,
      url: `${baseUrl}/${alt.alternative_slug}`,
      similarityScore: alt.similarity_score,
      migrationDifficulty: alt.difficulty,
    })),
    faqs: faqs.slice(0, 10).map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
    meta: {
      source: "AppAlter",
      sourceUrl: `${baseUrl}`,
      apiUrl: `${baseUrl}/api/ai/${software.slug}`,
      updatedAt: new Date().toISOString(),
      dataQuality: software.data_quality_score,
    },
  };
}

// ---------------------------------------------------------------------------
// Helper: format pricing text
// ---------------------------------------------------------------------------
function formatPricing(software: SoftwareDetail): string {
  const { pricing_model_slug, starting_price, price_currency, has_free_trial } =
    software;

  if (pricing_model_slug === "free" || pricing_model_slug === "open-source") {
    return "Free";
  }

  const parts: string[] = [];

  if (pricing_model_slug) {
    parts.push(
      pricing_model_slug.charAt(0).toUpperCase() +
        pricing_model_slug.slice(1).replace(/-/g, " ")
    );
  }

  if (starting_price !== null && starting_price !== undefined) {
    parts.push(`from ${price_currency}$${starting_price}/mo`);
  }

  if (has_free_trial) parts.push("free trial available");

  return parts.join(", ") || "Paid";
}
