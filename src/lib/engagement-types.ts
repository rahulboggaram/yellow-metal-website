import type { GoldKarat } from "@/lib/gold-price-format";

export type EngagementQuery = {
  from?: string;
  to?: string;
  month?: string;
};

export type LendingRateStopEvent = {
  id: string;
  type: "lending_rate_stop";
  timestamp: string;
  sessionId: string;
  path: string;
  durationMs: number;
};

export type CalculatorEntryEvent = {
  id: string;
  type: "calculator_entry";
  timestamp: string;
  sessionId: string;
  path: string;
  /** Exact text typed in the weight field (e.g. "23", "45"). */
  weightEntered?: string;
  weightGrams: number;
  karat: GoldKarat;
  loanAmountInr: number | null;
};

export type EngagementEvent = LendingRateStopEvent | CalculatorEntryEvent;

export type LendingRateStopInput = {
  type: "lending_rate_stop";
  sessionId: string;
  path: string;
  durationMs: number;
};

export type CalculatorEntryInput = {
  type: "calculator_entry";
  sessionId: string;
  path: string;
  weightEntered: string;
  weightGrams: number;
  karat: GoldKarat;
  loanAmountInr: number | null;
};

export type EngagementCollectInput = LendingRateStopInput | CalculatorEntryInput;

export type EngagementSummary = {
  lendingRate: {
    uniqueVisitors: number;
    totalStops: number;
    avgDurationSeconds: number;
    totalDurationSeconds: number;
    byDay: {
      date: string;
      stops: number;
      visitors: number;
      avgDurationSeconds: number;
    }[];
  };
  calculator: {
    uniqueVisitors: number;
    totalEntries: number;
    byDay: { date: string; entries: number; visitors: number }[];
    recentEntries: CalculatorEntryEvent[];
  };
};
