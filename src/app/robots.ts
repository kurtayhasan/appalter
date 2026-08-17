import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://appalter.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/(admin)/"],
      },
      {
        userAgent: "GPTBot",
        allow: ["/", "/llms.txt", "/ai.json"],
        disallow: ["/api/", "/(admin)/"],
      },
      {
        userAgent: "ClaudeBot",
        allow: ["/", "/llms.txt"],
        disallow: ["/api/", "/(admin)/"],
      },
      {
        userAgent: "Google-Extended",
        allow: ["/", "/llms.txt"],
        disallow: ["/api/", "/(admin)/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: ["/", "/llms.txt"],
        disallow: ["/api/", "/(admin)/"],
      },
      {
        userAgent: "Applebot-Extended",
        allow: ["/", "/llms.txt"],
        disallow: ["/api/", "/(admin)/"],
      },
    ],
    sitemap: [
      `${siteUrl}/sitemap.xml`,
      `${siteUrl}/feed.xml`
    ],
  };
}
