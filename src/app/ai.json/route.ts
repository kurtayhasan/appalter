import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Route: /ai.json
// Makine-okunabilir JSON dizin dosyası — AI sistemleri ve LLM'ler için.
// OpenAPI benzeri yapıda tüm endpoint'leri belgeler.
// ---------------------------------------------------------------------------


export async function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://appalter.com";

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
    "$schema": "https://appalter.com/ai-schema.json",
    name: "AppAlter",
    description:
      "Programmatic SEO platform indexing 1,000,000+ software products with alternatives, comparisons, and AI-readable content.",
    url: baseUrl,
    version: "1.0.0",
    updated_at: "2026-01-01T00:00:00Z",
    contact: {
      ai_partnerships: "ai@appalter.com",
      data_licensing: "data@appalter.com",
    },
    statistics: stats,
    languages: ["en", "tr", "de", "fr", "es", "ja", "pt", "zh", "ar", "ko"],
    endpoints: {
      ai_content: {
        description:
          "Retrieve AI-optimized content for any software. Returns Markdown by default.",
        url: `${baseUrl}/api/ai/{slug}`,
        method: "GET",
        formats: {
          markdown: `${baseUrl}/api/ai/{slug}`,
          json: `${baseUrl}/api/ai/{slug}?format=json`,
          locale: `${baseUrl}/api/ai/{slug}?locale=tr`,
        },
        example: `${baseUrl}/api/ai/figma`,
        response_fields: [
          "name", "slug", "description", "pricing", "rating",
          "alternatives", "faqs", "links",
        ],
        cache: "1 hour",
        rate_limit: "1000 req/hour",
      },
      search: {
        description: "Full-text + semantic hybrid search across all software.",
        url: `${baseUrl}/api/search`,
        method: "GET",
        parameters: {
          q: "Search query (required)",
          category: "Filter by category slug",
          pricing: "Filter by pricing model slug",
          locale: "Response language (default: en)",
          limit: "Results per page (default: 20, max: 50)",
          offset: "Pagination offset",
        },
        example: `${baseUrl}/api/search?q=project+management&pricing=free`,
      },
      llms_txt: {
        description: "LLMs.txt directory file for AI crawlers.",
        url: `${baseUrl}/llms.txt`,
        method: "GET",
        format: "text/plain",
        cache: "24 hours",
      },
      sitemap: {
        description: "Sitemap index with all software, category, and comparison URLs.",
        url: `${baseUrl}/sitemap.xml`,
        method: "GET",
        format: "application/xml",
        cache: "24 hours",
      },
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
