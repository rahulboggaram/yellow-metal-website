import "server-only";

import path from "node:path";
import { createDayShardedStore } from "@/lib/day-event-store";
import { engagementInRange } from "@/lib/engagement-query";
import type {
  CalculatorEntryEvent,
  EngagementEvent,
  EngagementQuery,
  EngagementSummary,
  LendingRateStopEvent,
} from "@/lib/engagement-types";

const store = createDayShardedStore<EngagementEvent>({
  localDir: path.join(process.cwd(), "data", "engagement-days"),
  blobPrefix: "engagement/days",
  legacyLocalPath: path.join(process.cwd(), "data", "engagement.json"),
  legacyBlobPath: "engagement/events.json",
  maxEventsPerDay: 10_000,
});

export async function appendEngagementEvent(event: EngagementEvent): Promise<void> {
  await store.appendEvent(event);
}

function isLendingRateStop(event: EngagementEvent): event is LendingRateStopEvent {
  return event.type === "lending_rate_stop";
}

function isCalculatorEntry(event: EngagementEvent): event is CalculatorEntryEvent {
  return event.type === "calculator_entry";
}

export async function getEngagementSummary(query: EngagementQuery): Promise<EngagementSummary> {
  const all = await store.readAllEvents();
  const events = all.filter((event) => engagementInRange(event.timestamp, query));
  const lendingStops = events.filter(isLendingRateStop);
  const calculatorEntries = events.filter(isCalculatorEntry);

  const lendingSessions = new Set(lendingStops.map((event) => event.sessionId));
  const calculatorSessions = new Set(calculatorEntries.map((event) => event.sessionId));
  const totalDurationMs = lendingStops.reduce((sum, event) => sum + event.durationMs, 0);

  const lendingByDay = new Map<
    string,
    { stops: number; sessions: Set<string>; durationMs: number }
  >();
  for (const event of lendingStops) {
    const day = event.timestamp.slice(0, 10);
    const entry = lendingByDay.get(day) ?? {
      stops: 0,
      sessions: new Set<string>(),
      durationMs: 0,
    };
    entry.stops += 1;
    entry.sessions.add(event.sessionId);
    entry.durationMs += event.durationMs;
    lendingByDay.set(day, entry);
  }

  const calculatorByDay = new Map<string, { entries: number; sessions: Set<string> }>();
  for (const event of calculatorEntries) {
    const day = event.timestamp.slice(0, 10);
    const entry = calculatorByDay.get(day) ?? { entries: 0, sessions: new Set<string>() };
    entry.entries += 1;
    entry.sessions.add(event.sessionId);
    calculatorByDay.set(day, entry);
  }

  return {
    lendingRate: {
      uniqueVisitors: lendingSessions.size,
      totalStops: lendingStops.length,
      avgDurationSeconds:
        lendingStops.length > 0
          ? Math.round(totalDurationMs / lendingStops.length / 1000)
          : 0,
      totalDurationSeconds: Math.round(totalDurationMs / 1000),
      byDay: [...lendingByDay.entries()]
        .map(([date, stats]) => ({
          date,
          stops: stats.stops,
          visitors: stats.sessions.size,
          avgDurationSeconds:
            stats.stops > 0 ? Math.round(stats.durationMs / stats.stops / 1000) : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    },
    calculator: {
      uniqueVisitors: calculatorSessions.size,
      totalEntries: calculatorEntries.length,
      byDay: [...calculatorByDay.entries()]
        .map(([date, stats]) => ({
          date,
          entries: stats.entries,
          visitors: stats.sessions.size,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      recentEntries: [...calculatorEntries]
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, 20)
        .map((event) => ({
          ...event,
          weightEntered: event.weightEntered ?? event.weightBucket ?? String(event.weightGrams),
          country: event.country ?? "Unknown",
          region: event.region ?? null,
          city: null,
        })),
    },
  };
}

export async function getCalculatorEntries(
  query: EngagementQuery,
  limit = 200,
): Promise<CalculatorEntryEvent[]> {
  const all = await store.readAllEvents();
  return all
    .filter(isCalculatorEntry)
    .filter((event) => engagementInRange(event.timestamp, query))
    .map((event) => ({
      ...event,
      weightEntered: event.weightEntered ?? event.weightBucket ?? String(event.weightGrams),
      country: event.country ?? "Unknown",
      region: event.region ?? null,
      city: null,
    }))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit);
}
