import type {
  CalculatorEntryInput,
  EngagementCollectInput,
  LendingRateStopInput,
} from "@/lib/engagement-types";
import { getAnalyticsSessionId } from "@/lib/analytics-session";

export function sendEngagementEvent(
  payload: Omit<LendingRateStopInput, "sessionId" | "path"> | Omit<CalculatorEntryInput, "sessionId" | "path">,
): void {
  const body = {
    ...payload,
    sessionId: getAnalyticsSessionId(),
    path: window.location.pathname,
  } as EngagementCollectInput;

  void fetch("/api/engagement/collect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  });
}
