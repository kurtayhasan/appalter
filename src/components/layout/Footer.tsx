// src/components/layout/Footer.tsx
// Ana site altbilgisi (Server Component).

import Link from "next/link";
import type { Locale } from "@/i18n/routing";

export function Footer({ locale }: { locale: Locale }) {
  const currentYear = 2025;

  return (
    <footer className="site-footer">
      <div className="container footer-container">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-col brand-col">
            <Link href={`/${locale}`} className="footer-logo">
              AppAlter
            </Link>
            <p className="footer-description">
              The programmatic SEO and AI-Optimization platform for finding the best software alternatives.
            </p>
            <div className="footer-socials">
              {/* Social links placeholder */}
              <a href="#" aria-label="Twitter">Twitter</a>
              <a href="#" aria-label="GitHub">GitHub</a>
            </div>
          </div>

          {/* Links Column 1 */}
          <div className="footer-col">
            <h3 className="footer-heading">Categories</h3>
            <ul className="footer-links">
              <li><Link href={`/${locale}/category/marketing`}>Marketing</Link></li>
              <li><Link href={`/${locale}/category/development`}>Development</Link></li>
              <li><Link href={`/${locale}/category/design`}>Design</Link></li>
              <li><Link href={`/${locale}/category/productivity`}>Productivity</Link></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div className="footer-col">
            <h3 className="footer-heading">Discover</h3>
            <ul className="footer-links">
              <li><Link href={`/${locale}/search?pricing=free`}>Free Software</Link></li>
              <li><Link href={`/${locale}/search?pricing=open-source`}>Open Source</Link></li>
              <li><Link href={`/${locale}/collections`}>Collections</Link></li>
            </ul>
          </div>

          {/* Links Column 3 */}
          <div className="footer-col">
            <h3 className="footer-heading">Legal</h3>
            <ul className="footer-links">
              <li><Link href={`/${locale}/about`}>About Us</Link></li>
              <li><Link href={`/${locale}/privacy`}>Privacy Policy</Link></li>
              <li><Link href={`/${locale}/terms`}>Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">
            &copy; {currentYear} AppAlter. All rights reserved.
          </p>
          <div className="footer-badges">
            <span className="badge badge-ai-friendly">🤖 AI-Friendly Data</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
