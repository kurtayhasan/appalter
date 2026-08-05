import { type Locale, routing } from "@/i18n/routing";
import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// next-intl lokalizasyon middleware'i
// ---------------------------------------------------------------------------
const intlMiddleware = createMiddleware(routing);

// ---------------------------------------------------------------------------
// Matcher: hangi path'ler middleware'e tabi
// ---------------------------------------------------------------------------
export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *  - _next/static / _next/image (build assets)
     *  - favicon.ico
     *  - Static file extensions
     *  - API routes (/api/*)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff2?|ttf|eot|otf)|api/).*)",
  ],
};

// ---------------------------------------------------------------------------
// Paths that skip locale prefix handling entirely
// ---------------------------------------------------------------------------
const PUBLIC_PATHS_NO_LOCALE = new Set([
  "/llms.txt",
  "/ai.json",
  "/sitemap.xml",
  "/robots.txt",
]);

// Locale slugs that are NOT software slugs (skip slug-redirect check)
const NON_SOFTWARE_SLUGS = new Set([
  "category",
  "search",
  "collections",
  "dashboard",
  "blog",
  "about",
  "privacy",
  "terms",
]);

// ---------------------------------------------------------------------------
// MAIN MIDDLEWARE
// ---------------------------------------------------------------------------
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Skip locale handling for known public paths ────────────────────────
  if (PUBLIC_PATHS_NO_LOCALE.has(pathname)) {
    return NextResponse.next();
  }

  // ── 2. Run next-intl locale middleware ─────────────────────────────────────
  const response = intlMiddleware(request);

  // ── 3. Inject CSP nonce (production only) ─────────────────────────────────
  // Edge Runtime has globalThis.crypto available (Web Crypto API)
  if (process.env.NODE_ENV === "production") {
    const nonce = Buffer.from(globalThis.crypto.randomUUID()).toString("base64");

    // Build a tight CSP with the nonce
    const cspHeader = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' https://app.posthog.com https://vercel.live`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co https://app.posthog.com https://o*.ingest.sentry.io wss://*.supabase.co",
      "media-src 'self'",
      "frame-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; ");

    response.headers.set("Content-Security-Policy", cspHeader);
    // Surface nonce to Server Components via custom request header
    response.headers.set("x-nonce", nonce);
  }

  // ── 4. Slug-level 301 redirect resolution (slug_history table) ───────────
  const localePattern = new RegExp(
    `^/(${routing.locales.join("|")})/([^/]+)(/.*)?$`
  );
  const defaultLocalePattern = /^\/([^/]+)(\/.*)?$/;

  // Try locale-prefixed path first, then default-locale (no prefix) path
  let slug: string | undefined;
  let locale: Locale = routing.defaultLocale as Locale;
  let rest = "";

  const prefixedMatch = pathname.match(localePattern);
  if (prefixedMatch) {
    locale = prefixedMatch[1] as Locale;
    slug = prefixedMatch[2];
    rest = prefixedMatch[3] ?? "";
  } else if (!pathname.startsWith("/api/") && !pathname.startsWith("/_next/")) {
    const defaultMatch = pathname.match(defaultLocalePattern);
    if (defaultMatch) {
      slug = defaultMatch[1];
      rest = defaultMatch[2] ?? "";
    }
  }

  if (slug && !NON_SOFTWARE_SLUGS.has(slug)) {
    try {
      const redirectTarget = await resolveSlugRedirect(slug);

      if (redirectTarget && redirectTarget !== slug) {
        const isDefaultLocale = locale === routing.defaultLocale;
        const destination = isDefaultLocale
          ? new URL(`/${redirectTarget}${rest}`, request.url)
          : new URL(`/${locale}/${redirectTarget}${rest}`, request.url);

        return NextResponse.redirect(destination, {
          status: 301,
          headers: {
            "Cache-Control":
              "public, max-age=86400, stale-while-revalidate=3600",
          },
        });
      }
    } catch {
      // Swallow — never break page rendering due to redirect lookup failure
    }
  }

  return response;
}

// ---------------------------------------------------------------------------
// resolveSlugRedirect
// Uses lightweight Supabase REST fetch (no full JS client in edge bundle).
// ---------------------------------------------------------------------------
async function resolveSlugRedirect(slug: string): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;

  const url = new URL(`${supabaseUrl}/rest/v1/slug_history`);
  url.searchParams.set("old_slug", `eq.${slug}`);
  url.searchParams.set("entity_type", "eq.software");
  url.searchParams.set("select", "new_slug");
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) return null;

  const data = (await res.json()) as Array<{ new_slug: string }>;
  return data[0]?.new_slug ?? null;
}
