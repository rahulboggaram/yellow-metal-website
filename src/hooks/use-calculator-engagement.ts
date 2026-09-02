"use client";

import { useCallback, useEffect, useRef } from "react";
import type { GoldKarat } from "@/lib/gold-price-format";
import { sendEngagementEvent } from "@/lib/engagement-collect-client";

type CalculatorEngagementOptions = {
  weightInput: string;
  weightGrams: number;
  karat: GoldKarat;
  loanAmountInr: number | null;
};

export function useCalculatorEngagement({
  weightInput,
  weightGrams,
  karat,
  loanAmountInr,
}: CalculatorEngagementOptions) {
  const loanAmountRef = useRef(loanAmountInr);
  const lastSentRef = useRef<string | null>(null);
  const weightInputRef = useRef(weightInput);
  const weightGramsRef = useRef(weightGrams);
  const karatRef = useRef(karat);

  loanAmountRef.current = loanAmountInr;
  weightInputRef.current = weightInput;
  weightGramsRef.current = weightGrams;
  karatRef.current = karat;

  const recordWeightEntry = useCallback(() => {
    const trimmed = weightInputRef.current.trim();
    const grams = weightGramsRef.current;
    const purity = karatRef.current;
    if (!trimmed || grams <= 0) return;

    const key = `${trimmed}|${purity}|${loanAmountRef.current ?? ""}`;
    if (lastSentRef.current === key) return;
    lastSentRef.current = key;

    sendEngagementEvent({
      type: "calculator_entry",
      weightEntered: trimmed,
      weightGrams: grams,
      karat: purity,
      loanAmountInr: loanAmountRef.current,
    });
  }, []);

  useEffect(() => {
    const onHide = () => recordWeightEntry();
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") onHide();
    };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [recordWeightEntry]);

  return { recordWeightEntry };
}
