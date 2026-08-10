import React from "react";
import { getLocale } from "next-intl/server";
import { Inter, Outfit } from "next/font/google";
import { Suspense } from "react";
import Script from "next/script";
import "@/app/globals.css";
import { PostHogProvider, PostHogPageview } from "@/components/providers/PostHogProvider";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  variable: "--font-outfit",
  display: "swap",
});

export default async function GlobalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head>
      </head>
      <body>
        <Suspense fallback={null}>
          <PostHogPageview />
        </Suspense>
        <PostHogProvider>
          {children}
        </PostHogProvider>
        
        {/* Google Analytics */}
        <Script
          strategy="lazyOnload"
          src="https://www.googletagmanager.com/gtag/js?id=G-7S5JDVBGYL"
        />
        <Script
          id="google-analytics"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-7S5JDVBGYL');
            `,
          }}
        />

        {/* Google AdSense */}
        <Script
          id="google-adsense"
          strategy="lazyOnload"
          crossOrigin="anonymous"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5280507999154958"
        />
      </body>
    </html>
  );
}
