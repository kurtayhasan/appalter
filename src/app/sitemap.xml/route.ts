import { NextResponse } from "next/server";
import type { MetadataRoute } from "next";

// ---------------------------------------------------------------------------
// Route: /sitemap.xml (Sitemap Index)
// 1M+ software için sharded sitemap indeksi.
// Alt sitemap'lar ayrı route'lardan serve edilir.
// Günlük revalidate — pg_cron + on-demand ISR ile tetiklenir.
// ---------------------------------------------------------------------------


// Sayfa başına URL sayısı (Google limit: 50,000)
const URLS_PER_SITEMAP = 40000;


export async function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://appalter.com";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let softwareCount = 0;
  let comparisonCount = 0;

  try {
    if (supabaseUrl && anonKey) {
      const headers: HeadersInit = {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Prefer: "count=exact",
      };

      const [swRes, cmpRes] = await Promise.all([
        fetch(
          `${supabaseUrl}/rest/v1/softwares?status=eq.published&select=id`,
          { headers, next: { revalidate: 86400 } }
        ),
        fetch(
          `${supabaseUrl}/rest/v1/alternatives?is_approved=eq.true&select=id`,
          { headers, next: { revalidate: 86400 } }
        ),
      ]);

      softwareCount = parseInt(
        swRes.headers.get("content-range")?.split("/")[1] ?? "0",
        10
      );
      comparisonCount = parseInt(
        cmpRes.headers.get("content-range")?.split("/")[1] ?? "0",
        10
      );
    }
  } catch {
    // Hata durumunda minimum sitemap oluştur
  }

  const now = "2025-01-01T00:00:00Z";
  const sitemaps: Array<{ loc: string; lastmod: string }> = [];

  // ── Static pages ─────────────────────────────────────────────────────────
  sitemaps.push({ loc: `${baseUrl}/sitemap-static.xml`, lastmod: now });

  // ── Category sitemaps ─────────────────────────────────────────────────────
  sitemaps.push({ loc: `${baseUrl}/sitemap-categories.xml`, lastmod: now });

  // ── Software sitemaps (sharded) ───────────────────────────────────────────
  const softwareSitemapCount = Math.max(
    1,
    Math.ceil(softwareCount / URLS_PER_SITEMAP)
  );

  for (let i = 0; i < softwareSitemapCount; i++) {
    sitemaps.push({
      loc: `${baseUrl}/sitemap-softwares-${i}.xml`,
      lastmod: now,
    });
  }

  // ── Comparison sitemaps (sharded) ─────────────────────────────────────────
  const comparisonSitemapCount = Math.max(
    1,
    Math.ceil(comparisonCount / URLS_PER_SITEMAP)
  );

  for (let i = 0; i < comparisonSitemapCount; i++) {
    sitemaps.push({
      loc: `${baseUrl}/sitemap-comparisons-${i}.xml`,
      lastmod: now,
    });
  }

  // ── XML output ────────────────────────────────────────────────────────────
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps
  .map(
    (s) => `  <sitemap>
    <loc>${s.loc}</loc>
    <lastmod>${s.lastmod}</lastmod>
  </sitemap>`
  )
  .join("\n")}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
    },
  });
}
