import React from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import type { Metadata, Viewport } from "next";
import { routing, type Locale } from "@/i18n/routing";
import { Inter } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "@/app/globals.css";

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

// ---------------------------------------------------------------------------
// Static locale segments for generateStaticParams
// ---------------------------------------------------------------------------
export function generateStaticParams() {
  return routing.locales.map((locale: Locale) => ({ locale }));
}

// ---------------------------------------------------------------------------
// Viewport
// ---------------------------------------------------------------------------
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
  width: "device-width",
  initialScale: 1,
};

// ---------------------------------------------------------------------------
// Metadata (locale-aware base metadata)
// ---------------------------------------------------------------------------
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://appalter.com"
    ),
    title: {
      default: "AppAlter — Find the Best Software Alternatives",
      template: "%s | AppAlter",
    },
    description:
      "Discover the best alternatives to any software. Compare features, pricing, and ratings to find your perfect tool.",
    keywords: [
      "software alternatives",
      "app alternatives",
      "software comparison",
      "best software",
      "open source alternatives",
    ],
    authors: [{ name: "AppAlter Team" }],
    creator: "AppAlter",
    publisher: "AppAlter",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      siteName: "AppAlter",
      locale: locale.replace("-", "_"),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      site: "@appalter",
      creator: "@appalter",
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
    alternates: {
      types: {
        "application/rss+xml": "/feed.xml",
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Root Layout
// ---------------------------------------------------------------------------
interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Validate locale — triggers 404 for invalid locales
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  // Load all messages for the current locale (passed to NextIntlClientProvider)
  const messages = await getMessages();

  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Preconnect to critical third-party origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link
            rel="preconnect"
            href={process.env.NEXT_PUBLIC_SUPABASE_URL}
          />
        )}
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Header locale={locale as Locale} />
          <main className="site-main">{children}</main>
          <Footer locale={locale as Locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
