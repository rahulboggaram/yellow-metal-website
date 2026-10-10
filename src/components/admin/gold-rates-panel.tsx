"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminInfoTip } from "@/components/admin/admin-info-tip";
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

function GoldRateChart({ rows }: { rows: SeenGoldRateDay[] }) {
  if (rows.length < 2) return null;

  const values = rows.map((row) => row.rate24kPerGramInr);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const width = 1000;
  const height = 180;
  const padY = 10;
  const coords = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = padY + (1 - (value - min) / span) * (height - padY * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = coords.join(" ");
  const area = `0,${height} ${line} ${width},${height}`;
  const first = rows[0];
  const last = rows[rows.length - 1];
  const fromLabel = formatAdminDate(first.shownOn);
  const toLabel = formatAdminDate(last.shownOn);

  return (
    <figure className="ym-admin-chart">
      <figcaption>
        <p className="ym-admin-chart-title">24K gold price per gram</p>
        <p className="ym-admin-chart-caption">
          The price on the site each day. The top line is the highest price,
          and the bottom line is the lowest.
        </p>
      </figcaption>
      <div className="ym-admin-chart-body">
        <div className="ym-admin-chart-scale" aria-hidden>
          <span>{formatInr(max)}</span>
          <span>{formatInr(min)}</span>
        </div>
        <div>
          <svg
            className="ym-admin-chart-svg"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            role="img"
            aria-label={`24K gold price per gram from ${fromLabel} to ${toLabel}. Highest ${formatInr(max)}, lowest ${formatInr(min)}.`}
          >
            <line
              x1="0"
              y1={padY}
              x2={width}
              y2={padY}
              stroke="currentColor"
              strokeOpacity="0.12"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="0"
              y1={height - padY}
              x2={width}
              y2={height - padY}
              stroke="currentColor"
              strokeOpacity="0.12"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <polygon points={area} fill="currentColor" fillOpacity="0.06" />
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={line}
            />
          </svg>
          <div className="ym-admin-chart-axis" aria-hidden>
            <span>{fromLabel}</span>
            <span>{toLabel}</span>
          </div>
        </div>
      </div>
    </figure>
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
    return {
      latest: history.rows[history.rows.length - 1],
    };
  }, [history]);

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
            <div className="ym-admin-heading-row">
              <h2 className="ym-admin-heading">Gold rates</h2>
              <AdminInfoTip text="The 24K gold price per gram for each day, next to the lending rate the homepage showed. A 5:30 PM close appears on the site from the next midnight, and stays up through the weekend." />
            </div>
          </div>

          {stats ? (
            <>
              <div className="ym-admin-stats">
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
              </div>
              <GoldRateChart rows={history.rows} />
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
                      <th>Date</th>
                      <th>24K gold / g</th>
                      <th>Lending rate / g</th>
                      <th>Change</th>
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
