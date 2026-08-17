import { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

export const revalidate = 86400; // Cache for 24 hours

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://appalter.com";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const getUrl = (locale: string, path: string = "") => {
    const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
    return locale === routing.defaultLocale
      ? `${baseUrl}${cleanPath}`
      : `${baseUrl}/${locale}${cleanPath}`;
  };

  const routes: MetadataRoute.Sitemap = [];

  // 1. Static Routes (Home & Categories Index)
  for (const locale of routing.locales) {
    routes.push({
      url: getUrl(locale, ""),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    });
    routes.push({
      url: getUrl(locale, "/categories"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  if (!supabaseUrl || !anonKey) return routes;

  try {
    const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };

    // 2. Fetch Categories
    const catRes = await fetch(`${supabaseUrl}/rest/v1/categories?select=slug`, { headers });
    if (catRes.ok) {
      const categories = await catRes.json();
      for (const cat of categories) {
        for (const locale of routing.locales) {
          routes.push({
            url: getUrl(locale, `/category/${cat.slug}`),
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
          });
        }
      }
    }

    // 3. Fetch Softwares
    // Added order=updated_at.desc.nullslast to ensure the newest published softwares are always included
    const swRes = await fetch(`${supabaseUrl}/rest/v1/softwares?status=eq.published&select=slug,updated_at,alternative_count&order=updated_at.desc.nullslast&limit=10000`, { headers });
    let softwares = [];
    if (swRes.ok) {
      softwares = await swRes.json();
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

    // 4. Fetch Top VS Pairs (Alternatives)
    // Added order=created_at.desc.nullslast to ensure newly opened comparisons are indexed
    const altRes = await fetch(
      `${supabaseUrl}/rest/v1/alternatives?select=software_id,alternative_id,software:softwares!alternatives_software_id_fkey(slug),alternative:softwares!alternatives_alternative_id_fkey(slug)&is_approved=eq.true&is_indexable=eq.true&order=created_at.desc.nullslast&limit=10000`,
      { headers }
    );
    if (altRes.ok) {
      const alternatives = await altRes.json();
      for (const alt of alternatives) {
        const swSlug = alt.software?.slug;
        const altSlug = alt.alternative?.slug;
        if (swSlug && altSlug) {
          for (const locale of routing.locales) {
            routes.push({
              url: getUrl(locale, `/${swSlug}/vs/${altSlug}`),
              lastModified: new Date(),
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
