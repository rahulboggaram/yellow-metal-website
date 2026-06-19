"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FloatingInput } from "@/components/ui/floating-field";
import {
  FlipClockAmount,
  FlipClockPlaceholder,
} from "@/components/flip-clock-amount";
import type { GoldKarat, GoldPriceSnapshot } from "@/lib/gold-price-format";
import {
  GOLD_KARAT_OPTIONS,
  formatInr,
  isGoldPriceSnapshot,
  loanAmountFromWeightGrams,
} from "@/lib/gold-price-format";
import { LoanPlansModal, useLoanPlans } from "@/components/loan-plans";
import { LoanCalculatorJewels } from "@/components/loan-calculator-jewels";
import { calculatorJewelSummary } from "@/lib/loan-calculator-jewels";

/** Top flip clock — fixed 1g @ 22K; not tied to calculator inputs */
const BRIDGE_LENDING_KARAT: GoldKarat = "22K";
const BRIDGE_LENDING_GRAMS = 1;

export function GoldLoanCalculator() {
  const { plans, loading: plansLoading, error: plansError } = useLoanPlans();
  const [price, setPrice] = useState<GoldPriceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [karat, setKarat] = useState<GoldKarat>("22K");
  const [plansModalOpen, setPlansModalOpen] = useState(false);
  const [weightFocused, setWeightFocused] = useState(false);
  const [flipRevealed, setFlipRevealed] = useState(false);
  const [bridgeFlipKey, setBridgeFlipKey] = useState(0);

  const amountCardRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const el = amountCardRef.current;
    if (!el || flipRevealed) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setFlipRevealed(true);
          setBridgeFlipKey((key) => key + 1);
        }
      },
      { threshold: 0.35, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [flipRevealed]);

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

  const bridgeLoanAmount = useMemo(() => {
    if (!price) return null;
    return loanAmountFromWeightGrams(
      BRIDGE_LENDING_GRAMS,
      BRIDGE_LENDING_KARAT,
      price.gold999BaseRaw,
      price.rate22kPerGramInr,
    );
  }, [price]);

  const hasWeightValue = weightInput.trim().length > 0 && weightGrams > 0;
  const weightFieldActive = weightFocused || weightInput.trim().length > 0;

  const showEligibleAmount =
    hasWeightValue && !loading && !error && loanAmount !== null;

  const bridgeAmountText =
    loading || error || bridgeLoanAmount === null
      ? "—"
      : formatInr(bridgeLoanAmount);

  const showBridgeFlip =
    flipRevealed && !loading && !error && bridgeLoanAmount !== null;

  const jewelSummary =
    hasWeightValue ? calculatorJewelSummary(weightGrams) : "";

  const amountText =
    loading || error || loanAmount === null ? "—" : formatInr(loanAmount);

  return (
    <div className="ym-loan-estimate-column">
      <div ref={amountCardRef} className="ym-loan-flip-bridge">
        {(loading || error) && (
          <p className="ym-loan-flip-status">
            {loading ? "Fetching live spot rate…" : "Live rate unavailable"}
          </p>
        )}

        <p className="ym-loan-ltv-caption">
          Today&apos;s lending rate for {BRIDGE_LENDING_KARAT} gold at 75% LTV
        </p>

        <div className="ym-loan-flip-result" aria-live="polite">
          {showBridgeFlip ? (
            <FlipClockAmount
              amount={bridgeLoanAmount}
              flipKey={bridgeFlipKey}
              className="ym-solari-amount--loan"
            />
          ) : (
            <FlipClockPlaceholder
              className="ym-solari-amount--loan"
              template="₹00000"
            />
          )}
          <span className="ym-sr-only">{bridgeAmountText}</span>
        </div>
      </div>

      <section
        className="ym-section ym-loan-calculator-section ym-loan-calculator--dash"
        aria-labelledby="ym-loan-calculator-title"
      >
        <div className="ym-loan-calculator">
            <p className="ym-eyebrow">How much can you borrow</p>
            <h2 id="ym-loan-calculator-title" className="ym-section-title">
              Loan Estimate
            </h2>

            <div className="ym-loan-calculator-card-stage">
              <LoanCalculatorJewels weightGrams={weightGrams} side="left" />

              <div className="ym-loan-calculator-card ym-loan-calculator-card--inputs">
              <div className="ym-loan-calculator-card-inner">
                <div className="ym-loan-dash-controls">
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
                      onBlur={() => setWeightFocused(false)}
                      className="font-tabular-nums"
                    />
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
                    <p className="ym-loan-eligible-label">Eligible loan amount</p>
                    <p className="ym-loan-eligible-value font-tabular-nums">
                      {amountText}
                    </p>
                    <button
                      type="button"
                      className="ym-loan-plans-link"
                      onClick={() => setPlansModalOpen(true)}
                      aria-haspopup="dialog"
                    >
                      View loan plans
                      <span className="ym-loan-plans-link-arrow" aria-hidden>
                        {">"}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>

              <LoanCalculatorJewels weightGrams={weightGrams} side="right" />
            </div>

            {jewelSummary && (
              <p className="ym-loan-jewel-summary" aria-live="polite">
                {jewelSummary}
              </p>
            )}
        </div>
      </section>

      <LoanPlansModal
        open={plansModalOpen}
        onClose={() => setPlansModalOpen(false)}
        plans={plans}
        loading={plansLoading}
        error={plansError}
      />
    </div>
  );
}
