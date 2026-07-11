"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

export function LoanPlansAdminPanel({ secret }: { secret: string }) {
  const [plans, setPlans] = useState<LoanPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LoanPlanInput>(EMPTY_PLAN);

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      "x-admin-secret": secret,
    }),
    [secret],
  );

  const loadPlans = useCallback(async () => {
    if (!secret) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/loan-plans?all=1", { headers });
      if (!res.ok) throw new Error("Could not load plans");
      const data: { plans?: LoanPlan[] } = await res.json();
      setPlans(data.plans ?? []);
    } catch {
      setMessage("Could not load plans. Check your admin secret.");
    } finally {
      setLoading(false);
    }
  }, [headers, secret]);

  useEffect(() => {
    if (secret) void loadPlans();
  }, [secret, loadPlans]);

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
    if (!secret) {
      setMessage("Enter the admin secret first.");
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const url = editingId ? `/api/loan-plans/${editingId}` : "/api/loan-plans";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(form),
      });
      const data: { error?: string } = await res.json();
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
    if (!secret || !window.confirm("Delete this loan plan?")) return;

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/loan-plans/${id}`, {
        method: "DELETE",
        headers,
      });
      const data: { error?: string } = await res.json();
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

  return (
    <div className="ym-admin-stack">
      <div className="ym-admin-toolbar ym-admin-toolbar--end">
        <button
          type="button"
          className="ym-admin-btn"
          onClick={() => void loadPlans()}
          disabled={!secret || loading}
        >
          {loading ? "Loading…" : "Reload plans"}
        </button>
      </div>

      {message && <p className="ym-admin-message">{message}</p>}

      <div className="ym-admin-split">
        <section className="ym-admin-panel">
          <h2 className="ym-admin-heading">
            {editingId ? "Edit plan" : "Add plan"}
          </h2>
          <form className="ym-admin-form" onSubmit={handleSubmit}>
            <label className="ym-admin-field">
              <span className="ym-admin-label">Amount label</span>
              <input
                className="ym-admin-input"
                value={form.amountLabel}
                onChange={(e) =>
                  setForm((c) => ({ ...c, amountLabel: e.target.value }))
                }
                placeholder="₹20,000 – ₹49,999"
                required
              />
            </label>

            <div className="ym-admin-row">
              <label className="ym-admin-field">
                <span className="ym-admin-label">Min amount (₹)</span>
                <input
                  className="ym-admin-input"
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
              </label>
              <label className="ym-admin-field">
                <span className="ym-admin-label">Max amount (₹)</span>
                <input
                  className="ym-admin-input"
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
              </label>
            </div>

            <div className="ym-admin-row">
              <label className="ym-admin-field">
                <span className="ym-admin-label">Repayment type</span>
                <select
                  className="ym-admin-input"
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
                </select>
              </label>
              <label className="ym-admin-field">
                <span className="ym-admin-label">Category</span>
                <input
                  className="ym-admin-input"
                  value={form.category ?? ""}
                  onChange={(e) =>
                    setForm((c) => ({
                      ...c,
                      category: e.target.value.trim() || null,
                    }))
                  }
                  placeholder="Non-Agri (optional)"
                />
              </label>
              <label className="ym-admin-field">
                <span className="ym-admin-label">Sort order</span>
                <input
                  className="ym-admin-input"
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
              </label>
            </div>

            <div className="ym-admin-row">
              <label className="ym-admin-field">
                <span className="ym-admin-label">LTV label</span>
                <input
                  className="ym-admin-input"
                  value={form.ltvLabel}
                  onChange={(e) =>
                    setForm((c) => ({ ...c, ltvLabel: e.target.value }))
                  }
                />
              </label>
              <label className="ym-admin-field">
                <span className="ym-admin-label">Tenure (months)</span>
                <input
                  className="ym-admin-input"
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
              </label>
            </div>

            <div className="ym-admin-row">
              <label className="ym-admin-field">
                <span className="ym-admin-label">Annual rate (%)</span>
                <input
                  className="ym-admin-input"
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
              </label>
              <label className="ym-admin-field">
                <span className="ym-admin-label">Monthly rate (%)</span>
                <input
                  className="ym-admin-input"
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
              </label>
            </div>

            <fieldset className="ym-admin-fieldset">
              <legend className="ym-admin-label">Interest tiers</legend>
              {form.interestTiers.map((tier, index) => (
                <div key={index} className="ym-admin-tier-row">
                  <input
                    className="ym-admin-input"
                    type="number"
                    min="0"
                    value={tier.daysFrom}
                    onChange={(e) =>
                      updateTier(index, {
                        daysFrom: Number(e.target.value) || 0,
                      })
                    }
                    aria-label={`Tier ${index + 1} from days`}
                  />
                  <span>to</span>
                  <input
                    className="ym-admin-input"
                    type="number"
                    min="0"
                    value={tier.daysTo}
                    onChange={(e) =>
                      updateTier(index, { daysTo: Number(e.target.value) || 0 })
                    }
                    aria-label={`Tier ${index + 1} to days`}
                  />
                  <span>days @</span>
                  <input
                    className="ym-admin-input"
                    type="number"
                    step="0.001"
                    value={tier.monthlyRatePercent}
                    onChange={(e) =>
                      updateTier(index, {
                        monthlyRatePercent: Number(e.target.value) || 0,
                      })
                    }
                    aria-label={`Tier ${index + 1} monthly rate`}
                  />
                  <span>%/mo</span>
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

        <section className="ym-admin-panel">
          <h2 className="ym-admin-heading">Existing plans</h2>
          {plans.length === 0 ? (
            <p className="ym-admin-empty">No plans loaded yet.</p>
          ) : (
            <ul className="ym-admin-list">
              {plans.map((plan) => (
                <li key={plan.id} className="ym-admin-list-item">
                  <div>
                    <div className="ym-admin-list-title-row">
                      <p className="ym-admin-list-title">{plan.amountLabel}</p>
                      <span
                        className={`ym-admin-pill${plan.active ? " is-active" : ""}`}
                      >
                        {plan.active ? "Live" : "Hidden"}
                      </span>
                    </div>
                    <p className="ym-admin-list-meta">
                      {plan.repaymentType === "bullet" ? "Bullet" : "Monthly"} ·{" "}
                      {plan.annualRatePercent}% p.a. · {plan.tenureMonths}M
                    </p>
                  </div>
                  <div className="ym-admin-list-actions">
                    <button
                      type="button"
                      className="ym-admin-btn ym-admin-btn--ghost"
                      onClick={() => startEdit(plan)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="ym-admin-btn ym-admin-btn--danger"
                      onClick={() => void handleDelete(plan.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
