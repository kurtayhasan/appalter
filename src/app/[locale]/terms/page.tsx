import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { type Locale, routing } from "@/i18n/routing";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://appalter.com";
  const canonicalUrl =
    locale === routing.defaultLocale ? `${siteUrl}/terms` : `${siteUrl}/${locale}/terms`;

  return {
    title: "Terms of Service | AppAlter",
    description: "Read our Terms of Service to understand the rules and regulations for using AppAlter.",
    alternates: {
      canonical: canonicalUrl,
      languages: Object.fromEntries(
        routing.locales.map((loc) => [
          loc,
          loc === routing.defaultLocale ? `${siteUrl}/terms` : `${siteUrl}/${loc}/terms`,
        ])
      ),
    },
    openGraph: {
      title: "Terms of Service | AppAlter",
      description: "Read our Terms of Service to understand the rules and regulations for using AppAlter.",
      url: canonicalUrl,
      type: "website",
    },
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="container" style={{ padding: "4rem 1.5rem", maxWidth: "800px" }}>
      <h1 style={{ fontSize: "3rem", marginBottom: "1.5rem" }}>Terms of Service</h1>
      <div className="prose" style={{ lineHeight: "1.8", color: "var(--text-secondary)" }}>
        <p style={{ marginBottom: "1.5rem" }}><em>Last Updated: August 2026</em></p>
        
        <p style={{ marginBottom: "1.5rem" }}>
          Welcome to AppAlter! These terms and conditions outline the rules and regulations for the use of AppAlter's Website, 
          located at appalter.com.
        </p>
        <p style={{ marginBottom: "1.5rem" }}>
          By accessing this website we assume you accept these terms and conditions. Do not continue to use AppAlter if you do not 
          agree to take all of the terms and conditions stated on this page.
        </p>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem", color: "var(--text-primary)" }}>Cookies</h2>
        <p style={{ marginBottom: "1.5rem" }}>
          We employ the use of cookies. By accessing AppAlter, you agreed to use cookies in agreement with the AppAlter's Privacy Policy.
          Most interactive websites use cookies to let us retrieve the user's details for each visit. Cookies are used by our website to 
          enable the functionality of certain areas to make it easier for people visiting our website. Some of our affiliate/advertising 
          partners may also use cookies.
        </p>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem", color: "var(--text-primary)" }}>License</h2>
        <p style={{ marginBottom: "1.5rem" }}>
          Unless otherwise stated, AppAlter and/or its licensors own the intellectual property rights for all material on AppAlter. 
          All intellectual property rights are reserved. You may access this from AppAlter for your own personal use subjected to 
          restrictions set in these terms and conditions.
        </p>
        <ul style={{ paddingLeft: "1.5rem", marginBottom: "1.5rem" }}>
          <li style={{ marginBottom: "0.5rem" }}>Republish material from AppAlter</li>
          <li style={{ marginBottom: "0.5rem" }}>Sell, rent or sub-license material from AppAlter</li>
          <li style={{ marginBottom: "0.5rem" }}>Reproduce, duplicate or copy material from AppAlter</li>
          <li style={{ marginBottom: "0.5rem" }}>Redistribute content from AppAlter</li>
        </ul>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem", color: "var(--text-primary)" }}>Disclaimer</h2>
        <p style={{ marginBottom: "1.5rem" }}>
          To the maximum extent permitted by applicable law, we exclude all representations, warranties and conditions relating to our 
          website and the use of this website. AppAlter provides information about software and alternatives for informational purposes 
          only. We do not guarantee the accuracy, completeness, or usefulness of this information.
        </p>
        <p style={{ marginBottom: "1.5rem" }}>
          As long as the website and the information and services on the website are provided free of charge, we will not be liable 
          for any loss or damage of any nature.
        </p>
      </div>
    </main>
  );
}
