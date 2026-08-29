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
    locale === routing.defaultLocale ? `${siteUrl}/contact` : `${siteUrl}/${locale}/contact`;

  return {
    title: "Contact Us | AppAlter",
    description: "Get in touch with the AppAlter team. We'd love to hear your feedback, suggestions, or partnership inquiries.",
    alternates: {
      canonical: canonicalUrl,
      languages: Object.fromEntries(
        routing.locales.map((loc) => [
          loc,
          loc === routing.defaultLocale ? `${siteUrl}/contact` : `${siteUrl}/${loc}/contact`,
        ])
      ),
    },
    openGraph: {
      title: "Contact Us | AppAlter",
      description: "Get in touch with the AppAlter team. We'd love to hear your feedback, suggestions, or partnership inquiries.",
      url: canonicalUrl,
      type: "website",
    },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="container" style={{ padding: "4rem 1.5rem", maxWidth: "800px" }}>
      <h1 style={{ fontSize: "3rem", marginBottom: "1.5rem" }}>Contact Us</h1>
      <div className="prose" style={{ lineHeight: "1.8", color: "var(--text-secondary)" }}>
        <p style={{ marginBottom: "1.5rem" }}>
          Have a question, suggestion, or a software recommendation? We'd love to hear from you. 
          Please use the information below to get in touch with the AppAlter team.
        </p>
        
        <div style={{ padding: "2rem", backgroundColor: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border-color)", marginTop: "2rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "var(--text-primary)" }}>Email Us</h2>
          <p style={{ marginBottom: "0.5rem" }}>
            For general inquiries and support:
          </p>
          <a href="mailto:kurtayhasan@gmail.com" style={{ fontSize: "1.25rem", color: "var(--primary-color)", fontWeight: "500", textDecoration: "none" }}>kurtayhasan@gmail.com</a>
        </div>

        <h2 style={{ fontSize: "1.75rem", marginTop: "3rem", marginBottom: "1rem", color: "var(--text-primary)" }}>Frequently Asked Questions</h2>
        <ul style={{ paddingLeft: "1.5rem", marginBottom: "1.5rem" }}>
          <li style={{ marginBottom: "1rem" }}>
            <strong>How can I add my software to AppAlter?</strong><br/>
            Currently, our database is updated programmatically and curated by our editorial team. If you'd like your software to be considered, please email us with details.
          </li>
          <li style={{ marginBottom: "1rem" }}>
            <strong>Found incorrect information?</strong><br/>
            Please email us with a link to the page and the correction needed. We strive for accuracy and appreciate your help.
          </li>
        </ul>
      </div>
    </main>
  );
}
