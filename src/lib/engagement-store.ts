import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { engagementInRange } from "@/lib/engagement-query";
import type {
  CalculatorEntryEvent,
  EngagementEvent,
  EngagementQuery,
  EngagementSummary,
  LendingRateStopEvent,
} from "@/lib/engagement-types";
import { getYmSupabase, assertStoreBackend } from "@/lib/ym-supabase";
import { RETENTION_DAYS } from "@/lib/retention-purge";

const LOCAL_PATH = path.join(process.cwd(), "data", "engagement.json");
const MAX_EVENTS = 50_000;

type EngagementFile = { events: EngagementEvent[] };

let localChain: Promise<void> = Promise.resolve();

function parseLocal(raw: string): EngagementFile {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as EngagementFile).events)) {
      return { events: [] };
    }
    return parsed as EngagementFile;
  } catch {
    return { events: [] };
  }
}

function pruneEvents(events: EngagementEvent[]): EngagementEvent[] {
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return events
    .filter((event) => {
      const t = new Date(event.timestamp).getTime();
      return Number.isFinite(t) && t >= cutoff;
    })
    .slice(-MAX_EVENTS);
}

function readLocal(): EngagementFile {
  if (!existsSync(LOCAL_PATH)) return { events: [] };
  return { events: pruneEvents(parseLocal(readFileSync(LOCAL_PATH, "utf8")).events) };
}

function writeLocal(file: EngagementFile): void {
  const dir = path.dirname(LOCAL_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(LOCAL_PATH, `${JSON.stringify({ events: pruneEvents(file.events) })}\n`, "utf8");
}

function rowToEvent(row: Record<string, unknown>): EngagementEvent {
  if (row.type === "lending_rate_stop") {
    return {
      id: String(row.id),
      type: "lending_rate_stop",
      timestamp: String(row.timestamp),
      sessionId: String(row.session_id),
      path: String(row.path),
      durationMs: Number(row.duration_ms ?? 0),
    };
  }
  return {
    id: String(row.id),
    type: "calculator_entry",
    timestamp: String(row.timestamp),
    sessionId: String(row.session_id),
    path: String(row.path),
    weightBucket: row.weight_bucket ? String(row.weight_bucket) : undefined,
    karat: row.karat as CalculatorEntryEvent["karat"],
    loanAmountInr:
      row.loan_amount_inr === null || row.loan_amount_inr === undefined
        ? null
        : Number(row.loan_amount_inr),
    country: row.country ? String(row.country) : undefined,
    region: (row.region as string | null) ?? null,
    city: null,
  };
}

export async function appendEngagementEvent(event: EngagementEvent): Promise<void> {
  if (assertStoreBackend() === "supabase") {
    const row =
      event.type === "lending_rate_stop"
        ? {
            id: event.id,
            type: event.type,
            timestamp: event.timestamp,
            session_id: event.sessionId,
            path: event.path,
            duration_ms: event.durationMs,
          }
        : {
            id: event.id,
            type: event.type,
            timestamp: event.timestamp,
            session_id: event.sessionId,
            path: event.path,
            weight_bucket: event.weightBucket ?? null,
            karat: event.karat,
            loan_amount_inr: event.loanAmountInr,
            country: event.country ?? null,
            region: event.region ?? null,
            city: null,
          };
    const { error } = await getYmSupabase()
      .from("engagement_events")
      .insert(row as Record<string, unknown>);
    if (error) throw error;
    return;
  }

  const run = localChain.then(() => {
    const store = readLocal();
    store.events.push(event);
    writeLocal(store);
  });
  localChain = run.catch(() => undefined);
  await run;
}

async function readAllEvents(): Promise<EngagementEvent[]> {
  if (assertStoreBackend() === "supabase") {
    const cutoff = new Date(
      Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();
    const { data, error } = await getYmSupabase()
      .from("engagement_events")
      .select("*")
      .gte("timestamp", cutoff)
      .order("timestamp", { ascending: true })
      .limit(MAX_EVENTS);
    if (error) throw error;
    return (data ?? []).map((row) => rowToEvent(row as Record<string, unknown>));
  }
  return readLocal().events;
}

function isLendingRateStop(event: EngagementEvent): event is LendingRateStopEvent {
  return event.type === "lending_rate_stop";
}

function isCalculatorEntry(event: EngagementEvent): event is CalculatorEntryEvent {
  return event.type === "calculator_entry";
}

export async function getEngagementSummary(query: EngagementQuery): Promise<EngagementSummary> {
  const all = await readAllEvents();
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
          weightEntered: event.weightBucket ?? "",
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
  const all = await readAllEvents();
  return all
    .filter(isCalculatorEntry)
    .filter((event) => engagementInRange(event.timestamp, query))
    .map((event) => ({
      ...event,
      weightEntered: event.weightBucket ?? "",
      country: event.country ?? "Unknown",
      region: event.region ?? null,
      city: null,
    }))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit);
}
