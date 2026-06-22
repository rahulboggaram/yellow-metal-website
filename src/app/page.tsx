import { HeroSection } from "@/components/hero-section";
import { LoanLendingRateBridge } from "@/components/loan-lending-rate-bridge";
import { GoldLoanCalculator } from "@/components/gold-loan-calculator";
import { RbiLicensedSection } from "@/components/rbi-licensed-section";
import { UpiSection } from "@/components/upi-section";
import { FeaturesSection } from "@/components/features-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <LoanLendingRateBridge />
      <GoldLoanCalculator />
      <RbiLicensedSection />
      <UpiSection />
      <FeaturesSection />
    </>
  );
}
