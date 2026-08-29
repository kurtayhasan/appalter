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
    locale === routing.defaultLocale ? `${siteUrl}/about` : `${siteUrl}/${locale}/about`;

  return {
    title: "About Us | AppAlter",
    description: "Learn more about AppAlter, our mission, and how we help you find the best software alternatives.",
    alternates: {
      canonical: canonicalUrl,
      languages: Object.fromEntries(
        routing.locales.map((loc) => [
          loc,
          loc === routing.defaultLocale ? `${siteUrl}/about` : `${siteUrl}/${loc}/about`,
        ])
      ),
    },
    openGraph: {
      title: "About Us | AppAlter",
      description: "Learn more about AppAlter, our mission, and how we help you find the best software alternatives.",
      url: canonicalUrl,
      type: "website",
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="container" style={{ padding: "4rem 1.5rem", maxWidth: "800px" }}>
      <h1 style={{ fontSize: "3rem", marginBottom: "1.5rem" }}>About AppAlter</h1>
      <div className="prose" style={{ lineHeight: "1.8", color: "var(--text-secondary)" }}>
        <p style={{ marginBottom: "1.5rem" }}>
          Welcome to AppAlter, the premier platform dedicated to helping you find the perfect software alternatives. 
          In today's fast-paced digital world, finding the right tools can be overwhelming. We simplify that process.
        </p>
        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem", color: "var(--text-primary)" }}>Our Mission</h2>
        <p style={{ marginBottom: "1.5rem" }}>
          Our mission is to empower individuals and businesses to make informed decisions about the software they use. 
          Whether you are looking for cost-effective open-source solutions, feature-rich premium tools, or simply a change of pace, 
          AppAlter provides comprehensive comparisons, detailed reviews, and AI-driven insights to guide your choice.
        </p>
        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem", color: "var(--text-primary)" }}>Why Choose Us?</h2>
        <ul style={{ paddingLeft: "1.5rem", marginBottom: "1.5rem" }}>
          <li style={{ marginBottom: "0.5rem" }}><strong>Comprehensive Database:</strong> We track thousands of software products across hundreds of categories.</li>
          <li style={{ marginBottom: "0.5rem" }}><strong>Unbiased Comparisons:</strong> Our alternative suggestions are data-driven and focused on features and value.</li>
          <li style={{ marginBottom: "0.5rem" }}><strong>AI-Powered Insights:</strong> We leverage the latest in AI technology to categorize, summarize, and recommend the best tools for your specific needs.</li>
        </ul>
        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem", color: "var(--text-primary)" }}>Get in Touch</h2>
        <p style={{ marginBottom: "1.5rem" }}>
          We are always looking to improve our platform. If you have any questions, suggestions, or feedback, please don't hesitate to contact us.
        </p>
      </div>
    </main>
  );
}
