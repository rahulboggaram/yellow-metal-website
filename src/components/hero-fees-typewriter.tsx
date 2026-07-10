"use client";

import { useEffect, useRef, useState } from "react";

const FEES_LINE_1 = "· No hidden fees · No processing fees ·";
const FEES_LINE_2 = "· No valuation charges ·";
const FEES_FULL_TEXT = `${FEES_LINE_1}\n${FEES_LINE_2}`;
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

export function HeroFeesTypewriter({
  onComplete,
}: {
  onComplete?: () => void;
}) {
  const [charIndex, setCharIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const markComplete = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onCompleteRef.current?.();
  };

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) {
      setCharIndex(FEES_FULL_TEXT.length);
      markComplete();
      return;
    }

    setCharIndex(0);
    setStarted(false);
    completedRef.current = false;

    const startTimer = window.setTimeout(() => setStarted(true), START_DELAY_MS);
    return () => window.clearTimeout(startTimer);
  }, []);

  useEffect(() => {
    if (!started || charIndex >= FEES_FULL_TEXT.length) return;

    const timer = window.setTimeout(() => {
      setCharIndex((index) => index + 1);
    }, TYPE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [started, charIndex]);

  useEffect(() => {
    if (charIndex >= FEES_FULL_TEXT.length) {
      markComplete();
    }
  }, [charIndex]);

  const visibleText = FEES_FULL_TEXT.slice(0, charIndex);
  const { line1, line2 } = splitTypedText(visibleText);
  const isComplete = charIndex >= FEES_FULL_TEXT.length;
  const onLine2 = charIndex > FEES_LINE_1.length;

  return (
    <span
      className="ym-hero-line ym-hero-line--fees ym-hero-subtext ym-hero-subtext-typewriter"
      aria-live="polite"
    >
      <span className="ym-hero-subtext-ghost" aria-hidden>
        <span className="ym-hero-subtext-line">{FEES_LINE_1}</span>
        <span className="ym-hero-subtext-line">{FEES_LINE_2}</span>
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
      <span className="ym-sr-only">{FEES_FULL_TEXT.replace("\n", " ")}</span>
    </span>
  );
}
