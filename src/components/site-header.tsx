import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="ym-header ym-header--logo">
      <div className="ym-header-inner">
        <div className="ym-header-brand">
          <Link href="/" className="ym-header-logo-link" aria-label="Yellow Metal home">
            <Image
              src="/images/ym-logo.png"
              alt="Yellow Metal"
              width={1024}
              height={520}
              priority
              className="ym-header-logo"
            />
          </Link>
          <p className="ym-header-tagline">RBI Licensed NBFC</p>
        </div>
      </div>
    </header>
  );
}
