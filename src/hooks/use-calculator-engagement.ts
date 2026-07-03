"use client";

import { useEffect, useRef } from "react";
import type { GoldKarat } from "@/lib/gold-price-format";
import { sendEngagementEvent } from "@/lib/engagement-collect-client";

const DEBOUNCE_MS = 2000;

export function useCalculatorEngagement(
  weightGrams: number,
  karat: GoldKarat,
  loanAmountInr: number | null,
) {
  const lastSentRef = useRef("");

  useEffect(() => {
    if (weightGrams <= 0) return undefined;

    const timer = window.setTimeout(() => {
      const key = `${weightGrams}|${karat}|${loanAmountInr ?? "null"}`;
      if (key === lastSentRef.current) return;
      lastSentRef.current = key;
      sendEngagementEvent({
        type: "calculator_entry",
        weightGrams,
        karat,
        loanAmountInr,
      });
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [weightGrams, karat, loanAmountInr]);
}
