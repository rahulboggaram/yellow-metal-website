import Image from "next/image";

/** Fold 1 — headline + jewels. Sizes with CSS clamp (no JS scaling). */
export function HeroSection() {
  return (
    <section className="ym-hero">
      <div className="ym-hero-inner">
        <div className="ym-hero-title-pin">
          <h1 className="ym-hero-headline">
            <span className="ym-hero-line ym-hero-line--gold">
              <span className="ym-hero-anchor">
                <Image
                  src="/images/ornaments/flower.png"
                  alt=""
                  width={132}
                  height={134}
                  data-ornament-id="flower"
                  className="ym-hero-ornament ym-hero-ornament--flower"
                  priority
                  aria-hidden
                />
                G
              </span>
              old
            </span>
            <span className="ym-hero-line ym-hero-line--loans">
              L
              <span className="ym-hero-anchor">
                <Image
                  src="/images/ornaments/stud.png"
                  alt=""
                  width={100}
                  height={112}
                  data-ornament-id="stud"
                  className="ym-hero-ornament ym-hero-ornament--stud"
                  priority
                  aria-hidden
                />
                o
              </span>
              an
              <span className="ym-hero-anchor">
                <Image
                  src="/images/ornaments/ganesha.png"
                  alt=""
                  width={86}
                  height={172}
                  data-ornament-id="ganesha"
                  className="ym-hero-ornament ym-hero-ornament--ganesha"
                  priority
                  aria-hidden
                />
                s
              </span>
            </span>
            <span className="ym-hero-line ym-hero-line--tagline">
              <span className="ym-hero-anchor">
                <Image
                  src="/images/ornaments/waist-belt.png"
                  alt=""
                  width={404}
                  height={91}
                  data-ornament-id="belt"
                  className="ym-hero-ornament ym-hero-ornament--belt"
                  priority
                  aria-hidden
                />
                N
              </span>
              o hidden fees
            </span>
          </h1>
        </div>
      </div>
    </section>
  );
}
