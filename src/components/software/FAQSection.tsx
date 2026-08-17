// src/components/software/FAQSection.tsx
// SSS bölümü — FAQPage JSON-LD ile birlikte.
// Suspense ile stream edilir.

import type { Locale } from "@/i18n/routing";
import { getFAQsCached } from "@/lib/cache/queries";
import { FAQJsonLd } from "@/components/seo/JsonLd";

interface FAQSectionProps {
  softwareId: string;
  softwareName: string;
  locale: Locale;
}

export async function FAQSection({
  softwareId,
  softwareName,
  locale,
}: FAQSectionProps) {
  const faqs = await getFAQsCached(softwareId, locale);

  if (faqs.length === 0) return null;

  return (
    <section className="faq-section" aria-labelledby="faqs-heading">
      {/* JSON-LD için FAQPage schema */}
      <FAQJsonLd faqs={faqs} />

      <h2 id="faqs-heading" className="section-title">
        Frequently Asked Questions
        <span className="faq-subtitle">about {softwareName}</span>
      </h2>

      <div className="faq-list">
        {faqs.map((faq, index) => (
          <details key={faq.id} className="faq-item">
            <summary className="faq-question" id={`faq-q-${index}`}>
              <span className="faq-question-text">{faq.question}</span>
              <span className="faq-chevron" aria-hidden="true">›</span>
            </summary>

            <div className="faq-answer" id={`faq-a-${index}`}>
              <p>{faq.answer}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
