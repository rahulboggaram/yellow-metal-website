"use client";

import { useEffect, type RefObject } from "react";
import { sendEngagementEvent } from "@/lib/engagement-collect-client";

const MIN_STOP_MS = 1000;

export function useLendingRateEngagement(
  active: boolean,
  targetRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!active) return;
    const el = targetRef.current;
    if (!el) return;

    let visibleStart: number | null = null;

    const flush = () => {
      if (visibleStart === null) return;
      const durationMs = Date.now() - visibleStart;
      visibleStart = null;
      if (durationMs < MIN_STOP_MS) return;
      sendEngagementEvent({
        type: "lending_rate_stop",
        durationMs,
      });
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (visibleStart === null) visibleStart = Date.now();
          return;
        }
        flush();
      },
      { threshold: 0.35, rootMargin: "0px" },
    );

    observer.observe(el);

    const onHide = () => flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);

    return () => {
      flush();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
  }, [active, targetRef]);
}
