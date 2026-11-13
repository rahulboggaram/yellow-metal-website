"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { FloatingInput } from "@/components/ui/floating-field";
import type { GoldKarat, GoldPriceSnapshot } from "@/lib/gold-price-format";
import {
  GOLD_KARAT_OPTIONS,
  formatInr,
  isGoldPriceSnapshot,
  loanAmountFromWeightGrams,
  weightGramsFromLoanAmount,
} from "@/lib/gold-price-format";
import {
  calculateMonthlyInterestInr,
  formatPlanRate,
  formatPlanRepaymentLabel,
  getMatchingLoanPlansByType,
  type LoanPlan,
} from "@/lib/loan-plans-shared";
import { useLoanPlans } from "@/components/loan-plans";
import { InterNumeric } from "@/components/inter-numeric";
import { interFontBindings } from "@/lib/fonts";
import { useCalculatorEngagement } from "@/hooks/use-calculator-engagement";

const LOAN_STOPS = [
  { amount: 20_000, label: "₹20K" },
  { amount: 100_000, label: "₹1L" },
  { amount: 500_000, label: "₹5L" },
  { amount: 1_000_000, label: "₹10L" },
  { amount: 5_000_000, label: "₹50L" },
] as const;

/** Everyday estimate. Sits between ₹1L and ₹5L. */
const DEFAULT_LOAN_AMOUNT = 250_000;

const SLIDER_MAX = 1000;
const SNAP_DISTANCE = 36;

function stopPosition(index: number): number {
  return Math.round((index / (LOAN_STOPS.length - 1)) * SLIDER_MAX);
}

function nearestStopIndex(position: number, distance = SNAP_DISTANCE): number | null {
  let nearest = 0;
  let nearestDistance = Infinity;
  LOAN_STOPS.forEach((_, index) => {
    const gap = Math.abs(stopPosition(index) - position);
    if (gap < nearestDistance) {
      nearest = index;
      nearestDistance = gap;
    }
  });
  return nearestDistance <= distance ? nearest : null;
}

function amountFromPosition(position: number): number {
  const snapped = nearestStopIndex(position);
  if (snapped !== null) return LOAN_STOPS[snapped].amount;

  const scaled = (position / SLIDER_MAX) * (LOAN_STOPS.length - 1);
  const index = Math.min(LOAN_STOPS.length - 2, Math.floor(scaled));
  const local = scaled - index;
  const start = LOAN_STOPS[index].amount;
  const end = LOAN_STOPS[index + 1].amount;
  const raw = start + (end - start) * local;
  const rounded = Math.round(raw / 1000) * 1000;
  return Math.min(LOAN_STOPS[LOAN_STOPS.length - 1].amount, Math.max(LOAN_STOPS[0].amount, rounded));
}

const MIN_LOAN = LOAN_STOPS[0].amount;
const MAX_LOAN = LOAN_STOPS[LOAN_STOPS.length - 1].amount;

type EstimateDriver = "weight" | "amount";

