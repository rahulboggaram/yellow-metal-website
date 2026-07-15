import "server-only";

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import {
  hasBlobStorage,
  mutatePrivateJsonBlob,
  readPrivateJsonBlob,
} from "@/lib/blob-json-store";
import { engagementInRange } from "@/lib/engagement-query";
import type {
  CalculatorEntryEvent,
  EngagementEvent,
  EngagementQuery,
  EngagementSummary,
  LendingRateStopEvent,
} from "@/lib/engagement-types";

const LOCAL_PATH = path.join(process.cwd(), "data", "engagement.json");
const BLOB_PATHNAME = "engagement/events.json";
const MAX_EVENTS = 50_000;

type EngagementFile = {
  events: EngagementEvent[];
};

const EMPTY: EngagementFile = { events: [] };

let localWriteChain: Promise<void> = Promise.resolve();

function parseEngagementFile(raw: string): EngagementFile {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as EngagementFile).events)) {
    return { events: [] };
  }
  return parsed as EngagementFile;
}

function readLocalFile(): EngagementFile {
  if (!existsSync(LOCAL_PATH)) {
    return { events: [] };
  }
  const raw = readFileSync(LOCAL_PATH, "utf8");
  return parseEngagementFile(raw);
}

function writeLocalFile(data: EngagementFile): void {
  const dir = path.dirname(LOCAL_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(LOCAL_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function readStore(): Promise<EngagementFile> {
  if (hasBlobStorage()) {
    const snapshot = await readPrivateJsonBlob(
      BLOB_PATHNAME,
      EMPTY,
      parseEngagementFile,
    );
    return snapshot.data;
  }
  return readLocalFile();
}

export async function appendEngagementEvent(event: EngagementEvent): Promise<void> {
  if (hasBlobStorage()) {
    await mutatePrivateJsonBlob(
      BLOB_PATHNAME,
      EMPTY,
      parseEngagementFile,
      (store) => ({
        events: [...store.events, event].slice(-MAX_EVENTS),
      }),
    );
    return;
  }

  localWriteChain = localWriteChain.then(() => {
    const store = readLocalFile();
    store.events.push(event);
    writeLocalFile({ events: store.events.slice(-MAX_EVENTS) });
  });
  try {
    await localWriteChain;
  } catch (error) {
    localWriteChain = Promise.resolve();
    throw error;
  }
}

function isLendingRateStop(event: EngagementEvent): event is LendingRateStopEvent {
  return event.type === "lending_rate_stop";
}

function isCalculatorEntry(event: EngagementEvent): event is CalculatorEntryEvent {
  return event.type === "calculator_entry";
}

export async function getEngagementSummary(query: EngagementQuery): Promise<EngagementSummary> {
  const store = await readStore();
  const events = store.events.filter((event) => engagementInRange(event.timestamp, query));
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
          weightEntered:
            event.weightEntered ??
            String(event.weightGrams),
          country: event.country ?? "Unknown",
          region: event.region ?? null,
          city: event.city ?? null,
        })),
    },
  };
}

export async function getCalculatorEntries(
  query: EngagementQuery,
): Promise<CalculatorEntryEvent[]> {
  const store = await readStore();
  return store.events
    .filter(isCalculatorEntry)
    .filter((event) => engagementInRange(event.timestamp, query))
    .map((event) => ({
      ...event,
      weightEntered: event.weightEntered ?? String(event.weightGrams),
      country: event.country ?? "Unknown",
      region: event.region ?? null,
      city: event.city ?? null,
    }))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
