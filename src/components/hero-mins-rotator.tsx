"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const PHRASES = [
  { lang: "en", before: "In ", after: " Mins" },
  { lang: "kn", before: "", after: " ನಿಮಿಷಗಳಲ್ಲಿ" },
  { lang: "te", before: "", after: " నిమిషాల్లో" },
] as const;

function phraseText(phrase: (typeof PHRASES)[number]) {
  return `${phrase.before}10${phrase.after}`;
}

const GHOST_PHRASE = PHRASES.reduce((longest, phrase) =>
  phraseText(phrase).length > phraseText(longest).length ? phrase : longest,
);

const HOLD_MS = 2800;
const FADE_MS = 420;

function MinsPhrase({
  before,
  after,
  showBelt,
}: {
  before: string;
  after: string;
  showBelt: boolean;
}) {
  return (
    <>
      {before}
      <span className="ym-hero-anchor ym-hero-anchor--belt">
        {showBelt ? (
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
        ) : null}
        10
      </span>
      {after}
    </>
  );
}

export function HeroMinsRotator({ active = true }: { active?: boolean }) {
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
    if (reducedMotion || !active) return;

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
  }, [reducedMotion, active]);

  const phrase = reducedMotion ? PHRASES[0] : PHRASES[index];

  return (
    <span
      className="ym-hero-line ym-hero-line--mins ym-hero-mins-rotator"
      aria-live="polite"
    >
      <span className="ym-hero-mins-ghost" aria-hidden>
        <MinsPhrase
          before={GHOST_PHRASE.before}
          after={GHOST_PHRASE.after}
          showBelt={false}
        />
      </span>
      <span
        className={`ym-hero-mins-live${visible ? " is-visible" : ""}${
          !reducedMotion && phrase.lang !== "en" ? " ym-hero-mins-live--regional" : ""
        }`}
        lang={phrase.lang}
      >
        <MinsPhrase
          before={phrase.before}
          after={phrase.after}
          showBelt
        />
      </span>
      <span className="ym-sr-only">
        In 10 minutes — English, Kannada, and Telugu
      </span>
    </span>
  );
}
