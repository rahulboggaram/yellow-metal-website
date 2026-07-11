"use client";

import { useMemo } from "react";
import { FloatingInput, FloatingSelect } from "@/components/ui/floating-field";
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
      <FloatingSelect
        label="Period"
        value={month}
        onChange={(event) => handleMonthChange(event.target.value)}
      >
        {months.map((option) => (
          <option key={option.value || "all"} value={option.value}>
            {option.label}
          </option>
        ))}
      </FloatingSelect>
      <FloatingInput
        label="From"
        type="date"
        value={from}
        onChange={(event) => {
          onFromChange(event.target.value);
          onMonthChange("custom");
        }}
      />
      <FloatingInput
        label="To"
        type="date"
        value={to}
        onChange={(event) => {
          onToChange(event.target.value);
          onMonthChange("custom");
        }}
      />
    </div>
  );
}
