import { HeroSection } from "@/components/hero-section";
import { GoldLoanCalculator } from "@/components/gold-loan-calculator";
import { RbiLicensedSection } from "@/components/rbi-licensed-section";
import { UpiSection } from "@/components/upi-section";
import { FeaturesSection } from "@/components/features-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <GoldLoanCalculator />
      <RbiLicensedSection />
      <UpiSection />
      <FeaturesSection />
    </>
  );
}
