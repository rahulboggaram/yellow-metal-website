import Link from "next/link";
import { SiteHeader } from "./site-header";

export { SiteHeader };

const FOOTER_LINKS = [
  { href: "/about", label: "About us" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
  { href: "/policies", label: "Policies" },
];

export function SiteFooter() {
  return (
    <footer className="ym-footer">
      <div className="ym-container ym-footer-inner">
        <div className="ym-footer-brand">
          <p className="ym-logo-text">Yellow Metal</p>
          <p className="ym-footer-tagline">
            Gold loans with no hidden charges.
          </p>
        </div>

        <nav className="ym-footer-nav">
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
    </footer>
  );
}
