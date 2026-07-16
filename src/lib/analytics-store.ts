import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getYmSupabase, assertStoreBackend } from "@/lib/ym-supabase";
import { RETENTION_DAYS } from "@/lib/retention-purge";
import type { AnalyticsEvent, AnalyticsQuery, AnalyticsSummary } from "./analytics-types";

const LOCAL_PATH = path.join(process.cwd(), "data", "analytics.json");
const MAX_EVENTS = 20_000;

type AnalyticsFile = { events: AnalyticsEvent[] };

let localChain: Promise<void> = Promise.resolve();

function parseLocal(raw: string): AnalyticsFile {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as AnalyticsFile).events)) {
      return { events: [] };
    }
    return parsed as AnalyticsFile;
  } catch {
    return { events: [] };
  }
}

function pruneEvents(events: AnalyticsEvent[]): AnalyticsEvent[] {
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return events
    .filter((event) => {
      const t = new Date(event.timestamp).getTime();
      return Number.isFinite(t) && t >= cutoff;
    })
    .slice(-MAX_EVENTS);
}

function readLocal(): AnalyticsFile {
  if (!existsSync(LOCAL_PATH)) return { events: [] };
  return { events: pruneEvents(parseLocal(readFileSync(LOCAL_PATH, "utf8")).events) };
}

function writeLocal(file: AnalyticsFile): void {
  const dir = path.dirname(LOCAL_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(LOCAL_PATH, `${JSON.stringify({ events: pruneEvents(file.events) })}\n`, "utf8");
}

export async function appendAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
  if (assertStoreBackend() === "supabase") {
    const { error } = await getYmSupabase().from("analytics_events").insert({
      id: event.id,
      timestamp: event.timestamp,
      path: event.path,
      session_id: event.sessionId,
      referrer: event.referrer,
      device_type: event.deviceType,
      browser: event.browser,
      browser_version: event.browserVersion,
      os: event.os,
      os_version: event.osVersion,
      device_vendor: event.deviceVendor,
      device_model: event.deviceModel,
      country: event.country,
      region: event.region,
      city: event.city,
    });
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

async function readAllEvents(): Promise<AnalyticsEvent[]> {
  if (assertStoreBackend() === "supabase") {
    const cutoff = new Date(
      Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();
    const { data, error } = await getYmSupabase()
      .from("analytics_events")
      .select("*")
      .gte("timestamp", cutoff)
      .order("timestamp", { ascending: true })
      .limit(MAX_EVENTS);
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      timestamp: row.timestamp,
      path: row.path,
      sessionId: row.session_id,
      referrer: row.referrer,
      deviceType: row.device_type,
      browser: row.browser,
      browserVersion: row.browser_version ?? "",
      os: row.os,
      osVersion: row.os_version ?? "",
      deviceVendor: row.device_vendor,
      deviceModel: row.device_model,
      country: row.country ?? "Unknown",
      region: row.region,
      city: row.city,
    }));
  }
  return readLocal().events;
}

function parseMonth(month: string): { from: Date; to: Date } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return null;
  const from = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
  const to = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999));
  return { from, to };
}

function inRange(timestamp: string, query: AnalyticsQuery): boolean {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return false;
  if (query.month) {
    const monthRange = parseMonth(query.month);
    if (!monthRange) return false;
    return date >= monthRange.from && date <= monthRange.to;
  }
  if (query.from) {
    const from = new Date(`${query.from}T00:00:00.000Z`);
    if (date < from) return false;
  }
  if (query.to) {
    const to = new Date(`${query.to}T23:59:59.999Z`);
    if (date > to) return false;
  }
  return true;
}

function countBy<T>(items: T[], keyFn: (item: T) => string, limit = 10) {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function getAnalyticsSummary(query: AnalyticsQuery): Promise<AnalyticsSummary> {
  const all = await readAllEvents();
  const events = all.filter((event) => inRange(event.timestamp, query));
  const sessionIds = new Set(events.map((event) => event.sessionId));
  const byDayMap = new Map<string, { views: number; sessions: Set<string> }>();
  for (const event of events) {
    const day = event.timestamp.slice(0, 10);
    const entry = byDayMap.get(day) ?? { views: 0, sessions: new Set<string>() };
    entry.views += 1;
    entry.sessions.add(event.sessionId);
    byDayMap.set(day, entry);
  }
  const mobileDevices = events.filter((event) => event.deviceType === "mobile");

  return {
    totalViews: events.length,
    uniqueVisitors: sessionIds.size,
    mobileViews: events.filter((event) => event.deviceType === "mobile").length,
    desktopViews: events.filter((event) => event.deviceType === "desktop").length,
    tabletViews: events.filter((event) => event.deviceType === "tablet").length,
    byCountry: countBy(events, (event) => event.country),
    byCity: countBy(
      events.filter((event) => event.region),
      (event) => `${event.region}, ${event.country}`,
    ),
    byBrowser: countBy(
      events,
      (event) =>
        event.browserVersion ? `${event.browser} ${event.browserVersion}` : event.browser,
    ),
    byMobileDevice: countBy(
      mobileDevices,
      (event) => {
        const vendor = event.deviceVendor ?? "Unknown";
        const model = event.deviceModel ?? "Phone";
        const os = event.osVersion ? `${event.os} ${event.osVersion}` : event.os;
        return `${vendor} ${model} (${os})`;
      },
      12,
    ),
    byDay: [...byDayMap.entries()]
      .map(([date, stats]) => ({
        date,
        views: stats.views,
        visitors: stats.sessions.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    byPath: countBy(events, (event) => event.path, 12),
  };
}
