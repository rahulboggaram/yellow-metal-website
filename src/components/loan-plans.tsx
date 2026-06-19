"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { LoanPlan } from "@/lib/loan-plans-shared";
import { formatPlanRate } from "@/lib/loan-plans-shared";

export function LoanPlanCard({ plan }: { plan: LoanPlan }) {
  return (
    <article className="ym-loan-plan-card">
      <header className="ym-loan-plan-card-header">
        <div>
          <h4 className="ym-loan-plan-amount">{plan.amountLabel}</h4>
        </div>
        <div className="ym-loan-plan-headline-rate">
          <span className="ym-loan-plan-rate-value">
            {formatPlanRate(plan.annualRatePercent)}%
          </span>
          <span className="ym-loan-plan-rate-label">p.a.</span>
        </div>
      </header>

      <dl className="ym-loan-plan-meta">
        <div>
          <dt>LTV</dt>
          <dd>{plan.ltvLabel}</dd>
        </div>
        <div>
          <dt>Tenure</dt>
          <dd>{plan.tenureMonths}M</dd>
        </div>
        <div>
          <dt>Monthly</dt>
          <dd>{formatPlanRate(plan.monthlyRatePercent)}%</dd>
        </div>
      </dl>
    </article>
  );
}

export function useLoanPlans() {
  const [plans, setPlans] = useState<LoanPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/loan-plans");
        if (!res.ok) throw new Error("fetch failed");
        const data: { plans?: LoanPlan[] } = await res.json();
        if (!cancelled) {
          setPlans(data.plans ?? []);
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

  return { plans, loading, error };
}

type LoanPlansModalProps = {
  open: boolean;
  onClose: () => void;
  plans: LoanPlan[];
  loading: boolean;
  error: boolean;
};

export function LoanPlansModal({
  open,
  onClose,
  plans,
  loading,
  error,
}: LoanPlansModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="ym-loan-plans-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ym-loan-plans-modal-title"
    >
      <button
        type="button"
        className="ym-loan-plans-modal-backdrop"
        onClick={onClose}
        aria-label="Close loan plans"
      />
      <div className="ym-loan-plans-modal-panel">
        <header className="ym-loan-plans-modal-header">
          <div>
            <h3 id="ym-loan-plans-modal-title" className="ym-loan-plans-modal-title">
              All loan plans
            </h3>
            <p className="ym-loan-plans-modal-subtitle">
              Interest rates vary by loan amount and tenure. All plans offer up to 75% LTV.
            </p>
          </div>
          <button
            type="button"
            className="ym-loan-plans-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        {loading && <p className="ym-loan-plans-modal-status">Loading plans…</p>}
        {error && (
          <p className="ym-loan-plans-modal-status ym-loan-plans-modal-status--error">
            Plans are unavailable right now.
          </p>
        )}

        {!loading && !error && (
          <div className="ym-loan-plans-modal-list">
            {plans.map((plan) => (
              <LoanPlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
