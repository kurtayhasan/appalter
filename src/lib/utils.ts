// src/lib/utils.ts
// Utility fonksiyonları — cn(), formatters, slugify

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ---------------------------------------------------------------------------
// cn — Tailwind class birleştirici (clsx + tailwind-merge)
// ---------------------------------------------------------------------------
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// formatPrice — para birimi formatlama
// ---------------------------------------------------------------------------
export function formatPrice(
  amount: number | null | undefined,
  currency = "USD",
  locale = "en-US"
): string {
  if (amount === null || amount === undefined) return "Free";
  if (amount === 0) return "Free";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ---------------------------------------------------------------------------
// formatRating — rating formatlama
// ---------------------------------------------------------------------------
export function formatRating(rating: number | null | undefined): string {
  if (rating === null || rating === undefined) return "N/A";
  return rating.toFixed(1);
}

// ---------------------------------------------------------------------------
// formatCount — büyük sayıları kısalt (1200 → 1.2K)
// ---------------------------------------------------------------------------
export function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

// ---------------------------------------------------------------------------
// formatDate — tarih formatlama
// ---------------------------------------------------------------------------
export function formatDate(
  dateString: string | null | undefined,
  locale = "en-US"
): string {
  if (!dateString) return "";

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

// ---------------------------------------------------------------------------
// slugify — string'i URL-safe slug'a çevirir
// ---------------------------------------------------------------------------
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------------------
// truncate — metin kısaltma
// ---------------------------------------------------------------------------
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

// ---------------------------------------------------------------------------
// getInitials — isimden baş harfler (avatar için)
// ---------------------------------------------------------------------------
export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

// ---------------------------------------------------------------------------
// absoluteUrl — relative path'i absolute URL'ye çevirir
// ---------------------------------------------------------------------------
export function absoluteUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://appalter.com";
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

// ---------------------------------------------------------------------------
// isValidSlug — slug formatını doğrula
// ---------------------------------------------------------------------------
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug);
}

// ---------------------------------------------------------------------------
// starRatingColor — rating değerine göre renk
// ---------------------------------------------------------------------------
export function starRatingColor(rating: number): string {
  if (rating >= 4.5) return "text-emerald-500";
  if (rating >= 4.0) return "text-green-500";
  if (rating >= 3.0) return "text-yellow-500";
  if (rating >= 2.0) return "text-orange-500";
  return "text-red-500";
}

// ---------------------------------------------------------------------------
// difficultyColor — migration difficulty için renk
// ---------------------------------------------------------------------------
export function difficultyColor(
  difficulty: "easy" | "medium" | "hard" | "expert" | null | undefined
): string {
  switch (difficulty) {
    case "easy": return "text-emerald-400";
    case "medium": return "text-yellow-400";
    case "hard": return "text-orange-400";
    case "expert": return "text-red-400";
    default: return "text-slate-400";
  }
}

// ---------------------------------------------------------------------------
// getLocalizedPath — localePrefix as-needed standardizer
// en (default) -> /path, other locales -> /locale/path
// ---------------------------------------------------------------------------
export function getLocalizedPath(path: string, locale: string = "en"): string {
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  if (locale === "en" || !locale) {
    return cleanPath || "/";
  }
  return `/${locale}${cleanPath}`;
}

