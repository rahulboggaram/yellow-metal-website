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

type PendingCalculatorEntry = {
  weightEntered: string;
  weightGrams: number;
  karat: GoldKarat;
};

export function useCalculatorEngagement({
  weightInput,
  weightGrams,
  karat,
  loanAmountInr,
}: CalculatorEngagementOptions) {
  const loanAmountRef = useRef(loanAmountInr);
  const lastSentRef = useRef<string | null>(null);
  const pendingEntryRef = useRef<PendingCalculatorEntry | null>(null);
  const weightInputRef = useRef(weightInput);
  const weightGramsRef = useRef(weightGrams);
  const karatRef = useRef(karat);

  loanAmountRef.current = loanAmountInr;
  weightInputRef.current = weightInput;
  weightGramsRef.current = weightGrams;
  karatRef.current = karat;

  const sendEntry = useCallback(
    (entry: PendingCalculatorEntry, amountInr: number) => {
      const key = `${entry.weightEntered}|${entry.karat}|${amountInr}`;
      if (lastSentRef.current === key) return;
      lastSentRef.current = key;

      sendEngagementEvent({
        type: "calculator_entry",
        weightEntered: entry.weightEntered,
        weightGrams: entry.weightGrams,
        karat: entry.karat,
        loanAmountInr: amountInr,
      });
    },
    [],
  );

  const currentEntry = useCallback((): PendingCalculatorEntry | null => {
    const trimmed = weightInputRef.current.trim();
    const grams = weightGramsRef.current;
    if (!trimmed || grams <= 0) return null;

    return {
      weightEntered: trimmed,
      weightGrams: grams,
      karat: karatRef.current,
    };
  }, []);

  const recordWeightEntry = useCallback(() => {
    const entry = currentEntry();
    if (!entry) {
      pendingEntryRef.current = null;
      return;
    }

    const amountInr = loanAmountRef.current;
    if (amountInr === null) {
      pendingEntryRef.current = entry;
      return;
    }

    pendingEntryRef.current = null;
    sendEntry(entry, amountInr);
  }, [currentEntry, sendEntry]);

  useEffect(() => {
    const pending = pendingEntryRef.current;
    if (!pending || loanAmountInr === null) return;

    const entry = currentEntry();
    const pendingStillCurrent =
      entry &&
      entry.weightEntered === pending.weightEntered &&
      entry.weightGrams === pending.weightGrams &&
      entry.karat === pending.karat;

    pendingEntryRef.current = null;
    if (pendingStillCurrent) sendEntry(pending, loanAmountInr);
  }, [currentEntry, karat, loanAmountInr, sendEntry, weightGrams, weightInput]);

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
