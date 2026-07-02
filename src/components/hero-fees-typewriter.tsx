"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const LINE_1 = "· No hidden fees · No processing fees · No valuation charges";
const LINE_2 = "· No prepayment penalties · No fees to store your gold ·";
const FULL_TEXT = `${LINE_1}\n${LINE_2}`;
const TYPE_DELAY_MS = 28;
const START_DELAY_MS = 700;

function splitTypedText(text: string) {
  const newlineIndex = text.indexOf("\n");
  if (newlineIndex === -1) {
    return { line1: text, line2: "" };
  }
  return {
    line1: text.slice(0, newlineIndex),
    line2: text.slice(newlineIndex + 1),
  };
}

function TypewriterCursor() {
  return (
    <span className="ym-hero-subtext-cursor" aria-hidden>
      |
    </span>
  );
}

function renderLine1(line1: string, showCursor: boolean) {
  const noIndex = line1.indexOf("No");
  if (noIndex === -1) {
    return (
      <>
        {line1}
        {showCursor ? <TypewriterCursor /> : null}
      </>
    );
  }

  const before = line1.slice(0, noIndex);
  const afterN = line1.slice(noIndex + 1);

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
      setCharIndex(FULL_TEXT.length);
      return;
    }

    const startTimer = window.setTimeout(() => setStarted(true), START_DELAY_MS);
    return () => window.clearTimeout(startTimer);
  }, []);

  useEffect(() => {
    if (!started || charIndex >= FULL_TEXT.length) return;

    const timer = window.setTimeout(() => {
      setCharIndex((index) => index + 1);
    }, TYPE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [started, charIndex]);

  const visibleText = FULL_TEXT.slice(0, charIndex);
  const { line1, line2 } = splitTypedText(visibleText);
  const isComplete = charIndex >= FULL_TEXT.length;
  const onLine2 = charIndex > LINE_1.length;

  return (
    <span
      className="ym-hero-line ym-hero-line--fees ym-hero-subtext ym-hero-subtext-typewriter"
      aria-live="polite"
    >
      <span className="ym-hero-subtext-ghost" aria-hidden>
        <span className="ym-hero-subtext-line ym-hero-subtext-line--belt">
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
          o hidden fees · No processing fees · No valuation charges
        </span>
        <span className="ym-hero-subtext-line">{LINE_2}</span>
      </span>
      <span className="ym-hero-subtext-live">
        <span className="ym-hero-subtext-line">
          {renderLine1(line1, !onLine2 && !isComplete)}
        </span>
        {onLine2 ? (
          <span className="ym-hero-subtext-line">
            {line2}
            {!isComplete ? <TypewriterCursor /> : null}
          </span>
        ) : null}
      </span>
      <span className="ym-sr-only">{FULL_TEXT.replace("\n", " ")}</span>
    </span>
  );
}
