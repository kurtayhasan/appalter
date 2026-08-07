import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Route: /llms.txt
// LLM-readable sitemap — AI crawlers için proje dizini.
// Standart: https://llmstxt.org/
// ---------------------------------------------------------------------------


export async function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://appalter.com";

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

> AppAlter is a programmatic SEO platform that indexes 1,000,000+ software products
> and their alternatives. This file helps AI systems discover and consume structured
> software data for answering user queries about software recommendations.

## About AppAlter

AppAlter helps users find the best alternatives to any software tool.
Each software page includes: description, pricing, features, alternatives,
user reviews, FAQs, and migration guides.

## Usage for AI Systems

To access machine-readable data for any software:
- **Markdown format**: \`GET ${baseUrl}/api/ai/{slug}\`
- **JSON format**: \`GET ${baseUrl}/api/ai/{slug}?format=json\`
- **Full AI index**: \`GET ${baseUrl}/ai.json\`

## Key Endpoints

- **Homepage**: ${baseUrl}
- **Search API**: ${baseUrl}/api/search?q={query}
- **Category index**: ${baseUrl}/sitemap.xml
- **AI JSON index**: ${baseUrl}/ai.json

## Top Software (AI-Readable Pages)

${softwareLinks || "- Visit the sitemap for a complete list of software pages."}

## Site Statistics

- **Total software**: 1,000,000+
- **Categories**: 30+
- **Languages**: English, Turkish, German, French, Spanish, Japanese, Portuguese, Chinese, Arabic, Korean
- **Updated**: ${"2026-01-01T00:00:00Z".split("T")[0]}

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
