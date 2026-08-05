import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

// ---------------------------------------------------------------------------
// next-intl server-side request configuration
// Çağrıldığı yer: next-intl'in internal Next.js plugin'i (App Router)
// ---------------------------------------------------------------------------
const STATIC_NOW = new Date("2025-01-01T00:00:00Z");

export default getRequestConfig(async ({ requestLocale }) => {
  // requestLocale, [locale] segment'inden gelir; doğrula
  let locale = await requestLocale;

  // Tanımlı locale listesinde yoksa varsayılana dön
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }

  // Mesaj dosyasını dinamik import ile yükle (code-splitting için)
  const messages = (
    await import(`../../messages/${locale}.json`)
  ).default as any;

  return {
    locale,
    messages,
    // Saat dilimi: UTC — istemci tarafında kullanıcının yerel saatiyle gösterilir
    timeZone: "UTC",
    // Tarih/saat formatları (opsiyonel — bileşenlerde useFormatter ile kullanılır)
    formats: {
      dateTime: {
        short: {
          day: "numeric",
          month: "short",
          year: "numeric",
        },
        long: {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        },
      },
      number: {
        price: {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        },
      },
    },
    now: STATIC_NOW,
  };
});
