import { NextResponse } from "next/server";
import { createStaticClient } from "@/lib/supabase/server";

export const revalidate = 3600; // 1 hour

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://appalter.com";
  const supabase = createStaticClient();

  // En son eklenen veya güncellenen 50 yazılımı çek
  const { data: softwares } = await supabase
    .from("softwares")
    .select("slug, name, tagline, short_description, updated_at, created_at")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(50);

  const itemsList = (softwares as any[]) || [];

  const itemsXml = itemsList
    .map((sw) => {
      const pubDate = new Date(sw.updated_at || sw.created_at || Date.now()).toUTCString();
      const description = sw.tagline || sw.short_description || `Discover the best alternatives to ${sw.name}`;
      return `
    <item>
      <title><![CDATA[${sw.name} Alternatives & Review (2026)]]></title>
      <link>${baseUrl}/en/${sw.slug}</link>
      <guid isPermaLink="true">${baseUrl}/en/${sw.slug}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${description}]]></description>
    </item>`;
    })
    .join("");

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AppAlter - Best Software Alternatives &amp; Comparisons</title>
    <link>${baseUrl}</link>
    <description>Find and compare the best SaaS and software alternatives.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(rssXml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=1800",
    },
  });
}
