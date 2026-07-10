"use client";

import { useEffect, useRef, useState } from "react";

const LINE_1 = "· No hidden fees · No processing fees · No valuation charges";
const MOBILE_LINE_1 = "· No hidden fees · No processing fees ·";
const MOBILE_LINE_2 = "· No valuation charges ·";
const MOBILE_FULL_TEXT = `${MOBILE_LINE_1}\n${MOBILE_LINE_2}`;
const MOBILE_FEES_QUERY = "(max-width: 768px)";
const TYPE_DELAY_MS = 28;
const START_DELAY_MS = 700;

function feesTextForViewport(isMobile: boolean) {
  return isMobile ? MOBILE_FULL_TEXT : LINE_1;
}

function firstLineLength(isMobile: boolean) {
  return isMobile ? MOBILE_LINE_1.length : LINE_1.length;
}

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

export function HeroFeesTypewriter({
  onComplete,
}: {
  onComplete?: () => void;
}) {
  const [charIndex, setCharIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [viewportReady, setViewportReady] = useState(false);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const fullText = feesTextForViewport(isMobile);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const markComplete = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onCompleteRef.current?.();
  };

  useEffect(() => {
    const mobileMedia = window.matchMedia(MOBILE_FEES_QUERY);
    const updateViewport = () => setIsMobile(mobileMedia.matches);
    updateViewport();
    setViewportReady(true);
    mobileMedia.addEventListener("change", updateViewport);
    return () => mobileMedia.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    if (!viewportReady) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) {
      setCharIndex(fullText.length);
      markComplete();
      return;
    }

    setCharIndex(0);
    setStarted(false);
    completedRef.current = false;

    const startTimer = window.setTimeout(() => setStarted(true), START_DELAY_MS);
    return () => window.clearTimeout(startTimer);
  }, [viewportReady, fullText]);

  useEffect(() => {
    if (!started || charIndex >= fullText.length) return;

    const timer = window.setTimeout(() => {
      setCharIndex((index) => index + 1);
    }, TYPE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [started, charIndex, fullText]);

  useEffect(() => {
    if (charIndex >= fullText.length) {
      markComplete();
    }
  }, [charIndex, fullText]);

  const visibleText = fullText.slice(0, charIndex);
  const { line1, line2 } = splitTypedText(visibleText);
  const isComplete = charIndex >= fullText.length;
  const onLine2 = charIndex > firstLineLength(isMobile);

  return (
    <span
      className="ym-hero-line ym-hero-line--fees ym-hero-subtext ym-hero-subtext-typewriter"
      aria-live="polite"
    >
      <span className="ym-hero-subtext-ghost" aria-hidden>
        {isMobile ? (
          <>
            <span className="ym-hero-subtext-line">{MOBILE_LINE_1}</span>
            <span className="ym-hero-subtext-line">{MOBILE_LINE_2}</span>
          </>
        ) : (
          <span className="ym-hero-subtext-line">{LINE_1}</span>
        )}
      </span>
      <span className="ym-hero-subtext-live">
        <span className="ym-hero-subtext-line">
          {line1}
          {!onLine2 && !isComplete ? (
            <span className="ym-hero-subtext-cursor" aria-hidden>
              |
            </span>
          ) : null}
        </span>
        {onLine2 ? (
          <span className="ym-hero-subtext-line">
            {line2}
            {!isComplete ? (
              <span className="ym-hero-subtext-cursor" aria-hidden>
                |
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
      <span className="ym-sr-only">{fullText.replace("\n", " ")}</span>
    </span>
  );
}
