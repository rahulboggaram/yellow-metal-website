"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DateRangeFilter } from "@/components/admin/date-range-filter";
import { StatCard } from "@/components/admin/stat-card";
import { buildAdminDateQuery, formatAdminDate, last30DaysRange } from "@/lib/admin-session";
import type { AnalyticsSummary } from "@/lib/analytics-types";

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
    <section className="ym-admin-panel">
      <h2 className="ym-admin-heading">{title}</h2>
      {rows.length === 0 ? (
        <p className="ym-admin-empty">{emptyLabel}</p>
      ) : (
        <div className="ym-admin-table-wrap">
          <table className="ym-admin-table">
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
        </div>
      )}
    </section>
  );
}

export function AnalyticsAdminPanel({ secret }: { secret: string }) {
  const initialRange = useMemo(() => last30DaysRange(), []);
  const [month, setMonth] = useState("last30");
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
      const params = buildAdminDateQuery(month, from, to);
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

  return (
    <div className="ym-admin-stack">
      <div className="ym-admin-toolbar">
        <DateRangeFilter
          month={month}
          from={from}
          to={to}
          onMonthChange={setMonth}
          onFromChange={setFrom}
          onToChange={setTo}
        />
        <button
          type="button"
          className="ym-admin-btn ym-admin-btn--primary"
          onClick={() => void loadAnalytics()}
          disabled={!secret || loading}
        >
          {loading ? "Updating…" : "Update"}
        </button>
      </div>

      {message && (
        <p className="ym-admin-message ym-admin-message--error">{message}</p>
      )}

      {summary && summary.totalViews === 0 && !message && (
        <p className="ym-admin-empty-banner">
          No visits recorded yet. Open the home page on your phone or laptop,
          then click Update.
        </p>
      )}

      {summary && (
        <>
          <div className="ym-admin-stats">
            <StatCard label="Total page views" value={summary.totalViews} />
            <StatCard label="Unique visitors" value={summary.uniqueVisitors} />
            <StatCard label="Mobile views" value={summary.mobileViews} />
            <StatCard label="Desktop views" value={summary.desktopViews} />
            <StatCard label="Tablet views" value={summary.tabletViews} />
          </div>

          <div className="ym-admin-grid">
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
            <section className="ym-admin-panel">
              <h2 className="ym-admin-heading">Views by day</h2>
              {summary.byDay.length === 0 ? (
                <p className="ym-admin-empty">No daily data yet.</p>
              ) : (
                <div className="ym-admin-table-wrap">
                  <table className="ym-admin-table">
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
                          <td>{formatAdminDate(row.date)}</td>
                          <td>{row.views.toLocaleString("en-IN")}</td>
                          <td>{row.visitors.toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
