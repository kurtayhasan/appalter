// src/app/api/ai/[slug]/route.ts
// GEO (Generative Engine Optimization) endpoint.
// LLM'lerin (GPT, Claude, Perplexity, Gemini vb.) doğrudan tüketebileceği
// yapılandırılmış içerik döndürür: Markdown (default), JSON (?format=json).
//
// Güvenlik: anon key ile public data — sadece published software'ler.
// Rate limit: Vercel Edge rate limiting veya upstash/ratelimit önerilir.

import { type NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { softwareTag } from "@/lib/cache/tags";
import { generateGeoMarkdown, generateGeoJson } from "@/lib/ai/geo";
import type { SoftwareDetail, AlternativeItem, SoftwareFAQ } from "@/types";


// Cache süresi: 1 saat (CDN seviyesinde)
const CACHE_MAX_AGE = 3600;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = request.nextUrl;
  const format = searchParams.get("format") ?? "markdown"; // "markdown" | "json"
  const locale = searchParams.get("locale") ?? "en";

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://appalter.com";

  // Doğrulama
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: "Invalid slug format" },
      { status: 400 }
    );
  }

  try {
    // Supabase REST API (edge bundle'da full client yok)
    const data = await fetchSoftwareGeoData(slug, locale);

    if (!data) {
      return NextResponse.json(
        { error: "Software not found" },
        { status: 404 }
      );
    }

    const { software, alternatives, faqs } = data;

    if (format === "json") {
      const json = generateGeoJson({ software, alternatives, faqs, baseUrl });

      return new NextResponse(JSON.stringify(json, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": `public, max-age=${CACHE_MAX_AGE}, stale-while-revalidate=300`,
          "X-AppAlter-Source": "geo-endpoint",
          "X-Robots-Tag": "noindex", // AI endpoint'i search engine'in index'lememesi için
          Vary: "Accept",
        },
      });
    }

    // Default: Markdown
    const markdown = generateGeoMarkdown({
      software,
      alternatives,
      faqs,
      baseUrl,
      locale,
    });

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": `public, max-age=${CACHE_MAX_AGE}, stale-while-revalidate=300`,
        "X-AppAlter-Source": "geo-endpoint",
        "X-Robots-Tag": "noindex",
        Vary: "Accept-Language",
      },
    });
  } catch (err) {
    console.error("[GEO] Error generating content for slug:", slug, err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// fetchSoftwareGeoData — edge-compatible Supabase REST fetch
// ---------------------------------------------------------------------------
async function fetchSoftwareGeoData(
  slug: string,
  locale: string
): Promise<{
  software: SoftwareDetail;
  alternatives: AlternativeItem[];
  faqs: SoftwareFAQ[];
} | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) return null;

  const headers: HeadersInit = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  // Paralel fetch: software + alternatives + FAQs
  const [softwareRes, alternativesRes, faqsRes] = await Promise.all([
    // Software via RPC
    fetch(`${supabaseUrl}/rest/v1/rpc/get_software_by_slug`, {
      method: "POST",
      headers,
      body: JSON.stringify({ p_slug: slug }),
      next: { revalidate: CACHE_MAX_AGE, tags: [softwareTag(slug)] },
    }),
    // Alternatives via RPC
    fetch(`${supabaseUrl}/rest/v1/rpc/get_alternatives_for_software`, {
      method: "POST",
      headers,
      body: JSON.stringify({ p_slug: slug, p_limit: 20, p_offset: 0 }),
      next: { revalidate: CACHE_MAX_AGE },
    }),
    // FAQs via REST
    fetch(
      `${supabaseUrl}/rest/v1/software_faqs?software_id=in.(select id from softwares where slug=eq.${encodeURIComponent(slug)})&locale=in.(${locale},en)&order=sort_order.asc&limit=10`,
      {
        headers,
        next: { revalidate: CACHE_MAX_AGE },
      }
    ),
  ]);

  if (!softwareRes.ok) return null;

  const softwareArr = (await softwareRes.json()) as SoftwareDetail[];
  if (!softwareArr || softwareArr.length === 0) return null;

  const software = softwareArr[0]!;
  const alternatives = alternativesRes.ok
    ? ((await alternativesRes.json()) as AlternativeItem[])
    : [];
  const faqs = faqsRes.ok
    ? ((await faqsRes.json()) as SoftwareFAQ[])
    : [];

  return { software, alternatives, faqs };
}
