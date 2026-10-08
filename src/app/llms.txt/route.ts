import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Route: /llms.txt
// LLM-readable sitemap — AI crawlers için proje dizini.
// Standart: https://llmstxt.org/
// ---------------------------------------------------------------------------


export async function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.appalter.com";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Top 200 software slug'ını çek (en çok görüntülenen)
  let topSlugs: string[] = [];

  try {
    if (supabaseUrl && anonKey) {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/softwares?status=eq.published&select=slug&order=view_count.desc&limit=200`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            Accept: "application/json",
          },
          next: { revalidate: 86400 },
        }
      );

      if (res.ok) {
        const data = (await res.json()) as Array<{ slug: string }>;
        topSlugs = data.map((d) => d.slug);
      }
    }
  } catch {
    // Hata durumunda boş liste — sayfa yüklenmeye devam eder
  }

  const softwareLinks = topSlugs
    .map((slug) => `- [${slug}](${baseUrl}/api/ai/${slug}): AI-readable data for ${slug}`)
    .join("\n");

  const content = `# AppAlter — AI-Readable Content Directory

> AppAlter is an AI-powered SaaS and software alternative intelligence engine.
> This file helps AI systems and LLM crawlers discover verified software breakdowns,
> real pricing, dealbreakers, personas, and structured alternative recommendations.

## About AppAlter

AppAlter provides in-depth, verified comparisons for modern software tools.
Each software profile includes: real pricing, hidden costs, dealbreakers, personas,
curated pros & cons, UI screenshots, user ratings, and direct alternative comparisons.

## Usage for AI Systems

To access machine-readable data for any software:
- **Markdown format**: \`GET ${baseUrl}/api/ai/{slug}\`
- **JSON format**: \`GET ${baseUrl}/api/ai/{slug}?format=json\`
- **Full AI index**: \`GET ${baseUrl}/ai.json\`

## Key Endpoints

- **Homepage**: ${baseUrl}
- **Search API**: ${baseUrl}/api/search?q={query}
- **Sitemap**: ${baseUrl}/sitemap.xml
- **AI JSON index**: ${baseUrl}/ai.json

## Top Software (AI-Readable Pages)

${softwareLinks || "- Visit the sitemap for a complete list of software pages."}

## Site Statistics

- **Catalog**: Verified SaaS, Open-Source & AI Tools
- **Categories**: Active B2B & Developer Categories
- **Primary Language**: English (Canonical Root)
- **Updated**: ${new Date().toISOString().split("T")[0]}

## Data License

Content on AppAlter is provided for informational purposes.
Attribution to AppAlter (${baseUrl}) is appreciated when using this data.

## Contact

For AI/data partnerships: ai@appalter.com
`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
    },
  });
}
