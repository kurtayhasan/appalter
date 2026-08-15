import Link from "next/link";
import { routing, type Locale } from "@/i18n/routing";

export function Footer({ locale }: { locale: Locale }) {
  const currentYear = 2026;
  const getHref = (path: string) =>
    locale === routing.defaultLocale ? path : `/${locale}${path}`;

  return (
    <footer className="site-footer">
      <div className="container footer-container">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-col brand-col">
            <Link href={getHref("/")} className="footer-logo">
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
              <li><Link href={getHref("/category/security")}>Security & Antivirus</Link></li>
              <li><Link href={getHref("/category/marketing")}>Marketing</Link></li>
              <li><Link href={getHref("/category/development")}>Development</Link></li>
              <li><Link href={getHref("/category/design")}>Design</Link></li>
              <li><Link href={getHref("/category/productivity")}>Productivity</Link></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div className="footer-col">
            <h3 className="footer-heading">Discover</h3>
            <ul className="footer-links">
              <li><Link href={getHref("/search?pricing=free")}>Free Software</Link></li>
              <li><Link href={getHref("/search?pricing=open-source")}>Open Source</Link></li>
              <li><Link href={getHref("/categories")}>All Categories</Link></li>
            </ul>
          </div>

          {/* Links Column 3 */}
          <div className="footer-col">
            <h3 className="footer-heading">Legal</h3>
            <ul className="footer-links">
              <li><Link href={getHref("/about")}>About Us</Link></li>
              <li><Link href={getHref("/contact")}>Contact Us</Link></li>
              <li><Link href={getHref("/privacy")}>Privacy Policy</Link></li>
              <li><Link href={getHref("/terms")}>Terms of Service</Link></li>
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
