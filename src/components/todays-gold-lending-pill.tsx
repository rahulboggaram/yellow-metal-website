"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { GoldPriceSnapshot } from "@/lib/gold-price-format";
import {
  formatInr,
  isGoldPriceSnapshot,
} from "@/lib/gold-price-format";
import { getMsUntilNextMidnightIst } from "@/lib/spot-schedule";
import {
  FlipClockAmount,
  FlipClockPlaceholder,
} from "@/components/flip-clock-amount";

export function TodaysGoldLendingPill({ className }: { className?: string }) {
  const pathname = usePathname();
  const [price, setPrice] = useState<GoldPriceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [flipKey, setFlipKey] = useState(0);

  useEffect(() => {
    setFlipKey((key) => key + 1);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    let refreshTimer: number | undefined;

    async function load() {
      try {
        const res = await fetch("/api/gold-price");
        if (!res.ok) throw new Error("fetch failed");
        const data: unknown = await res.json();
        if (!isGoldPriceSnapshot(data)) throw new Error("invalid payload");
        if (!cancelled) {
          setPrice(data);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    function scheduleNextRefresh() {
      refreshTimer = window.setTimeout(() => {
        void load().finally(() => {
          if (!cancelled) scheduleNextRefresh();
        });
      }, getMsUntilNextMidnightIst());
    }

    void load();
    scheduleNextRefresh();

    return () => {
      cancelled = true;
      if (refreshTimer !== undefined) {
        window.clearTimeout(refreshTimer);
      }
    };
  }, []);

  const loanAmount = useMemo(() => {
    if (!price) return null;
    return price.loanPerGramInr;
  }, [price]);

  const amountText = useMemo(() => {
    if (loading || error || loanAmount === null) return "Loading…";
    return `${formatInr(loanAmount)}/g`;
  }, [error, loading, loanAmount]);

  const showFlip = loanAmount !== null && !error;

  return (
    <div
      className={["ym-todays-pill-wrap", className].filter(Boolean).join(" ")}
      role="region"
      aria-label="Today&apos;s gold lending rate"
      aria-live="polite"
    >
      <div className="ym-todays-pill">
        <div className="ym-todays-pill-value">
          {showFlip ? (
            <FlipClockAmount amount={loanAmount} flipKey={flipKey} />
          ) : (
            <FlipClockPlaceholder />
          )}
          <span className="ym-sr-only">{amountText}</span>
        </div>
      </div>
    </div>
  );
}
