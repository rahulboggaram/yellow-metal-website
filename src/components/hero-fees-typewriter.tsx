"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const FEES_TEXT =
  "· No hidden fees · No processing fees · No valuation charges · No prepayment penalties · No fees to store your gold ·";
const TYPE_DELAY_MS = 28;
const START_DELAY_MS = 700;

function TypewriterCursor() {
  return (
    <span className="ym-hero-subtext-cursor" aria-hidden>
      |
    </span>
  );
}

function renderFeesText(text: string, showCursor: boolean) {
  const noIndex = text.indexOf("No");
  if (noIndex === -1) {
    return (
      <>
        {text}
        {showCursor ? <TypewriterCursor /> : null}
      </>
    );
  }

  const before = text.slice(0, noIndex);
  const afterN = text.slice(noIndex + 1);

  return (
    <>
      {before}
      <span className="ym-hero-anchor ym-hero-anchor--belt-jewel">
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
        <span className="ym-hero-subtext-letter">N</span>
      </span>
      {afterN}
      {showCursor ? <TypewriterCursor /> : null}
    </>
  );
}

export function HeroFeesTypewriter() {
  const [charIndex, setCharIndex] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) {
      setCharIndex(FEES_TEXT.length);
      return;
    }

    const startTimer = window.setTimeout(() => setStarted(true), START_DELAY_MS);
    return () => window.clearTimeout(startTimer);
  }, []);

  useEffect(() => {
    if (!started || charIndex >= FEES_TEXT.length) return;

    const timer = window.setTimeout(() => {
      setCharIndex((index) => index + 1);
    }, TYPE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [started, charIndex]);

  const visibleText = FEES_TEXT.slice(0, charIndex);
  const isComplete = charIndex >= FEES_TEXT.length;

  return (
    <span
      className="ym-hero-line ym-hero-line--fees ym-hero-subtext ym-hero-subtext-typewriter"
      aria-live="polite"
    >
      <span className="ym-hero-subtext-ghost" aria-hidden>
        <span className="ym-hero-subtext-line ym-hero-subtext-line--belt ym-hero-subtext-line--single">
          ·{" "}
          <span className="ym-hero-anchor ym-hero-anchor--belt-jewel">
            <Image
              src="/images/ornaments/waist-belt.png"
              alt=""
              width={404}
              height={91}
              className="ym-hero-ornament ym-hero-ornament--belt"
              aria-hidden
            />
            <span className="ym-hero-subtext-letter">N</span>
          </span>
          o hidden fees · No processing fees · No valuation charges · No prepayment
          penalties · No fees to store your gold ·
        </span>
      </span>
      <span className="ym-hero-subtext-live">
        <span className="ym-hero-subtext-line ym-hero-subtext-line--single">
          {renderFeesText(visibleText, !isComplete)}
        </span>
      </span>
      <span className="ym-sr-only">{FEES_TEXT}</span>
    </span>
  );
}
