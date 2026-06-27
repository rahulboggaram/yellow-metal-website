"use client";

import { useEffect, useMemo, useState } from "react";
import { FloatingInput } from "@/components/ui/floating-field";
import type { GoldKarat, GoldPriceSnapshot } from "@/lib/gold-price-format";
import {
  GOLD_KARAT_OPTIONS,
  formatInr,
  isGoldPriceSnapshot,
  loanAmountFromWeightGrams,
} from "@/lib/gold-price-format";
import {
  calculateMonthlyInterestInr,
  formatPlanRepaymentLabel,
  getMatchingLoanPlansByType,
} from "@/lib/loan-plans-shared";
import { useLoanPlans } from "@/components/loan-plans";
import { LoanCalculatorJewels } from "@/components/loan-calculator-jewels";
import { brandFont, LOAN_CALCULATOR_INTER_CLASS } from "@/lib/fonts";

export function GoldLoanCalculator() {
  const { plans, loading: plansLoading, error: plansError } = useLoanPlans();
  const [price, setPrice] = useState<GoldPriceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [karat, setKarat] = useState<GoldKarat>("22K");
  const [weightFocused, setWeightFocused] = useState(false);

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

  const loanAmount = useMemo(() => {
    if (!price || weightGrams <= 0) return null;
    return loanAmountFromWeightGrams(
      weightGrams,
      karat,
      price.gold999BaseRaw,
      price.rate22kPerGramInr,
    );
  }, [price, weightGrams, karat]);

  const matchedPlans = useMemo(() => {
    if (loanAmount === null || loanAmount <= 0) return [];
    return getMatchingLoanPlansByType(loanAmount, plans);
  }, [loanAmount, plans]);

  const hasWeightValue = weightInput.trim().length > 0 && weightGrams > 0;
  const weightFieldActive = weightFocused || weightInput.trim().length > 0;

  const showEligibleAmount =
    hasWeightValue && !loading && !error && loanAmount !== null;

  const amountText =
    loading || error || loanAmount === null ? "—" : formatInr(loanAmount);

  return (
    <section
      className={`ym-loan-estimate-fold ym-loan-calculator-section ym-loan-calculator--dash ${LOAN_CALCULATOR_INTER_CLASS}`}
      aria-labelledby="ym-loan-calculator-title"
    >
      <div className="ym-loan-estimate-fold-inner ym-loan-estimate-column">
        <div className="ym-loan-calculator">
          <p className={`ym-eyebrow ${LOAN_CALCULATOR_INTER_CLASS}`}>How much can you borrow</p>
          <h2
            id="ym-loan-calculator-title"
            className={`ym-section-title ym-loan-calculator-title ${brandFont.className}`}
          >
            Loan Estimate
          </h2>

          <div className="ym-loan-calculator-card-stage">
            <LoanCalculatorJewels weightGrams={weightGrams} />

            <div
              className={`ym-loan-calculator-card ym-loan-calculator-card--inputs ${LOAN_CALCULATOR_INTER_CLASS}`}
            >
              <div className={`ym-loan-calculator-card-inner ${LOAN_CALCULATOR_INTER_CLASS}`}>
                <div className="ym-loan-dash-controls">
                  <div
                    className={[
                      "ym-loan-field ym-loan-field--weight",
                      LOAN_CALCULATOR_INTER_CLASS,
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
                      onBlur={() => setWeightFocused(false)}
                      className={`font-tabular-nums ${LOAN_CALCULATOR_INTER_CLASS}`}
                    />
                  </div>

                  <div className="ym-purity-pills">
                    <p className={`ym-purity-pills-label ${LOAN_CALCULATOR_INTER_CLASS}`} id="ym-gold-purity-label">
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
                              LOAN_CALCULATOR_INTER_CLASS,
                              selected ? "ym-purity-pill--selected" : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            onClick={() => setKarat(option)}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {showEligibleAmount && (
                  <div className="ym-loan-eligible-amount" aria-live="polite">
                    <p className={`ym-loan-eligible-label ${LOAN_CALCULATOR_INTER_CLASS}`}>
                      Eligible loan amount
                    </p>
                    <p className={`ym-loan-eligible-value font-tabular-nums ${LOAN_CALCULATOR_INTER_CLASS}`}>
                      {amountText}
                    </p>

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
                                <p
                                  className={`ym-loan-interest-value font-tabular-nums ${LOAN_CALCULATOR_INTER_CLASS}`}
                                >
                                  {formatInr(monthlyInterest)}
                                </p>
                                <p className={`ym-loan-interest-period ${LOAN_CALCULATOR_INTER_CLASS}`}>Per Month</p>
                                <p className={`ym-loan-interest-meta ${LOAN_CALCULATOR_INTER_CLASS}`}>
                                  {formatPlanRepaymentLabel(plan.repaymentType)}
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
