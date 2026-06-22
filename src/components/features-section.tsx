import { AppFeaturesCarousel } from "@/components/app-features-carousel";

export function FeaturesSection() {
  return (
    <section className="ym-section ym-app-features" id="features">
      <div className="ym-container">
        <p className="ym-eyebrow ym-app-features-eyebrow">Yellow Metal app</p>
        <h2 className="ym-section-title ym-app-features-title">
          Manage your loan from your phone
        </h2>
        <p className="ym-section-subtitle ym-app-features-subtitle">
          Download the app to track loans, pay interest, release jewellery, and
          make part payments — anytime.
        </p>

        <AppFeaturesCarousel />
      </div>
    </section>
  );
}
