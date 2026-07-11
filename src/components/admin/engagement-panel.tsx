"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DateRangeFilter } from "@/components/admin/date-range-filter";
import { StatCard } from "@/components/admin/stat-card";
import {
  buildAdminDateQuery,
  formatAdminDate,
  formatAdminDateTime,
  last30DaysRange,
} from "@/lib/admin-session";
import type { CalculatorEntryEvent, EngagementSummary } from "@/lib/engagement-types";
import { formatInr } from "@/lib/gold-price-format";

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

function formatEntryRegion(entry: CalculatorEntryEvent): string {
  const city = entry.city?.trim();
  const region = entry.region?.trim();
  const country = entry.country?.trim() || "Unknown";

  if (city && region) return `${city}, ${region}`;
  if (city) return `${city}, ${country}`;
  if (region) return `${region}, ${country}`;
  if (country !== "Unknown") return country;
  return "—";
}

export function EngagementAdminPanel({ secret }: { secret: string }) {
  const initialRange = useMemo(() => last30DaysRange(), []);
  const [month, setMonth] = useState("last30");
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [summary, setSummary] = useState<EngagementSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
      const params = buildAdminDateQuery(month, from, to);
      const query = params.toString();
      const res = await fetch(`/api/engagement${query ? `?${query}` : ""}`, {
        headers,
      });
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
          onClick={() => void loadSummary()}
          disabled={!secret || loading}
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {message && (
        <p className="ym-admin-message ym-admin-message--error">{message}</p>
      )}

      {summary && (
        <>
          <section className="ym-admin-panel">
            <div className="ym-admin-section-head">
              <h2 className="ym-admin-heading">Lending rate flip clock</h2>
              <p className="ym-admin-section-lead">
                People who paused on the home page flip clock to check today&apos;s
                lending rate (at least 1 second in view).
              </p>
            </div>
            <div className="ym-admin-stats">
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
            <div className="ym-admin-section-block">
              <h3 className="ym-admin-subheading">Stops by day</h3>
              {summary.lendingRate.byDay.length === 0 ? (
                <p className="ym-admin-empty">No lending rate stops recorded yet.</p>
              ) : (
                <div className="ym-admin-table-wrap">
                  <table className="ym-admin-table">
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
                          <td>{formatAdminDate(row.date)}</td>
                          <td>{row.stops.toLocaleString("en-IN")}</td>
                          <td>{row.visitors.toLocaleString("en-IN")}</td>
                          <td>{formatDuration(row.avgDurationSeconds)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section className="ym-admin-panel">
            <div className="ym-admin-section-head">
              <h2 className="ym-admin-heading">Loan estimate calculator</h2>
              <p className="ym-admin-section-lead">
                Exact gold weights people typed in the loan estimate field on the
                home page.
              </p>
            </div>
            <div className="ym-admin-stats">
              <StatCard
                label="People who used calculator"
                value={summary.calculator.uniqueVisitors}
              />
              <StatCard
                label="Total entries saved"
                value={summary.calculator.totalEntries}
              />
            </div>
            <div className="ym-admin-section-block">
              <h3 className="ym-admin-subheading">Recent entries</h3>
              {summary.calculator.recentEntries.length === 0 ? (
                <p className="ym-admin-empty">
                  No entries yet. On the home page, type a weight like 23 or 45 in
                  the loan estimate field, then tap away from the field.
                </p>
              ) : (
                <div className="ym-admin-table-wrap">
                  <table className="ym-admin-table ym-admin-table--wide">
                    <thead>
                      <tr>
                        <th>When</th>
                        <th>Gold weight</th>
                        <th>Purity</th>
                        <th>Estimated loan</th>
                        <th>Region</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.calculator.recentEntries.map((entry) => (
                        <tr key={entry.id}>
                          <td>{formatAdminDateTime(entry.timestamp)}</td>
                          <td>{formatWeightEntered(entry)}</td>
                          <td>{entry.karat}</td>
                          <td>
                            {entry.loanAmountInr === null
                              ? "—"
                              : formatInr(entry.loanAmountInr)}
                          </td>
                          <td>{formatEntryRegion(entry)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="ym-admin-section-block">
              <h3 className="ym-admin-subheading">Entries by day</h3>
              {summary.calculator.byDay.length === 0 ? (
                <p className="ym-admin-empty">No calculator entries recorded yet.</p>
              ) : (
                <div className="ym-admin-table-wrap">
                  <table className="ym-admin-table">
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
                          <td>{formatAdminDate(row.date)}</td>
                          <td>{row.entries.toLocaleString("en-IN")}</td>
                          <td>{row.visitors.toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
