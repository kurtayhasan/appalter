import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.appalter.com";

  const standardDisallow = [
    "/api/",
    "/_next/",
    "/(admin)/",
    "/*?*sort=",
    "/*?*pricing=",
    "/*?*platform=",
    "/*?*page=",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: standardDisallow,
      },
      {
        userAgent: "GPTBot",
        allow: ["/", "/llms.txt", "/ai.json"],
        disallow: standardDisallow,
      },
      {
        userAgent: "ClaudeBot",
        allow: ["/", "/llms.txt"],
        disallow: standardDisallow,
      },
      {
        userAgent: "Google-Extended",
        allow: ["/", "/llms.txt"],
        disallow: standardDisallow,
      },
      {
        userAgent: "PerplexityBot",
        allow: ["/", "/llms.txt"],
        disallow: standardDisallow,
      },
      {
        userAgent: "Applebot-Extended",
        allow: ["/", "/llms.txt"],
        disallow: standardDisallow,
      },
    ],
    sitemap: [
      `${siteUrl}/sitemap.xml`,
      `${siteUrl}/feed.xml`,
    ],
  };
}
