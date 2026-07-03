import "server-only";

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { get, put } from "@vercel/blob";
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

function hasBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

async function readBlobFile(): Promise<EngagementFile> {
  try {
    const result = await get(BLOB_PATHNAME, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return { events: [] };
    }

    const raw = await new Response(result.stream).text();
    return parseEngagementFile(raw);
  } catch {
    return { events: [] };
  }
}

async function writeBlobFile(data: EngagementFile): Promise<void> {
  await put(BLOB_PATHNAME, JSON.stringify(data), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

async function readStore(): Promise<EngagementFile> {
  if (hasBlobStorage()) return readBlobFile();
  return readLocalFile();
}

async function writeStore(data: EngagementFile): Promise<void> {
  const trimmed: EngagementFile = {
    events: data.events.slice(-MAX_EVENTS),
  };
  if (hasBlobStorage()) {
    await writeBlobFile(trimmed);
    return;
  }
  writeLocalFile(trimmed);
}

export async function appendEngagementEvent(event: EngagementEvent): Promise<void> {
  const store = await readStore();
  store.events.push(event);
  await writeStore(store);
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
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
