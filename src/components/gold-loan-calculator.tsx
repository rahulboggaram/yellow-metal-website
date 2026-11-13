"use client";

import { useEffect, useMemo, useState } from "react";
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
import { LoanCalculatorJewels } from "@/components/loan-calculator-jewels";
import { InterNumeric } from "@/components/inter-numeric";
import { brandFont, interFontBindings } from "@/lib/fonts";
import { useCalculatorEngagement } from "@/hooks/use-calculator-engagement";

type EstimateMode = "weight" | "amount";

const LOAN_AMOUNT_PRESETS = [
  { amount: 25_000, label: "₹25K" },
  { amount: 50_000, label: "₹50K" },
  { amount: 100_000, label: "₹1L" },
  { amount: 200_000, label: "₹2L" },
  { amount: 500_000, label: "₹5L" },
] as const;

function formatAmountField(digits: string): string {
  if (!digits) return "";
  const amount = Number(digits);
  if (!Number.isFinite(amount)) return "";
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount)}`;
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

export function GoldLoanCalculator() {
  const { plans, loading: plansLoading, error: plansError } = useLoanPlans();
  const [price, setPrice] = useState<GoldPriceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mode, setMode] = useState<EstimateMode>("weight");
  const [weightInput, setWeightInput] = useState("");
  const [amountDigits, setAmountDigits] = useState("");
  const [karat, setKarat] = useState<GoldKarat>("22K");
  const [weightFocused, setWeightFocused] = useState(false);
  const [amountFocused, setAmountFocused] = useState(false);

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

  const weightGrams = useMemo(() => {
    const parsed = Number.parseFloat(weightInput.replace(/,/g, "").trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }, [weightInput]);

  const typedLoanAmount = useMemo(() => {
    if (!amountDigits) return 0;
    const parsed = Number(amountDigits);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [amountDigits]);

  const loanFromWeight = useMemo(() => {
    if (!price || weightGrams <= 0) return null;
    return loanAmountFromWeightGrams(
      weightGrams,
      karat,
      price.gold999BaseRaw,
      price.rate22kPerGramInr,
    );
  }, [price, weightGrams, karat]);

  const gramsFromAmount = useMemo(() => {
    if (!price || typedLoanAmount <= 0) return 0;
    return weightGramsFromLoanAmount(
      typedLoanAmount,
      karat,
      price.gold999BaseRaw,
      price.rate22kPerGramInr,
    );
  }, [price, typedLoanAmount, karat]);

  const loanAmount =
    mode === "amount"
      ? typedLoanAmount > 0
        ? typedLoanAmount
        : null
      : loanFromWeight;

  const activeWeightGrams = mode === "weight" ? weightGrams : gramsFromAmount;

  const matchedPlans = useMemo(() => {
    if (loanAmount === null || loanAmount <= 0) return [];
    return getMatchingLoanPlansByType(loanAmount, plans);
  }, [loanAmount, plans]);

  const hasWeightValue = weightInput.trim().length > 0 && weightGrams > 0;
  const weightFieldActive = weightFocused || weightInput.trim().length > 0;
  const amountFieldActive = amountFocused || amountDigits.length > 0;

  const showResult =
    mode === "weight"
      ? hasWeightValue && !loading && !error && loanFromWeight !== null
      : typedLoanAmount > 0 && !loading;

  const resultLabel =
    mode === "amount" ? "Gold required" : "Eligible loan amount";

  const resultText =
    mode === "amount"
      ? !error && gramsFromAmount > 0
        ? formatGoldGrams(gramsFromAmount)
        : "—"
      : loanFromWeight === null
        ? "—"
        : formatInr(loanFromWeight);

  const numericBindings = interFontBindings("font-tabular-nums");
  const recordedWeight =
    mode === "weight"
      ? weightInput
      : activeWeightGrams > 0
        ? String(Math.round(activeWeightGrams * 10) / 10)
        : "";

  const { recordWeightEntry } = useCalculatorEngagement({
    weightInput: recordedWeight,
    weightGrams: activeWeightGrams,
    karat,
    loanAmountInr: loanAmount,
  });

  useEffect(() => {
    if (mode !== "amount" || amountFocused || typedLoanAmount <= 0 || !price) {
      return;
    }
    recordWeightEntry();
  }, [
    mode,
    amountFocused,
    typedLoanAmount,
    price,
    karat,
    recordWeightEntry,
  ]);

  function selectMode(next: EstimateMode) {
    if (next === mode) return;
    if (next === "amount" && loanFromWeight !== null && loanFromWeight > 0) {
      setAmountDigits(String(loanFromWeight));
    }
    if (next === "weight" && gramsFromAmount > 0) {
      const rounded = Math.round(gramsFromAmount * 10) / 10;
      setWeightInput(String(rounded));
    }
    setMode(next);
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
            <LoanCalculatorJewels weightGrams={activeWeightGrams} />

            <div className="ym-loan-calculator-card ym-loan-calculator-card--inputs">
              <div className="ym-loan-calculator-card-inner">
                <div className="ym-loan-dash-controls">
                  <div
                    className="ym-loan-input-mode"
                    role="radiogroup"
                    aria-label="Estimate using"
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={mode === "weight"}
                      className={[
                        "ym-loan-input-mode-btn",
                        mode === "weight" ? "ym-loan-input-mode-btn--selected" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => selectMode("weight")}
                    >
                      Gold weight
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={mode === "amount"}
                      className={[
                        "ym-loan-input-mode-btn",
                        mode === "amount" ? "ym-loan-input-mode-btn--selected" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => selectMode("amount")}
                    >
                      Loan amount
                    </button>
                  </div>

                  {mode === "weight" ? (
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
                        onChange={(event) => setWeightInput(event.target.value)}
                        onFocus={() => setWeightFocused(true)}
                        onBlur={() => {
                          setWeightFocused(false);
                          recordWeightEntry();
                        }}
                        className={numericBindings.className}
                        style={numericBindings.style}
                      />
                    </div>
                  ) : (
                    <div className="ym-loan-amount-entry">
                      <div
                        className={[
                          "ym-loan-field ym-loan-field--weight",
                          amountFieldActive
                            ? "ym-loan-field--active"
                            : "ym-loan-field--idle",
                        ].join(" ")}
                      >
                        <FloatingInput
                          id="ym-loan-amount"
                          label="Enter loan amount"
                          inputMode="numeric"
                          autoComplete="off"
                          value={formatAmountField(amountDigits)}
                          onChange={(event) => {
                            const digits = event.target.value
                              .replace(/\D/g, "")
                              .slice(0, 8);
                            setAmountDigits(digits);
                          }}
                          onFocus={() => setAmountFocused(true)}
                          onBlur={() => setAmountFocused(false)}
                          className={numericBindings.className}
                          style={numericBindings.style}
                        />
                      </div>

                      <div className="ym-amount-pills">
                        <p className="ym-purity-pills-label" id="ym-loan-amount-picks">
                          Or pick an amount
                        </p>
                        <div
                          className="ym-amount-pills-row"
                          role="radiogroup"
                          aria-labelledby="ym-loan-amount-picks"
                        >
                          {LOAN_AMOUNT_PRESETS.map((preset) => {
                            const selected = amountDigits === String(preset.amount);
                            return (
                              <button
                                key={preset.amount}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                aria-label={formatInr(preset.amount)}
                                className={[
                                  "ym-amount-pill",
                                  selected ? "ym-amount-pill--selected" : "",
                                ]
                                  .filter(Boolean)
                                  .join(" ")}
                                onClick={() =>
                                  setAmountDigits(String(preset.amount))
                                }
                              >
                                {preset.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

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
                              if (mode === "weight" && weightGrams > 0) {
                                window.setTimeout(() => recordWeightEntry(), 0);
                              }
                            }}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {showResult && (
                  <div className="ym-loan-eligible-amount" aria-live="polite">
                    <p className="ym-loan-eligible-label">{resultLabel}</p>
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
                            const monthlyInterest =
                              loanAmount === null
                                ? 0
                                : calculateMonthlyInterestInr(loanAmount, plan);

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
