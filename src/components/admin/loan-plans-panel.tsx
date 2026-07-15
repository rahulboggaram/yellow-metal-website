"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FloatingInput, FloatingSelect } from "@/components/ui/floating-field";
import type { LoanPlan, LoanPlanInput, LoanPlanInterestTier } from "@/lib/loan-plans-shared";

const EMPTY_TIER: LoanPlanInterestTier = {
  daysFrom: 0,
  daysTo: 30,
  monthlyRatePercent: 1.5,
};

const EMPTY_PLAN: LoanPlanInput = {
  amountLabel: "",
  minAmountInr: 0,
  maxAmountInr: null,
  category: null,
  repaymentType: "monthly",
  ltvLabel: "up to 75%",
  tenureMonths: 6,
  annualRatePercent: 0,
  monthlyRatePercent: 0,
  interestTiers: [{ ...EMPTY_TIER }],
  sortOrder: 1,
  active: true,
};

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function LoanPlansAdminPanel() {
  const [plans, setPlans] = useState<LoanPlan[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LoanPlanInput>(EMPTY_PLAN);

  const loadPlans = useCallback(async () => {
    setMessage(null);
    try {
      const res = await fetch("/api/loan-plans?all=1");
      if (res.status === 401) {
        throw new Error("Your session expired. Sign in again.");
      }
      if (!res.ok) throw new Error("Could not load plans");
      const data: { plans?: LoanPlan[] } = await res.json();
      setPlans(data.plans ?? []);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not load plans.",
      );
    }
  }, []);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  function resetForm() {
    setEditingId(null);
    setForm({
      ...EMPTY_PLAN,
      sortOrder: plans.length + 1,
      interestTiers: [{ ...EMPTY_TIER }],
    });
  }

  function startEdit(plan: LoanPlan) {
    setEditingId(plan.id);
    setForm({
      amountLabel: plan.amountLabel,
      minAmountInr: plan.minAmountInr,
      maxAmountInr: plan.maxAmountInr,
      category: plan.category,
      repaymentType: plan.repaymentType,
      ltvLabel: plan.ltvLabel,
      tenureMonths: plan.tenureMonths,
      annualRatePercent: plan.annualRatePercent,
      monthlyRatePercent: plan.monthlyRatePercent,
      interestTiers: plan.interestTiers.map((tier) => ({ ...tier })),
      sortOrder: plan.sortOrder,
      active: plan.active,
    });
    setMessage(null);
  }

  function updateTier(index: number, patch: Partial<LoanPlanInterestTier>) {
    setForm((current) => ({
      ...current,
      interestTiers: current.interestTiers.map((tier, i) =>
        i === index ? { ...tier, ...patch } : tier,
      ),
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setSaving(true);
    setMessage(null);
    try {
      const url = editingId ? `/api/loan-plans/${editingId}` : "/api/loan-plans";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data: { error?: string } = await res.json();
      if (res.status === 401) {
        throw new Error("Your session expired. Sign in again.");
      }
      if (!res.ok) throw new Error(data.error ?? "Save failed");

      setMessage(editingId ? "Plan updated." : "Plan created.");
      resetForm();
      await loadPlans();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this loan plan?")) return;

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/loan-plans/${id}`, {
        method: "DELETE",
      });
      const data: { error?: string } = await res.json();
      if (res.status === 401) {
        throw new Error("Your session expired. Sign in again.");
      }
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      setMessage("Plan deleted.");
      if (editingId === id) resetForm();
      await loadPlans();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setSaving(false);
    }
  }

  const livePlans = useMemo(
    () => plans.filter((plan) => plan.active),
    [plans],
  );
  const disabledPlans = useMemo(
    () => plans.filter((plan) => !plan.active),
    [plans],
  );

  return (
    <div className="ym-admin-stack">
      {message && <p className="ym-admin-message">{message}</p>}

      <div className="ym-admin-split">
        <section className="ym-admin-panel ym-admin-plan-form">
          <h2 className="ym-admin-heading">
            {editingId ? "Edit plan" : "Add plan"}
          </h2>
          <form className="ym-admin-form" onSubmit={handleSubmit}>
            <FloatingInput
              label="Amount label"
              value={form.amountLabel}
              onChange={(e) =>
                setForm((c) => ({ ...c, amountLabel: e.target.value }))
              }
              placeholder="₹20,000 – ₹49,999"
              required
            />

            <div className="ym-admin-row">
              <FloatingInput
                label="Min amount (₹)"
                type="number"
                min="0"
                value={form.minAmountInr || ""}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    minAmountInr: Number(e.target.value) || 0,
                  }))
                }
                required
              />
              <FloatingInput
                label="Max amount (₹)"
                type="number"
                min="0"
                value={form.maxAmountInr ?? ""}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    maxAmountInr: parseOptionalNumber(e.target.value),
                  }))
                }
                placeholder="Leave empty for no max"
              />
            </div>

            <div className="ym-admin-row ym-admin-row--3">
              <FloatingSelect
                label="Repayment type"
                value={form.repaymentType}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    repaymentType:
                      e.target.value === "bullet" ? "bullet" : "monthly",
                  }))
                }
              >
                <option value="monthly">Monthly</option>
                <option value="bullet">Bullet</option>
              </FloatingSelect>
              <FloatingInput
                label="Category"
                value={form.category ?? ""}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    category: e.target.value.trim() || null,
                  }))
                }
                placeholder="Non-Agri (optional)"
              />
              <FloatingInput
                label="Sort order"
                type="number"
                min="1"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    sortOrder: Number(e.target.value) || 1,
                  }))
                }
              />
            </div>

            <div className="ym-admin-row">
              <FloatingInput
                label="LTV label"
                value={form.ltvLabel}
                onChange={(e) =>
                  setForm((c) => ({ ...c, ltvLabel: e.target.value }))
                }
              />
              <FloatingInput
                label="Tenure (months)"
                type="number"
                min="1"
                value={form.tenureMonths}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    tenureMonths: Number(e.target.value) || 12,
                  }))
                }
              />
            </div>

            <div className="ym-admin-row">
              <FloatingInput
                label="Annual rate (%)"
                type="number"
                step="0.001"
                value={form.annualRatePercent || ""}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    annualRatePercent: Number(e.target.value) || 0,
                  }))
                }
                required
              />
              <FloatingInput
                label="Monthly rate (%)"
                type="number"
                step="0.001"
                value={form.monthlyRatePercent || ""}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    monthlyRatePercent: Number(e.target.value) || 0,
                  }))
                }
                required
              />
            </div>

            <fieldset className="ym-admin-fieldset">
              <legend className="ym-admin-label">Interest tiers</legend>
              {form.interestTiers.map((tier, index) => (
                <div key={index} className="ym-admin-tier-row ym-admin-tier-row--fields">
                  <FloatingInput
                    label="From day"
                    type="number"
                    min="0"
                    value={tier.daysFrom}
                    onChange={(e) =>
                      updateTier(index, {
                        daysFrom: Number(e.target.value) || 0,
                      })
                    }
                  />
                  <FloatingInput
                    label="To day"
                    type="number"
                    min="0"
                    value={tier.daysTo}
                    onChange={(e) =>
                      updateTier(index, { daysTo: Number(e.target.value) || 0 })
                    }
                  />
                  <FloatingInput
                    label="% / month"
                    type="number"
                    step="0.001"
                    value={tier.monthlyRatePercent}
                    onChange={(e) =>
                      updateTier(index, {
                        monthlyRatePercent: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              ))}
              <button
                type="button"
                className="ym-admin-btn ym-admin-btn--ghost"
                onClick={() =>
                  setForm((c) => ({
                    ...c,
                    interestTiers: [
                      ...c.interestTiers,
                      { daysFrom: 0, daysTo: 30, monthlyRatePercent: 1.5 },
                    ],
                  }))
                }
              >
                + Add tier
              </button>
            </fieldset>

            <label className="ym-admin-check">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm((c) => ({ ...c, active: e.target.checked }))
                }
              />
              Active on website
            </label>

            <div className="ym-admin-actions">
              <button
                type="submit"
                className="ym-admin-btn ym-admin-btn--primary"
                disabled={saving}
              >
                {saving ? "Saving…" : editingId ? "Update plan" : "Create plan"}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="ym-admin-btn ym-admin-btn--ghost"
                  onClick={resetForm}
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="ym-admin-panel ym-admin-plans-live">
          <h2 className="ym-admin-heading">Live loan plans</h2>
          {livePlans.length === 0 ? (
            <p className="ym-admin-empty">No live plans yet.</p>
          ) : (
            <ul className="ym-admin-list">
              {livePlans.map((plan) => (
                <PlanListItem
                  key={plan.id}
                  plan={plan}
                  onEdit={() => startEdit(plan)}
                  onDelete={() => void handleDelete(plan.id)}
                />
              ))}
            </ul>
          )}
        </section>

        <section className="ym-admin-panel ym-admin-plans-disabled">
          <h2 className="ym-admin-heading">Disabled loan plans</h2>
          {disabledPlans.length === 0 ? (
            <p className="ym-admin-empty">No disabled plans.</p>
          ) : (
            <ul className="ym-admin-list">
              {disabledPlans.map((plan) => (
                <PlanListItem
                  key={plan.id}
                  plan={plan}
                  onEdit={() => startEdit(plan)}
                  onDelete={() => void handleDelete(plan.id)}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function PlanListItem({
  plan,
  onEdit,
  onDelete,
}: {
  plan: LoanPlan;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="ym-admin-list-item">
      <div>
        <p className="ym-admin-list-title">{plan.amountLabel}</p>
        <p className="ym-admin-list-meta">
          {plan.repaymentType === "bullet" ? "Bullet" : "Monthly"} ·{" "}
          {plan.annualRatePercent}% p.a. · {plan.tenureMonths}M
        </p>
      </div>
      <div className="ym-admin-list-actions">
        <button
          type="button"
          className="ym-admin-icon-btn"
          onClick={onEdit}
          aria-label={`Edit ${plan.amountLabel}`}
          title="Edit"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 20h4l10.5-10.5a2.12 2.12 0 0 0-3-3L5 17v3Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path
              d="M13.5 6.5l3 3"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <button
          type="button"
          className="ym-admin-icon-btn ym-admin-icon-btn--danger"
          onClick={onDelete}
          aria-label={`Delete ${plan.amountLabel}`}
          title="Delete"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 7h14M10 7V5h4v2M8 7l1 12h6l1-12"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </li>
  );
}
