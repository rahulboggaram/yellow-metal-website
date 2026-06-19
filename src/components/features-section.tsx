import { FeaturesCarousel } from "@/components/features-carousel";

export function FeaturesSection() {
  return (
    <section className="ym-section ym-features" id="features">
      <div className="ym-container">
        <p className="ym-eyebrow">Why Yellow Metal</p>
        <h2 className="ym-section-title">Everything you need, in one place</h2>
        <p className="ym-section-subtitle">
          From applying to closing — manage your gold loan without visiting a
          branch for every little thing.
        </p>

        <FeaturesCarousel />

        <div className="ym-cta-banner">
          <div>
            <p className="ym-cta-banner-title">Ready to get started?</p>
            <p className="ym-cta-banner-text">
              Visit your nearest Yellow Metal branch or call us — we&apos;ll walk
              you through every step.
            </p>
          </div>
          <a href="/contact" className="ym-btn ym-btn--primary">
            Contact us
          </a>
        </div>
      </div>
    </section>
  );
}
