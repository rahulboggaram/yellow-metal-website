"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  FEATURE_CAROUSEL_SLIDES,
  type FeatureCarouselSlide,
} from "@/lib/feature-carousel";

function FeatureIcon({ icon }: { icon: "app" | "bell" | "payment" | "release" }) {
  switch (icon) {
    case "app":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <rect x="6" y="2" width="12" height="20" rx="2" />
          <path d="M10 18h4" strokeLinecap="round" />
        </svg>
      );
    case "bell":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path
            d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" />
        </svg>
      );
    case "payment":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M12 2v20M17 7l-5-5-5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "release":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path
            d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
            strokeLinejoin="round"
          />
          <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" strokeLinejoin="round" />
        </svg>
      );
  }
}

function CarouselSlide({ slide }: { slide: FeatureCarouselSlide }) {
  switch (slide.kind) {
    case "feature":
      return (
        <div className="ym-carousel-slide ym-carousel-slide--feature">
          <div className="ym-feature-icon">
            <FeatureIcon icon={slide.icon} />
          </div>
          <h3 className="ym-carousel-slide-title">{slide.title}</h3>
          <p className="ym-carousel-slide-text">{slide.description}</p>
        </div>
      );

    case "app-download":
      return (
        <div className="ym-carousel-slide ym-carousel-slide--app-download">
          <div className="ym-carousel-slide-copy">
            <h3 className="ym-carousel-slide-title">{slide.title}</h3>
            <p className="ym-carousel-slide-text">{slide.description}</p>
            <a
              href={slide.playStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ym-carousel-store-link"
            >
              Get it on Google Play
            </a>
          </div>
          <div className="ym-carousel-app-download-media">
            <div className="ym-carousel-qr-wrap">
              <Image
                src={slide.qrSrc}
                alt="QR code to download Yellow Metal on Google Play"
                width={120}
                height={120}
                className="ym-carousel-qr"
              />
              <p className="ym-carousel-qr-label">Scan to download</p>
            </div>
            <div className="ym-carousel-phone-strip">
              {slide.screens.map((screen) => (
                <Image
                  key={screen.src}
                  src={screen.src}
                  alt={screen.alt}
                  width={180}
                  height={320}
                  className="ym-carousel-phone-shot"
                />
              ))}
            </div>
          </div>
        </div>
      );

    case "partners":
      return (
        <div className="ym-carousel-slide ym-carousel-slide--partners">
          <h3 className="ym-carousel-slide-title">{slide.title}</h3>
          <div className="ym-carousel-partner-logos">
            {slide.logos.map((logo) => (
              <Image
                key={logo.src}
                src={logo.src}
                alt={logo.alt}
                width={140}
                height={40}
                className="ym-carousel-partner-logo"
              />
            ))}
          </div>
        </div>
      );

    case "app-screens":
      return (
        <div className="ym-carousel-slide ym-carousel-slide--app-screens">
          <div className="ym-carousel-slide-copy">
            <h3 className="ym-carousel-slide-title">{slide.title}</h3>
            <p className="ym-carousel-slide-text">{slide.subtitle}</p>
          </div>
          <div className="ym-carousel-phone-strip">
            {slide.screens.map((screen) => (
              <Image
                key={screen.src}
                src={screen.src}
                alt={screen.alt}
                width={220}
                height={380}
                className="ym-carousel-phone-shot"
              />
            ))}
          </div>
        </div>
      );

    case "stories":
      return (
        <div className="ym-carousel-slide ym-carousel-slide--stories">
          <div className="ym-carousel-slide-copy">
            <h3 className="ym-carousel-slide-title">{slide.title}</h3>
            <p className="ym-carousel-slide-subtitle">{slide.subtitle}</p>
          </div>
          <div className="ym-carousel-story-strip" tabIndex={0}>
            {slide.images.map((image, index) => (
              <Image
                key={image.src}
                src={image.src}
                alt={image.alt}
                width={280}
                height={360}
                className="ym-carousel-story-image"
                priority={index < 2}
              />
            ))}
          </div>
          <p className="ym-carousel-disclaimer">{slide.disclaimer}</p>
        </div>
      );
  }
}

export function FeaturesCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const slideCount = FEATURE_CAROUSEL_SLIDES.length;

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex((index + slideCount) % slideCount);
    },
    [slideCount],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") goTo(activeIndex - 1);
      if (event.key === "ArrowRight") goTo(activeIndex + 1);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, goTo]);

  const activeSlide = FEATURE_CAROUSEL_SLIDES[activeIndex];

  return (
    <div className="ym-features-carousel">
      <div
        className="ym-features-carousel-viewport"
        aria-live="polite"
        aria-roledescription="carousel"
        aria-label="Yellow Metal features"
      >
        <CarouselSlide slide={activeSlide} />
      </div>

      <div className="ym-features-carousel-controls">
        <button
          type="button"
          className="ym-features-carousel-arrow"
          onClick={() => goTo(activeIndex - 1)}
          aria-label="Previous slide"
        >
          ←
        </button>

        <div className="ym-features-carousel-dots" role="tablist" aria-label="Choose slide">
          {FEATURE_CAROUSEL_SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Slide ${index + 1}: ${slide.title}`}
              className={[
                "ym-features-carousel-dot",
                index === activeIndex ? "ym-features-carousel-dot--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => goTo(index)}
            />
          ))}
        </div>

        <button
          type="button"
          className="ym-features-carousel-arrow"
          onClick={() => goTo(activeIndex + 1)}
          aria-label="Next slide"
        >
          →
        </button>
      </div>
    </div>
  );
}
