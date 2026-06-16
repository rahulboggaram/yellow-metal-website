import { HeroSection, PacketSealSection } from "@/components/hero-packet-sections";
import { GoldPriceSection } from "@/components/gold-price-section";
import { UpiSection } from "@/components/upi-section";
import { FeaturesSection } from "@/components/features-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <GoldPriceSection />
      <PacketSealSection />
      <UpiSection />
      <FeaturesSection />
    </>
  );
}
