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
      },
      {
        userAgent: "ClaudeBot",
        allow: ["/", "/llms.txt"],
      },
      {
        userAgent: "Google-Extended",
        allow: ["/", "/llms.txt"],
      },
      {
        userAgent: "PerplexityBot",
        allow: ["/", "/llms.txt"],
      },
      {
        userAgent: "Applebot-Extended",
        allow: ["/", "/llms.txt"],
      },
    ],
    sitemap: [
      `${siteUrl}/sitemap.xml`
    ],
  };
}