function parseWeight(value: string): number {
  const parsed = Number.parseFloat(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function formatWeightInput(grams: number): string {
  if (!Number.isFinite(grams) || grams <= 0) return "";
  const rounded = Math.round(grams * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function positionFromAmount(amount: number): number {
  const clamped = Math.min(MAX_LOAN, Math.max(MIN_LOAN, amount));
  for (let index = 0; index < LOAN_STOPS.length - 1; index += 1) {
    const start = LOAN_STOPS[index].amount;
    const end = LOAN_STOPS[index + 1].amount;
    if (clamped <= end || index === LOAN_STOPS.length - 2) {
      const span = end - start;
      const local = span === 0 ? 0 : (clamped - start) / span;
      const bounded = Math.min(1, Math.max(0, local));
      return Math.round(
        ((index + bounded) / (LOAN_STOPS.length - 1)) * SLIDER_MAX,
      );
    }
  }
  return SLIDER_MAX;
}

function dotStyle(index: number): CSSProperties {
  return {
    left: `calc(var(--ym-slider-thumb) / 2 + (100% - var(--ym-slider-thumb)) * ${index / (LOAN_STOPS.length - 1)})`,
  };
}

const INTRO_MS = 1900;

function glide(t: number) {
  const c1 = 1.15;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

function delayedMix(mix: number, delayMs: number, durationMs: number) {
  const elapsed = mix * INTRO_MS;
  const t = Math.min(1, Math.max(0, (elapsed - delayMs) / durationMs));
  return 1 - (1 - t) ** 3;
}

function useFoldIntro(active: boolean) {
  const [mix, setMix] = useState(0);
  const cancelRef = useRef(false);

  useEffect(() => {
    if (!active) return;
    if (
      cancelRef.current ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setMix(1);
      return;
    }

    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      if (cancelRef.current) {
        setMix(1);
        return;
      }
      const t = Math.min(1, (now - start) / INTRO_MS);
      setMix(t);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  const finish = () => {
    cancelRef.current = true;
    setMix(1);
  };

  const settled = mix >= 1;
  return { mix: settled ? 1 : mix, settled, finish };
}

function RollingFigure({
  text,
  spin,
  delay = 0,
}: {
  text: string;
  spin: boolean;
  delay?: number;
}) {
  const digitCount = [...text].filter((ch) => /\d/.test(ch)).length;
  let seen = 0;

  return (
    <span className="ym-roll-figure" aria-hidden>
      {[...text].map((ch, index) => {
        if (!/\d/.test(ch)) {
          return (
            <span key={`${ch}-${index}`} className="ym-roll-mark">
              {ch}
            </span>
          );
        }
        const fromRight = digitCount - 1 - seen;
        seen += 1;
        const turns = 1 + Math.min(2, Math.floor(fromRight / 2));
        return (
          <span
            key={`d-${index}`}
            className="ym-roll"
            style={
              {
                "--ym-roll-index": spin ? turns * 10 + Number(ch) : 0,
                "--ym-roll-delay": `${delay + fromRight * 48}ms`,
                "--ym-roll-ms": `${760 + fromRight * 80}ms`,
              } as CSSProperties
            }
          >
            <span className="ym-roll-strip">
              {Array.from({ length: turns * 10 + 10 }, (_, step) => (
                <span key={step}>{step % 10}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function GoldLoanCalculator({
  initialPlans = [],
  initialPrice = null,
}: {
  initialPlans?: LoanPlan[];
  initialPrice?: GoldPriceSnapshot | null;
}) {
  const { plans, loading: plansLoading, error: plansError } = useLoanPlans(initialPlans);
  const [price, setPrice] = useState<GoldPriceSnapshot | null>(initialPrice);
  const [sliderPos, setSliderPos] = useState(() =>
    positionFromAmount(DEFAULT_LOAN_AMOUNT),
  );
  const [weightInput, setWeightInput] = useState("");
  const [weightFocused, setWeightFocused] = useState(false);
  const [driver, setDriver] = useState<EstimateDriver>("amount");
  const [karat, setKarat] = useState<GoldKarat>("22K");
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const { mix, settled, finish } = useFoldIntro(inView);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/gold-price");
        if (!res.ok) throw new Error("fetch failed");
        const data: unknown = await res.json();
        if (!isGoldPriceSnapshot(data)) throw new Error("invalid payload");
        if (!cancelled) setPrice(data);
      } catch {
        if (!cancelled) setPrice(null);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const sliderAmount = amountFromPosition(sliderPos);
  const typedGrams = useMemo(() => parseWeight(weightInput), [weightInput]);

  const loanFromWeight = useMemo(() => {
    if (!price || typedGrams <= 0) return null;
    return loanAmountFromWeightGrams(
      typedGrams,
      karat,
      price.gold999BaseRaw,
      price.rate22kPerGramInr,
    );
  }, [price, typedGrams, karat]);

  const gramsFromSlider = useMemo(() => {
    if (!price || sliderAmount <= 0) return 0;
    return weightGramsFromLoanAmount(
      sliderAmount,
      karat,
      price.gold999BaseRaw,
      price.rate22kPerGramInr,
    );
  }, [price, sliderAmount, karat]);

  const loanAmount =
    driver === "weight" && loanFromWeight !== null && loanFromWeight > 0
      ? loanFromWeight
      : sliderAmount;

  const activeGrams =
    driver === "weight" && typedGrams > 0 ? typedGrams : gramsFromSlider;
  const weightMix = settled ? 1 : delayedMix(mix, 280, 980);
  const shownGrams = settled ? activeGrams : activeGrams * weightMix;
  const weightValue =
    weightFocused || settled
      ? weightInput
      : shownGrams <= 0
        ? "0"
        : formatWeightInput(shownGrams) || "0";
  const sliderGlide = settled ? 1 : glide(mix);
  const visualPos = settled
    ? sliderPos
    : Math.max(0, Math.min(SLIDER_MAX, Math.round(sliderPos * sliderGlide)));
  const markerAmount = settled ? loanAmount : amountFromPosition(visualPos);

  useEffect(() => {
    if (!price || driver !== "weight" || loanFromWeight === null || loanFromWeight <= 0) {
      return;
    }
    setSliderPos(positionFromAmount(loanFromWeight));
  }, [price, driver, loanFromWeight]);

  useEffect(() => {
    if (!price || driver !== "amount" || weightFocused) return;
    const next = formatWeightInput(gramsFromSlider);
    setWeightInput((current) => (current === next ? current : next));
  }, [price, driver, gramsFromSlider, weightFocused]);

  const matchedPlans = useMemo(() => {
    if (loanAmount <= 0) return [];
    return getMatchingLoanPlansByType(loanAmount, plans);
  }, [loanAmount, plans]);

  const recordedWeight =
    weightInput.trim() ||
    (activeGrams > 0 ? formatWeightInput(activeGrams) : "");

  const { recordWeightEntry } = useCalculatorEngagement({
    weightInput: recordedWeight,
    weightGrams: activeGrams,
    karat,
    loanAmountInr: loanAmount,
  });

  const weightFieldActive = weightFocused || weightInput.trim().length > 0;
  const numericBindings = interFontBindings("font-tabular-nums");

  function applyAmount(position: number) {
    finish();
    setDriver("amount");
    setSliderPos(position);
  }

  function commitSlider(position = sliderPos) {
    const snapped = nearestStopIndex(position);
    applyAmount(snapped === null ? position : stopPosition(snapped));
    window.setTimeout(() => recordWeightEntry(), 0);
  }

  function selectStop(index: number) {
    applyAmount(stopPosition(index));
    window.setTimeout(() => recordWeightEntry(), 0);
  }

  return (
    <section
      ref={sectionRef}
      className={[
        "ym-loan-estimate-fold ym-loan-calculator-section ym-loan-calculator--dash",
        inView && !settled ? "ym-loan-estimate-fold--play" : "",
        settled ? "ym-loan-estimate-fold--settled" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-labelledby="ym-loan-calculator-title"
    >
      <div className="ym-loan-estimate-fold-inner ym-loan-estimate-column">
        <div className="ym-loan-calculator">
          <p className="ym-eyebrow">How much can you borrow</p>
          <h2
            id="ym-loan-calculator-title"
            className="ym-section-title ym-loan-calculator-title"
          >
            Loan Estimate
          </h2>

          <div className="ym-loan-calculator-card-stage">
            <div className="ym-loan-calculator-card ym-loan-calculator-card--inputs">
              <div className="ym-loan-calculator-card-inner">
                <div className="ym-loan-dash-controls">
                  <div className="ym-loan-entry">
                  <div className="ym-loan-slider">
                    <div className="ym-loan-slider-readout">
                      <p className="ym-loan-eligible-label">Loan amount</p>
                      <InterNumeric
                        as="p"
                        className="ym-loan-eligible-value font-tabular-nums"
                      >
                        <span className="ym-sr-only">{formatInr(loanAmount)}</span>
                        {settled ? (
                          <span aria-hidden>{formatInr(loanAmount)}</span>
                        ) : (
                          <RollingFigure
                            text={formatInr(loanAmount)}
                            spin={inView}
                          />
                        )}
                      </InterNumeric>
                    </div>

                    <div
                      className="ym-loan-slider-rail"
                      style={
                        {
                          "--ym-slider-fill": `${(visualPos / SLIDER_MAX) * 100}%`,
                        } as CSSProperties
                      }
                    >
                      <div className="ym-loan-slider-track" aria-hidden="true">
                        <span className="ym-loan-slider-track-fill" />
                      </div>
                      <div className="ym-loan-slider-dots" aria-hidden="true">
                        {LOAN_STOPS.map((stop, index) => (
                          <span
                            key={stop.amount}
                            className={[
                              "ym-loan-slider-dot",
                              markerAmount >= stop.amount
                                ? "ym-loan-slider-dot--reached"
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            style={dotStyle(index)}
                          />
                        ))}
                      </div>
                      <input
                        className="ym-loan-range"
                        type="range"
                        min={0}
                        max={SLIDER_MAX}
                        step={1}
                        value={visualPos}
                        aria-label="Loan amount"
                        aria-valuemin={LOAN_STOPS[0].amount}
                        aria-valuemax={LOAN_STOPS[LOAN_STOPS.length - 1].amount}
                        aria-valuenow={loanAmount}
                        aria-valuetext={formatInr(loanAmount)}
                        onChange={(event) =>
                          applyAmount(Number(event.target.value))
                        }
                        onPointerUp={(event) =>
                          commitSlider(Number(event.currentTarget.value))
                        }
                        onKeyUp={() => {
                          window.setTimeout(() => recordWeightEntry(), 0);
                        }}
                      />
                    </div>

                    <div className="ym-loan-slider-labels">
                      {LOAN_STOPS.map((stop, index) => {
                        const current = loanAmount === stop.amount;
                        return (
                          <button
                            key={stop.amount}
                            type="button"
                            className={[
                              "ym-loan-slider-label",
                              current ? "ym-loan-slider-label--current" : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            style={dotStyle(index)}
                            aria-label={formatInr(stop.amount)}
                            aria-pressed={current}
                            onClick={() => selectStop(index)}
                          >
                            {stop.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <p className="ym-loan-either">or</p>

                  <div
                    className={[
                      "ym-loan-field ym-loan-field--weight",
                      weightFieldActive ? "ym-loan-field--active" : "ym-loan-field--idle",
                      !settled ? "ym-loan-field--reeling" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <FloatingInput
                      id="ym-gold-weight"
                      label="Enter gold weight (g)"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.1"
                      value={weightValue}
                      onChange={(event) => {
                        finish();
                        setDriver("weight");
                        setWeightInput(event.target.value);
                      }}
                      onFocus={() => {
                        finish();
                        setWeightFocused(true);
                      }}
                      onBlur={() => {
                        setWeightFocused(false);
                        recordWeightEntry();
                      }}
                      className={numericBindings.className}
                      style={numericBindings.style}
                    />
                    {!settled && activeGrams > 0 && (
                      <span className="ym-loan-weight-reel">
                        <RollingFigure
                          text={formatWeightInput(activeGrams)}
                          spin={inView}
                          delay={280}
                        />
                      </span>
                    )}
                  </div>
                  </div>

                  <div className="ym-purity-pills">
                    <p className="ym-purity-pills-label" id="ym-gold-purity-label">
                      Purity
                    </p>
                    <div
                      className="ym-purity-pills-row"
                      role="radiogroup"
                      aria-labelledby="ym-gold-purity-label"
                    >
                      {GOLD_KARAT_OPTIONS.map((option) => {
                        const selected = karat === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            className={[
                              "ym-purity-pill",
                              selected ? "ym-purity-pill--selected" : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            onClick={() => {
                              finish();
                              setDriver("amount");
                              setKarat(option);
                              window.setTimeout(() => recordWeightEntry(), 0);
                            }}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {!plansLoading && !plansError && matchedPlans.length > 0 && (
                  <div className="ym-loan-eligible-amount">
                    <p className="ym-sr-only" aria-live="polite">
                      {settled
                        ? matchedPlans
                            .map(
                              (plan) =>
                                `${formatInr(calculateMonthlyInterestInr(loanAmount, plan))} per month, ${formatPlanRepaymentLabel(plan.repaymentType)}`,
                            )
                            .join(". ")
                        : ""}
                    </p>
                    <div className="ym-loan-interest-section">
                        <div
                          className={[
                            "ym-loan-interest-cards",
                            matchedPlans.length === 1
                              ? "ym-loan-interest-cards--single"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          {matchedPlans.map((plan, planIndex) => {
                            const monthlyInterest = calculateMonthlyInterestInr(
                              loanAmount,
                              plan,
                            );

                            return (
                              <article
                                key={plan.id}
                                className="ym-loan-interest-card"
                              >
                                <InterNumeric
                                  as="p"
                                  className="ym-loan-interest-value font-tabular-nums"
                                >
                                  {settled ? (
                                    formatInr(monthlyInterest)
                                  ) : (
                                    <RollingFigure
                                      text={formatInr(monthlyInterest)}
                                      spin={inView}
                                      delay={180 + planIndex * 160}
                                    />
                                  )}
                                </InterNumeric>
                                <p className="ym-loan-interest-period">Per Month</p>
                                <p className="ym-loan-interest-charges">Including All Charges</p>
                                <p className="ym-loan-interest-meta">
                                  <span className="ym-loan-interest-plan-type">
                                    {formatPlanRepaymentLabel(plan.repaymentType)}
                                  </span>
                                  <span className="ym-loan-interest-rate">
                                    {formatPlanRate(plan.monthlyRatePercent)}% p.m.
                                  </span>
                                </p>
                              </article>
                            );
                          })}
                        </div>
                      </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
