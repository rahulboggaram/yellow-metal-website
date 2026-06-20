import Image from "next/image";

export function RbiLicensedSection() {
  return (
    <section
      className="ym-section ym-rbi-licensed-section"
      aria-label="RBI licensed NBFC"
    >
      <div className="ym-container">
        <div className="ym-rbi-licensed-inner">
          <div className="ym-rbi-licensed-brand">
            <Image
              src="/images/rbi-logo.png"
              alt="Reserve Bank of India"
              width={88}
              height={88}
              className="ym-rbi-licensed-logo"
            />
            <dl className="ym-rbi-licensed-details">
              <div className="ym-rbi-licensed-detail">
                <dt>Registration No.</dt>
                <dd>0016/2026</dd>
              </div>
              <div className="ym-rbi-licensed-detail">
                <dt>License Category</dt>
                <dd>NBFC-ND-ICC</dd>
              </div>
            </dl>
          </div>
          <p className="ym-rbi-licensed-text">
            RBI Licensed <span className="ym-rbi-licensed-nbfc">NBFC</span>
          </p>
        </div>
      </div>
    </section>
  );
}
