"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { GoldKarat, GoldPriceSnapshot } from "@/lib/gold-price-format";
import {
  GOLD_KARAT_OPTIONS,
  formatInr,
  isGoldPriceSnapshot,
  weightGramsFromLoanAmount,
} from "@/lib/gold-price-format";
import {
  calculateMonthlyInterestInr,
  formatPlanRate,
  formatPlanRepaymentLabel,
  getMatchingLoanPlansByType,
} from "@/lib/loan-plans-shared";
import { useLoanPlans } from "@/components/loan-plans";
import { LoanCalculatorJewels } from "@/components/loan-calculator-jewels";
import { InterNumeric } from "@/components/inter-numeric";
import { brandFont } from "@/lib/fonts";
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

function formatGoldGrams(grams: number): string {
  const digits = grams < 1 ? 2 : 1;
  const factor = 10 ** digits;
  const rounded = Math.round(grams * factor) / factor;
  return `${rounded.toLocaleString("en-IN", {
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : digits,
    maximumFractionDigits: digits,
  })} g`;
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
  const [error, setError] = useState(false);
  const [sliderPos, setSliderPos] = useState(() => stopPosition(DEFAULT_STOP_INDEX));
  const [karat, setKarat] = useState<GoldKarat>("22K");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/gold-price");
        if (!res.ok) throw new Error("fetch failed");
        const data: unknown = await res.json();
        if (!isGoldPriceSnapshot(data)) throw new Error("invalid payload");
        if (!cancelled) {
          setPrice(data);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const loanAmount = amountFromPosition(sliderPos);

  const gramsFromAmount = useMemo(() => {
    if (!price || loanAmount <= 0) return 0;
    return weightGramsFromLoanAmount(
      loanAmount,
      karat,
      price.gold999BaseRaw,
      price.rate22kPerGramInr,
    );
  }, [price, loanAmount, karat]);

  const matchedPlans = useMemo(() => {
    if (loanAmount <= 0) return [];
    return getMatchingLoanPlansByType(loanAmount, plans);
  }, [loanAmount, plans]);

  const resultText =
    !error && gramsFromAmount > 0 ? formatGoldGrams(gramsFromAmount) : "—";

  const recordedWeight =
    gramsFromAmount > 0
      ? String(Math.round(gramsFromAmount * 10) / 10)
      : "";

  const { recordWeightEntry } = useCalculatorEngagement({
    weightInput: recordedWeight,
    weightGrams: gramsFromAmount,
    karat,
    loanAmountInr: loanAmount,
  });

  function commitSlider(position = sliderPos) {
    const snapped = nearestStopIndex(position);
    if (snapped !== null) setSliderPos(stopPosition(snapped));
    window.setTimeout(() => recordWeightEntry(), 0);
  }

  function selectStop(index: number) {
    setSliderPos(stopPosition(index));
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
            <LoanCalculatorJewels weightGrams={gramsFromAmount} />

            <div className="ym-loan-calculator-card ym-loan-calculator-card--inputs">
              <div className="ym-loan-calculator-card-inner">
                <div className="ym-loan-dash-controls">
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
                          setSliderPos(Number(event.target.value))
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

                {!loading && (
                  <div className="ym-loan-eligible-amount" aria-live="polite">
                    <p className="ym-loan-eligible-label">Gold required</p>
                    <InterNumeric
                      as="p"
                      className="ym-loan-eligible-value font-tabular-nums"
                    >
                      {resultText}
                    </InterNumeric>

                    {!plansLoading && !plansError && matchedPlans.length > 0 && (
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
                    )}
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
