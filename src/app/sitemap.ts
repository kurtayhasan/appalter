import { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

export const revalidate = 86400; // Cache for 24 hours

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.appalter.com";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const getUrl = (locale: string, path: string = "") => {
    const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
    return locale === routing.defaultLocale
      ? `${baseUrl}${cleanPath}`
      : `${baseUrl}/${locale}${cleanPath}`;
  };

  const routes: MetadataRoute.Sitemap = [];

  // 1. Static Routes (Home, Categories Index, Informational & Legal)
  const staticPaths = ["", "/categories", "/about", "/contact", "/privacy", "/terms"];
  for (const path of staticPaths) {
    for (const locale of routing.locales) {
      routes.push({
        url: getUrl(locale, path),
        lastModified: new Date(),
        changeFrequency: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1 : 0.8,
      });
    }
  }

  if (!supabaseUrl || !anonKey) return routes;

  try {
    const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };

    // 2. Fetch Active Categories (only those with software_count > 0)
    const catRes = await fetch(
      `${supabaseUrl}/rest/v1/categories?is_active=eq.true&software_count=gt.0&select=slug,updated_at&order=software_count.desc`,
      { headers }
    );
    if (catRes.ok) {
      const categories = await catRes.json();
      for (const cat of categories) {
        const lastMod = cat.updated_at ? new Date(cat.updated_at) : new Date();
        for (const locale of routing.locales) {
          routes.push({
            url: getUrl(locale, `/category/${cat.slug}`),
            lastModified: lastMod,
            changeFrequency: "weekly",
            priority: 0.8,
          });
        }
      }
    }

    // 3. Fetch Softwares (published only)
    const swRes = await fetch(
      `${supabaseUrl}/rest/v1/softwares?status=eq.published&select=slug,updated_at,alternative_count&order=updated_at.desc.nullslast&limit=10000`,
      { headers }
    );
    if (swRes.ok) {
      const softwares = await swRes.json();
      for (const sw of softwares) {
        const lastMod = sw.updated_at ? new Date(sw.updated_at) : new Date();
        for (const locale of routing.locales) {
          // Software Detail Page
          routes.push({
            url: getUrl(locale, `/${sw.slug}`),
            lastModified: lastMod,
            changeFrequency: "weekly",
            priority: 0.9,
          });
          // Alternatives List Page (only if software actually has alternatives)
          if ((sw.alternative_count ?? 0) > 0) {
            routes.push({
              url: getUrl(locale, `/${sw.slug}/alternatives`),
              lastModified: lastMod,
              changeFrequency: "weekly",
              priority: 0.7,
            });
          }
        }
      }
    }

    // 4. Fetch Top High-Value Indexable VS Pairs
    const altRes = await fetch(
      `${supabaseUrl}/rest/v1/alternatives?select=software_id,alternative_id,updated_at,software:softwares!alternatives_software_id_fkey(slug,status),alternative:softwares!alternatives_alternative_id_fkey(slug,status)&is_approved=eq.true&is_indexable=eq.true&order=updated_at.desc.nullslast&limit=5000`,
      { headers }
    );
    if (altRes.ok) {
      const alternatives = await altRes.json();
      for (const alt of alternatives) {
        const sw = alt.software;
        const targetSw = alt.alternative;
        if (sw?.slug && targetSw?.slug && sw.status === "published" && targetSw.status === "published") {
          const lastMod = alt.updated_at ? new Date(alt.updated_at) : new Date();
          for (const locale of routing.locales) {
            routes.push({
              url: getUrl(locale, `/${sw.slug}/vs/${targetSw.slug}`),
              lastModified: lastMod,
              changeFrequency: "monthly",
              priority: 0.6,
            });
          }
        }
      }
    }
  } catch (e) {
    console.error("Failed to fetch data for sitemap", e);
  }

  return routes;
}
