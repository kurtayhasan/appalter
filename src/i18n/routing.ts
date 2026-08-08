import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

// ---------------------------------------------------------------------------
// next-intl routing configuration
// ---------------------------------------------------------------------------
export const routing = defineRouting({
  // Desteklenen tüm diller — veritabanındaki translation_status lokalleriyle eşleşmeli
  locales: ["en", "tr"],

  // Varsayılan dil — "/" rotası "en" içeriğini prefix'siz sunar
  defaultLocale: "en",

  // Prefix stratejisi:
  //   "as-needed" → default locale (/en) prefix'i olmadan yayınlanır → SEO dostu
  //   URL: /project-management  (en, prefix yok)
  //        /tr/proje-yonetimi   (tr)
  //        /de/projektmanagement (de)
  localePrefix: "as-needed",

  // Locale algılama sırası: URL → Accept-Language header → varsayılan
  localeDetection: true,

  // Her rota için tanımlı path'ler (isteğe bağlı i18n URL'leri)
  // Şimdilik tüm localler aynı slug'ı kullanır; gelecekte
  // category slug'ları locale'ye göre çevrilebilir.
  pathnames: {
    "/": "/",
    "/search": {
      en: "/search",
      tr: "/ara",
    },
  },
});

// ---------------------------------------------------------------------------
// Exported types — kullanımı: import type { Locale } from "@/i18n/routing"
// ---------------------------------------------------------------------------
export type Locale = (typeof routing.locales)[number];

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
