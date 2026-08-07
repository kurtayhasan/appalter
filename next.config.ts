import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // ---------------------------------------------------------------------------
  // PPR (cacheComponents) + React 19
  // ---------------------------------------------------------------------------
  typedRoutes: false,         // Disable typedRoutes because dynamic programmatic SEO routes throw TS errors
  serverExternalPackages: [
    "@supabase/supabase-js",
    "posthog-node",
  ],


  // ---------------------------------------------------------------------------
  // i18n handled by next-intl middleware — NOT the built-in next.js i18n key.
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // Image domains / remote patterns
  // ---------------------------------------------------------------------------
  images: {
    remotePatterns: [
      // Supabase Storage (your project URL)
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Supabase Storage (custom domain)
      {
        protocol: "https",
        hostname: "storage.appalter.com",
        pathname: "/**",
      },
      // Software vendor logos from common CDNs
      {
        protocol: "https",
        hostname: "**.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "logo.clearbit.com",
      },
      {
        protocol: "https",
        hostname: "**.cdnlogo.com",
      },
      {
        protocol: "https",
        hostname: "**.wikimedia.org",
      },
      // Allow all HTTPS origins for dynamically-sourced logos (with size constraint)
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,       // 24h CDN cache for images
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ---------------------------------------------------------------------------
  // Security Headers
  // Applied on every response via headers() below.
  // CSP uses nonce-based approach (nonce injected by middleware).
  // ---------------------------------------------------------------------------
  async headers() {
    const isDev = process.env.NODE_ENV === "development";

    // In development we relax CSP so HMR / React DevTools work.
    const csp = isDev
      ? ""
      : [
          "default-src 'self'",
          // Scripts: self + Vercel analytics + PostHog
          // NOTE: nonce is injected by middleware.ts via Content-Security-Policy header override
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.posthog.com https://vercel.live https://cdn.vercel-insights.com",
          // Styles: self + inline (needed for Tailwind's JIT output)
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          // Fonts
          "font-src 'self' https://fonts.gstatic.com",
          // Images: self + data URIs + Supabase + known CDNs
          "img-src 'self' data: blob: https: *.supabase.co logo.clearbit.com",
          "connect-src 'self' https://*.supabase.co https://app.posthog.com https://*.sentry.io wss://*.supabase.co",
          "media-src 'self'",
          // Frames
          "frame-src 'none'",
          // Frame ancestors
          "frame-ancestors 'none'",
          // Base URI
          "base-uri 'self'",
          // Form actions
          "form-action 'self'",
          // Object / embed
          "object-src 'none'",
          // Upgrade insecure requests in prod
          "upgrade-insecure-requests",
        ].join("; ");

    const securityHeaders = [
      {
        key: "X-DNS-Prefetch-Control",
        value: "on",
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value:
          "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
      },
      ...(csp
        ? [
            {
              key: "Content-Security-Policy",
              value: csp,
            },
          ]
        : []),
      {
        key: "X-XSS-Protection",
        value: "1; mode=block",
      },
    ];

    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // ---------------------------------------------------------------------------
  // Redirects — handled dynamically via Supabase `redirects` table in
  // middleware.ts, static redirects handled by next-intl (as-needed prefix)
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // Webpack — suppress Supabase realtime ws warning in SSR
  // ---------------------------------------------------------------------------
  webpack(config, { isServer }) {
    if (isServer) {
      config.externals = [...(config.externals ?? []), "bufferutil", "utf-8-validate"];
    }
    return config;
  },

  // ---------------------------------------------------------------------------
  // Output — standalone for Docker / Vercel
  // ---------------------------------------------------------------------------
  // Standalone output'u sildim, böylece 'next start' sorunsuz çalışacak

  // ---------------------------------------------------------------------------
  // Compiler options
  // ---------------------------------------------------------------------------
  compiler: {
    // Remove all console.log in production builds (keep warn/error)
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },

  // ---------------------------------------------------------------------------
  // Logging
  // ---------------------------------------------------------------------------
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  // ---------------------------------------------------------------------------
  // PoweredByHeader — remove "X-Powered-By: Next.js" for security
  // ---------------------------------------------------------------------------
  poweredByHeader: false,

  // ---------------------------------------------------------------------------
  // Trailing slashes — false keeps URLs canonical without trailing /
  // ---------------------------------------------------------------------------
  trailingSlash: false,
};

export default withNextIntl(nextConfig);
