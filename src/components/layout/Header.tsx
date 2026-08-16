// src/components/layout/Header.tsx
// Ana site başlığı (Server Component).

import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LiveSearchModal } from "@/components/search/LiveSearchModal";

import { getLocalizedPath } from "@/lib/utils";

export async function Header({ locale }: { locale: Locale }) {
  // next-intl server-side translation fetch
  const t = await getTranslations({ locale, namespace: "Navigation" });

  return (
    <header className="site-header">
      <div className="container header-container">
        {/* Logo */}
        <Link href={getLocalizedPath("/", locale)} className="header-logo" aria-label="AppAlter Home">
          <span className="logo-text">AppAlter</span>
        </Link>

        {/* Instant Live Search (Spotlight & Cmd+K) */}
        <div className="header-search">
          <LiveSearchModal locale={locale} />
        </div>

        {/* Navigation */}
        <nav className="header-nav" aria-label="Main Navigation">
          <ul className="nav-list">
            <li>
              <Link href={getLocalizedPath("/category/marketing", locale)} className="nav-link">
                {t("marketing")}
              </Link>
            </li>
            <li>
              <Link href={getLocalizedPath("/category/development", locale)} className="nav-link">
                {t("development")}
              </Link>
            </li>
            <li>
              <Link href={getLocalizedPath("/search?pricing=free", locale)} className="nav-link">
                {t("freeTools")}
              </Link>
            </li>
          </ul>
        </nav>

        {/* Header Actions: Theme Toggle + Locale Switcher */}
        <div className="header-actions">
          <ThemeToggle />
          <div className="header-locale">
            <LanguageSwitcher currentLocale={locale} locales={[...routing.locales]} />
          </div>
        </div>
      </div>
    </header>
  );
}
