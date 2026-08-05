// src/components/software/ScreenshotsGallery.tsx
// Ekran görüntüleri galerisi — Suspense ile stream edilir.
// Client-side lightbox için 'use client' wrapper gerekir.
// Burada statik Server Component versiyon; lightbox Client Component olarak ayrı.

import Image from "next/image";
import type { Locale } from "@/i18n/routing";
import { getScreenshotsCached } from "@/lib/cache/queries";

interface ScreenshotsGalleryProps {
  softwareId: string;
  locale?: string;
}

export async function ScreenshotsGallery({
  softwareId,
  locale,
}: ScreenshotsGalleryProps) {
  const screenshots = await getScreenshotsCached(softwareId, locale);

  if (screenshots.length === 0) return null;

  return (
    <section className="screenshots-section" aria-labelledby="screenshots-heading">
      <h2 id="screenshots-heading" className="section-title">
        Screenshots
        <span className="screenshots-count">({screenshots.length})</span>
      </h2>

      <div
        className="screenshots-grid"
        role="list"
        aria-label="Software screenshots"
      >
        {screenshots.map((screenshot, index) => (
          <figure
            key={screenshot.id}
            className="screenshot-item"
            role="listitem"
          >
            <div className="screenshot-wrapper">
              <Image
                src={screenshot.url}
                alt={screenshot.alt_text ?? `Screenshot ${index + 1}`}
                width={screenshot.width ?? 1200}
                height={screenshot.height ?? 800}
                className="screenshot-img"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
            {screenshot.caption && (
              <figcaption className="screenshot-caption">
                {screenshot.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}
