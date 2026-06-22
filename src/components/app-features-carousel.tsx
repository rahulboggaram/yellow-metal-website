"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  APP_FEATURE_SLIDES,
  PLAY_STORE_URL,
} from "@/lib/app-feature-carousel";

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="ym-app-phone">
      <div className="ym-app-phone-notch" aria-hidden />
      <div className="ym-app-phone-screen">{children}</div>
    </div>
  );
}

function DownloadAppCard() {
  return (
    <div className="ym-app-feature-card ym-app-feature-card--download">
      <div className="ym-app-feature-card-body ym-app-feature-card-body--download">
        <div className="ym-app-feature-qr-wrap">
          <Image
            src="/images/site/app-qr.png"
            alt="QR code to download Yellow Metal on Google Play"
            width={168}
            height={168}
            className="ym-app-feature-qr"
          />
        </div>
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="ym-app-feature-play-badge"
        >
          <span className="ym-app-feature-play-icon" aria-hidden>
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path
                fill="currentColor"
                d="M3.6 1.8c-.3.2-.6.6-.6 1.1v18.2c0 .5.3.9.6 1.1l10.2-10.2L3.6 1.8zm11.8 7.5-2.5 2.5 2.5 2.5 5.4-3.1c.5-.3.5-.8 0-1.1l-5.4-3.1zm-2.5 5.8-2.3 2.3 8.5-4.9-8.5-4.9 2.3 2.3 2.5 2.5-2.5 2.5z"
              />
            </svg>
          </span>
          <span className="ym-app-feature-play-copy">
            <span className="ym-app-feature-play-kicker">GET IT ON</span>
            <span className="ym-app-feature-play-title">Google Play</span>
          </span>
        </a>
      </div>
    </div>
  );
}

function LoanReminderCard({
  amount,
  interest,
  footer,
  active = false,
}: {
  amount: string;
  interest: string;
  footer?: ReactNode;
  active?: boolean;
}) {
  return (
    <article
      className={[
        "ym-app-loan-card",
        active ? "ym-app-loan-card--active" : "",
      ].join(" ")}
    >
      <div className="ym-app-loan-card-top">
        <p className="ym-app-loan-card-amount">{amount}</p>
        <span className="ym-app-loan-card-link">Loan Details &gt;</span>
      </div>
      <p className="ym-app-loan-card-interest">{interest}</p>
      {footer}
    </article>
  );
}

function InterestRemindersCard() {
  return (
    <div className="ym-app-feature-card ym-app-feature-card--phone">
      <PhoneFrame>
        <div className="ym-app-screen-header">
          <span>10:42</span>
          <span className="ym-app-screen-status" aria-hidden />
        </div>
        <p className="ym-app-screen-greeting">🙏 Namaste, Nagarjuna Gupta...</p>
        <p className="ym-app-screen-section-label">YOUR GOLD LOANS</p>
        <div className="ym-app-loan-stack">
          <LoanReminderCard
            amount="₹ 7,00,000"
            interest="Interest till today - ₹ 8,050"
          />
          <LoanReminderCard
            amount="₹ 7,00,000"
            interest="Interest till today - ₹ 8,050"
            active
            footer={
              <div className="ym-app-loan-card-action">
                <span>Due in 3 days</span>
                <button type="button">Pay Now</button>
              </div>
            }
          />
          <LoanReminderCard
            amount="₹ 25,000"
            interest="Interest till today - ₹ 1,050"
            footer={
              <p className="ym-app-loan-card-due">
                Next interest is due on 15th Mar 2024
              </p>
            }
          />
        </div>
      </PhoneFrame>
    </div>
  );
}

function PartPaymentsCard() {
  return (
    <div className="ym-app-feature-card ym-app-feature-card--phone">
      <PhoneFrame>
        <div className="ym-app-screen-header">
          <span>10:42</span>
          <span className="ym-app-screen-status" aria-hidden />
        </div>
        <div className="ym-app-part-payment">
          <div className="ym-app-part-payment-sheet">
            <span className="ym-app-part-payment-handle" aria-hidden />
            <button type="button" className="ym-app-part-payment-back" aria-label="Back">
              ←
            </button>
            <p className="ym-app-part-payment-label">Enter Part Payment Amount</p>
            <p className="ym-app-part-payment-amount">₹10,000</p>
            <button type="button" className="ym-app-part-payment-cta">
              Proceed To Pay
            </button>
          </div>
          <div className="ym-app-keypad" aria-hidden>
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"].map(
              (key) => (
                <span key={key} className="ym-app-keypad-key">
                  {key}
                </span>
              ),
            )}
            <span className="ym-app-keypad-key ym-app-keypad-key--enter">→</span>
          </div>
        </div>
      </PhoneFrame>
    </div>
  );
}

function PartReleaseCard() {
  return (
    <div className="ym-app-feature-card ym-app-feature-card--phone">
      <PhoneFrame>
        <div className="ym-app-screen-header">
          <span>10:42</span>
          <span className="ym-app-screen-status" aria-hidden />
        </div>
        <div className="ym-app-release-card">
          <div className="ym-app-release-card-top">
            <div className="ym-app-release-jewel">
              <Image
                src="/images/ornaments/stud.png"
                alt=""
                width={72}
                height={72}
                className="ym-app-release-jewel-image"
              />
            </div>
            <div className="ym-app-release-meta">
              <p className="ym-app-release-title">Jewel 2: Ear Rings</p>
              <dl className="ym-app-release-details">
                <div>
                  <dt>Gross:</dt>
                  <dd>11.92gms</dd>
                </div>
                <div>
                  <dt>Deductions:</dt>
                  <dd>3.50gms</dd>
                </div>
                <div>
                  <dt>Purity:</dt>
                  <dd>22K</dd>
                </div>
              </dl>
            </div>
            <span className="ym-app-release-check" aria-hidden>
              ✓
            </span>
          </div>
          <button type="button" className="ym-app-release-pay">
            Pay ₹52,776.56
          </button>
        </div>
      </PhoneFrame>
    </div>
  );
}

function SlideVisual({ slideId }: { slideId: string }) {
  switch (slideId) {
    case "download-app":
      return <DownloadAppCard />;
    case "interest-reminders":
      return <InterestRemindersCard />;
    case "part-payments":
      return <PartPaymentsCard />;
    case "part-release":
      return <PartReleaseCard />;
    default:
      return null;
  }
}

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
        {APP_FEATURE_SLIDES.map((slide) => (
          <article
            key={slide.id}
            data-app-feature-slide
            className={[
              "ym-app-features-slide",
              slide.id === "part-payments" ? "ym-app-features-slide--payments" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label={slide.title}
          >
            <div className="ym-app-features-slide-inner">
              {slide.id !== "part-payments" ? (
                <h3 className="ym-app-features-slide-title">{slide.title}</h3>
              ) : null}
              {slide.subtitle ? (
                <p className="ym-app-features-slide-subtitle">{slide.subtitle}</p>
              ) : null}
              <SlideVisual slideId={slide.id} />
              {slide.id === "part-payments" ? (
                <h3 className="ym-app-features-slide-title">{slide.title}</h3>
              ) : null}
              {slide.footer ? (
                <p className="ym-app-features-slide-footer">{slide.footer}</p>
              ) : null}
            </div>
          </article>
        ))}
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
