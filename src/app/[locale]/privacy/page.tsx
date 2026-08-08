import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { type Locale, routing } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://appalter.com";
  const canonicalUrl =
    locale === routing.defaultLocale ? `${siteUrl}/privacy` : `${siteUrl}/${locale}/privacy`;

  return {
    title: "Privacy Policy | AppAlter",
    description: "Read our Privacy Policy to understand how AppAlter collects, uses, and protects your data.",
    alternates: {
      canonical: canonicalUrl,
      languages: Object.fromEntries(
        routing.locales.map((loc) => [
          loc,
          loc === routing.defaultLocale ? `${siteUrl}/privacy` : `${siteUrl}/${loc}/privacy`,
        ])
      ),
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="container" style={{ padding: "4rem 1.5rem", maxWidth: "800px" }}>
      <h1 style={{ fontSize: "3rem", marginBottom: "1.5rem" }}>Privacy Policy</h1>
      <div className="prose" style={{ lineHeight: "1.8", color: "var(--text-secondary)" }}>
        <p style={{ marginBottom: "1.5rem" }}><em>Last Updated: August 2026</em></p>
        
        <p style={{ marginBottom: "1.5rem" }}>
          At AppAlter, accessible from appalter.com, one of our main priorities is the privacy of our visitors. 
          This Privacy Policy document contains types of information that is collected and recorded by AppAlter and how we use it.
        </p>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem", color: "var(--text-primary)" }}>Log Files</h2>
        <p style={{ marginBottom: "1.5rem" }}>
          AppAlter follows a standard procedure of using log files. These files log visitors when they visit websites. 
          All hosting companies do this and a part of hosting services' analytics. The information collected by log files include 
          internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, 
          and possibly the number of clicks. These are not linked to any information that is personally identifiable. 
          The purpose of the information is for analyzing trends, administering the site, tracking users' movement on the website, 
          and gathering demographic information.
        </p>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem", color: "var(--text-primary)" }}>Cookies and Web Beacons</h2>
        <p style={{ marginBottom: "1.5rem" }}>
          Like any other website, AppAlter uses "cookies". These cookies are used to store information including visitors' preferences, 
          and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience 
          by customizing our web page content based on visitors' browser type and/or other information.
        </p>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem", color: "var(--text-primary)" }}>Google DoubleClick DART Cookie</h2>
        <p style={{ marginBottom: "1.5rem" }}>
          Google is one of a third-party vendor on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors 
          based upon their visit to www.website.com and other sites on the internet. However, visitors may choose to decline the use of DART cookies 
          by visiting the Google ad and content network Privacy Policy at the following URL – 
          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary-color)" }}>https://policies.google.com/technologies/ads</a>
        </p>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem", color: "var(--text-primary)" }}>Third Party Privacy Policies</h2>
        <p style={{ marginBottom: "1.5rem" }}>
          AppAlter's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective 
          Privacy Policies of these third-party ad servers for more detailed information. It may include their practices and instructions 
          about how to opt-out of certain options.
        </p>
        <p style={{ marginBottom: "1.5rem" }}>
          You can choose to disable cookies through your individual browser options. To know more detailed information about cookie management 
          with specific web browsers, it can be found at the browsers' respective websites.
        </p>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem", color: "var(--text-primary)" }}>Consent</h2>
        <p style={{ marginBottom: "1.5rem" }}>
          By using our website, you hereby consent to our Privacy Policy and agree to its Terms and Conditions.
        </p>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem", color: "var(--text-primary)" }}>Contact Us</h2>
        <p style={{ marginBottom: "1.5rem" }}>
          If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us at 
          <a href="mailto:kurtayhasan@gmail.com" style={{ color: "var(--primary-color)" }}> kurtayhasan@gmail.com</a>.
        </p>
      </div>
    </main>
  );
}
