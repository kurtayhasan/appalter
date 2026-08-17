// src/components/seo/JsonLd.tsx
// JSON-LD yapılandırılmış veri bileşenleri — tüm schema.org tipleri.
// Server Component'lar — client bundle'a dahil değiller.

import type { SoftwareDetail, BreadcrumbItem, SoftwareFAQ } from "@/types";

// ---------------------------------------------------------------------------
// SoftwareJsonLd — SoftwareApplication schema
// ---------------------------------------------------------------------------
interface SoftwareJsonLdProps {
  software: SoftwareDetail;
  url: string;
}

export function SoftwareJsonLd({ software, url }: SoftwareJsonLdProps) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": url,
    name: software.name,
    description:
      software.meta_description ??
      software.short_description ??
      software.description,
    url: software.website_url ?? url,
    applicationCategory: software.category_name ?? "SoftwareApplication",
    operatingSystem: "Web",
    ...(software.logo_url && {
      image: software.logo_url,
    }),
    ...(software.developer_name && {
      author: {
        "@type": "Organization",
        name: software.developer_name,
        url: software.developer_url,
      },
    }),
    ...(software.avg_rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: software.avg_rating.toFixed(1),
        reviewCount: Math.max(software.review_count || 1, 1),
        bestRating: "5",
        worstRating: "1",
      },
    }),
    offers: buildOffers(software),
    ...(software.is_discontinued && {
      applicationCategory: "DiscontinuedApplication",
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ---------------------------------------------------------------------------
// FAQJsonLd — FAQPage schema
// ---------------------------------------------------------------------------
interface FAQJsonLdProps {
  faqs: SoftwareFAQ[];
}

export function FAQJsonLd({ faqs }: FAQJsonLdProps) {
  if (faqs.length === 0) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ---------------------------------------------------------------------------
// AlternativesListJsonLd — ItemList schema for alternatives
// ---------------------------------------------------------------------------
interface AlternativesListJsonLdProps {
  softwareName: string;
  alternatives: Array<{
    name: string;
    slug: string;
    url: string;
    description?: string | null;
    logoUrl?: string | null;
    rating?: number | null;
  }>;
}

export function AlternativesListJsonLd({
  softwareName,
  alternatives,
}: AlternativesListJsonLdProps) {
  if (alternatives.length === 0) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Best Alternatives to ${softwareName}`,
    numberOfItems: alternatives.length,
    itemListElement: alternatives.map((alt, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "SoftwareApplication",
        name: alt.name,
        url: alt.url,
        description: alt.description,
        ...(alt.logoUrl && { image: alt.logoUrl }),
        ...(alt.rating && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: alt.rating.toFixed(1),
            bestRating: "5",
          },
        }),
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ---------------------------------------------------------------------------
// ComparisonJsonLd — ItemList for VS pages
// ---------------------------------------------------------------------------
interface ComparisonJsonLdProps {
  software: { name: string; url: string; logo?: string | null; rating?: number | null };
  alternative: { name: string; url: string; logo?: string | null; rating?: number | null };
  comparisonUrl: string;
}

export function ComparisonJsonLd({
  software,
  alternative,
  comparisonUrl,
}: ComparisonJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${software.name} vs ${alternative.name} Comparison`,
    url: comparisonUrl,
    numberOfItems: 2,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        item: {
          "@type": "SoftwareApplication",
          name: software.name,
          url: software.url,
          ...(software.logo && { image: software.logo }),
          ...(software.rating && {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: software.rating.toFixed(1),
              bestRating: "5",
            },
          }),
        },
      },
      {
        "@type": "ListItem",
        position: 2,
        item: {
          "@type": "SoftwareApplication",
          name: alternative.name,
          url: alternative.url,
          ...(alternative.logo && { image: alternative.logo }),
          ...(alternative.rating && {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: alternative.rating.toFixed(1),
              bestRating: "5",
            },
          }),
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ---------------------------------------------------------------------------
// WebSiteJsonLd — SiteLinksSearchBox + Organization
// ---------------------------------------------------------------------------
export function WebSiteJsonLd({ baseUrl }: { baseUrl: string }) {
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      url: baseUrl,
      name: "AppAlter",
      description: "Find the best software alternatives",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${baseUrl}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      name: "AppAlter",
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.png`,
        width: 512,
        height: 512,
      },
      sameAs: [
        "https://twitter.com/appalter",
        "https://github.com/appalter",
      ],
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ---------------------------------------------------------------------------
// Helper: buildOffers
// ---------------------------------------------------------------------------
function buildOffers(software: SoftwareDetail) {
  const { pricing_model_slug, starting_price, price_currency } = software;

  if (
    pricing_model_slug === "free" ||
    pricing_model_slug === "open-source"
  ) {
    return {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    };
  }

  if (pricing_model_slug === "freemium") {
    return [
      {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        name: "Free tier",
      },
      ...(starting_price
        ? [
            {
              "@type": "Offer",
              price: starting_price.toFixed(2),
              priceCurrency: price_currency,
              name: "Paid tier",
            },
          ]
        : []),
    ];
  }

  if (starting_price) {
    return {
      "@type": "Offer",
      price: starting_price.toFixed(2),
      priceCurrency: price_currency,
      availability: "https://schema.org/InStock",
    };
  }

  return {
    "@type": "Offer",
    availability: "https://schema.org/InStock",
  };
}
