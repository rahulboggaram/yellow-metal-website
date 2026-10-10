"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DateRangeFilter } from "@/components/admin/date-range-filter";
import { StatCard } from "@/components/admin/stat-card";
import { buildAdminDateQuery, formatAdminDate } from "@/lib/admin-session";
import type { GoldRateHistory, SeenGoldRateDay } from "@/lib/gold-rate-history-types";
import { formatInr } from "@/lib/gold-price-format";

function formatSignedInr(delta: number): string {
  if (delta === 0) return "₹0";
  const sign = delta > 0 ? "+" : "−";
  return `${sign}${formatInr(Math.abs(delta))}`;
}

function changeClass(delta: number | null): string {
  if (delta === null || delta === 0) return "ym-admin-rate-flat";
  return delta > 0 ? "ym-admin-rate-up" : "ym-admin-rate-down";
}

function RateSparkline({ rows }: { rows: SeenGoldRateDay[] }) {
  const values = rows.map((row) => row.loanPerGramInr);
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const width = 100;
  const height = 36;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / span) * (height - 4) - 2;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      className="ym-admin-spark"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Lending rate from the first day in this list to the latest day"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}

export function GoldRatesAdminPanel() {
  const [month, setMonth] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [history, setHistory] = useState<GoldRateHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const params = buildAdminDateQuery(month, from, to);
      const query = params.toString();
      const res = await fetch(`/api/gold-rates${query ? `?${query}` : ""}`);
      if (res.status === 401) {
        throw new Error("Your session expired. Sign in again.");
      }
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not load gold rates");
      }
      const data: GoldRateHistory = await res.json();
      setHistory(data);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not load gold rates.",
      );
      setHistory(null);
    } finally {
      setLoading(false);
    }
  }, [from, month, to]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const newestFirst = useMemo(
    () => (history ? [...history.rows].reverse() : []),
    [history],
  );

  const stats = useMemo(() => {
    if (!history || history.rows.length === 0) return null;
    const rows = history.rows;
    const latest = rows[rows.length - 1];
    const first = rows[0];
    const loans = rows.map((row) => row.loanPerGramInr);
    return {
      days: rows.length,
      latest,
      first,
      high: Math.max(...loans),
      low: Math.min(...loans),
      change: latest.loanPerGramInr - first.loanPerGramInr,
    };
  }, [history]);

  const coversLaunch = history?.from === history?.inception;

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
          onClick={() => void loadHistory()}
          disabled={loading}
        >
          {loading ? "Updating…" : "Update"}
        </button>
      </div>

      {message && (
        <p className="ym-admin-message ym-admin-message--error">{message}</p>
      )}

      {history && (
        <section className="ym-admin-panel">
          <div className="ym-admin-section-head">
            <h2 className="ym-admin-heading">Rates visitors saw</h2>
            <p className="ym-admin-section-lead">
              The 24K gold price per gram for each day, next to the lending
              rate the homepage showed.
              A 5:30 PM close appears on the site from the next midnight,
              and stays up through the weekend.
            </p>
            <p className="ym-admin-section-lead ym-admin-section-lead--follow">
              The website went live on {formatAdminDate(history.inception)}.
              {history.firstShownOn
                ? ` This feed’s first rate is ${formatAdminDate(history.firstShownOn)}.`
                : " This feed does not have a rate for that period yet."}
              {history.rows.length > 0
                ? ` Showing ${formatAdminDate(history.from)} to ${formatAdminDate(history.to)}.`
                : ""}
            </p>
          </div>

          {stats ? (
            <>
              <div className="ym-admin-stats">
                <StatCard label="Days shown" value={stats.days} />
                <StatCard
                  label="Latest lending rate"
                  value={`${formatInr(stats.latest.loanPerGramInr)}/g`}
                  info="This is the amount on the homepage flip clock: 1 gram at 75% of the 22K price."
                />
                <StatCard
                  label="Latest 24K gold"
                  value={`${formatInr(stats.latest.rate24kPerGramInr)}/g`}
                  info="The pure gold price per gram from that day’s 5:30 PM close."
                />
                <StatCard
                  label="Highest lending rate"
                  value={`${formatInr(stats.high)}/g`}
                />
                <StatCard
                  label="Lowest lending rate"
                  value={`${formatInr(stats.low)}/g`}
                />
                <StatCard
                  label={
                    coversLaunch && stats.first.shownOn === history.inception
                      ? "Change since launch"
                      : coversLaunch
                        ? "Change since first rate"
                        : "Change in this period"
                  }
                  value={formatSignedInr(stats.change)}
                  info={`From ${formatAdminDate(stats.first.shownOn)} to ${formatAdminDate(stats.latest.shownOn)}.`}
                />
              </div>
              <RateSparkline rows={history.rows} />
            </>
          ) : (
            <p className="ym-admin-empty">
              No gold rate was on the site in this period.
            </p>
          )}

          {newestFirst.length > 0 && (
            <div className="ym-admin-section-block">
              <h3 className="ym-admin-subheading">Day by day</h3>
              <div className="ym-admin-table-wrap">
                <table className="ym-admin-table ym-admin-table--rates">
                  <thead>
                    <tr>
                      <th>Date on the site</th>
                      <th>24K gold / g</th>
                      <th>Lending rate / g</th>
                      <th>Change</th>
                      <th>Price from</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newestFirst.map((row) => (
                      <tr key={row.shownOn}>
                        <td>{formatAdminDate(row.shownOn)}</td>
                        <td>{formatInr(row.rate24kPerGramInr)}</td>
                        <td>{formatInr(row.loanPerGramInr)}</td>
                        <td className={changeClass(row.changeInr)}>
                          {row.changeInr === null ? "—" : formatSignedInr(row.changeInr)}
                        </td>
                        <td>{formatAdminDate(row.spotSession)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
