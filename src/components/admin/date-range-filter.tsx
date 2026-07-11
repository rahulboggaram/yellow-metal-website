"use client";

import { useMemo } from "react";
import { last30DaysRange, monthFilterOptions } from "@/lib/admin-session";

type Props = {
  month: string;
  from: string;
  to: string;
  onMonthChange: (value: string) => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
};

export function DateRangeFilter({
  month,
  from,
  to,
  onMonthChange,
  onFromChange,
  onToChange,
}: Props) {
  const months = useMemo(() => monthFilterOptions(), []);

  function handleMonthChange(value: string) {
    if (value === "last30") {
      const range = last30DaysRange();
      onMonthChange("last30");
      onFromChange(range.from);
      onToChange(range.to);
      return;
    }
    if (value === "all") {
      onMonthChange("all");
      onFromChange("");
      onToChange("");
      return;
    }
    if (value === "custom") {
      onMonthChange("custom");
      return;
    }
    onMonthChange(value);
    onFromChange("");
    onToChange("");
  }

  return (
    <div className="ym-admin-filters-grid" aria-label="Date filter">
      <label className="ym-admin-field">
        <span className="ym-admin-label">Period</span>
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
        <span className="ym-admin-label">From</span>
        <input
          className="ym-admin-input"
          type="date"
          value={from}
          onChange={(event) => {
            onFromChange(event.target.value);
            onMonthChange("custom");
          }}
        />
      </label>
      <label className="ym-admin-field">
        <span className="ym-admin-label">To</span>
        <input
          className="ym-admin-input"
          type="date"
          value={to}
          onChange={(event) => {
            onToChange(event.target.value);
            onMonthChange("custom");
          }}
        />
      </label>
    </div>
  );
}
