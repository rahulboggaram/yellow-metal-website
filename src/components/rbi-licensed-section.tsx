import Image from "next/image";

export function RbiLicensedSection() {
  return (
    <section
      className="ym-section ym-rbi-licensed-section"
      aria-label="RBI licensed NBFC"
    >
      <div className="ym-container">
        <div className="ym-rbi-licensed-inner">
          <Image
            src="/images/rbi-logo.png"
            alt="Reserve Bank of India"
            width={88}
            height={88}
            className="ym-rbi-licensed-logo"
          />
          <p className="ym-rbi-licensed-text">
            RBI Licensed <span className="ym-rbi-licensed-nbfc">NBFC</span>
          </p>
        </div>
      </div>
    </section>
  );
}
