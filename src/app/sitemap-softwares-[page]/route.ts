import { NextResponse, type NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Route: /sitemap-softwares-[page].xml
// Sharded software sitemap — her dosyada 40,000 URL.
// Örnek: /sitemap-softwares-0.xml, /sitemap-softwares-1.xml
// ---------------------------------------------------------------------------

const LIMIT = 40000;
const LOCALES = ["en", "tr", "de", "fr", "es", "ja", "pt", "zh", "ar", "ko"];
const DEFAULT_LOCALE = "en";


export async function GET(
  _request: NextRequest,
  context: any
) {
  const params = context?.params ? await context.params : {};
  const pageStr = params.page;
  const page = parseInt(pageStr ?? "0", 10);
  const offset = page * LIMIT;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://appalter.com";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return new NextResponse("Configuration error", { status: 500 });
  }

  const res = await fetch(
    `${supabaseUrl}/rest/v1/rpc/get_software_for_sitemap`,
    {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ p_limit: LIMIT, p_offset: offset }),
      next: { revalidate: 86400 },
    }
  );

  if (!res.ok) {
    return new NextResponse("Upstream error", { status: 502 });
  }

  const slugs = (await res.json()) as Array<{
    slug: string;
    updated_at: string;
  }>;

  if (slugs.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  // URL grubu: her slug için tüm locale'lerdeki URL'leri üret
  const urls: string[] = [];

  for (const { slug, updated_at } of slugs) {
    const lastmod = updated_at
      ? new Date(updated_at).toISOString().split("T")[0]
      : "2026-01-01T00:00:00Z".split("T")[0];

    // Default locale URL (prefix yok)
    const canonicalUrl = `${baseUrl}/${slug}`;

    // xhtml:link hreflang alternates
    const alternates = LOCALES.map((loc) => {
      const url =
        loc === DEFAULT_LOCALE
          ? `${baseUrl}/${slug}`
          : `${baseUrl}/${loc}/${slug}`;
      return `      <xhtml:link rel="alternate" hreflang="${loc}" href="${url}"/>`;
    }).join("\n");

    // x-default
    const xDefault = `      <xhtml:link rel="alternate" hreflang="x-default" href="${canonicalUrl}"/>`;

    urls.push(`  <url>
    <loc>${canonicalUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
${alternates}
${xDefault}
  </url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
    },
  });
}
