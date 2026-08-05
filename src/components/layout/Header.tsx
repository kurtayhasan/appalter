// src/components/layout/Header.tsx
// Ana site başlığı (Server Component).

import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";

export async function Header({ locale }: { locale: Locale }) {
  // next-intl server-side translation fetch
  const t = await getTranslations({ locale, namespace: "Navigation" });

  return (
    <header className="site-header">
      <div className="container header-container">
        {/* Logo */}
        <Link href={`/${locale}`} className="header-logo" aria-label="AppAlter Home">
          <span className="logo-text">AppAlter</span>
        </Link>

        {/* Search Bar Placeholder (Client Component eklenecek) */}
        <div className="header-search">
          <form action={`/${locale}/search`} className="search-form" role="search">
            <input
              type="search"
              name="q"
              placeholder={t("searchPlaceholder")}
              className="search-input"
              aria-label={t("searchPlaceholder")}
            />
            <button type="submit" className="search-submit" aria-label="Search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>
        </div>

        {/* Navigation */}
        <nav className="header-nav" aria-label="Main Navigation">
          <ul className="nav-list">
            <li>
              <Link href={`/${locale}/category/marketing`} className="nav-link">
                {t("marketing")}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/category/development`} className="nav-link">
                {t("development")}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/search?pricing=free`} className="nav-link">
                {t("freeTools")}
              </Link>
            </li>
          </ul>
        </nav>

        {/* Locale Switcher (Basit versiyon) */}
        <div className="header-locale">
          <select 
            className="locale-select" 
            defaultValue={locale}
            aria-label="Language selection"
          >
            {routing.locales.map((loc) => (
              <option key={loc} value={loc}>
                {loc.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
