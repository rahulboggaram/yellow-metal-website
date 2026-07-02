"use client";

import { useEffect, useState } from "react";

const PHRASES = [
  { lang: "en", text: "In 10 Mins" },
  { lang: "kn", text: "10 ನಿಮಿಷಗಳಲ್ಲಿ" },
  { lang: "te", text: "10 నిమిషాల్లో" },
] as const;

const GHOST_TEXT = PHRASES.map((phrase) => phrase.text).reduce(
  (longest, text) => (text.length > longest.length ? text : longest),
  PHRASES[0].text,
);

const HOLD_MS = 2800;
const FADE_MS = 420;

export function HeroMinsRotator() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    let holdTimer: number;
    let fadeTimer: number;

    const scheduleNext = () => {
      holdTimer = window.setTimeout(() => {
        setVisible(false);
        fadeTimer = window.setTimeout(() => {
          setIndex((current) => (current + 1) % PHRASES.length);
          setVisible(true);
          scheduleNext();
        }, FADE_MS);
      }, HOLD_MS);
    };

    scheduleNext();

    return () => {
      window.clearTimeout(holdTimer);
      window.clearTimeout(fadeTimer);
    };
  }, [reducedMotion]);

  const phrase = PHRASES[index];

  return (
    <span
      className="ym-hero-line ym-hero-line--mins ym-hero-mins-rotator"
      aria-live="polite"
    >
      <span className="ym-hero-mins-ghost" aria-hidden>
        {GHOST_TEXT}
      </span>
      <span
        className={`ym-hero-mins-live${visible ? " is-visible" : ""}`}
        lang={phrase.lang}
      >
        {reducedMotion ? PHRASES[0].text : phrase.text}
      </span>
      <span className="ym-sr-only">
        In 10 minutes — English, Kannada, and Telugu
      </span>
    </span>
  );
}
