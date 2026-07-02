"use client";

import { useState } from "react";
import { HeroFeesTypewriter } from "@/components/hero-fees-typewriter";
import { HeroMinsRotator } from "@/components/hero-mins-rotator";

export function HeroHeadlineAnimations() {
  const [feesComplete, setFeesComplete] = useState(false);

  return (
    <>
      <HeroMinsRotator active={feesComplete} />
      <HeroFeesTypewriter onComplete={() => setFeesComplete(true)} />
    </>
  );
}
