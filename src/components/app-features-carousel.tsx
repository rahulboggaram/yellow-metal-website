"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { APP_FEATURE_SLIDES } from "@/lib/app-feature-carousel";

export function AppFeaturesCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const getTrackPadStart = useCallback((track: HTMLDivElement) => {
    const style = getComputedStyle(track);
    return Number.parseFloat(style.paddingInlineStart || style.paddingLeft);
  }, []);

  const updateActiveFromScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const cards = Array.from(
      track.querySelectorAll<HTMLElement>("[data-feature-card]"),
    );
    if (!cards.length) return;

    const padStart = getTrackPadStart(track);
    const anchor = track.scrollLeft + padStart;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const distance = Math.abs(card.offsetLeft - anchor);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);
  }, [getTrackPadStart]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateActiveFromScroll();
    track.addEventListener("scroll", updateActiveFromScroll, { passive: true });
    window.addEventListener("resize", updateActiveFromScroll);

    return () => {
      track.removeEventListener("scroll", updateActiveFromScroll);
      window.removeEventListener("resize", updateActiveFromScroll);
    };
  }, [updateActiveFromScroll]);

  const goTo = useCallback(
    (index: number) => {
      const track = trackRef.current;
      if (!track) return;

      const cards = track.querySelectorAll<HTMLElement>("[data-feature-card]");
      const target = cards[index];
      if (!target) return;

      const padStart = getTrackPadStart(track);

      track.scrollTo({
        left: target.offsetLeft - padStart,
        behavior: "smooth",
      });
      setActiveIndex(index);
    },
    [getTrackPadStart],
  );

  return (
    <div className="ym-features-carousel">
      <div
        ref={trackRef}
        className="ym-features-track"
        aria-live="polite"
        aria-roledescription="carousel"
        aria-label="Yellow Metal app features"
      >
        {APP_FEATURE_SLIDES.map((slide, index) => {
          const image = (
            <Image
              src={slide.imageSrc}
              alt={slide.title}
              width={848}
              height={1024}
              className="ym-features-card-image"
              priority={index === 0}
              sizes="(max-width: 768px) 82vw, 24rem"
            />
          );

          return (
            <article
              key={slide.id}
              data-feature-card
              className="ym-features-card"
              aria-label={slide.title}
            >
              {slide.href ? (
                <Link
                  href={slide.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ym-features-card-link"
                >
                  {image}
                </Link>
              ) : (
                image
              )}
            </article>
          );
        })}
      </div>

      <nav className="ym-features-nav" aria-label="Carousel controls">
        <button
          type="button"
          className="ym-features-nav-btn"
          onClick={() =>
            goTo(
              (activeIndex - 1 + APP_FEATURE_SLIDES.length) %
                APP_FEATURE_SLIDES.length,
            )
          }
          aria-label="Previous feature"
        >
          <svg
            className="ym-features-nav-icon"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            aria-hidden
          >
            <path
              d="M11 4.5 6.5 9 11 13.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="ym-features-dots" role="tablist" aria-label="Choose feature">
          {APP_FEATURE_SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={slide.title}
              className={[
                "ym-features-dot",
                index === activeIndex ? "ym-features-dot--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => goTo(index)}
            />
          ))}
        </div>

        <button
          type="button"
          className="ym-features-nav-btn"
          onClick={() => goTo((activeIndex + 1) % APP_FEATURE_SLIDES.length)}
          aria-label="Next feature"
        >
          <svg
            className="ym-features-nav-icon"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            aria-hidden
          >
            <path
              d="m7 4.5 4.5 4.5L7 13.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </nav>
    </div>
  );
}
