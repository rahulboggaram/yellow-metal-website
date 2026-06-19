import { HeroSection } from "@/components/hero-section";
import { GoldLoanCalculator } from "@/components/gold-loan-calculator";
import { UpiSection } from "@/components/upi-section";
import { FeaturesSection } from "@/components/features-section";

export default function HomePage() {
  return (
    <>
      <div className="ym-hero-calculator-flow">
        <HeroSection />
        <GoldLoanCalculator />
      </div>
      <UpiSection />
      <FeaturesSection />
    </>
  );
}
