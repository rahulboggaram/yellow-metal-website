"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "@/lib/loan-plans-shared";
import { useLoanPlans } from "@/components/loan-plans";
import { InterNumeric } from "@/components/inter-numeric";
import { brandFont, interFontBindings } from "@/lib/fonts";
import { useCalculatorEngagement } from "@/hooks/use-calculator-engagement";

const LOAN_STOPS = [
  { amount: 20_000, label: "₹20K" },
  { amount: 100_000, label: "₹1L" },
  { amount: 500_000, label: "₹5L" },
  { amount: 1_000_000, label: "₹10L" },
  { amount: 5_000_000, label: "₹50L" },
] as const;

/** Everyday estimate. Index of ₹1L in LOAN_STOPS. */
const DEFAULT_STOP_INDEX = 1;

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

export function GoldLoanCalculator() {
  const { plans, loading: plansLoading, error: plansError } = useLoanPlans();
  const [price, setPrice] = useState<GoldPriceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [sliderPos, setSliderPos] = useState(() => stopPosition(DEFAULT_STOP_INDEX));
  const [weightInput, setWeightInput] = useState("");
  const [weightFocused, setWeightFocused] = useState(false);
  const [driver, setDriver] = useState<EstimateDriver>("amount");
  const [karat, setKarat] = useState<GoldKarat>("22K");

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
      } finally {
        if (!cancelled) setLoading(false);
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
      className="ym-loan-estimate-fold ym-loan-calculator-section ym-loan-calculator--dash"
      aria-labelledby="ym-loan-calculator-title"
    >
      <div className="ym-loan-estimate-fold-inner ym-loan-estimate-column">
        <div className="ym-loan-calculator">
          <p className="ym-eyebrow">How much can you borrow</p>
          <h2
            id="ym-loan-calculator-title"
            className={`ym-section-title ym-loan-calculator-title ${brandFont.className}`}
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
                        {formatInr(loanAmount)}
                      </InterNumeric>
                    </div>

                    <div className="ym-loan-slider-rail">
                      <div className="ym-loan-slider-dots" aria-hidden="true">
                        {LOAN_STOPS.map((stop, index) => (
                          <span
                            key={stop.amount}
                            className={[
                              "ym-loan-slider-dot",
                              loanAmount >= stop.amount
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
                        value={sliderPos}
                        aria-label="Loan amount"
                        aria-valuemin={LOAN_STOPS[0].amount}
                        aria-valuemax={LOAN_STOPS[LOAN_STOPS.length - 1].amount}
                        aria-valuenow={loanAmount}
                        aria-valuetext={formatInr(loanAmount)}
                        style={
                          {
                            "--ym-slider-fill": `${(sliderPos / SLIDER_MAX) * 100}%`,
                          } as CSSProperties
                        }
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
                    ].join(" ")}
                  >
                    <FloatingInput
                      id="ym-gold-weight"
                      label="Enter gold weight (g)"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.1"
                      value={weightInput}
                      onChange={(event) => {
                        setDriver("weight");
                        setWeightInput(event.target.value);
                      }}
                      onFocus={() => setWeightFocused(true)}
                      onBlur={() => {
                        setWeightFocused(false);
                        recordWeightEntry();
                      }}
                      className={numericBindings.className}
                      style={numericBindings.style}
                    />
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

                {!loading && !plansLoading && !plansError && matchedPlans.length > 0 && (
                  <div className="ym-loan-eligible-amount" aria-live="polite">
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
                          {matchedPlans.map((plan) => {
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
                                  {formatInr(monthlyInterest)}
                                </InterNumeric>
                                <p className="ym-loan-interest-period">Per Month</p>
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
