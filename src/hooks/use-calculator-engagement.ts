"use client";

import { useCallback, useEffect, useRef } from "react";
import type { GoldKarat } from "@/lib/gold-price-format";
import { sendEngagementEvent } from "@/lib/engagement-collect-client";

const DEBOUNCE_MS = 800;
const DUPLICATE_WINDOW_MS = 2500;

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
  const lastSentRef = useRef<{ key: string; at: number } | null>(null);
  const weightInputRef = useRef(weightInput);
  const weightGramsRef = useRef(weightGrams);
  const karatRef = useRef(karat);

  loanAmountRef.current = loanAmountInr;
  weightInputRef.current = weightInput;
  weightGramsRef.current = weightGrams;
  karatRef.current = karat;

  const recordWeightEntry = useCallback((force = false) => {
    const trimmed = weightInputRef.current.trim();
    const grams = weightGramsRef.current;
    const purity = karatRef.current;
    if (!trimmed || grams <= 0) return;

    const key = `${trimmed}|${purity}`;
    const now = Date.now();
    if (
      !force &&
      lastSentRef.current?.key === key &&
      now - lastSentRef.current.at < DUPLICATE_WINDOW_MS
    ) {
      return;
    }

    lastSentRef.current = { key, at: now };
    sendEngagementEvent({
      type: "calculator_entry",
      weightEntered: trimmed,
      weightGrams: grams,
      karat: purity,
      loanAmountInr: loanAmountRef.current,
    });
  }, []);

  useEffect(() => {
    if (weightGrams <= 0) return undefined;

    const timer = window.setTimeout(() => {
      recordWeightEntry();
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [weightInput, karat, weightGrams, recordWeightEntry]);

  useEffect(() => {
    const onHide = () => recordWeightEntry(true);
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
