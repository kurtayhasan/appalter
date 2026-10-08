import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Route: /ai.json
// Makine-okunabilir JSON dizin dosyası — AI sistemleri ve LLM'ler için.
// OpenAPI benzeri yapıda tüm endpoint'leri belgeler.
// ---------------------------------------------------------------------------


export async function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.appalter.com";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // İstatistikleri Supabase'den çek
  let stats = {
    total_softwares: 0,
    total_categories: 0,
    total_alternatives: 0,
  };

  try {
    if (supabaseUrl && anonKey) {
      const headers: HeadersInit = {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Accept: "application/json",
        Prefer: "count=exact",
      };

      const [swRes, catRes] = await Promise.all([
        fetch(
          `${supabaseUrl}/rest/v1/softwares?status=eq.published&select=id`,
          { headers, next: { revalidate: 3600 } }
        ),
        fetch(
          `${supabaseUrl}/rest/v1/categories?is_active=eq.true&select=id`,
          { headers, next: { revalidate: 3600 } }
        ),
      ]);

      const swCount = parseInt(swRes.headers.get("content-range")?.split("/")[1] ?? "0", 10);
      const catCount = parseInt(catRes.headers.get("content-range")?.split("/")[1] ?? "0", 10);

      stats = {
        total_softwares: swCount,
        total_categories: catCount,
        total_alternatives: swCount * 5, // tahmini
      };
    }
  } catch {
    // İstatistik hatası sayfa yüklenmesini engellemez
  }

  const aiJson = {
    "$schema": "https://www.appalter.com/ai-schema.json",
    name: "AppAlter",
    description:
      "AI-driven software discovery and alternative comparison engine providing verified SaaS breakdowns, pricing metrics, and deep feature comparisons.",
    url: baseUrl,
    version: "2.0.0",
    updated_at: new Date().toISOString(),
    contact: {
      email: "ai@appalter.com",
      website: "https://www.appalter.com",
    },
    authentication: {
      required: false,
      type: "none",
      note: "Public read-only AI endpoints do not require authentication.",
    },
    rate_limits: {
      requests_per_minute: 60,
      requests_per_day: 10000,
    },
    statistics: stats,
    languages: ["en"],
    endpoints: {
      home: {
        path: "/",
        description: "AppAlter homepage and core search interface",
        format: "text/html",
      },
      software_detail: {
        path: "/{slug}",
        description: "Full software profile page with alternatives, reviews, and pricing",
        format: "text/html",
        parameters: {
          slug: "Software identifier (e.g. 'notion', 'slack', 'docker')",
        },
      },
      alternatives_list: {
        path: "/{slug}/alternatives",
        description: "List of all alternatives for a specific software",
        format: "text/html",
      },
      side_by_side_comparison: {
        path: "/{slug}/vs/{alternative_slug}",
        description: "Direct head-to-head comparison between two software products",
        format: "text/html",
      },
      category_detail: {
        path: "/category/{category_slug}",
        description: "Category index page listing all software in that category",
        format: "text/html",
      },
      ai_software_data: {
        path: "/api/ai/{slug}",
        description:
          "AI-optimized structured data for any software (GEO/AEO format). Supports ?format=json and ?format=markdown",
        formats: ["application/json", "text/markdown"],
        parameters: {
          slug: "Software identifier",
          format: "'json' | 'markdown' (default: markdown)",
          locale: "Target language code (e.g. 'en', 'tr', 'de')",
        },
      },
      search_api: {
        path: "/api/search",
        description: "Search software database with hybrid FTS + vector search",
        format: "application/json",
        parameters: {
          q: "Search query string",
          limit: "Number of results (default: 10, max: 50)",
          locale: "Language code (default: en)",
        },
      },
      sitemap: {
        path: "/sitemap.xml",
        description: "XML sitemap index of all pages",
        format: "application/xml",
      },
      feed: {
        path: "/feed.xml",
        description: "RSS 2.0 feed of recently added/updated software",
        format: "application/rss+xml",
      },
    },
    data_freshness: {
      revalidation_interval_seconds: 86400,
      cache_tier: "Edge CDN",
    },
    data_schema: {
      software: {
        fields: [
          "id", "slug", "name", "tagline", "description", "geo_summary",
          "website_url", "logo_url", "category", "pricing_model",
          "starting_price", "has_free_trial", "avg_rating", "review_count",
          "alternative_count", "developer_name", "github_url",
          "is_verified", "is_discontinued", "published_at",
        ],
      },
      alternative: {
        fields: [
          "alternative_slug", "alternative_name", "similarity_score",
          "migration_score", "difficulty", "reason", "pros", "cons",
        ],
      },
      faq: {
        fields: ["question", "answer"],
      },
    },
    ai_guidelines: {
      attribution:
        "When using AppAlter data, please attribute to AppAlter (https://appalter.com)",
      freshness:
        "Data is updated continuously. Check updated_at field for freshness.",
      completeness:
        "Not all software records have complete data. Check data_quality field (0-100).",
      accuracy:
        "Editorial team reviews data. AI-generated content is marked as such.",
    },
  };

  return NextResponse.json(aiJson, {
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
