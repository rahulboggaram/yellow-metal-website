import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "./site-header";
import { FOOTER_LOGO, SOCIAL_LINKS } from "@/lib/social-links";

export { SiteHeader };

const FOOTER_LINKS = [
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQs" },
  { href: "/policies", label: "Policies" },
];

export function SiteFooter() {
  return (
    <footer className="ym-footer">
      <div className="ym-container ym-footer-inner">
        <div className="ym-footer-top">
          <div className="ym-footer-brand">
            <div className="ym-footer-brand-row">
              <Link href="/" className="ym-footer-logo-link" aria-label="Yellow Metal home">
                <Image
                  src={FOOTER_LOGO.src}
                  alt={FOOTER_LOGO.alt}
                  width={FOOTER_LOGO.width}
                  height={FOOTER_LOGO.height}
                  className="ym-footer-logo"
                />
              </Link>

              <div className="ym-footer-social" aria-label="Social media">
                {SOCIAL_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ym-footer-social-link"
                    aria-label={link.label}
                  >
                    <Image
                      src={link.icon}
                      alt=""
                      width={16}
                      height={16}
                      className="ym-footer-social-icon"
                    />
                  </a>
                ))}
              </div>
            </div>

            <p className="ym-footer-tagline">
              Gold loans with no hidden charges.
            </p>
          </div>
        </div>

        <nav className="ym-footer-nav" aria-label="Footer">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="ym-footer-copy">
          © {new Date().getFullYear()} Yellow Metal. All rights reserved.
        </p>
      </div>
      <p className="ym-footer-wordmark" aria-hidden>
        YELLOW METAL
      </p>
    </footer>
  );
}
