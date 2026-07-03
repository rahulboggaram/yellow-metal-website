"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FlipClockAmount,
  FlipClockPlaceholder,
} from "@/components/flip-clock-amount";
import type { GoldKarat, GoldPriceSnapshot } from "@/lib/gold-price-format";
import {
  formatInr,
  isGoldPriceSnapshot,
  loanAmountFromWeightGrams,
} from "@/lib/gold-price-format";
import { useLendingRateEngagement } from "@/hooks/use-lending-rate-engagement";

const BRIDGE_LENDING_KARAT: GoldKarat = "22K";
const BRIDGE_LENDING_GRAMS = 1;

export function LoanLendingRateBridge() {
  const [price, setPrice] = useState<GoldPriceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [flipRevealed, setFlipRevealed] = useState(false);
  const [bridgeFlipKey, setBridgeFlipKey] = useState(0);
  const bridgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

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

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = bridgeRef.current;
    if (!el || flipRevealed) return;

    const reveal = () => {
      setFlipRevealed(true);
      setBridgeFlipKey((key) => key + 1);
    };

    const revealIfInView = () => {
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) reveal();
      },
      { threshold: 0, rootMargin: "0px" },
    );

    observer.observe(el);

    // Already in the first fold on load — observer may not fire until scroll
    requestAnimationFrame(() => {
      if (revealIfInView()) reveal();
    });

    return () => observer.disconnect();
  }, [flipRevealed]);

  const bridgeLoanAmount = useMemo(() => {
    if (!price) return null;
    return loanAmountFromWeightGrams(
      BRIDGE_LENDING_GRAMS,
      BRIDGE_LENDING_KARAT,
      price.gold999BaseRaw,
      price.rate22kPerGramInr,
    );
  }, [price]);

  const bridgeAmountText =
    loading || error || bridgeLoanAmount === null
      ? "—"
      : formatInr(bridgeLoanAmount);

  const showBridgeFlip =
    flipRevealed && !loading && !error && bridgeLoanAmount !== null;

  useLendingRateEngagement(showBridgeFlip, bridgeRef);

  return (
    <section
      className={`ym-loan-lending-rate-fold${flipRevealed ? " is-revealed" : ""}`}
      aria-label="Today's lending rate"
    >
      <div className="ym-loan-estimate-column">
        <div ref={bridgeRef} className="ym-loan-flip-bridge">
          {error && (
            <p className="ym-loan-flip-status">Live rate unavailable</p>
          )}

          <div className="ym-loan-flip-result" aria-live="polite">
            {showBridgeFlip ? (
              <FlipClockAmount
                amount={bridgeLoanAmount}
                flipKey={bridgeFlipKey}
                className="ym-solari-amount--loan"
              />
            ) : (
              <FlipClockPlaceholder
                className="ym-solari-amount--loan"
                template="₹00000"
              />
            )}
            <span className="ym-sr-only">{bridgeAmountText}</span>
          </div>

          <p className="ym-loan-ltv-caption">
            <span className="ym-loan-ltv-caption-line">Today&apos;s lending rate</span>{" "}
            <span className="ym-loan-ltv-caption-line">
              for {BRIDGE_LENDING_KARAT} gold at 75% LTV
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
