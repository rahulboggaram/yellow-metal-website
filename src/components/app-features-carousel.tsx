"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { APP_FEATURE_SLIDES } from "@/lib/app-feature-carousel";

export function AppFeaturesCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateActiveFromScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const cards = Array.from(
      track.querySelectorAll<HTMLElement>("[data-app-feature-slide]"),
    );
    if (!cards.length) return;

    const trackCenter = track.scrollLeft + track.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(trackCenter - cardCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);
  }, []);

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

  const goTo = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;

    const cards = track.querySelectorAll<HTMLElement>("[data-app-feature-slide]");
    const target = cards[index];
    if (!target) return;

    track.scrollTo({
      left: target.offsetLeft - (track.clientWidth - target.offsetWidth) / 2,
      behavior: "smooth",
    });
    setActiveIndex(index);
  }, []);

  return (
    <div className="ym-app-features-carousel">
      <div
        ref={trackRef}
        className="ym-app-features-track"
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
              className="ym-app-features-image"
              priority={index === 0}
              sizes="(max-width: 768px) 88vw, 24rem"
            />
          );

          return (
            <article
              key={slide.id}
              data-app-feature-slide
              className="ym-app-features-slide"
              aria-label={slide.title}
            >
              {slide.href ? (
                <Link
                  href={slide.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ym-app-features-image-link"
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

      <div className="ym-app-features-controls">
        <button
          type="button"
          className="ym-app-features-arrow"
          onClick={() =>
            goTo(
              (activeIndex - 1 + APP_FEATURE_SLIDES.length) %
                APP_FEATURE_SLIDES.length,
            )
          }
          aria-label="Previous feature"
        >
          ←
        </button>

        <div className="ym-app-features-dots" role="tablist" aria-label="Choose feature">
          {APP_FEATURE_SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={slide.title}
              className={[
                "ym-app-features-dot",
                index === activeIndex ? "ym-app-features-dot--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => goTo(index)}
            />
          ))}
        </div>

        <button
          type="button"
          className="ym-app-features-arrow"
          onClick={() => goTo((activeIndex + 1) % APP_FEATURE_SLIDES.length)}
          aria-label="Next feature"
        >
          →
        </button>
      </div>
    </div>
  );
}
