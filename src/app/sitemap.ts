import { MetadataRoute } from "next";

export const revalidate = 86400; // Cache for 24 hours

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://appalter.com";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/en`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/en/categories`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  if (supabaseUrl && anonKey) {
    try {
      const headers = {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      };

      const res = await fetch(`${supabaseUrl}/rest/v1/softwares?status=eq.published&select=slug,updated_at&limit=50000`, {
        headers,
      });

      if (res.ok) {
        const softwares = await res.json();
        for (const sw of softwares) {
          routes.push({
            url: `${baseUrl}/en/${sw.slug}`,
            lastModified: sw.updated_at ? new Date(sw.updated_at) : new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
      }
    } catch (e) {
      console.error("Failed to fetch software for sitemap", e);
    }
  }

  return routes;
}
