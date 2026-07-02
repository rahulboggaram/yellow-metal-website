"use client";

import Image from "next/image";
import { useState } from "react";
import { HeroFeesTypewriter } from "@/components/hero-fees-typewriter";
import { HeroMinsRotator } from "@/components/hero-mins-rotator";

export function HeroHeadlineAnimations() {
  const [feesComplete, setFeesComplete] = useState(false);

  return (
    <>
      <HeroMinsRotator active={feesComplete} />
      <span className="ym-hero-belt-row" aria-hidden>
        <Image
          src="/images/ornaments/waist-belt.png"
          alt=""
          width={404}
          height={91}
          data-ornament-id="belt"
          className="ym-hero-ornament ym-hero-ornament--belt"
          priority
        />
      </span>
      <HeroFeesTypewriter onComplete={() => setFeesComplete(true)} />
    </>
  );
}
