import "server-only";

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import {
  hasBlobStorage,
  mutatePrivateJsonBlob,
  readPrivateJsonBlob,
} from "@/lib/blob-json-store";
import type { AnalyticsEvent, AnalyticsQuery, AnalyticsSummary } from "./analytics-types";

const LOCAL_PATH = path.join(process.cwd(), "data", "analytics.json");
const BLOB_PATHNAME = "analytics/events.json";
const MAX_EVENTS = 20_000;

type AnalyticsFile = {
  events: AnalyticsEvent[];
};

const EMPTY: AnalyticsFile = { events: [] };

/** Serialize local writes so concurrent serverless-like local requests don't clobber. */
let localWriteChain: Promise<void> = Promise.resolve();

function parseAnalyticsFile(raw: string): AnalyticsFile {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as AnalyticsFile).events)) {
    return { events: [] };
  }
  return parsed as AnalyticsFile;
}

function readLocalFile(): AnalyticsFile {
  if (!existsSync(LOCAL_PATH)) {
    return { events: [] };
  }
  const raw = readFileSync(LOCAL_PATH, "utf8");
  return parseAnalyticsFile(raw);
}

function writeLocalFile(data: AnalyticsFile): void {
  const dir = path.dirname(LOCAL_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(LOCAL_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function readStore(): Promise<AnalyticsFile> {
  if (hasBlobStorage()) {
    const snapshot = await readPrivateJsonBlob(
      BLOB_PATHNAME,
      EMPTY,
      parseAnalyticsFile,
    );
    return snapshot.data;
  }
  return readLocalFile();
}

export async function appendAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
  if (hasBlobStorage()) {
    await mutatePrivateJsonBlob(
      BLOB_PATHNAME,
      EMPTY,
      parseAnalyticsFile,
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
  const store = await readStore();
  const events = store.events.filter((event) => inRange(event.timestamp, query));

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
      events.filter((event) => event.city),
      (event) => `${event.city}, ${event.country}`,
    ),
    byBrowser: countBy(
      events,
      (event) =>
        event.browserVersion
          ? `${event.browser} ${event.browserVersion}`
          : event.browser,
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
