import { AppFeaturesCarousel } from "@/components/app-features-carousel";

export function FeaturesSection() {
  return (
    <section className="ym-features-fold" id="features">
      <div className="ym-features-fold-header">
        <p className="ym-eyebrow">Why Yellow Metal is</p>
        <h2 className="ym-section-title">The Best Place For Gold Loans</h2>
      </div>
      <AppFeaturesCarousel />
    </section>
  );
}
