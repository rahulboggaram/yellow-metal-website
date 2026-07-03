"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { last30DaysRange } from "@/lib/admin-session";
import type { CalculatorEntryEvent, EngagementSummary } from "@/lib/engagement-types";
import { formatInr } from "@/lib/gold-price-format";

function monthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [
    { value: "last30", label: "Last 30 days" },
    { value: "all", label: "All time" },
    { value: "custom", label: "Custom range" },
  ];
  const now = new Date();
  for (let i = 0; i < 12; i += 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const value = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    options.push({ value, label });
  }
  return options;
}

function buildQueryParams(month: string, from: string, to: string): URLSearchParams {
  const params = new URLSearchParams();
  if (month === "last30") {
    const range = last30DaysRange();
    params.set("from", range.from);
    params.set("to", range.to);
  } else if (month && month !== "all" && month !== "custom") {
    params.set("month", month);
  } else if (from) {
    params.set("from", from);
    if (to) params.set("to", to);
  }
  return params;
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="ym-analytics-stat">
      <p className="ym-analytics-stat-label">{label}</p>
      <p className="ym-analytics-stat-value">{value}</p>
    </div>
  );
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder > 0 ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

function formatWeightEntered(entry: CalculatorEntryEvent): string {
  const raw = entry.weightEntered?.trim();
  if (raw) return `${raw} g`;
  return `${entry.weightGrams.toLocaleString("en-IN")} g`;
}

export function EngagementAdminPanel({ secret }: { secret: string }) {
  const initialRange = useMemo(() => last30DaysRange(), []);
  const [month, setMonth] = useState("last30");
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [summary, setSummary] = useState<EngagementSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const months = useMemo(() => monthOptions(), []);

  const headers = useMemo(
    () => ({
      "x-admin-secret": secret,
    }),
    [secret],
  );

  const loadSummary = useCallback(async () => {
    if (!secret) return;
    setLoading(true);
    setMessage(null);
    try {
      const params = buildQueryParams(month, from, to);
      const query = params.toString();
      const res = await fetch(`/api/engagement${query ? `?${query}` : ""}`, { headers });
      if (!res.ok) throw new Error("Could not load engagement");
      const data: { summary?: EngagementSummary } = await res.json();
      setSummary(data.summary ?? null);
    } catch {
      setMessage("Could not load engagement data. Check your admin secret.");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [from, headers, month, secret, to]);

  useEffect(() => {
    if (secret) void loadSummary();
  }, [secret, loadSummary]);

  function handleMonthChange(value: string) {
    if (value === "last30") {
      const range = last30DaysRange();
      setMonth("last30");
      setFrom(range.from);
      setTo(range.to);
      return;
    }
    if (value === "all") {
      setMonth("all");
      setFrom("");
      setTo("");
      return;
    }
    if (value === "custom") {
      setMonth("custom");
      return;
    }
    setMonth(value);
    setFrom("");
    setTo("");
  }

  return (
    <>
      <div className="ym-admin-tab-toolbar">
        <button
          type="button"
          className="ym-admin-btn ym-admin-btn--primary"
          onClick={() => void loadSummary()}
          disabled={!secret || loading}
        >
          {loading ? "Loading…" : "Refresh engagement"}
        </button>
      </div>

      <section className="ym-admin-panel ym-analytics-filters">
        <h2 className="ym-admin-heading">Filter by date</h2>
        <div className="ym-analytics-filter-grid">
          <label className="ym-admin-field">
            <span className="ym-admin-label">Month</span>
            <select
              className="ym-admin-input"
              value={month}
              onChange={(event) => handleMonthChange(event.target.value)}
            >
              {months.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="ym-admin-field">
            <span className="ym-admin-label">From date</span>
            <input
              className="ym-admin-input"
              type="date"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
                setMonth("custom");
              }}
            />
          </label>
          <label className="ym-admin-field">
            <span className="ym-admin-label">To date</span>
            <input
              className="ym-admin-input"
              type="date"
              value={to}
              onChange={(event) => {
                setTo(event.target.value);
                setMonth("custom");
              }}
            />
          </label>
        </div>
      </section>

      {message && <p className="ym-admin-message">{message}</p>}

      {summary && (
        <>
          <section className="ym-admin-panel ym-engagement-section">
            <h2 className="ym-admin-heading">Lending rate flip clock</h2>
            <p className="ym-admin-list-meta ym-engagement-section-lead">
              People who paused on the home page flip clock to check today&apos;s lending
              rate (at least 1 second in view).
            </p>
            <div className="ym-analytics-stats">
              <StatCard
                label="People who stopped"
                value={summary.lendingRate.uniqueVisitors}
              />
              <StatCard label="Total stops" value={summary.lendingRate.totalStops} />
              <StatCard
                label="Avg time spent"
                value={formatDuration(summary.lendingRate.avgDurationSeconds)}
              />
              <StatCard
                label="Total time spent"
                value={formatDuration(summary.lendingRate.totalDurationSeconds)}
              />
            </div>
            <section className="ym-analytics-table-panel">
              <h3 className="ym-admin-subheading">Stops by day</h3>
              {summary.lendingRate.byDay.length === 0 ? (
                <p className="ym-admin-empty">No lending rate stops recorded yet.</p>
              ) : (
                <table className="ym-analytics-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Stops</th>
                      <th>People</th>
                      <th>Avg time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.lendingRate.byDay.map((row) => (
                      <tr key={row.date}>
                        <td>{row.date}</td>
                        <td>{row.stops.toLocaleString("en-IN")}</td>
                        <td>{row.visitors.toLocaleString("en-IN")}</td>
                        <td>{formatDuration(row.avgDurationSeconds)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </section>

          <section className="ym-admin-panel ym-engagement-section">
            <h2 className="ym-admin-heading">Loan estimate calculator</h2>
            <p className="ym-admin-list-meta ym-engagement-section-lead">
              Exact gold weights people typed in the loan estimate field on the home page.
            </p>
            <div className="ym-analytics-stats">
              <StatCard
                label="People who used calculator"
                value={summary.calculator.uniqueVisitors}
              />
              <StatCard
                label="Total entries saved"
                value={summary.calculator.totalEntries}
              />
            </div>
            <section className="ym-analytics-table-panel">
              <h3 className="ym-admin-subheading">Recent entries</h3>
              {summary.calculator.recentEntries.length === 0 ? (
                <p className="ym-admin-empty">
                  No entries yet. On the home page, type a weight like 23 or 45 in the
                  loan estimate field, then tap away from the field.
                </p>
              ) : (
                <table className="ym-analytics-table ym-engagement-entries-table">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Gold weight entered</th>
                      <th>Purity</th>
                      <th>Estimated loan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.calculator.recentEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{formatTimestamp(entry.timestamp)}</td>
                        <td>{formatWeightEntered(entry)}</td>
                        <td>{entry.karat}</td>
                        <td>
                          {entry.loanAmountInr === null
                            ? "—"
                            : formatInr(entry.loanAmountInr)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
            <section className="ym-analytics-table-panel">
              <h3 className="ym-admin-subheading">Entries by day</h3>
              {summary.calculator.byDay.length === 0 ? (
                <p className="ym-admin-empty">No calculator entries recorded yet.</p>
              ) : (
                <table className="ym-analytics-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Entries</th>
                      <th>People</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.calculator.byDay.map((row) => (
                      <tr key={row.date}>
                        <td>{row.date}</td>
                        <td>{row.entries.toLocaleString("en-IN")}</td>
                        <td>{row.visitors.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </section>
        </>
      )}
    </>
  );
}
