"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AnalyticsSummary } from "@/lib/analytics-types";

function monthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [
    { value: "", label: "All time" },
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

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="ym-analytics-stat">
      <p className="ym-analytics-stat-label">{label}</p>
      <p className="ym-analytics-stat-value">{value}</p>
    </div>
  );
}

function DataTable({
  title,
  rows,
  emptyLabel,
}: {
  title: string;
  rows: { label: string; count: number }[];
  emptyLabel: string;
}) {
  return (
    <section className="ym-admin-panel ym-analytics-table-panel">
      <h2 className="ym-admin-heading">{title}</h2>
      {rows.length === 0 ? (
        <p className="ym-admin-empty">{emptyLabel}</p>
      ) : (
        <table className="ym-analytics-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Visits</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                <td>{row.count.toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export function AnalyticsAdminPanel({ secret }: { secret: string }) {
  const [month, setMonth] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const months = useMemo(() => monthOptions(), []);

  const headers = useMemo(
    () => ({
      "x-admin-secret": secret,
    }),
    [secret],
  );

  const loadAnalytics = useCallback(async () => {
    if (!secret) return;
    setLoading(true);
    setMessage(null);
    try {
      const params = new URLSearchParams();
      if (month) params.set("month", month);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const query = params.toString();
      const res = await fetch(`/api/analytics${query ? `?${query}` : ""}`, {
        headers,
      });
      if (!res.ok) throw new Error("Could not load analytics");
      const data: { summary?: AnalyticsSummary } = await res.json();
      setSummary(data.summary ?? null);
    } catch {
      setMessage("Could not load analytics. Check your admin secret.");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [from, headers, month, secret, to]);

  useEffect(() => {
    if (secret) void loadAnalytics();
  }, [secret, loadAnalytics]);

  function handleMonthChange(value: string) {
    setMonth(value);
    if (value) {
      setFrom("");
      setTo("");
    }
  }

  return (
    <>
      <div className="ym-admin-tab-toolbar">
        <button
          type="button"
          className="ym-admin-btn ym-admin-btn--primary"
          onClick={() => void loadAnalytics()}
          disabled={!secret || loading}
        >
          {loading ? "Loading…" : "Refresh analytics"}
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
                setMonth("");
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
                setMonth("");
              }}
            />
          </label>
        </div>
      </section>

      {message && <p className="ym-admin-message">{message}</p>}

        {summary && summary.totalViews === 0 && !message && (
          <p className="ym-admin-empty ym-admin-tab-hint">
            No visits recorded yet. Open the home page on your phone or laptop, then
            click Refresh analytics.
          </p>
        )}

        {summary && (
        <>
          <div className="ym-analytics-stats">
            <StatCard label="Total page views" value={summary.totalViews} />
            <StatCard label="Unique visitors" value={summary.uniqueVisitors} />
            <StatCard label="Mobile views" value={summary.mobileViews} />
            <StatCard label="Desktop views" value={summary.desktopViews} />
            <StatCard label="Tablet views" value={summary.tabletViews} />
          </div>

          <div className="ym-analytics-grid">
            <DataTable
              title="Top locations (country)"
              rows={summary.byCountry}
              emptyLabel="No location data yet."
            />
            <DataTable
              title="Top cities"
              rows={summary.byCity}
              emptyLabel="No city data yet."
            />
            <DataTable
              title="Browsers"
              rows={summary.byBrowser}
              emptyLabel="No browser data yet."
            />
            <DataTable
              title="Mobile phones & OS"
              rows={summary.byMobileDevice}
              emptyLabel="No mobile device data yet."
            />
            <DataTable
              title="Pages viewed"
              rows={summary.byPath}
              emptyLabel="No page data yet."
            />
            <section className="ym-admin-panel ym-analytics-table-panel">
              <h2 className="ym-admin-heading">Views by day</h2>
              {summary.byDay.length === 0 ? (
                <p className="ym-admin-empty">No daily data yet.</p>
              ) : (
                <table className="ym-analytics-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Views</th>
                      <th>Visitors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.byDay.map((row) => (
                      <tr key={row.date}>
                        <td>{row.date}</td>
                        <td>{row.views.toLocaleString("en-IN")}</td>
                        <td>{row.visitors.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}
