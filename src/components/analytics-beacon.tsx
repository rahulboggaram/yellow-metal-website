"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getAnalyticsSessionId } from "@/lib/analytics-session";

export function AnalyticsBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    const payload = JSON.stringify({
      path: pathname,
      sessionId: getAnalyticsSessionId(),
      referrer: document.referrer || null,
    });

    void fetch("/api/analytics/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    });
  }, [pathname]);

  return null;
}
